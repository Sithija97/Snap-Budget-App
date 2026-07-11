import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";
import { createDb } from "../db/client";
import { users, categories, wallets } from "../db/schema";
import { DEFAULT_CATEGORIES } from "../db/defaultCategories";
import type { Env } from "../types";

export const clerkAuth = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return c.json({ error: "Missing bearer token" }, 401);

  let userId: string;
  try {
    const payload = await verifyToken(token, { secretKey: c.env.CLERK_SECRET_KEY });
    userId = payload.sub;
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  const db = createDb(c.env.DATABASE_URL);

  // First time we see this user: create their row + seed default categories.
  // The insert itself is the atomicity boundary — Postgres guarantees only
  // one concurrent INSERT ... ON CONFLICT DO NOTHING for the same PK returns
  // a row, so only the request that "wins" the race seeds data. A prior
  // SELECT-then-INSERT version raced on the app's first parallel fetchAll()
  // burst, producing duplicate default categories and wallets.
  const [inserted] = await db
    .insert(users)
    .values({ id: userId })
    .onConflictDoNothing()
    .returning({ id: users.id });

  if (inserted) {
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId }))
    );
    // Mirrors the old client-side ensureDefaultWallet() — every account
    // always has at least one wallet.
    await db.insert(wallets).values({
      userId,
      name: "My Wallet",
      balance: null,
      isDefault: true,
    });
  }

  c.set("userId", userId);
  c.set("db", db);
  await next();
});
