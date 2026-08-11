import { TxType } from "@/types";

/** How a captured notification's transaction fields were determined. */
export type CaptureSource = "regex" | "gemini" | "unparsed";

export interface CapturedSuggestion {
  id: string;
  packageName: string;
  appLabel: string;
  rawText: string;
  postTimeMs: number;
  source: CaptureSource;
  /** Prefilled review fields — absent fields are left blank for the user to fill in (PLAN.md §7 "graceful degradation") */
  amount: number | null;
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
