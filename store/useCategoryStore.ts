import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Category } from "@/types";
import { DEFAULT_CATEGORIES } from "@/constants/seedData";
import { generateId } from "@/utils/id";
import { useTransactionStore } from "./useTransactionStore";

interface CategoryState {
  categories: Category[];
  addCategory: (c: Omit<Category, "id" | "isDefault">) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, "id" | "isDefault">>) => void;
  /** Refuses default categories and categories still referenced by transactions. */
  deleteCategory: (id: string) => boolean;
  categoryHasTransactions: (id: string) => boolean;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,

      addCategory: (c) =>
        set((s) => ({
          categories: [...s.categories, { ...c, id: generateId(), isDefault: false }],
        })),

      updateCategory: (id, updates) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCategory: (id) => {
        const cat = get().categories.find((c) => c.id === id);
        if (!cat || cat.isDefault || get().categoryHasTransactions(id)) return false;
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
        return true;
      },

      categoryHasTransactions: (id) =>
        useTransactionStore.getState().transactions.some((t) => t.categoryId === id),
    }),
    { name: "snapbudget-categories", storage: createJSONStorage(() => AsyncStorage) }
  )
);
