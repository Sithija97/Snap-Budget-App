import { Hono } from "hono";
import { and, eq, gt } from "drizzle-orm";
import { createDb } from "../db/client";
import { messagingLinks, messagingLinkCodes } from "../db/schema";
import { sendTelegramMessage } from "../lib/telegram";
import { answerQuestion, getPendingDraft, putPendingDraft, saveDraftTransaction, clearPendingDraft } from "./assistant";
import type { Env } from "../types";

// Telegram has no button-based confirm step in this flow, so a pending draft
// is confirmed/cancelled by the next free-text reply — a generous set of
// synonyms since "yes"/"y"/"confirm"/"ok" are all natural replies to "Log
// spend of Rs 500 for lunch?".
const CONFIRM_WORDS = new Set(["yes", "y", "yeah", "yep", "confirm", "ok", "okay", "sure"]);
const CANCEL_WORDS = new Set(["no", "n", "nope", "cancel", "stop"]);

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

      // A pending draft takes priority over classifying this message as a
      // new question — "yes"/"no" would otherwise get sent to Gemini as a
      // fresh, nonsensical query.
      const pendingDraft = await getPendingDraft(c.env.RATE_LIMIT_KV, link.userId);
      const normalized = text.trim().toLowerCase();

      if (pendingDraft && CONFIRM_WORDS.has(normalized)) {
        await saveDraftTransaction(c.env, db, link.userId, pendingDraft);
        await sendTelegramMessage(c.env, chatId, "Saved!");
        return c.json({ ok: true });
      }

      if (pendingDraft && CANCEL_WORDS.has(normalized)) {
        await clearPendingDraft(c.env.RATE_LIMIT_KV, link.userId);
        await sendTelegramMessage(c.env, chatId, "Okay, discarded.");
        return c.json({ ok: true });
      }

      const result = await answerQuestion(c.env, db, link.userId, text);
      if (result.draft) {
        await putPendingDraft(c.env.RATE_LIMIT_KV, link.userId, result.draft);
        await sendTelegramMessage(c.env, chatId, `${result.reply}\n\nReply "yes" to save, or "no" to discard.`);
      } else {
        await sendTelegramMessage(c.env, chatId, result.reply);
      }
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
