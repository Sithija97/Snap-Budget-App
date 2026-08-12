import { TxType } from "@/types";

/** How a captured notification's transaction fields were determined. */
export type CaptureSource = "regex" | "gemini";

export interface CapturedSuggestion {
  id: string;
  packageName: string;
  appLabel: string;
  rawText: string;
  postTimeMs: number;
  source: CaptureSource;
  // A suggestion is only ever created once an amount has actually been
  // extracted (see lib/notificationCapture.ts's handleNotification) — a
  // notification with no confirmed transaction amount (OTP, marketing,
  // balance check, unrecognized format, etc.) is dropped before it ever
  // becomes a CapturedSuggestion, so this is never null here.
  amount: number;
  /** Merchant/counterparty — still optional since not every template/Gemini extraction includes one */
  merchant: string | null;
  categoryName: string | null;
  txType: TxType;
  date: string; // "YYYY-MM-DD"
  status: "pending" | "dismissed" | "saved";
}

export interface AllowlistedApp {
  packageName: string;
  label: string;
}
