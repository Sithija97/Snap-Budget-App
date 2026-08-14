import type { Env } from "../types";

type Bindings = Env["Bindings"];

// Flash is cheap/fast and comfortably handles receipt-photo OCR; strict JSON
// output (responseSchema) avoids parsing free-form text out of the model.
const MODEL = "gemini-2.5-flash";

export interface ExtractedReceipt {
  merchant: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  categoryName: string | null;
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

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Bounds how long a scan can hang the Worker if Gemini stalls — the
      // route's caller turns any failure here into a 502 with a clear
      // "try again or enter manually" message either way.
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
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

  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string }[] };
    }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(
      `Gemini returned no content (finishReason: ${data.candidates?.[0]?.finishReason ?? "unknown"})`
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
  if (
    typeof parsed.merchant !== "string" ||
    typeof parsed.amount !== "number" ||
    typeof parsed.date !== "string"
  ) {
    throw new Error(`Gemini returned an unexpected shape: ${text.slice(0, 200)}`);
  }

  return {
    merchant: parsed.merchant,
    amount: parsed.amount,
    date: parsed.date,
    categoryName: typeof parsed.categoryName === "string" ? parsed.categoryName : null,
  };
}
