import { Transaction } from "@/types";

export type TransactionGroup = { label: string; txs: Transaction[] };

const TODAY     = "2026-05-26";
const YESTERDAY = "2026-05-25";

export function groupByDate(txs: Transaction[]): TransactionGroup[] {
  const dateMap: Record<string, Transaction[]> = {};

  for (const tx of txs) {
    if (!dateMap[tx.date]) dateMap[tx.date] = [];
    dateMap[tx.date].push(tx);
  }

  return Object.keys(dateMap)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      let label = date;
      if (date === TODAY)          label = "Today";
      else if (date === YESTERDAY) label = "Yesterday";
      else {
        const d = new Date(date);
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return { label, txs: dateMap[date] };
    });
}
