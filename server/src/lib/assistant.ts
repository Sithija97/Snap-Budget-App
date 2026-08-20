import type { Env } from "../types";
import type { QuerySpec } from "./insights";

type Bindings = Env["Bindings"];

const MODEL = "gemini-2.5-flash";

export type Intent = "query" | "survival_estimate" | "budget_status" | "add_transaction" | "unsupported";

// What the model extracted from a "spent 500 on lunch" style message — never
// saved directly. The caller must always show this back to the user for
// confirmation before it becomes a real transaction (see routes/assistant.ts
// draftTransaction / confirmDraft).
export interface TransactionDraft {
  merchant: string;
  amount: number;
  categoryName: string;
  txType: "inc" | "exp";
  /** ISO "YYYY-MM-DD", defaults to today when the message doesn't name a date */
  date: string;
}

export interface IntentResult {
  intent: Intent;
  /** Only present when intent is "query" — the filter/grouping to run against real transactions */
  querySpec?: QuerySpec;
  /** Only present when intent is "budget_status" — "YYYY-MM", defaults to the current month if omitted */
  month?: string;
  /** Only present when intent is "add_transaction" */
  draft?: TransactionDraft;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Shared by classifyIntent's add_transaction extraction and
// extractTransactionFromText — same untrusted-model-output shape, same
// validation rules, so the two paths can never accept a draft the other
// would reject.
function validateDraft(rawDraft: unknown, fallbackDate: string): TransactionDraft | undefined {
  if (!rawDraft || typeof rawDraft !== "object") return undefined;
  const d = rawDraft as Record<string, unknown>;
  if (
    typeof d.merchant !== "string" ||
    d.merchant.trim().length === 0 ||
    typeof d.amount !== "number" ||
    d.amount <= 0 ||
    typeof d.categoryName !== "string" ||
    d.categoryName.trim().length === 0 ||
    (d.txType !== "inc" && d.txType !== "exp")
  ) {
    return undefined;
  }
  return {
    merchant: d.merchant.trim(),
    amount: d.amount,
    categoryName: d.categoryName.trim(),
    txType: d.txType,
    date: typeof d.date === "string" && DATE_RE.test(d.date) ? d.date : fallbackDate,
  };
}

// Thrown instead of a bare Error so route handlers can tell "Gemini's daily
// free-tier quota is exhausted" (transient, resets on its own) apart from
// any other failure without string-matching the message.
export class GeminiQuotaError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "GeminiQuotaError";
  }
}

async function callGemini(env: Bindings, prompt: string, responseSchema: object): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Classification/phrasing only — no multi-step reasoning needed, and
        // the default "thinking" pass adds several seconds of latency for no
        // benefit here (see gemini.ts for the same fix, measured directly).
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema,
        },
      }),
    }
  );

  if (res.status === 429) throw new GeminiQuotaError(await res.text());
  if (!res.ok) throw new Error(`Gemini request failed (${res.status}): ${await res.text()}`);

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return text;
}

const INTENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    intent: { type: "STRING", enum: ["query", "survival_estimate", "budget_status", "add_transaction", "unsupported"] },
    querySpec: {
      type: "OBJECT",
      nullable: true,
      properties: {
        startDate: { type: "STRING", nullable: true, description: 'ISO "YYYY-MM-DD"' },
        endDate: { type: "STRING", nullable: true, description: 'ISO "YYYY-MM-DD"' },
        categoryName: { type: "STRING", nullable: true },
        merchantContains: { type: "STRING", nullable: true },
        txType: { type: "STRING", nullable: true, enum: ["inc", "exp"] },
        groupBy: { type: "STRING", nullable: true, enum: ["category"] },
      },
    },
    month: { type: "STRING", nullable: true, description: 'ISO "YYYY-MM", only for budget_status' },
    draft: {
      type: "OBJECT",
      nullable: true,
      description: "Only for add_transaction",
      properties: {
        merchant: { type: "STRING", description: 'Who/what it was for, e.g. "lunch", "Uber", "salary"' },
        amount: { type: "NUMBER" },
        categoryName: { type: "STRING", description: 'Best-guess category, e.g. "Food", "Transport", "Salary"' },
        txType: { type: "STRING", enum: ["inc", "exp"] },
        date: { type: "STRING", description: 'ISO "YYYY-MM-DD" — resolve relative dates like "yesterday"' },
      },
      required: ["merchant", "amount", "categoryName", "txType", "date"],
    },
  },
  required: ["intent"],
};

