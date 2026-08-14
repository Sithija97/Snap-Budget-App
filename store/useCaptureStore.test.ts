import { describe, it, expect } from "vitest";
import { isValidSuggestion } from "./useCaptureStore";

const validSuggestion = {
  id: "1",
  packageName: "com.example.bank",
  appLabel: "Bank",
  rawText: "Rs 500 spent at Keells",
  postTimeMs: 1_700_000_000_000,
  source: "regex",
  amount: 500,
  merchant: "Keells",
  categoryName: null,
  txType: "exp",
  date: "2026-08-01",
  status: "pending",
};

describe("isValidSuggestion", () => {
  it("accepts a well-formed suggestion", () => {
    expect(isValidSuggestion(validSuggestion)).toBe(true);
  });

  it("rejects a suggestion with amount: null (pre-migration \"unparsed\" shape)", () => {
    // Regression: CapturedSuggestion.amount was once `number | null` and
    // `source` once included "unparsed" — a record persisted under that
    // older shape must not pass validation, or app/captured.tsx crashes
    // calling amount.toLocaleString() on null.
    expect(isValidSuggestion({ ...validSuggestion, amount: null })).toBe(false);
  });

  it("rejects a suggestion with source: \"unparsed\" (removed enum value)", () => {
    expect(isValidSuggestion({ ...validSuggestion, source: "unparsed" })).toBe(false);
  });

  it("rejects a non-finite amount (NaN/Infinity)", () => {
    expect(isValidSuggestion({ ...validSuggestion, amount: NaN })).toBe(false);
    expect(isValidSuggestion({ ...validSuggestion, amount: Infinity })).toBe(false);
  });

  it("rejects an unrecognized status", () => {
    expect(isValidSuggestion({ ...validSuggestion, status: "archived" })).toBe(false);
  });

  it("rejects null/undefined/non-object input", () => {
    expect(isValidSuggestion(null)).toBe(false);
    expect(isValidSuggestion(undefined)).toBe(false);
    expect(isValidSuggestion("not an object")).toBe(false);
  });

  it("accepts a suggestion with a null merchant/categoryName (both legitimately optional)", () => {
    expect(isValidSuggestion({ ...validSuggestion, merchant: null, categoryName: null })).toBe(true);
  });
});
