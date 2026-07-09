import { Transaction, TxType, Category, MonthlySpending, CategoryBreakdown } from "@/types";
import { toISODate } from "./dates";

const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Last N calendar months (oldest first), aggregating expense totals only —
// mirrors the shape the Analytics bar chart already expects.
export function monthlySpendingSeries(txs: Transaction[], monthsBack = 6): MonthlySpending[] {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTH_INITIALS[d.getMonth()] };
  });

  const totals = new Map(months.map((m) => [m.key, 0]));
  for (const t of txs) {
    if (t.txType !== TxType.Expense) continue;
    const key = t.date.slice(0, 7);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + t.amount);
  }

  return months.map((m) => ({ month: m.label, amount: totals.get(m.key) ?? 0 }));
}

// Last N rolling 7-day windows ending today (oldest first).
export function weeklySpendingSeries(txs: Transaction[], weeksBack = 6): MonthlySpending[] {
  const today = new Date();

  return Array.from({ length: weeksBack }, (_, i) => {
    const weeksAgo = weeksBack - 1 - i;
    const end = new Date(today);
    end.setDate(today.getDate() - weeksAgo * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const startISO = toISODate(start);
    const endISO = toISODate(end);
    const amount = txs
      .filter((t) => t.txType === TxType.Expense && t.date >= startISO && t.date <= endISO)
      .reduce((sum, t) => sum + t.amount, 0);

    return { month: `W${i + 1}`, amount };
  });
}

const BREAKDOWN_PALETTE = ["#1D9E75", "#FF6B9D", "#FF9F40", "#9B6BFF", "#4A7AFF", "#F43F5E", "#22C55E", "#EAB308"];

// Expense breakdown by category for a single "YYYY-MM" month, highest first.
export function categoryBreakdownForMonth(
  txs: Transaction[],
  categories: Category[],
  month: string
): CategoryBreakdown[] {
  const totals = new Map<string, number>();
  for (const t of txs) {
    if (t.txType !== TxType.Expense || !t.date.startsWith(month)) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }

  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  const catById = new Map(categories.map((c) => [c.id, c]));

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId, amount], i) => ({
      category: catById.get(categoryId)?.name ?? "Uncategorized",
      emoji: "",
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: BREAKDOWN_PALETTE[i % BREAKDOWN_PALETTE.length],
    }));
}
