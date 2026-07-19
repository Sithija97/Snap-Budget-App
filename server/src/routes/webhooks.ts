import { Hono } from "hono";
import { and, eq, gt } from "drizzle-orm";
import { createDb } from "../db/client";
import { messagingLinks, messagingLinkCodes } from "../db/schema";
import { sendTelegramMessage } from "../lib/telegram";
import { answerQuestion } from "./assistant";
import type { Env } from "../types";

export const webhooksRoute = new Hono<Env>();

// Telegram's Update shape, narrowed to only what /start needs.
interface TelegramUpdate {
  message?: {
    chat: { id: number; type: string };
    from?: { username?: string; first_name?: string };
    text?: string;
  };
}

webhooksRoute.post("/telegram", async (c) => {
  // Telegram echoes this header on every webhook call when a secret_token was
  // set on registration (see wrangler.toml) — without this check, anyone who
  // finds the URL could post fake "linked" updates for arbitrary users.
  const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const update = await c.req.json<TelegramUpdate>();
  const message = update.message;
  const text = message?.text?.trim();

  if (!message || !text) {
    return c.json({ ok: true });
  }

  const chatId = String(message.chat.id);

  // Anything that isn't /start is a free-text question, routed through the
  // same Q&A logic the in-app chat and /api/assistant/ask use — but only for
  // an already-linked chat; an unlinked chat asking questions has no
  // SnapBudget account to answer from. The whole branch (including
  // createDb, which throws synchronously on a bad connection string) is
  // inside the try — Telegram must always get its 200 back, or it will keep
  // retrying the same failed update.
  if (!text.startsWith("/start")) {
    try {
      const db = createDb(c.env.DATABASE_URL);
      const [link] = await db
        .select({ userId: messagingLinks.userId })
        .from(messagingLinks)
        .where(and(eq(messagingLinks.channel, "telegram"), eq(messagingLinks.externalId, chatId)));

      if (!link) {
        await sendTelegramMessage(
          c.env,
          chatId,
          "This chat isn't linked to a SnapBudget account yet. Open the app → Settings → Connect Telegram to link it."
        );
        return c.json({ ok: true });
      }

      const reply = await answerQuestion(c.env, db, link.userId, text);
      await sendTelegramMessage(c.env, chatId, reply);
    } catch (e) {
      console.error(e);
      await sendTelegramMessage(c.env, chatId, "Couldn't answer that right now — try again in a moment.");
    }
    return c.json({ ok: true });
  }

  const db = createDb(c.env.DATABASE_URL);
  const code = text.replace("/start", "").trim().toUpperCase();

  if (!code) {
    await sendTelegramMessage(
      c.env,
      chatId,
      "Open SnapBudget → Settings → Connect Telegram to get a linking code, then tap the link it gives you."
    );
    return c.json({ ok: true });
  }

  const [linkCode] = await db
    .select()
    .from(messagingLinkCodes)
    .where(and(eq(messagingLinkCodes.code, code), gt(messagingLinkCodes.expiresAt, new Date())));

  if (!linkCode) {
    await sendTelegramMessage(
      c.env,
      chatId,
      "That linking code has expired or is invalid. Go back to SnapBudget → Settings and generate a new one."
    );
    return c.json({ ok: true });
  }

  const displayName = message.from?.username ? `@${message.from.username}` : message.from?.first_name ?? null;

  try {
    await db.insert(messagingLinks).values({
      userId: linkCode.userId,
      channel: "telegram",
      externalId: chatId,
      externalDisplayName: displayName,
    });
  } catch (e: any) {
    // Unique violation on (channel, externalId): this Telegram account is
    // already linked to a different SnapBudget user.
    if (e?.code === "23505") {
      await sendTelegramMessage(c.env, chatId, "This Telegram account is already linked to a SnapBudget account.");
      return c.json({ ok: true });
    }
    throw e;
  }

  await db.delete(messagingLinkCodes).where(eq(messagingLinkCodes.code, code));
  await sendTelegramMessage(c.env, chatId, "You're linked! SnapBudget features delivered here will show up in this chat.");

  return c.json({ ok: true });
});
