import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { budgets } from "../db/schema";
import type { Env } from "../types";

const budgetInput = z.object({
  categoryId: z.string().uuid(),
  limitAmount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  repeat: z.boolean(),
});

export const budgetsRoute = new Hono<Env>();

budgetsRoute.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const rows = await db.select().from(budgets).where(eq(budgets.userId, userId));
  return c.json(rows);
});

budgetsRoute.post("/", zValidator("json", budgetInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const [row] = await db.insert(budgets).values({ ...body, userId }).returning();
  return c.json(row, 201);
});

budgetsRoute.patch("/:id", zValidator("json", budgetInput.partial()), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(budgets)
    .set(body)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning();

  if (!row) return c.json({ error: "Budget not found" }, 404);
  return c.json(row);
});

budgetsRoute.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [row] = await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning();

  if (!row) return c.json({ error: "Budget not found" }, 404);
  return c.json({ ok: true });
});
