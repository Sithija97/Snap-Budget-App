import type { Env } from "../types";

type Bindings = Env["Bindings"];

// Flash is cheap/fast and comfortably handles receipt-photo OCR; strict JSON
// output (responseSchema) avoids parsing free-form text out of the model.
const MODEL = "gemini-2.5-flash";

// Per-attempt timeout. Measured latency with thinkingBudget: 0 is ~4s for a
// receipt-sized image; 15s leaves comfortable margin for slower connections
// while still fitting 2 attempts inside the client's 35s budget (lib/api.ts).
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 2;
const BASE_BACKOFF_MS = 500;

export type GeminiErrorKind =
  | "quota" // 429 — rate limit or quota exceeded
  | "overloaded" // 503 — model temporarily overloaded
  | "timeout" // request exceeded REQUEST_TIMEOUT_MS
  | "network" // fetch itself failed (DNS, connection reset, etc.)
  | "invalid_response" // 4xx other than 429, or malformed/empty output
  | "server_error"; // 5xx other than 503

export class GeminiError extends Error {
  readonly kind: GeminiErrorKind;
  readonly retryable: boolean;

  constructor(kind: GeminiErrorKind, message: string) {
    super(message);
    this.name = "GeminiError";
    this.kind = kind;
    this.retryable = kind === "quota" || kind === "overloaded" || kind === "timeout" || kind === "network";
  }
}

function classifyHttpError(status: number, body: string): GeminiError {
  if (status === 429) return new GeminiError("quota", `Gemini quota/rate limit exceeded (429): ${body}`);
  if (status === 503) return new GeminiError("overloaded", `Gemini model overloaded (503): ${body}`);
  if (status >= 500) return new GeminiError("server_error", `Gemini server error (${status}): ${body}`);
  return new GeminiError("invalid_response", `Gemini request rejected (${status}): ${body}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ExtractedReceipt {
  merchant: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  categoryName: string | null;
}

async function callGemini(env: Bindings, prompt: string, imageBase64: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            // Receipt extraction is a direct-lookup task, not multi-step
            // reasoning — Flash defaults to a "thinking" pass that burned
            // 700+ tokens and ~15s/call even on this simple a prompt (measured
            // directly against the API), which is what was blowing the
            // request timeout. Disabling it cut latency to ~4s.
            thinkingConfig: { thinkingBudget: 0 },
            responseSchema: {
              type: "OBJECT",
              properties: {
                merchant: { type: "STRING" },
                amount: { type: "NUMBER" },
                date: { type: "STRING" },
                categoryName: { type: "STRING", nullable: true },
              },
              required: ["merchant", "amount", "date"],
            },
          },
        }),
      }
    );
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      throw new GeminiError("timeout", `Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw new GeminiError("network", `Gemini request failed: ${e?.message ?? String(e)}`);
  }

  if (!res.ok) {
    throw classifyHttpError(res.status, await res.text());
  }

  const data = (await res.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiError(
      "invalid_response",
      `Gemini returned no content (finishReason: ${data.candidates?.[0]?.finishReason ?? "unknown"})`
    );
  }
  return text;
}

export async function extractReceipt(
  env: Bindings,
  imageBase64: string,
  categoryNames: string[],
  todayISO: string
): Promise<ExtractedReceipt> {
  const prompt = `You are extracting structured data from a photo of a purchase receipt.
Return the merchant/store name, the total amount paid (a plain positive number, no currency symbol or thousands separators), and the purchase date in YYYY-MM-DD format (if no date is visible on the receipt, use ${todayISO}).
Also choose the single best-matching category from this exact list: ${categoryNames.length ? categoryNames.join(", ") : "(none available)"}.
If nothing on the list reasonably fits, set categoryName to null — never invent a category name that isn't in the list.`;

  let text: string | undefined;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      text = await callGemini(env, prompt, imageBase64);
      break;
    } catch (e) {
      lastError = e;
      const retryable = e instanceof GeminiError ? e.retryable : false;
      if (!retryable || attempt === MAX_ATTEMPTS) throw e;
      console.warn(
        `[gemini] attempt ${attempt}/${MAX_ATTEMPTS} failed (${e instanceof GeminiError ? e.kind : "unknown"}), retrying`,
        e
      );
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }
  if (text === undefined) throw lastError;

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("invalid_response", `Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
  if (
    typeof parsed.merchant !== "string" ||
    typeof parsed.amount !== "number" ||
    typeof parsed.date !== "string"
  ) {
    throw new GeminiError("invalid_response", `Gemini returned an unexpected shape: ${text.slice(0, 200)}`);
  }

  return {
    merchant: parsed.merchant,
    amount: parsed.amount,
    date: parsed.date,
    categoryName: typeof parsed.categoryName === "string" ? parsed.categoryName : null,
  };
}
