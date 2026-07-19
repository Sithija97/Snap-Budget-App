// Pure aggregation helpers backing the Q&A assistant (routes/assistant.ts).
// Mirrors the shape of the frontend's utils/analytics.ts + utils/payday.ts —
// duplicated rather than imported because server/ is a fully separate
// package (own tsconfig, no path alias, bundled independently by Wrangler)
// with no existing cross-package import anywhere in the codebase.

export interface TxRow {
  txType: "inc" | "exp";
  amount: number;
  date: string; // "YYYY-MM-DD"
  categoryId: string;
  merchant: string;
}

// A generic, safe query shape covering the long tail of "how much did I
// spend on X" phrasings — filter by date range / category / merchant /
// type, then total or group. Gemini fills this shape in (classifyIntent);
// it never sees or reports a number itself, only picks what to filter/group
// by. This one function replaces what used to be two narrow, hardcoded
// intents (spending_summary, top_spending) because a fixed enum of question
// "shapes" can't keep up with real phrasing — this can.
export interface QuerySpec {
  /** ISO "YYYY-MM-DD", inclusive. Omitted start = no lower bound. */
  startDate?: string;
  /** ISO "YYYY-MM-DD", inclusive. Omitted end = no upper bound (through today). */
  endDate?: string;
  /** Restrict to a single category by name (case-insensitive), if the question named one */
  categoryName?: string;
  /** Restrict to transactions whose merchant contains this (case-insensitive), if the question named one */
  merchantContains?: string;
  txType?: "inc" | "exp";
  /** Group the total by category (for "top spending" / "breakdown" style questions); omitted = one grand total */
  groupBy?: "category";
}

export interface QueryResult {
  spec: QuerySpec;
  total: number;
  transactionCount: number;
  byCategory?: { categoryName: string; amount: number }[];
}

export function runQuery(txs: TxRow[], categoryNamesById: Map<string, string>, spec: QuerySpec): QueryResult {
  const categoryNameLower = spec.categoryName?.toLowerCase();
  const merchantLower = spec.merchantContains?.toLowerCase();

  const filtered = txs.filter((t) => {
    if (spec.startDate && t.date < spec.startDate) return false;
    if (spec.endDate && t.date > spec.endDate) return false;
    if (spec.txType && t.txType !== spec.txType) return false;
    if (categoryNameLower && categoryNamesById.get(t.categoryId)?.toLowerCase() !== categoryNameLower) return false;
    if (merchantLower && !t.merchant.toLowerCase().includes(merchantLower)) return false;
    return true;
  });

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  if (spec.groupBy !== "category") {
    return { spec, total, transactionCount: filtered.length };
  }

  const byCategoryMap = new Map<string, number>();
  for (const t of filtered) {
    byCategoryMap.set(t.categoryId, (byCategoryMap.get(t.categoryId) ?? 0) + t.amount);
  }

  const byCategory = [...byCategoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId, amount]) => ({ categoryName: categoryNamesById.get(categoryId) ?? "Uncategorized", amount }));

  return { spec, total, transactionCount: filtered.length, byCategory };
}

export interface PaydayEstimate {
  confident: boolean;
  dayOfMonth?: number;
  usualAmount?: number;
  nextPayday?: string;
}

const MIN_OCCURRENCES = 2;
const DAY_CLUSTER_TOLERANCE = 3;

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextOccurrenceOf(dayOfMonth: number, from: Date): string {
  const candidate = new Date(from.getFullYear(), from.getMonth(), dayOfMonth);
  if (candidate <= from) candidate.setMonth(candidate.getMonth() + 1);
  if (candidate.getDate() !== dayOfMonth) candidate.setDate(0);
  return toISODate(candidate);
}

// Conservative by design: returns confident:false rather than a guess when
// there's too little recurring-income history, since this feeds a
// "will I survive until payday" answer that would be actively misleading if
// wrong. See utils/payday.ts (frontend) for the identical algorithm and its
// unit tests — this is the server-side twin operating on Drizzle rows.
export function inferPayday(txs: TxRow[], today = new Date()): PaydayEstimate {
  const incomeDays = txs
    .filter((t) => t.txType === "inc")
    .map((t) => ({ day: new Date(t.date).getDate(), amount: t.amount }));

  if (incomeDays.length < MIN_OCCURRENCES) return { confident: false };

  const clusters: { days: number[]; amounts: number[] }[] = [];
  for (const { day, amount } of incomeDays) {
    const cluster = clusters.find((c) => c.days.some((d) => Math.abs(d - day) <= DAY_CLUSTER_TOLERANCE));
    if (cluster) {
      cluster.days.push(day);
      cluster.amounts.push(amount);
    } else {
      clusters.push({ days: [day], amounts: [amount] });
    }
  }

  const largest = clusters.reduce((a, b) => (b.days.length > a.days.length ? b : a));
  if (largest.days.length < MIN_OCCURRENCES) return { confident: false };

  const dayOfMonth = Math.round(median(largest.days));
  const usualAmount = median(largest.amounts);

  return { confident: true, dayOfMonth, usualAmount, nextPayday: nextOccurrenceOf(dayOfMonth, today) };
}

