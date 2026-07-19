import type { Env } from "../types";
import type { QuerySpec } from "./insights";

type Bindings = Env["Bindings"];

const MODEL = "gemini-2.5-flash";

export type Intent = "query" | "survival_estimate" | "budget_status" | "unsupported";

export interface IntentResult {
  intent: Intent;
  /** Only present when intent is "query" — the filter/grouping to run against real transactions */
  querySpec?: QuerySpec;
  /** Only present when intent is "budget_status" — "YYYY-MM", defaults to the current month if omitted */
  month?: string;
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
        generationConfig: { responseMimeType: "application/json", responseSchema },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini request failed (${res.status}): ${await res.text()}`);

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return text;
}

const INTENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    intent: { type: "STRING", enum: ["query", "survival_estimate", "budget_status", "unsupported"] },
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
  },
  required: ["intent"],
};

// Classifies a free-text question into one of a small set of *safe
// operations* rather than a fixed list of pre-written questions — "query"
// covers the long tail of "how much did I spend on X between Y and Z"
// phrasings via a filter/group spec Gemini fills in (date range, category,
// merchant, income vs. expense, grouped or not). Gemini only ever chooses
// *what to filter/group by*; it never receives real transaction data at this
// stage and never states a number here. "unsupported" is reserved for
// genuinely non-financial questions or write requests (add/edit/delete),
// not just anything outside a narrow pre-set list.
export async function classifyIntent(env: Bindings, question: string, todayISO: string): Promise<IntentResult> {
  const prompt = `You are the query planner for a personal finance app called SnapBudget. Today's date is ${todayISO}. The user asked: "${question}"

Decide which of these safe operations answers it:
- "query": any question about how much was spent/earned, optionally filtered by date range, category, or merchant, and optionally grouped by category (for "breakdown"/"top categories"/"where did my money go" style questions). This covers almost every spending/income question — fill in querySpec with whatever the question implies (e.g. "last 6 months" → startDate 6 months before ${todayISO}, endDate ${todayISO}; "on food" → categoryName "Food"; "at Uber" → merchantContains "Uber"; a breakdown/top-categories question → groupBy "category"). Only set fields the question actually implies; leave the rest null.
- "survival_estimate": whether their remaining balance will last until their next payday/salary.
- "budget_status": how they're doing against their set budgets (over/under, remaining) — optionally for a specific month.
- "unsupported": only for things that are not a financial-data question at all (e.g. small talk, unrelated topics) or a request to create/edit/delete a transaction, budget, category, or wallet (this assistant is read-only).

Prefer "query" whenever the question is about actual amounts spent or earned — it is intentionally broad. Only use "unsupported" when none of the other three genuinely fit.`;

  const text = await callGemini(env, prompt, INTENT_SCHEMA);
  const parsed = JSON.parse(text);

  if (!["query", "survival_estimate", "budget_status", "unsupported"].includes(parsed.intent)) {
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

  return {
    intent: parsed.intent,
    querySpec,
    month: parsed.intent === "budget_status" && typeof parsed.month === "string" ? parsed.month : undefined,
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
  "I can answer questions about your spending, income, and budgets — but I can't add, edit, or delete anything, and I can't help with things outside your finances. Try asking about your spending instead!";
