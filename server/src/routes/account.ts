import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import { users } from "../db/schema";
import type { Env } from "../types";

export const accountRoute = new Hono<Env>();

// Deletes the account entirely — every wallet/category/budget/transaction
// row cascades off the users.id foreign keys (see db/schema.ts), then the
// Clerk identity itself is deleted so the login can never be reused. This is
// distinct from /api/data (DELETE), which wipes financial records but
// reseeds a fresh default state and keeps the account — Play Store policy
// requires apps with account creation to offer real account deletion, not
// just a data reset.
accountRoute.delete("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  await db.delete(users).where(eq(users.id, userId));

  const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
  await clerk.users.deleteUser(userId);

  return c.json({ ok: true });
});
