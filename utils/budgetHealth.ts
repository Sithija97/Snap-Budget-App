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
 * Overall budget health for one month: how much of the combined budget
 * limit is still safe to spend. Only spend in budgeted categories counts —
 * unbudgeted spending is a category-setup gap, not an overspend signal.
 * Pure; call inside useMemo (same convention as totalsForMonth).
 */
export function budgetHealth(
  monthBudgets: Budget[],
  spentByCategory: Record<string, number>
): BudgetHealth {
  const totalLimit = monthBudgets.reduce((sum, b) => sum + b.limitAmount, 0);
  if (totalLimit <= 0) {
    return { hasBudgets: false, safePercent: 0, status: "good" };
  }

  let spent = 0;
  for (const b of monthBudgets) {
    spent += spentByCategory[b.categoryId] ?? 0;
  }

  const safeRatio = Math.max(0, Math.min(1, (totalLimit - spent) / totalLimit));
  const safePercent = Math.round(safeRatio * 100);
  const status: BudgetHealthStatus =
    spent >= totalLimit ? "over" : safePercent < WATCH_BELOW_PERCENT ? "watch" : "good";

  return { hasBudgets: true, safePercent, status };
}
