import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, count } from "drizzle-orm";
import { wallets } from "../db/schema";
import type { Env } from "../types";

const walletInput = z.object({
  name: z.string().min(1),
  balance: z.number().nullable(),
  isDefault: z.boolean().optional(),
});

export const walletsRoute = new Hono<Env>();

walletsRoute.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const rows = await db.select().from(wallets).where(eq(wallets.userId, userId));
  return c.json(rows);
});

walletsRoute.post("/", zValidator("json", walletInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const [row] = await db.insert(wallets).values({ ...body, userId }).returning();
  return c.json(row, 201);
});

walletsRoute.patch("/:id", zValidator("json", walletInput.partial()), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(wallets)
    .set(body)
    .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
    .returning();

  if (!row) return c.json({ error: "Wallet not found" }, 404);
  return c.json(row);
});

walletsRoute.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(wallets)
    .where(eq(wallets.userId, userId));

  if (total <= 1) {
    return c.json({ error: "Cannot delete the last remaining wallet" }, 400);
  }

  const [row] = await db
    .delete(wallets)
    .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
    .returning();

  if (!row) return c.json({ error: "Wallet not found" }, 404);
  return c.json({ ok: true });
});
