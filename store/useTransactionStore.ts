import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction, TxType } from "@/types";
import { buildSeedTransactions } from "@/constants/seedData";
import { generateId } from "@/utils/id";

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: buildSeedTransactions(),

      addTransaction: (t) =>
        set((s) => ({
          transactions: [{ ...t, id: generateId() }, ...s.transactions],
        })),

      updateTransaction: (id, updates) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),
    }),
    { name: "snapbudget-transactions", storage: createJSONStorage(() => AsyncStorage) }
  )
);

// Pure derivation helpers — call inside useMemo with the subscribed transactions slice

export const transactionsInMonth = (txs: Transaction[], month: string) =>
  txs.filter((t) => t.date.startsWith(month));

export const totalsForMonth = (txs: Transaction[], month: string) => {
  let spent = 0;
  let income = 0;
  for (const t of transactionsInMonth(txs, month)) {
    if (t.txType === TxType.Expense) spent += t.amount;
    else income += t.amount;
  }
  return { spent, income, remaining: income - spent };
};

export const spentByCategoryInMonth = (
  txs: Transaction[],
  month: string
): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const t of transactionsInMonth(txs, month)) {
    if (t.txType !== TxType.Expense) continue;
    map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
  }
  return map;
};
