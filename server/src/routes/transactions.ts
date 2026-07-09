import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { transactions } from "../db/schema";
import type { Env } from "../types";

// Most-recent-first, capped — an unbounded SELECT * would grow without limit
// as a user's history accumulates. 500 comfortably covers months of normal
// use; a real date-range/cursor API is the follow-up once that's not true.
const MAX_TRANSACTIONS = 500;

const transactionInput = z.object({
  merchant: z.string().min(1),
  categoryId: z.string().uuid(),
  walletId: z.string().uuid().nullable(),
  txType: z.enum(["inc", "exp"]),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(1),
});

export const transactionsRoute = new Hono<Env>();

transactionsRoute.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.time))
    .limit(MAX_TRANSACTIONS);
  return c.json(rows);
});

transactionsRoute.post("/", zValidator("json", transactionInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const [row] = await db.insert(transactions).values({ ...body, userId }).returning();
  return c.json(row, 201);
});

transactionsRoute.patch("/:id", zValidator("json", transactionInput.partial()), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(transactions)
    .set(body)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();

  if (!row) return c.json({ error: "Transaction not found" }, 404);
  return c.json(row);
});

transactionsRoute.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [row] = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();

  if (!row) return c.json({ error: "Transaction not found" }, 404);
  return c.json({ ok: true });
});
