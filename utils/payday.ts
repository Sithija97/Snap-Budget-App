import { Transaction, TxType } from "@/types";
import { toISODate } from "./dates";

export interface PaydayEstimate {
  /** False when there isn't enough recurring-income history to guess confidently */
  confident: boolean;
  /** 1-31, the day-of-month income transactions cluster around */
  dayOfMonth?: number;
  /** Median amount of the recurring income transactions used for the estimate */
  usualAmount?: number;
  /** ISO date ("YYYY-MM-DD") of the next occurrence of dayOfMonth from today */
  nextPayday?: string;
}

const MIN_OCCURRENCES = 2;
// Two income dates within this many days of each other are treated as "the
// same" payday cycle (payday can drift a few days for weekends/holidays).
const DAY_CLUSTER_TOLERANCE = 3;

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function nextOccurrenceOf(dayOfMonth: number, from: Date): string {
  const candidate = new Date(from.getFullYear(), from.getMonth(), dayOfMonth);
  if (candidate <= from) candidate.setMonth(candidate.getMonth() + 1);
  // Clamp for months shorter than dayOfMonth (e.g. day 31 in a 30-day month)
  if (candidate.getDate() !== dayOfMonth) candidate.setDate(0);
  return toISODate(candidate);
}

/**
 * Infers a recurring payday from income transaction history — no explicit
 * "salary date" setting exists in the app, so this is a best-effort read of
 * the day-of-month income transactions cluster around. Pure; call with the
 * full transaction history (or at least the last few months of it).
 *
 * Deliberately conservative: returns `confident: false` rather than a guess
 * when there's too little history, since this feeds a "will I survive"
 * answer that would be actively misleading if wrong.
 */
export function inferPayday(transactions: Transaction[], today = new Date()): PaydayEstimate {
  const incomeDays = transactions
    .filter((t) => t.txType === TxType.Income)
    .map((t) => ({ day: new Date(t.date).getDate(), amount: t.amount }));

  if (incomeDays.length < MIN_OCCURRENCES) return { confident: false };

  // Cluster by day-of-month proximity, keep the largest cluster.
  const clusters: { days: number[]; amounts: number[] }[] = [];
  for (const { day, amount } of incomeDays) {
    const cluster = clusters.find((c) =>
      c.days.some((d) => Math.abs(d - day) <= DAY_CLUSTER_TOLERANCE)
    );
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

  return {
    confident: true,
    dayOfMonth,
    usualAmount,
    nextPayday: nextOccurrenceOf(dayOfMonth, today),
  };
}
