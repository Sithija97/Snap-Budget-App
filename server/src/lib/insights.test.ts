import { describe, it, expect } from "vitest";
import { runQuery, inferPayday, survivalEstimate, budgetStatusForMonth, recapForPeriod, TxRow, BudgetRow } from "./insights";

const categoryNames = new Map([
  ["cat-food", "Food"],
  ["cat-transport", "Transport"],
  ["cat-income", "Salary"],
]);

const exp = (date: string, amount: number, categoryId = "cat-food", merchant = "Shop"): TxRow => ({
  txType: "exp",
  amount,
  date,
  categoryId,
  merchant,
});
const inc = (date: string, amount: number): TxRow => ({
  txType: "inc",
  amount,
  date,
  categoryId: "cat-income",
  merchant: "Employer",
});

describe("runQuery", () => {
  it("with no filters, totals everything and reports a transaction count", () => {
    const txs = [exp("2026-07-01", 500), exp("2026-07-05", 200), inc("2026-07-01", 3000)];
    const result = runQuery(txs, categoryNames, {});
    expect(result.total).toBe(3700);
    expect(result.transactionCount).toBe(3);
  });

  it("filters by date range (inclusive)", () => {
    const txs = [exp("2026-06-30", 100), exp("2026-07-01", 200), exp("2026-07-31", 300), exp("2026-08-01", 400)];
    const result = runQuery(txs, categoryNames, { startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(result.total).toBe(500);
    expect(result.transactionCount).toBe(2);
  });

  it("filters by category name, case-insensitively", () => {
    const txs = [exp("2026-07-01", 500, "cat-food"), exp("2026-07-01", 200, "cat-transport")];
    const result = runQuery(txs, categoryNames, { categoryName: "food" });
    expect(result.total).toBe(500);
  });

  it("filters by merchant substring, case-insensitively", () => {
    const txs = [exp("2026-07-01", 500, "cat-food", "Uber Eats"), exp("2026-07-01", 200, "cat-food", "Keells")];
    const result = runQuery(txs, categoryNames, { merchantContains: "uber" });
    expect(result.total).toBe(500);
    expect(result.transactionCount).toBe(1);
  });

  it("filters by txType", () => {
    const txs = [exp("2026-07-01", 500), inc("2026-07-01", 3000)];
    const result = runQuery(txs, categoryNames, { txType: "inc" });
    expect(result.total).toBe(3000);
  });

  it("combines multiple filters", () => {
    const txs = [
      exp("2026-07-01", 500, "cat-food", "Keells"),
      exp("2026-06-01", 500, "cat-food", "Keells"), // wrong month
      exp("2026-07-02", 500, "cat-transport", "Keells"), // wrong category
    ];
    const result = runQuery(txs, categoryNames, { startDate: "2026-07-01", endDate: "2026-07-31", categoryName: "Food" });
    expect(result.total).toBe(500);
  });

  it("groups by category, sorted highest first, when groupBy is set", () => {
    const txs = [exp("2026-07-01", 100, "cat-food"), exp("2026-07-02", 300, "cat-transport")];
    const result = runQuery(txs, categoryNames, { groupBy: "category" });
    expect(result.byCategory?.[0]).toEqual({ categoryName: "Transport", amount: 300 });
    expect(result.byCategory?.[1]).toEqual({ categoryName: "Food", amount: 100 });
  });

  it("omits byCategory entirely when not grouping", () => {
    const result = runQuery([exp("2026-07-01", 100)], categoryNames, {});
    expect(result.byCategory).toBeUndefined();
  });

  it("returns a zero total for a query that matches nothing", () => {
    const result = runQuery([exp("2026-07-01", 100, "cat-food")], categoryNames, { categoryName: "Transport" });
    expect(result.total).toBe(0);
    expect(result.transactionCount).toBe(0);
  });
});

describe("inferPayday", () => {
  it("is not confident with fewer than two income transactions", () => {
    expect(inferPayday([inc("2026-06-01", 1000)]).confident).toBe(false);
  });

  it("infers a recurring payday from a clear pattern", () => {
    const txs = [inc("2026-05-01", 1000), inc("2026-06-01", 1000)];
    const result = inferPayday(txs, new Date(2026, 5, 15));
    expect(result.confident).toBe(true);
    expect(result.dayOfMonth).toBe(1);
    expect(result.nextPayday).toBe("2026-07-01");
  });
});

describe("survivalEstimate", () => {
  it("reports insufficient data when payday can't be inferred", () => {
    const result = survivalEstimate([exp("2026-07-01", 100)], 500, new Date(2026, 6, 15));
    expect(result.hasEnoughData).toBe(false);
    expect(result.willSurvive).toBeNull();
  });

  it("reports insufficient data when balance is null (\"not set\")", () => {
    const txs = [inc("2026-05-01", 1000), inc("2026-06-01", 1000)];
    const result = survivalEstimate(txs, null, new Date(2026, 5, 15));
    expect(result.hasEnoughData).toBe(false);
  });

  it("projects survival as true when balance comfortably covers the burn rate until payday", () => {
    const txs = [
      inc("2026-05-01", 3000),
      inc("2026-06-01", 3000),
      // ~33/day over the last 30 days
      exp("2026-06-10", 500),
    ];
    const result = survivalEstimate(txs, 5000, new Date(2026, 5, 15), 30);
    expect(result.hasEnoughData).toBe(true);
    expect(result.willSurvive).toBe(true);
  });

  it("projects survival as false when the burn rate would exceed the remaining balance", () => {
    const txs = [
      inc("2026-05-01", 3000),
      inc("2026-06-01", 3000),
      exp("2026-06-10", 5000), // heavy recent spend
    ];
    const result = survivalEstimate(txs, 100, new Date(2026, 5, 15), 30);
    expect(result.hasEnoughData).toBe(true);
    expect(result.willSurvive).toBe(false);
  });
});

describe("budgetStatusForMonth", () => {
  const budget = (limitAmount: number, month = "2026-07"): BudgetRow => ({
    limitAmount,
    month,
  });

  it("reports remaining budget when under the limit", () => {
    const txs = [exp("2026-07-01", 300, "cat-food")];
    const status = budgetStatusForMonth(txs, [budget(1000)], "2026-07");
    expect(status[0]).toEqual({ limitAmount: 1000, spent: 300, remaining: 700, overBudget: false });
  });

  it("flags overBudget when spend exceeds the limit", () => {
    const txs = [exp("2026-07-01", 1200, "cat-food")];
    const status = budgetStatusForMonth(txs, [budget(1000)], "2026-07");
    expect(status[0].overBudget).toBe(true);
    expect(status[0].remaining).toBe(-200);
  });

  it("only includes the budget for the requested month", () => {
    const txs = [exp("2026-07-01", 300, "cat-food")];
    const status = budgetStatusForMonth(txs, [budget(1000, "2026-06")], "2026-07");
    expect(status).toEqual([]);
  });

  it("reports zero spent when there are no transactions yet", () => {
    const status = budgetStatusForMonth([], [budget(1000)], "2026-07");
    expect(status[0].spent).toBe(0);
    expect(status[0].remaining).toBe(1000);
  });

  it("sums spend across all expense categories against the one budget", () => {
    const txs = [exp("2026-07-01", 300, "cat-food"), exp("2026-07-02", 200, "cat-transport")];
    const status = budgetStatusForMonth(txs, [budget(1000)], "2026-07");
    expect(status[0].spent).toBe(500);
  });
});

describe("recapForPeriod", () => {
  it("totals spend/income within the window and reports the top categories", () => {
    const txs = [
      exp("2026-07-01", 500, "cat-food"),
      exp("2026-07-02", 300, "cat-transport"),
      inc("2026-07-01", 3000),
      exp("2026-06-15", 999, "cat-food"), // outside the window
    ];
    const result = recapForPeriod(txs, categoryNames, "2026-07-01", "2026-07-07", "2026-06-24", "2026-06-30");
    expect(result.totalSpent).toBe(800);
    expect(result.totalIncome).toBe(3000);
    expect(result.transactionCount).toBe(3);
    expect(result.topCategories[0]).toEqual({ categoryName: "Food", amount: 500 });
    expect(result.topCategories[1]).toEqual({ categoryName: "Transport", amount: 300 });
  });

  it("caps topCategories at 5 entries", () => {
    const categoryNamesMany = new Map(
      Array.from({ length: 7 }, (_, i) => [`cat-${i}`, `Category ${i}`])
    );
    const txs = Array.from({ length: 7 }, (_, i) => exp("2026-07-01", 100 + i, `cat-${i}`));
    const result = recapForPeriod(txs, categoryNamesMany, "2026-07-01", "2026-07-07", "2026-06-24", "2026-06-30");
    expect(result.topCategories).toHaveLength(5);
  });

  it("reports previousPeriodSpent from the prior window", () => {
    const txs = [exp("2026-07-01", 500, "cat-food"), exp("2026-06-25", 200, "cat-food")];
    const result = recapForPeriod(txs, categoryNames, "2026-07-01", "2026-07-07", "2026-06-24", "2026-06-30");
    expect(result.previousPeriodSpent).toBe(200);
  });

  it("reports previousPeriodSpent as null when there's no transaction history before the period at all", () => {
    const txs = [exp("2026-07-01", 500, "cat-food")];
    const result = recapForPeriod(txs, categoryNames, "2026-07-01", "2026-07-07", "2026-06-24", "2026-06-30");
    expect(result.previousPeriodSpent).toBeNull();
  });
});
