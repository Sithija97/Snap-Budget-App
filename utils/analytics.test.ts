import { describe, it, expect } from "vitest";
import { monthlySpendingSeries, weeklySpendingSeries, categoryBreakdownForMonth } from "./analytics";
import { toISODate } from "./dates";
import { TxType, Transaction, Category } from "@/types";

describe("monthlySpendingSeries", () => {
  it("returns 6 months ending this month, summing expenses only", () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const txs: Transaction[] = [
      { id: "1", merchant: "A", categoryId: "c1", walletId: null, txType: TxType.Expense, amount: 1000, date: `${thisMonth}-05`, time: "10:00 AM" },
      { id: "2", merchant: "B", categoryId: "c1", walletId: null, txType: TxType.Income, amount: 5000, date: `${thisMonth}-05`, time: "10:00 AM" },
    ];
    const series = monthlySpendingSeries(txs);
    expect(series).toHaveLength(6);
    expect(series[5].amount).toBe(1000); // current month is the last entry, income excluded
  });
});

describe("weeklySpendingSeries", () => {
  it("returns 6 weeks, summing expenses within each 7-day window", () => {
    const todayISO = toISODate(new Date());
    const txs: Transaction[] = [
      { id: "1", merchant: "A", categoryId: "c1", walletId: null, txType: TxType.Expense, amount: 500, date: todayISO, time: "10:00 AM" },
    ];
    const series = weeklySpendingSeries(txs);
    expect(series).toHaveLength(6);
    expect(series[5].amount).toBe(500); // today falls in the last (most recent) week
    expect(series[0].amount).toBe(0);
  });
});

describe("categoryBreakdownForMonth", () => {
  const categories: Category[] = [
    { id: "c1", name: "Groceries", type: "expense", icon: "ShoppingCart", parentId: null, isDefault: true },
    { id: "c2", name: "Food", type: "expense", icon: "Coffee", parentId: null, isDefault: true },
  ];

  it("computes percentages and sorts by amount descending", () => {
    const txs: Transaction[] = [
      { id: "1", merchant: "A", categoryId: "c1", walletId: null, txType: TxType.Expense, amount: 3000, date: "2026-07-01", time: "10:00 AM" },
      { id: "2", merchant: "B", categoryId: "c2", walletId: null, txType: TxType.Expense, amount: 1000, date: "2026-07-02", time: "10:00 AM" },
      { id: "3", merchant: "C", categoryId: "c1", walletId: null, txType: TxType.Income, amount: 9999, date: "2026-07-02", time: "10:00 AM" },
    ];
    const result = categoryBreakdownForMonth(txs, categories, "2026-07");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ category: "Groceries", amount: 3000, pct: 75 });
    expect(result[1]).toMatchObject({ category: "Food", amount: 1000, pct: 25 });
  });

  it("returns an empty array when there's no spending that month", () => {
    expect(categoryBreakdownForMonth([], categories, "2026-07")).toEqual([]);
  });
});
