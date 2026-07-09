import { create } from "zustand";
import { Budget } from "@/types";
import { api } from "@/lib/api";
import { tempId } from "@/utils/tempId";

interface BudgetState {
  budgets: Budget[];
  status: "idle" | "loading" | "error";
  fetchAll: () => Promise<void>;
  addBudget: (b: Omit<Budget, "id">) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Omit<Budget, "id">>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  reset: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  status: "idle",

  fetchAll: async () => {
    set({ status: "loading" });
    try {
      const budgets = await api.get<Budget[]>("/api/budgets");
      set({ budgets, status: "idle" });
    } catch (e) {
      set({ status: "error" });
      throw e;
    }
  },

  addBudget: async (b) => {
    const optimisticId = tempId();
    const optimistic: Budget = { ...b, id: optimisticId };
    set((s) => ({ budgets: [...s.budgets, optimistic] }));
    try {
      const budget = await api.post<Budget>("/api/budgets", b);
      set((s) => ({ budgets: s.budgets.map((x) => (x.id === optimisticId ? budget : x)) }));
    } catch (e) {
      set((s) => ({ budgets: s.budgets.filter((x) => x.id !== optimisticId) }));
      throw e;
    }
  },

  updateBudget: async (id, updates) => {
    const previous = get().budgets.find((b) => b.id === id);
    set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)) }));
    try {
      const budget = await api.patch<Budget>(`/api/budgets/${id}`, updates);
      set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? budget : b)) }));
    } catch (e) {
      if (previous) set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? previous : b)) }));
      throw e;
    }
  },

  deleteBudget: async (id) => {
    const previous = get().budgets;
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
    try {
      await api.del(`/api/budgets/${id}`);
    } catch (e) {
      set({ budgets: previous });
      throw e;
    }
  },

  reset: () => set({ budgets: [], status: "idle" }),
}));

export const budgetsForMonth = (budgets: Budget[], month: string) =>
  budgets.filter((b) => b.month === month);
