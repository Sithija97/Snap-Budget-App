import { describe, it, expect } from "vitest";
import { budgetsForMonth } from "./useBudgetStore";
import { Budget } from "@/types";

const budgets: Budget[] = [
  { id: "1", categoryId: "cat-groceries", limitAmount: 15000, month: "2026-07", repeat: true },
  { id: "2", categoryId: "cat-food", limitAmount: 10000, month: "2026-06", repeat: true },
];

describe("budgetsForMonth", () => {
  it("filters budgets to the given month", () => {
    expect(budgetsForMonth(budgets, "2026-07")).toEqual([budgets[0]]);
    expect(budgetsForMonth(budgets, "2026-01")).toEqual([]);
  });
});
