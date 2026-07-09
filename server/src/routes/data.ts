import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { transactions, budgets, categories, wallets } from "../db/schema";
import { DEFAULT_CATEGORIES } from "../db/defaultCategories";
import type { Env } from "../types";

export const dataRoute = new Hono<Env>();

// Wipes every record the user owns and reseeds the same fresh state a brand
// new account gets — mirrors the seeding logic in middleware/auth.ts.
// Neon's HTTP driver has no interactive db.transaction() (it throws at
// runtime); db.batch() is its actual atomic primitive — an array of queries
// sent as one all-or-nothing request, which is all this needs since none of
// these steps depend on reading a previous step's result.
dataRoute.delete("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  await db.batch([
    db.delete(transactions).where(eq(transactions.userId, userId)),
    db.delete(budgets).where(eq(budgets.userId, userId)),
    db.delete(categories).where(eq(categories.userId, userId)),
    db.delete(wallets).where(eq(wallets.userId, userId)),
    db.insert(categories).values(
      DEFAULT_CATEGORIES.map((cat) => ({ ...cat, userId }))
    ),
    db.insert(wallets).values({
      userId,
      name: "My Wallet",
      balance: null,
      isDefault: true,
    }),
  ]);

  return c.json({ ok: true });
});
