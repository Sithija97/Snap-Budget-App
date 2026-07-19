import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { transactions, categories, wallets, budgets } from "../db/schema";
import { classifyIntent, phraseAnswer, UNSUPPORTED_REPLY } from "../lib/assistant";
import { runQuery, survivalEstimate, budgetStatusForMonth, TxRow, BudgetRow } from "../lib/insights";
import type { Env } from "../types";
import type { Db } from "../db/client";

const askInput = z.object({ question: z.string().min(1).max(500) });

export const assistantRoute = new Hono<Env>();

function todayISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentMonth(): string {
  return todayISODate().slice(0, 7);
}

// Shared by the authenticated /api/assistant/ask route and the Telegram
// webhook's free-text handling — one code path so the two surfaces can never
// answer the same question differently.
export async function answerQuestion(env: Env["Bindings"], db: Db, userId: string, question: string): Promise<string> {
  const intentResult = await classifyIntent(env, question, todayISODate());

  if (intentResult.intent === "unsupported") {
    return UNSUPPORTED_REPLY;
  }

  const [txRows, categoryRows, walletRows, budgetRows] = await Promise.all([
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
    db.select({ balance: wallets.balance }).from(wallets).where(eq(wallets.userId, userId)),
    db
      .select({ categoryId: budgets.categoryId, limitAmount: budgets.limitAmount, month: budgets.month })
      .from(budgets)
      .where(eq(budgets.userId, userId)),
  ]);

  const txs: TxRow[] = txRows;
  const budgetRowsTyped: BudgetRow[] = budgetRows;
  const categoryNamesById = new Map(categoryRows.map((c) => [c.id, c.name]));

  let data: unknown;
  switch (intentResult.intent) {
    case "query":
      data = runQuery(txs, categoryNamesById, intentResult.querySpec ?? {});
      break;
    case "budget_status":
      data = budgetStatusForMonth(txs, budgetRowsTyped, categoryNamesById, intentResult.month ?? currentMonth());
      break;
    case "survival_estimate": {
      // null balances count as 0 toward the total, matching useWalletStore's
      // getTotalBalance() convention on the frontend — but if every wallet is
      // unset, there's genuinely nothing to project against.
      const anySet = walletRows.some((w) => w.balance !== null);
      const totalBalance = anySet ? walletRows.reduce((sum, w) => sum + (w.balance ?? 0), 0) : null;
      data = survivalEstimate(txs, totalBalance);
      break;
    }
  }

  return phraseAnswer(env, question, data);
}

assistantRoute.post("/ask", zValidator("json", askInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { question } = c.req.valid("json");

  try {
    const reply = await answerQuestion(c.env, db, userId, question);
    return c.json({ reply });
  } catch (e) {
    console.error(e);
    return c.json({ error: "Couldn't answer that right now. Try again in a moment." }, 502);
  }
});
