import { useMemo, useState } from "react";
import { TxType } from "@/types";
import { DisplayTransaction } from "@/hooks/useDisplayTransactions";
import { groupByDate, TransactionGroup } from "@/utils/dates";

export const FILTER_OPTIONS = ["All", "Income", "Food", "Transport", "Shopping", "Bills"] as const;
export type FilterOption = (typeof FILTER_OPTIONS)[number];

export function useTransactionFilters(transactions: DisplayTransaction[]) {
  const [filter, setFilter] = useState<FilterOption>("All");

  const filtered = useMemo(() => {
    if (filter === "All")    return transactions;
    if (filter === "Income") return transactions.filter((tx) => tx.txType === TxType.Income);
    return transactions.filter((tx) =>
      tx.categoryName.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [transactions, filter]);

  const groups = useMemo<TransactionGroup<DisplayTransaction>[]>(
    () => groupByDate(filtered),
    [filtered],
  );

  return { filter, setFilter, groups } as const;
}
