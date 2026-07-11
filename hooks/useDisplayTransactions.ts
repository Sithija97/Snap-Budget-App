import { useMemo } from "react";
import { Transaction } from "@/types";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCategoryStore } from "@/store/useCategoryStore";

export interface DisplayTransaction extends Transaction {
  categoryName: string;
  categoryIcon: string;
}

// Joins transactions with their category's name/icon, newest first
export function useDisplayTransactions(): DisplayTransaction[] {
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);

  return useMemo(() => {
    const catById = new Map(categories.map((c) => [c.id, c]));
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((t) => {
        const cat = catById.get(t.categoryId);
        return {
          ...t,
          categoryName: cat?.name ?? "Uncategorized",
          categoryIcon: cat?.icon ?? "ShoppingCart",
        };
      });
  }, [transactions, categories]);
}