// Classifies a free-text question/message into one of a small set of *safe
// operations* rather than a fixed list of pre-written questions — "query"
// covers the long tail of "how much did I spend on X between Y and Z"
// phrasings via a filter/group spec Gemini fills in (date range, category,
// merchant, income vs. expense, grouped or not). Gemini only ever chooses
// *what to filter/group by*; it never receives real transaction data at this
// stage and never states a number here. "add_transaction" is the one intent
// that extracts a draft rather than data to read — it is never saved
// directly from here; the caller always shows the draft back for explicit
// confirmation (see routes/assistant.ts). "unsupported" is reserved for
// genuinely non-financial messages or edit/delete requests (this assistant
// can add, but never edit or delete, from chat), not just anything outside a
// narrow pre-set list.
export async function classifyIntent(env: Bindings, question: string, todayISO: string): Promise<IntentResult> {
  const prompt = `You are the query planner for a personal finance app called SnapBudget. Today's date is ${todayISO}. The user said: "${question}"

Decide which of these safe operations applies:
- "query": any question about how much was spent/earned, optionally filtered by date range, category, or merchant, and optionally grouped by category (for "breakdown"/"top categories"/"where did my money go" style questions). This covers almost every spending/income question — fill in querySpec with whatever the question implies (e.g. "last 6 months" → startDate 6 months before ${todayISO}, endDate ${todayISO}; "on food" → categoryName "Food"; "at Uber" → merchantContains "Uber"; a breakdown/top-categories question → groupBy "category"). Only set fields the question actually implies; leave the rest null.
- "survival_estimate": whether their remaining balance will last until their next payday/salary.
- "budget_status": how they're doing against their one monthly budget (over/under, remaining) — optionally for a specific month.
- "add_transaction": a statement logging money spent or received, e.g. "spent 500 on lunch", "paid 2000 for electricity", "got 50000 salary", "300 for coffee yesterday". Fill in draft: merchant (what/who for), amount, categoryName (your best guess, e.g. "Food", "Transport", "Utilities", "Salary"), txType ("exp" unless it's clearly income like salary/refund/received money), and date (resolve "yesterday"/"on Monday"/etc. relative to ${todayISO}; default to ${todayISO} if no date is mentioned).
- "unsupported": things that are not a financial-data question or a spend/income statement at all (e.g. small talk, unrelated topics), or a request to edit/delete an existing transaction, budget, category, or wallet (this assistant can add new transactions from chat, but can't edit or delete anything).

Prefer "query" whenever the message is a question about actual amounts spent or earned. Prefer "add_transaction" whenever the message is a statement that money was spent or received (not a question). Only use "unsupported" when none of the other four genuinely fit.`;

  const text = await callGemini(env, prompt, INTENT_SCHEMA);
  const parsed = JSON.parse(text);

  if (!["query", "survival_estimate", "budget_status", "add_transaction", "unsupported"].includes(parsed.intent)) {
    return { intent: "unsupported" };
  }

  const spec = parsed.querySpec;
  const querySpec: QuerySpec | undefined =
    parsed.intent === "query" && spec
      ? {
          startDate: typeof spec.startDate === "string" ? spec.startDate : undefined,
          endDate: typeof spec.endDate === "string" ? spec.endDate : undefined,
          categoryName: typeof spec.categoryName === "string" ? spec.categoryName : undefined,
          merchantContains: typeof spec.merchantContains === "string" ? spec.merchantContains : undefined,
          txType: spec.txType === "inc" || spec.txType === "exp" ? spec.txType : undefined,
          groupBy: spec.groupBy === "category" ? "category" : undefined,
        }
      : undefined;

  const draft = parsed.intent === "add_transaction" ? validateDraft(parsed.draft, todayISO) : undefined;

  // A malformed add_transaction extraction (missing amount, etc.) has
  // nothing safe to confirm — fall back to unsupported rather than surfacing
  // a broken draft.
  if (parsed.intent === "add_transaction" && !draft) {
    return { intent: "unsupported" };
  }

  return {
    intent: parsed.intent,
    querySpec,
    month: parsed.intent === "budget_status" && typeof parsed.month === "string" ? parsed.month : undefined,
    draft,
  };
}

