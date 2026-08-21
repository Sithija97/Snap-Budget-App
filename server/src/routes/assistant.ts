import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { transactions, categories, wallets, budgets } from "../db/schema";
import { classifyIntent, phraseAnswer, extractTransactionFromText, UNSUPPORTED_REPLY, TransactionDraft, GeminiQuotaError } from "../lib/assistant";
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

function nowTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// One pending draft per user at a time — a second "add_transaction" message
// before the first is confirmed/cancelled simply overwrites it, matching how
// a real assistant conversation only ever has one open question. Keyed in
// the same KV namespace the rate limiter uses (see middleware/rateLimit.ts);
// a short TTL means an abandoned draft just expires rather than needing
// active cleanup.
const DRAFT_TTL_SECONDS = 5 * 60;
const draftKey = (userId: string) => `draft:${userId}`;

export async function putPendingDraft(kv: KVNamespace, userId: string, draft: TransactionDraft): Promise<void> {
  await kv.put(draftKey(userId), JSON.stringify(draft), { expirationTtl: DRAFT_TTL_SECONDS });
}

export async function getPendingDraft(kv: KVNamespace, userId: string): Promise<TransactionDraft | null> {
  const raw = await kv.get(draftKey(userId));
  return raw ? (JSON.parse(raw) as TransactionDraft) : null;
}

export async function clearPendingDraft(kv: KVNamespace, userId: string): Promise<void> {
  await kv.delete(draftKey(userId));
}

function describeDraft(draft: TransactionDraft): string {
  const direction = draft.txType === "inc" ? "income of" : "spend of";
  return `Log ${direction} Rs ${draft.amount.toLocaleString("en-US")} for "${draft.merchant}" (${draft.categoryName}) on ${draft.date}?`;
}

// Matches an existing category of the given type by name (case-insensitive),
// or creates one — mirrors the client's identically-named helper in
// app/scan.tsx, but server-side since a chat-confirmed draft has no client
// round-trip to resolve it through useCategoryStore.
async function resolveCategoryId(db: Db, userId: string, name: string, type: "expense" | "income"): Promise<string> {
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, type), sql`lower(${categories.name}) = lower(${name})`));

  if (existing) return existing.id;

  const [created] = await db
    .insert(categories)
    .values({ userId, name, type, icon: type === "income" ? "CircleArrowDown" : "ShoppingCart", isDefault: false })
    .returning({ id: categories.id });

  return created.id;
}

// Shared by the in-app "Confirm" tap and Telegram's "yes" reply — saves
// exactly the draft the user already saw and agreed to, never re-deriving
// anything from the original free-text message.
export async function saveDraftTransaction(env: Env["Bindings"], db: Db, userId: string, draft: TransactionDraft) {
  // Mirrors app/scan.tsx's defaultWalletId fallback (default wallet, else the
  // first one, else unset) — a chat-confirmed draft has no client-side
  // useWalletStore to read that from, so the same rule is re-applied here.
  const userWallets = await db.select({ id: wallets.id, isDefault: wallets.isDefault }).from(wallets).where(eq(wallets.userId, userId));
  const walletId = userWallets.find((w) => w.isDefault)?.id ?? userWallets[0]?.id ?? null;

  const categoryId = await resolveCategoryId(db, userId, draft.categoryName, draft.txType === "inc" ? "income" : "expense");

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      merchant: draft.merchant,
      categoryId,
      walletId,
      txType: draft.txType,
      amount: draft.amount,
      date: draft.date,
      time: nowTime(),
      receiptKey: null,
    })
    .returning();

  await clearPendingDraft(env.RATE_LIMIT_KV, userId);
  return row;
}

export interface AnswerResult {
  reply: string;
  /** Only present for an "add_transaction" message — the caller must persist
   *  this itself (KV for Telegram, or hand it back to the app) so a later
   *  confirmation saves exactly what was shown, never re-deriving it. */
  draft?: TransactionDraft;
}

// Shared by the authenticated /api/assistant/ask route and the Telegram
// webhook's free-text handling — one code path so the two surfaces can never
// answer the same question differently.
export async function answerQuestion(env: Env["Bindings"], db: Db, userId: string, question: string): Promise<AnswerResult> {
  const intentResult = await classifyIntent(env, question, todayISODate());

  if (intentResult.intent === "unsupported") {
    return { reply: UNSUPPORTED_REPLY };
  }

  if (intentResult.intent === "add_transaction" && intentResult.draft) {
    return { reply: describeDraft(intentResult.draft), draft: intentResult.draft };
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
      .select({ limitAmount: budgets.limitAmount, month: budgets.month })
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
      data = budgetStatusForMonth(txs, budgetRowsTyped, intentResult.month ?? currentMonth());
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

  const reply = await phraseAnswer(env, question, data);
  return { reply };
}

const confirmInput = z.object({
  merchant: z.string().min(1),
  amount: z.number().positive(),
  categoryName: z.string().min(1),
  txType: z.enum(["inc", "exp"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

assistantRoute.post("/ask", zValidator("json", askInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const { question } = c.req.valid("json");

  try {
    const result = await answerQuestion(c.env, db, userId, question);
    // The app confirms with a button tap (POST /confirm), not another chat
    // message, so it needs the draft's exact fields back — but the draft
    // still gets mirrored into KV so the same pending-state guard Telegram
    // relies on also covers "user re-asks a different question mid-confirm"
    // in-app.
    if (result.draft) await putPendingDraft(c.env.RATE_LIMIT_KV, userId, result.draft);
    return c.json(result);
  } catch (e) {
    console.error(e);
    if (e instanceof GeminiQuotaError) {
      return c.json({ error: "The assistant has hit its daily usage limit. Please try again later." }, 429);
    }
    return c.json({ error: "Couldn't answer that right now. Try again in a moment." }, 502);
  }
});

assistantRoute.post("/confirm", zValidator("json", confirmInput), async (c) => {
  const db = c.get("db");
  const userId = c.get("userId");
  const draft = c.req.valid("json");

  try {
    const row = await saveDraftTransaction(c.env, db, userId, draft);
    return c.json(row, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Couldn't save that transaction. Try again in a moment." }, 502);
  }
});

assistantRoute.post("/cancel", async (c) => {
  const userId = c.get("userId");

  try {
    await clearPendingDraft(c.env.RATE_LIMIT_KV, userId);
    return c.json({ ok: true });
  } catch (e) {
    console.error(e);
    return c.json({ error: "Couldn't cancel that right now. Try again in a moment." }, 502);
  }
});

const parseNotificationInput = z.object({
  text: z.string().min(1).max(1000),
  postedAt: z.string().datetime(),
});

// Fallback for a captured Android notification (see
// app/lib/notificationCapture.ts) whose text didn't match any on-device
// regex template. No draft is persisted server-side here — unlike chat's
// /ask, the caller already has a client-side review screen (scan.tsx) to
// hold the draft until the user explicitly saves it, so there's nothing to
// resume if the app is closed mid-review.
assistantRoute.post("/parse-notification", zValidator("json", parseNotificationInput), async (c) => {
  const { text, postedAt } = c.req.valid("json");

  try {
    const draft = await extractTransactionFromText(c.env, text, postedAt, todayISODate());
    return c.json({ draft: draft ?? null });
  } catch (e) {
    console.error(e);
    return c.json({ error: "Couldn't parse that notification right now." }, 502);
  }
});
