import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, count, sql, ne } from "drizzle-orm";
import { categories, transactions, budgets } from "../db/schema";
import type { Env } from "../types";

const categoryInput = z.object({
  name: z.string().min(1),
  type: z.enum(["expense", "income"]),
  icon: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
});

const UNIQUE_VIOLATION = "23505";

export const categoriesRoute = new Hono<Env>();

categoriesRoute.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const rows = await db.select().from(categories).where(eq(categories.userId, userId));
  return c.json(rows);
});

categoriesRoute.post("/", zValidator("json", categoryInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const body = c.req.valid("json");

  // Friendly pre-check for the common case; the DB's unique index (below)
  // is the real guarantee against a race between two near-simultaneous requests.
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(
      eq(categories.userId, userId),
      eq(categories.type, body.type),
      sql`lower(${categories.name}) = lower(${body.name})`
    ));

  if (existing) {
    return c.json({ error: `A ${body.type} category named "${body.name}" already exists` }, 409);
  }

  try {
    const [row] = await db
      .insert(categories)
      .values({ ...body, isDefault: false, userId })
      .returning();
    return c.json(row, 201);
  } catch (e: any) {
    if (e?.code === UNIQUE_VIOLATION) {
      return c.json({ error: `A ${body.type} category named "${body.name}" already exists` }, 409);
    }
    throw e;
  }
});

// Default categories can be renamed but not have their type/icon changed away
// from what seeded them — matches the client rule ("defaults can be renamed").
categoriesRoute.patch(
  "/:id",
  zValidator("json", categoryInput.pick({ name: true, icon: true, parentId: true }).partial()),
  async (c) => {
    const db = c.get("db");
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    if (body.name) {
      const [current] = await db
        .select({ type: categories.type })
        .from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)));

      if (!current) return c.json({ error: "Category not found" }, 404);

      const [duplicate] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.userId, userId),
          eq(categories.type, current.type),
          ne(categories.id, id),
          sql`lower(${categories.name}) = lower(${body.name})`
        ));

      if (duplicate) {
        return c.json({ error: `A ${current.type} category named "${body.name}" already exists` }, 409);
      }
    }

    try {
      const [row] = await db
        .update(categories)
        .set(body)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

      if (!row) return c.json({ error: "Category not found" }, 404);
      return c.json(row);
    } catch (e: any) {
      if (e?.code === UNIQUE_VIOLATION) {
        return c.json({ error: `A category named "${body.name}" already exists` }, 409);
      }
      throw e;
    }
  }
);

categoriesRoute.delete("/:id", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const id = c.req.param("id");

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  if (!existing) return c.json({ error: "Category not found" }, 404);
  if (existing.isDefault) return c.json({ error: "Default categories can't be deleted" }, 400);

  const [{ value: txCount }] = await db
    .select({ value: count() })
    .from(transactions)
    .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));

  if (txCount > 0) {
    return c.json({ error: "Category is used by existing transactions" }, 400);
  }

  // budgets.categoryId cascades on delete — without this guard, deleting a
  // category would silently wipe out any budget set for it with no warning.
  const [{ value: budgetCount }] = await db
    .select({ value: count() })
    .from(budgets)
    .where(and(eq(budgets.categoryId, id), eq(budgets.userId, userId)));

  if (budgetCount > 0) {
    return c.json({ error: "Category has a budget set. Delete the budget first." }, 400);
  }

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  return c.json({ ok: true });
});
