import { describe, it, expect } from "vitest";
import { budgetHealth } from "./budgetHealth";
import { Budget } from "@/types";

const budget = (limitAmount: number, month = "2026-07"): Budget => ({
  id: "b1",
  limitAmount,
  month,
  repeat: false,
});

describe("budgetHealth", () => {
  it("reports hasBudgets false when the month has no budget", () => {
    expect(budgetHealth(undefined, 0).hasBudgets).toBe(false);
  });

  it("reports hasBudgets false when the limit is zero", () => {
    expect(budgetHealth(budget(0), 100).hasBudgets).toBe(false);
  });

  it("computes the safe-to-spend share against the one budget", () => {
    const h = budgetHealth(budget(1000), 300);
    expect(h).toEqual({ hasBudgets: true, safePercent: 70, status: "good" });
  });

  it("turns to watch below 40% left", () => {
    expect(budgetHealth(budget(1000), 700).status).toBe("watch");
  });

  it("clamps to 0 and reports over when spend exceeds the limit", () => {
    const h = budgetHealth(budget(1000), 1500);
    expect(h.safePercent).toBe(0);
    expect(h.status).toBe("over");
  });

  it("is over (not watch) at exactly 100% spent", () => {
    expect(budgetHealth(budget(1000), 1000).status).toBe("over");
  });

  it("reports zero spend as fully safe", () => {
    const h = budgetHealth(budget(1000), 0);
    expect(h.safePercent).toBe(100);
    expect(h.status).toBe("good");
  });
});
