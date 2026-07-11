import { describe, it, expect } from "vitest";
import { budgetHealth } from "./budgetHealth";
import { Budget } from "@/types";

const budget = (categoryId: string, limitAmount: number): Budget => ({
  id: `b-${categoryId}`,
  categoryId,
  limitAmount,
  month: "2026-07",
  repeat: false,
});

describe("budgetHealth", () => {
  it("reports hasBudgets false when the month has no budgets", () => {
    expect(budgetHealth([], {}).hasBudgets).toBe(false);
  });

  it("reports hasBudgets false when limits sum to zero", () => {
    expect(budgetHealth([budget("c1", 0)], { c1: 100 }).hasBudgets).toBe(false);
  });

  it("computes the safe-to-spend share across budgets", () => {
    const h = budgetHealth([budget("c1", 600), budget("c2", 400)], { c1: 200, c2: 100 });
    expect(h).toEqual({ hasBudgets: true, safePercent: 70, status: "good" });
  });

  it("turns to watch below 40% left", () => {
    expect(budgetHealth([budget("c1", 1000)], { c1: 700 }).status).toBe("watch");
  });

  it("clamps to 0 and reports over when spend exceeds the limit", () => {
    const h = budgetHealth([budget("c1", 1000)], { c1: 1500 });
    expect(h.safePercent).toBe(0);
    expect(h.status).toBe("over");
  });

  it("is over (not watch) at exactly 100% spent", () => {
    expect(budgetHealth([budget("c1", 1000)], { c1: 1000 }).status).toBe("over");
  });

  it("ignores spend in unbudgeted categories", () => {
    const h = budgetHealth([budget("c1", 1000)], { other: 900 });
    expect(h.safePercent).toBe(100);
    expect(h.status).toBe("good");
  });
});
