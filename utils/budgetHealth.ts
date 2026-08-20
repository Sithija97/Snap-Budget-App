import { Budget } from "@/types";

export type BudgetHealthStatus = "good" | "watch" | "over";

export interface BudgetHealth {
  /** False when no budgets (with a positive limit) exist for the month */
  hasBudgets: boolean;
  /** Share of the total monthly budget still unspent, 0–100 (clamped) */
  safePercent: number;
  status: BudgetHealthStatus;
}

// Below this much budget left, "good" turns into "watch"
const WATCH_BELOW_PERCENT = 40;

/**
 * Overall budget health for one month: how much of the single monthly
 * budget is still safe to spend, against total expense spend for the month —
 * all categories count now, since there is only one budget covering
 * everything. Pure; call inside useMemo (same convention as totalsForMonth).
 */
export function budgetHealth(monthBudget: Budget | undefined, totalSpent: number): BudgetHealth {
  if (!monthBudget || monthBudget.limitAmount <= 0) {
    return { hasBudgets: false, safePercent: 0, status: "good" };
  }

  const { limitAmount } = monthBudget;
  const safeRatio = Math.max(0, Math.min(1, (limitAmount - totalSpent) / limitAmount));
  const safePercent = Math.round(safeRatio * 100);
  const status: BudgetHealthStatus =
    totalSpent >= limitAmount ? "over" : safePercent < WATCH_BELOW_PERCENT ? "watch" : "good";

  return { hasBudgets: true, safePercent, status };
}
