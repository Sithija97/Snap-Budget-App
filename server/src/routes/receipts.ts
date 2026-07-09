import { Hono } from "hono";
import { getSignedDownloadUrl } from "../lib/cloudinary";
import type { Env } from "../types";

export const receiptsRoute = new Hono<Env>();

// The key is "userId/uuid" — a path with a slash — so the param needs a
// regex that matches across segments instead of Hono's default single-segment ":key".
receiptsRoute.get("/:key{.+}", async (c) => {
  const userId = c.get("userId");
  const key = c.req.param("key");

  // Same app-level scoping used everywhere else: a key that doesn't belong
  // to the caller is treated as not found, not just forbidden.
  if (!key.startsWith(`${userId}/`)) {
    return c.json({ error: "Receipt not found" }, 404);
  }

  const url = await getSignedDownloadUrl(c.env, key);
  return c.redirect(url, 302);
});