export interface SurvivalEstimate {
  hasEnoughData: boolean;
  currentBalance: number | null;
  dailyBurnRate: number;
  daysUntilPayday: number | null;
  projectedSpendUntilPayday: number | null;
  willSurvive: boolean | null;
  payday: PaydayEstimate;
}

// Projects remaining balance against a recent average daily spend rate out
// to the next inferred payday. Deliberately simple (average of the last N
// days, not a category-aware model) — same "pure arithmetic, no fabricated
// figures" principle as utils/budgetHealth.ts.
export function survivalEstimate(
  txs: TxRow[],
  totalBalance: number | null,
  today = new Date(),
  lookbackDays = 30
): SurvivalEstimate {
  const payday = inferPayday(txs, today);

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  const cutoffKey = toISODate(cutoff);

  const recentSpend = txs
    .filter((t) => t.txType === "exp" && t.date >= cutoffKey)
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyBurnRate = recentSpend / lookbackDays;

  if (!payday.confident || !payday.nextPayday || totalBalance === null) {
    return {
      hasEnoughData: false,
      currentBalance: totalBalance,
      dailyBurnRate,
      daysUntilPayday: null,
      projectedSpendUntilPayday: null,
      willSurvive: null,
      payday,
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilPayday = Math.max(
    0,
    Math.ceil((new Date(payday.nextPayday).getTime() - today.getTime()) / msPerDay)
  );
  const projectedSpendUntilPayday = dailyBurnRate * daysUntilPayday;

  return {
    hasEnoughData: true,
    currentBalance: totalBalance,
    dailyBurnRate,
    daysUntilPayday,
    projectedSpendUntilPayday,
    willSurvive: totalBalance >= projectedSpendUntilPayday,
    payday,
  };
}

export interface RecapCategoryAmount {
  categoryName: string;
  amount: number;
}

export interface RecapData {
  periodStart: string; // "YYYY-MM-DD"
  periodEnd: string; // "YYYY-MM-DD"
  totalSpent: number;
  totalIncome: number;
  transactionCount: number;
  topCategories: RecapCategoryAmount[];
  /** Same window's totals one period back (previous week/month), for a "vs last period" comparison. Null when there's no prior data at all. */
  previousPeriodSpent: number | null;
}

// Backs both the weekly and monthly proactive recap — same shape either way,
// just a different [periodStart, periodEnd] window. Reuses runQuery's
// filter/group semantics rather than re-deriving totals, so a recap and an
// equivalent Q&A answer for the same window can never silently disagree.
export function recapForPeriod(
  txs: TxRow[],
  categoryNamesById: Map<string, string>,
  periodStart: string,
  periodEnd: string,
  previousPeriodStart: string,
  previousPeriodEnd: string
): RecapData {
  const spentResult = runQuery(txs, categoryNamesById, {
    startDate: periodStart,
    endDate: periodEnd,
    txType: "exp",
    groupBy: "category",
  });
  const incomeResult = runQuery(txs, categoryNamesById, {
    startDate: periodStart,
    endDate: periodEnd,
    txType: "inc",
  });
  const allResult = runQuery(txs, categoryNamesById, { startDate: periodStart, endDate: periodEnd });

  const hasPriorTx = txs.some((t) => t.date < periodStart);
  const previousSpentResult = runQuery(txs, categoryNamesById, {
    startDate: previousPeriodStart,
    endDate: previousPeriodEnd,
    txType: "exp",
  });

  return {
    periodStart,
    periodEnd,
    totalSpent: spentResult.total,
    totalIncome: incomeResult.total,
    transactionCount: allResult.transactionCount,
    topCategories: (spentResult.byCategory ?? []).slice(0, 5),
    previousPeriodSpent: hasPriorTx ? previousSpentResult.total : null,
  };
}

export interface BudgetRow {
  categoryId: string;
  limitAmount: number;
  month: string; // "YYYY-MM"
}

export interface BudgetStatusEntry {
  categoryName: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  overBudget: boolean;
}

// Actual spend vs. each set budget for a given month — the natural
// "how am I doing against my budgets" question, previously answerable only
// visually on the Budget screen, not through the assistant.
export function budgetStatusForMonth(
  txs: TxRow[],
  budgets: BudgetRow[],
  categoryNamesById: Map<string, string>,
  month: string
): BudgetStatusEntry[] {
  const spentByCategory = new Map<string, number>();
  for (const t of txs) {
    if (t.txType !== "exp" || !t.date.startsWith(month)) continue;
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  return budgets
    .filter((b) => b.month === month)
    .map((b) => {
      const spent = spentByCategory.get(b.categoryId) ?? 0;
      return {
        categoryName: categoryNamesById.get(b.categoryId) ?? "Uncategorized",
        limitAmount: b.limitAmount,
        spent,
        remaining: b.limitAmount - spent,
        overBudget: spent > b.limitAmount,
      };
    });
}
