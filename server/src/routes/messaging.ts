import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { messagingLinks, messagingLinkCodes } from "../db/schema";
import type { Env } from "../types";

export const messagingRoute = new Hono<Env>();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes — long enough to switch to Telegram and tap Start

function generateCode(): string {
  // 8 chars from an unambiguous alphabet (no 0/O/1/I) — this is embedded in
  // a /start deep link the user never has to type themselves, but keeping it
  // short and unambiguous matters if they ever read it aloud or type it manually.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return code;
}

messagingRoute.get("/telegram", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const [link] = await db
    .select()
    .from(messagingLinks)
    .where(and(eq(messagingLinks.userId, userId), eq(messagingLinks.channel, "telegram")));

  if (!link) return c.json({ linked: false });
  return c.json({
    linked: true,
    displayName: link.externalDisplayName,
    linkedAt: link.linkedAt,
  });
});

messagingRoute.post("/telegram/link-code", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const [existing] = await db
    .select({ id: messagingLinks.id })
    .from(messagingLinks)
    .where(and(eq(messagingLinks.userId, userId), eq(messagingLinks.channel, "telegram")));

  if (existing) {
    return c.json({ error: "Telegram is already connected. Disconnect it first to relink." }, 409);
  }

  const code = generateCode();
  await db.insert(messagingLinkCodes).values({
    code,
    userId,
    channel: "telegram",
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  return c.json({
    code,
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    deepLink: `https://t.me/${c.env.TELEGRAM_BOT_USERNAME}?start=${code}`,
  });
});

messagingRoute.delete("/telegram", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const [row] = await db
    .delete(messagingLinks)
    .where(and(eq(messagingLinks.userId, userId), eq(messagingLinks.channel, "telegram")))
    .returning();

  if (!row) return c.json({ error: "Telegram is not connected" }, 404);
  return c.json({ ok: true });
});
