import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { categories } from "../db/schema";
import { extractReceipt, GeminiError } from "../lib/gemini";
import { uploadReceipt } from "../lib/cloudinary";
import type { Env } from "../types";

// Client compresses to ~1600px/JPEG q0.6 before upload (typically well under
// 2MB base64) — this cap is a defensive ceiling against a malformed or
// malicious client, not the expected size.
const MAX_BASE64_LENGTH = 15_000_000;
const scanInput = z.object({ imageBase64: z.string().min(1).max(MAX_BASE64_LENGTH) });

export const scanRoute = new Hono<Env>();

scanRoute.post("/", zValidator("json", scanInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { imageBase64 } = c.req.valid("json");

  const userCategories = await db
    .select({ name: categories.name })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, "expense")));

  const today = new Date().toISOString().slice(0, 10);

  let extracted;
  try {
    extracted = await extractReceipt(
      c.env,
      imageBase64,
      userCategories.map((cat) => cat.name),
      today
    );
  } catch (e) {
    console.error(`[scan] extractReceipt failed${e instanceof GeminiError ? ` (${e.kind})` : ""}:`, e);
    const message =
      e instanceof GeminiError && (e.kind === "quota" || e.kind === "overloaded")
        ? "Receipt scanning is busy right now. Wait a moment and try again, or enter it manually."
        : e instanceof GeminiError && e.kind === "timeout"
          ? "That took too long to read. Try again with a clearer photo, or enter it manually."
          : "Couldn't read that receipt. Try again or enter it manually.";
    return c.json({ error: message }, 502);
  }

  const publicId = `${userId}/${crypto.randomUUID()}`;
  try {
    await uploadReceipt(c.env, imageBase64, publicId);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Receipt image upload failed. Try again." }, 502);
  }

  return c.json({ ...extracted, receiptKey: publicId });
});
