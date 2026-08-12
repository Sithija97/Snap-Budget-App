import { describe, it, expect } from "vitest";
import { parseNotificationText, isDuplicateNotification } from "./notificationParser";
import { TxType } from "@/types";

describe("parseNotificationText", () => {
  it("parses a generic debit alert", () => {
    const result = parseNotificationText("com.example.bank", "Your account has been debited Rs. 1,450.00");
    expect(result).toEqual({ amount: 1450, merchant: null, txType: TxType.Expense, date: null });
  });

  it("parses a generic credit alert", () => {
    const result = parseNotificationText("com.example.bank", "Your account has been credited Rs 50,000");
    expect(result).toEqual({ amount: 50000, merchant: null, txType: TxType.Income, date: null });
  });

  it("extracts a merchant from an 'at <merchant>' pattern", () => {
    const result = parseNotificationText("com.example.bank", "Rs 850 spent at Keells Super");
    expect(result?.amount).toBe(850);
    expect(result?.merchant).toBe("Keells Super");
    expect(result?.txType).toBe(TxType.Expense);
  });

  it("returns null when nothing matches", () => {
    expect(parseNotificationText("com.example.bank", "Hello there, how can I help you today?")).toBeNull();
  });

  it("returns null for empty text", () => {
    expect(parseNotificationText("com.example.bank", "")).toBeNull();
  });

  it("rejects a calendar-invalid date instead of silently rolling it into the next month", () => {
    // "30/02/26" (Feb 30 doesn't exist) must not silently become March 2 —
    // JS's Date constructor overflows rather than throwing, so this needs an
    // explicit round-trip check.
    const result = parseNotificationText("com.example.bank", "Rs 500 spent at Some Shop on 30/02/26 04:28 PM");
    expect(result?.date).toBeNull();
  });

  it("parses an amount-first debit ('Rs X was debited') and still extracts a merchant", () => {
    const result = parseNotificationText("com.example.bank", "Rs 850 spent at Keells Super");
    // Regression: this text matches the generic debit-alert template
    // (contains "spent") before the more specific "at <merchant>" template
    // further down the list, so the debit template must itself be able to
    // recover the merchant rather than silently losing it.
    expect(result).toEqual({ amount: 850, merchant: "Keells Super", txType: TxType.Expense, date: null });
  });

  it("classifies an amount-first credit as income, not an expense (regression)", () => {
    // Real-world bug: "Rs X credited to your account" was previously falling
    // through the credit template (which only matched "credited...Rs X")
    // into the "at <merchant>" debit template, which matched "to your
    // Savings account" as if it were a merchant and misclassified income as
    // an expense.
    const result = parseNotificationText("com.example.bank", "Rs 5,000 credited to your Savings account");
    expect(result?.txType).toBe(TxType.Income);
    expect(result?.amount).toBe(5000);
    // No merchant — "to your Savings account" is the user's own account, not
    // a counterparty, so it must not be prefilled as a merchant name.
    expect(result?.merchant).toBeNull();
  });

  it("classifies an amount-first debit as an expense (regression, mirrors the credit case)", () => {
    const result = parseNotificationText("com.example.bank", "Rs 1,200 was debited from your account");
    expect(result?.txType).toBe(TxType.Expense);
    expect(result?.amount).toBe(1200);
  });

  // Real ComBank/card-network SMS-relay samples collected 2026-08-10 (PLAN.md
  // §7 "step zero") — these are the actual notification text this feature
  // will see in production, not synthetic examples.
  describe("real Sri Lankan bank/card notification samples", () => {
    it("does not treat an OTP/approval-code SMS as a transaction", () => {
      const result = parseNotificationText(
        "combank.com.combankdigital",
        "Digital-Transfer within ComBank LKR 20,000.00 attempted. Please use code 719321 to approve. Do NOT share this number with anyone. PbgqGoDg8jk"
      );
      expect(result).toBeNull();
    });

    it("parses a card authorisation SMS and cleans up a noisy POS merchant string", () => {
      const result = parseNotificationText(
        "com.android.messaging",
        "Dear Cardholder, Purchase at KEELLS PANNIPITIYA PANNIPITIYA COLK for LKR 953.00 on 07/08/26 04:28 PM has been authorised on your debit card ending #7806."
      );
      expect(result).toEqual({
        amount: 953,
        merchant: "Keells Pannipitiya",
        txType: TxType.Expense,
        date: "2026-08-07",
      });
    });

    it("cleans up a merchant string with an embedded phone number", () => {
      const result = parseNotificationText(
        "com.android.messaging",
        "Dear Cardholder, Purchase at PICKME RIDE 0117433433 LK for LKR 490.40 on 07/08/26 06:48 PM has been authorised on your debit card ending #7806."
      );
      expect(result?.amount).toBe(490.4);
      expect(result?.merchant).toBe("Pickme Ride");
      expect(result?.date).toBe("2026-08-07");
    });

    it("cleans up a merchant string with a trailing numeric code", () => {
      const result = parseNotificationText(
        "com.android.messaging",
        "Dear Cardholder, Purchase at UBER EATS 852 LK for LKR 1,284.28 on 04/08/26 02:56 PM has been authorised on your debit card ending #7806."
      );
      expect(result?.amount).toBe(1284.28);
      expect(result?.merchant).toBe("Uber Eats");
      expect(result?.date).toBe("2026-08-04");
    });

    it("classifies a 'Credit for Rs X' incoming-transfer SMS as income, not an expense (regression, 2026-08-12)", () => {
      // Real ComBank sample: an incoming transfer (e.g. a salary conversion)
      // uses the noun "Credit for", not "credited" — previously unrecognized
      // by the credit template entirely, so this fell through to the "at
      // <merchant>" debit template, which matched "to 8021406412 at ..." as
      // if the masked account number were a merchant and misclassified a
      // large real credit as an expense.
      const result = parseNotificationText(
        "combank.com.combankdigital",
        "Credit for Rs. 300,755.00 to 8021406412 at 21:23 at DIGITAL BANKING DIVISION"
      );
      expect(result?.txType).toBe(TxType.Income);
      expect(result?.amount).toBe(300755);
      expect(result?.merchant).toBeNull();
    });
  });
});

describe("isDuplicateNotification", () => {
  it("flags a near-simultaneous notification with the same amount as a duplicate", () => {
    const existing = [{ amount: 1450, postTimeMs: 1_700_000_000_000 }];
    expect(isDuplicateNotification(1450, 1_700_000_010_000, existing)).toBe(true); // 10s later
  });

  it("does not flag a different amount at the same time", () => {
    const existing = [{ amount: 1450, postTimeMs: 1_700_000_000_000 }];
    expect(isDuplicateNotification(1451, 1_700_000_000_000, existing)).toBe(false);
  });

  it("does not flag the same amount far apart in time", () => {
    const existing = [{ amount: 1450, postTimeMs: 1_700_000_000_000 }];
    expect(isDuplicateNotification(1450, 1_700_000_300_000, existing)).toBe(false); // 5 min later
  });

  it("returns false against an empty history", () => {
    expect(isDuplicateNotification(1450, 1_700_000_000_000, [])).toBe(false);
  });
});
