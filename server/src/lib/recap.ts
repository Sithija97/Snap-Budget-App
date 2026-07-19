import type { Env } from "../types";
import type { RecapData } from "./insights";

type Bindings = Env["Bindings"];

const MODEL = "gemini-2.5-flash";

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

// Same "Gemini phrases, never computes" principle as assistant.ts's
// phraseAnswer — every number here came from insights.ts's recapForPeriod,
// never from the model. Unprompted (not a reply to a question), so the
// wording leans into a proactive summary rather than answering "what was asked".
export async function phraseRecap(
  env: Bindings,
  periodType: "weekly" | "monthly",
  data: RecapData
): Promise<string> {
  const prompt = `You are a friendly personal-finance assistant inside a budgeting app called SnapBudget. Write a short, unprompted ${periodType} recap message for the user, covering ${data.periodStart} to ${data.periodEnd}. Amounts are in Sri Lankan Rupees, formatted as "Rs X,XXX" in your reply.

Here is the real, already-computed data to summarize (use only these numbers, never invent or estimate a figure that isn't here):
${JSON.stringify(data)}

Guidelines:
- 2-4 sentences max, conversational and direct, like a quick check-in message.
- Mention total spent and, if topCategories is non-empty, the top 1-2 categories.
- If previousPeriodSpent is not null, compare this period's spend against it (e.g. "12% less than last week") — only state a percentage if you can compute it exactly from the two numbers given; otherwise just say "more" or "less".
- If transactionCount is 0, say plainly that nothing was logged this period instead of guessing why.
- Do not mention budgets, payday, or anything not present in the data above.`;

  const text = await callGemini(env, prompt, {
    type: "OBJECT",
    properties: { message: { type: "STRING" } },
    required: ["message"],
  });

  const parsed = JSON.parse(text);
  if (typeof parsed.message !== "string") throw new Error("Gemini returned an unexpected shape");
  return parsed.message;
}
