import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { transactions, categories, recaps, messagingLinks, users } from "../db/schema";
import { recapForPeriod } from "../lib/insights";
import { phraseRecap } from "../lib/recap";
import { sendTelegramMessage } from "../lib/telegram";
import type { Env } from "../types";
import type { Db } from "../db/client";

export const recapRoute = new Hono<Env>();

recapRoute.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");

  const rows = await db
    .select({
      id: recaps.id,
      periodType: recaps.periodType,
      periodStart: recaps.periodStart,
      periodEnd: recaps.periodEnd,
      message: recaps.message,
      createdAt: recaps.createdAt,
    })
    .from(recaps)
    .where(eq(recaps.userId, userId))
    .orderBy(desc(recaps.createdAt))
    .limit(100);

  return c.json({ recaps: rows });
});

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * [periodStart, periodEnd] windows for a recap of `periodType`, anchored on
 * `today`, plus the equivalent window one period back for the "vs last
 * period" comparison. Weekly = the 7 days ending yesterday (Mon cron looking
 * back over the just-finished week); monthly = the full previous calendar
 * month (1st-of-month cron looking back at the month that just ended).
 */
export function periodWindows(periodType: "weekly" | "monthly", today = new Date()) {
  if (periodType === "weekly") {
    const periodEnd = addDays(today, -1);
    const periodStart = addDays(today, -7);
    const previousPeriodEnd = addDays(periodStart, -1);
    const previousPeriodStart = addDays(previousPeriodEnd, -6);
    return {
      periodStart: toISODate(periodStart),
      periodEnd: toISODate(periodEnd),
      previousPeriodStart: toISODate(previousPeriodStart),
      previousPeriodEnd: toISODate(previousPeriodEnd),
    };
  }

  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const twoMonthsAgoEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0);
  const twoMonthsAgoStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  return {
    periodStart: toISODate(prevMonthStart),
    periodEnd: toISODate(prevMonthEnd),
    previousPeriodStart: toISODate(twoMonthsAgoStart),
    previousPeriodEnd: toISODate(twoMonthsAgoEnd),
  };
}

/**
 * Generates and delivers one user's recap for one period, called once per
 * (user, periodType) by the cron handler in index.ts. Idempotent via the
 * `recaps` table's unique (userId, periodType, periodStart) index — a
 * skip-on-conflict insert, same pattern as the default-categories seed, so a
 * retried or double-fired cron can't send the same recap twice. Delivery
 * (Telegram) only fires when the insert actually happened.
 */
export async function generateAndDeliverRecap(
  env: Env["Bindings"],
  db: Db,
  userId: string,
  periodType: "weekly" | "monthly",
  today = new Date()
): Promise<void> {
  const { periodStart, periodEnd, previousPeriodStart, previousPeriodEnd } = periodWindows(periodType, today);

  const [txRows, categoryRows] = await Promise.all([
    db
      .select({
        txType: transactions.txType,
        amount: transactions.amount,
        date: transactions.date,
        categoryId: transactions.categoryId,
        merchant: transactions.merchant,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId)),
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.userId, userId)),
  ]);

  const categoryNamesById = new Map(categoryRows.map((cat) => [cat.id, cat.name]));
  const data = recapForPeriod(txRows, categoryNamesById, periodStart, periodEnd, previousPeriodStart, previousPeriodEnd);

  if (data.transactionCount === 0) return;

  const message = await phraseRecap(env, periodType, data);

  const [inserted] = await db
    .insert(recaps)
    .values({ userId, periodType, periodStart, periodEnd, message, data: JSON.stringify(data) })
    .onConflictDoNothing()
    .returning({ id: recaps.id });

  if (!inserted) return; // already delivered for this user+period

  const [link] = await db
    .select({ externalId: messagingLinks.externalId })
    .from(messagingLinks)
    .where(eq(messagingLinks.userId, userId));

  if (link) {
    await sendTelegramMessage(env, link.externalId, message);
  }
}

/** Runs `generateAndDeliverRecap` for every user, called by the scheduled() handler. One failure doesn't stop the rest. */
export async function generateRecapsForAllUsers(
  env: Env["Bindings"],
  db: Db,
  periodType: "weekly" | "monthly",
  today = new Date()
): Promise<void> {
  const allUsers = await db.select({ id: users.id }).from(users);

  for (const user of allUsers) {
    try {
      await generateAndDeliverRecap(env, db, user.id, periodType, today);
    } catch (e) {
      console.error(`Recap generation failed for user ${user.id} (${periodType}):`, e);
    }
  }
}
