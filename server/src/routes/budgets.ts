import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { budgets } from "../db/schema";
import type { Env } from "../types";

const budgetInput = z.object({
  limitAmount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  repeat: z.boolean(),
});

const UNIQUE_VIOLATION = "23505";

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

  // Friendly pre-check for the common case; the DB's unique (userId, month)
  // index is the real guarantee against a race between two near-simultaneous
  // requests. Not an upsert on purpose — the client always checks for an
  // existing month's budget first and routes to PATCH, so hitting this means
  // a genuine race or bug, and should surface rather than silently overwrite.
  const [existing] = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.month, body.month)));

  if (existing) {
    return c.json({ error: "A budget already exists for this month — edit it instead." }, 409);
  }

  try {
    const [row] = await db.insert(budgets).values({ ...body, userId }).returning();
    return c.json(row, 201);
  } catch (e: any) {
    if (e?.code === UNIQUE_VIOLATION) {
      return c.json({ error: "A budget already exists for this month — edit it instead." }, 409);
    }
    throw e;
  }
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
