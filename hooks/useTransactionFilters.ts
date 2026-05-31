import { useMemo, useState } from "react";
import { Transaction, TxType } from "@/types";
import { groupByDate, TransactionGroup } from "@/utils/dates";

export const FILTER_OPTIONS = ["All", "Income", "Food", "Transport", "Shopping", "Bills"] as const;
export type FilterOption = (typeof FILTER_OPTIONS)[number];

export function useTransactionFilters(transactions: Transaction[]) {
  const [filter, setFilter] = useState<FilterOption>("All");

  const filtered = useMemo(() => {
    if (filter === "All")    return transactions;
    if (filter === "Income") return transactions.filter((tx) => tx.txType === TxType.Income);
    return transactions.filter((tx) =>
      tx.category.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [transactions, filter]);

  const groups = useMemo<TransactionGroup[]>(() => groupByDate(filtered), [filtered]);

  return { filter, setFilter, groups } as const;
}
