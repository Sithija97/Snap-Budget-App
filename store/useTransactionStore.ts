import { create } from "zustand";
import { Transaction, TxType } from "@/types";
import { api } from "@/lib/api";
import { tempId } from "@/utils/tempId";

interface TransactionState {
  transactions: Transaction[];
  status: "idle" | "loading" | "error";
  fetchAll: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id">>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  reset: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  status: "idle",

  fetchAll: async () => {
    set({ status: "loading" });
    try {
      const transactions = await api.get<Transaction[]>("/api/transactions");
      set({ transactions, status: "idle" });
    } catch (e) {
      set({ status: "error" });
      throw e;
    }
  },

  addTransaction: async (t) => {
    const optimisticId = tempId();
    const optimistic: Transaction = { ...t, id: optimisticId };
    set((s) => ({ transactions: [optimistic, ...s.transactions] }));
    try {
      const transaction = await api.post<Transaction>("/api/transactions", t);
      set((s) => ({
        transactions: s.transactions.map((x) => (x.id === optimisticId ? transaction : x)),
      }));
    } catch (e) {
      set((s) => ({ transactions: s.transactions.filter((x) => x.id !== optimisticId) }));
      throw e;
    }
  },

  updateTransaction: async (id, updates) => {
    const previous = get().transactions.find((t) => t.id === id);
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    try {
      const transaction = await api.patch<Transaction>(`/api/transactions/${id}`, updates);
      set((s) => ({
        transactions: s.transactions.map((t) => (t.id === id ? transaction : t)),
      }));
    } catch (e) {
      if (previous) {
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? previous : t)),
        }));
      }
      throw e;
    }
  },

  deleteTransaction: async (id) => {
    const previous = get().transactions;
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    try {
      await api.del(`/api/transactions/${id}`);
    } catch (e) {
      set({ transactions: previous });
      throw e;
    }
  },

  reset: () => set({ transactions: [], status: "idle" }),
}));

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
