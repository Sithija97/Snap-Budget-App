import { createMiddleware } from "hono/factory";
import type { Env } from "../types";

const LIMIT_PER_MINUTE = 120;

// Fixed-window counter in KV, keyed per user per minute. KV reads/writes
// aren't atomic, so a burst of truly concurrent requests can under-count by
// a few — acceptable for abuse protection on a single-user app; a Durable
// Object would be the precise version if this ever needs to be exact.
export const rateLimit = createMiddleware<Env>(async (c, next) => {
  const userId = c.get("userId");
  const windowKey = `rl:${userId}:${Math.floor(Date.now() / 60_000)}`;

  const current = await c.env.RATE_LIMIT_KV.get(windowKey);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= LIMIT_PER_MINUTE) {
    return c.json({ error: "Too many requests. Please slow down." }, 429);
  }

  await c.env.RATE_LIMIT_KV.put(windowKey, String(count + 1), { expirationTtl: 70 });
  await next();
});
