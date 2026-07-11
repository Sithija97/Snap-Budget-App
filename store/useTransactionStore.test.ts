import { describe, it, expect } from "vitest";
import { totalsForMonth, spentByCategoryInMonth, transactionsInMonth } from "./useTransactionStore";
import { TxType, Transaction } from "@/types";

const txs: Transaction[] = [
  { id: "1", merchant: "Keells", categoryId: "cat-groceries", walletId: null, txType: TxType.Expense, amount: 2000, date: "2026-07-01", time: "10:00 AM" },
  { id: "2", merchant: "Salary", categoryId: "cat-salary", walletId: null, txType: TxType.Income, amount: 50000, date: "2026-07-01", time: "09:00 AM" },
  { id: "3", merchant: "Barista", categoryId: "cat-food", walletId: null, txType: TxType.Expense, amount: 500, date: "2026-07-05", time: "12:00 PM" },
  { id: "4", merchant: "Old expense", categoryId: "cat-groceries", walletId: null, txType: TxType.Expense, amount: 999, date: "2026-06-15", time: "12:00 PM" },
];

describe("transactionsInMonth", () => {
  it("filters to transactions whose date starts with the given month", () => {
    expect(transactionsInMonth(txs, "2026-07")).toHaveLength(3);
    expect(transactionsInMonth(txs, "2026-06")).toHaveLength(1);
  });
});

describe("totalsForMonth", () => {
  it("sums expenses and income separately, excluding other months", () => {
    const { spent, income, remaining } = totalsForMonth(txs, "2026-07");
    expect(spent).toBe(2500);
    expect(income).toBe(50000);
    expect(remaining).toBe(47500);
  });

  it("returns zeros for a month with no transactions", () => {
    expect(totalsForMonth(txs, "2026-12")).toEqual({ spent: 0, income: 0, remaining: 0 });
  });
});

describe("spentByCategoryInMonth", () => {
  it("groups expense totals by category, ignoring income", () => {
    const result = spentByCategoryInMonth(txs, "2026-07");
    expect(result).toEqual({ "cat-groceries": 2000, "cat-food": 500 });
    expect(result["cat-salary"]).toBeUndefined();
  });
});