// Phrases a natural-language answer from real, already-computed data.
// Gemini's only job here is wording — every number in the prompt came from
// insights.ts, never from the model itself.
export async function phraseAnswer(env: Bindings, question: string, data: unknown): Promise<string> {
  const prompt = `You are a friendly personal-finance assistant inside a budgeting app called SnapBudget. The user asked: "${question}"

Here is the real, already-computed data to answer with (amounts are in Sri Lankan Rupees, formatted as "Rs X,XXX" in your reply):
${JSON.stringify(data)}

Write a short, direct, conversational reply (2-4 sentences max) using only the numbers given above. Never invent or estimate a figure that isn't in the data. If the data shows zero transactions or missing/insufficient data, say so plainly instead of guessing.`;

  const text = await callGemini(env, prompt, {
    type: "OBJECT",
    properties: { reply: { type: "STRING" } },
    required: ["reply"],
  });

  const parsed = JSON.parse(text);
  if (typeof parsed.reply !== "string") throw new Error("Gemini returned an unexpected shape");
  return parsed.reply;
}

export const UNSUPPORTED_REPLY =
  "I can answer questions about your spending, income, and budgets, and log a new transaction if you tell me what you spent — but I can't edit or delete anything, and I can't help with things outside your finances. Try asking about your spending, or telling me what you spent!";

const NOTIFICATION_DRAFT_SCHEMA = {
  type: "OBJECT",
  properties: {
    isTransaction: {
      type: "BOOLEAN",
      description: "true only if this notification is a bank/payment transaction alert (money debited/credited/spent/received)",
    },
    draft: {
      type: "OBJECT",
      nullable: true,
      description: "Only when isTransaction is true",
      properties: {
        merchant: { type: "STRING", description: 'Who the payment was to/from, e.g. "Keells Super", "John Doe". If unknown, use the bank/app name.' },
        amount: { type: "NUMBER" },
        categoryName: { type: "STRING", description: 'Best-guess category, e.g. "Food", "Transport", "Utilities", "Salary"' },
        txType: { type: "STRING", enum: ["inc", "exp"] },
        date: { type: "STRING", description: 'ISO "YYYY-MM-DD"' },
      },
      required: ["merchant", "amount", "categoryName", "txType", "date"],
    },
  },
  required: ["isTransaction"],
};

// Fallback for when app/lib/notificationCapture.ts's on-device regex
// templates (utils/notificationParser.ts) don't match a captured
// notification's text (PLAN.md §7: "Gemini structured-output fallback for
// unmatched text"). Same never-auto-save contract as the rest of the
// assistant — the caller always shows this back to the user in the existing
// scan.tsx review screen before anything is saved; nothing here writes to
// the database.
export async function extractTransactionFromText(
  env: Bindings,
  notificationText: string,
  postedAtISO: string,
  todayISO: string
): Promise<TransactionDraft | undefined> {
  const prompt = `You are looking at the text of a single Android notification captured from a banking or payment app, for a personal finance app called SnapBudget. Today's date is ${todayISO}; the notification was posted at ${postedAtISO}.

Notification text: "${notificationText}"

Decide if this notification is announcing a real money transaction (debited/credited/spent/received/paid). Notifications that are NOT transactions — OTPs, marketing, "statement ready", login alerts, balance-check confirmations with no new transaction, promotional offers — must get isTransaction: false. If isTransaction is true, extract the draft: merchant/counterparty, amount, best-guess category, txType ("exp" for money going out, "inc" for money coming in), and date (use the notification's posted date unless the text clearly states a different date).`;

  const text = await callGemini(env, prompt, NOTIFICATION_DRAFT_SCHEMA);
  const parsed = JSON.parse(text);

  if (parsed.isTransaction !== true) return undefined;
  return validateDraft(parsed.draft, todayISO);
}
