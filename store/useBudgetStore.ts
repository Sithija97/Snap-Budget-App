import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Budget } from "@/types";
import { buildSeedBudgets } from "@/constants/seedData";
import { generateId } from "@/utils/id";

interface BudgetState {
  budgets: Budget[];
  addBudget: (b: Omit<Budget, "id">) => void;
  updateBudget: (id: string, updates: Partial<Omit<Budget, "id">>) => void;
  deleteBudget: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      budgets: buildSeedBudgets(),

      addBudget: (b) =>
        set((s) => ({
          budgets: [...s.budgets, { ...b, id: generateId() }],
        })),

      updateBudget: (id, updates) =>
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      deleteBudget: (id) =>
        set((s) => ({
          budgets: s.budgets.filter((b) => b.id !== id),
        })),
    }),
    { name: "snapbudget-budgets", storage: createJSONStorage(() => AsyncStorage) }
  )
);

export const budgetsForMonth = (budgets: Budget[], month: string) =>
  budgets.filter((b) => b.month === month);
