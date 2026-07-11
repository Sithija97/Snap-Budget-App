export type TransactionGroup<T extends { date: string }> = { label: string; txs: T[] };

// Local-timezone "YYYY-MM-DD" for a Date
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const todayISO = () => toISODate(new Date());

// "YYYY-MM" for the current month — the key budgets are stored under
export const currentMonth = () => todayISO().slice(0, 7);

// "2026-07-04" → "4 July 2026"
export function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

export function groupByDate<T extends { date: string }>(txs: T[]): TransactionGroup<T>[] {
  const today = todayISO();
  const yesterday = daysAgoISO(1);
  const dateMap: Record<string, T[]> = {};

  for (const tx of txs) {
    if (!dateMap[tx.date]) dateMap[tx.date] = [];
    dateMap[tx.date].push(tx);
  }

  return Object.keys(dateMap)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      let label = date;
      if (date === today)          label = "Today";
      else if (date === yesterday) label = "Yesterday";
      else {
        const d = new Date(date);
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return { label, txs: dateMap[date] };
    });
}
