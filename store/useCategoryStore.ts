import { create } from "zustand";
import { Category } from "@/types";
import { api } from "@/lib/api";
import { tempId } from "@/utils/tempId";
import { useTransactionStore } from "./useTransactionStore";

interface CategoryState {
  categories: Category[];
  status: "idle" | "loading" | "error";
  fetchAll: () => Promise<void>;
  addCategory: (c: Omit<Category, "id" | "isDefault">) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Omit<Category, "id" | "isDefault">>) => Promise<void>;
  /** Throws if the server refuses (default category, or still referenced by transactions/budgets). */
  deleteCategory: (id: string) => Promise<void>;
  categoryHasTransactions: (id: string) => boolean;
  reset: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  status: "idle",

  fetchAll: async () => {
    set({ status: "loading" });
    try {
      const categories = await api.get<Category[]>("/api/categories");
      set({ categories, status: "idle" });
    } catch (e) {
      set({ status: "error" });
      throw e;
    }
  },

  addCategory: async (c) => {
    const optimisticId = tempId();
    const optimistic: Category = { ...c, id: optimisticId, isDefault: false };
    set((s) => ({ categories: [...s.categories, optimistic] }));
    try {
      const category = await api.post<Category>("/api/categories", c);
      set((s) => ({ categories: s.categories.map((x) => (x.id === optimisticId ? category : x)) }));
      return category;
    } catch (e) {
      set((s) => ({ categories: s.categories.filter((x) => x.id !== optimisticId) }));
      throw e;
    }
  },

  updateCategory: async (id, updates) => {
    const previous = get().categories.find((c) => c.id === id);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
    try {
      const category = await api.patch<Category>(`/api/categories/${id}`, updates);
      set((s) => ({ categories: s.categories.map((c) => (c.id === id ? category : c)) }));
    } catch (e) {
      if (previous) set((s) => ({ categories: s.categories.map((c) => (c.id === id ? previous : c)) }));
      throw e;
    }
  },

  deleteCategory: async (id) => {
    const previous = get().categories;
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
    try {
      await api.del(`/api/categories/${id}`);
    } catch (e) {
      set({ categories: previous });
      throw e;
    }
  },

  // Client-side pre-check used only to show a friendlier message before
  // attempting the request — the server enforces this rule regardless.
  categoryHasTransactions: (id) =>
    useTransactionStore.getState().transactions.some((t) => t.categoryId === id),

  reset: () => set({ categories: [], status: "idle" }),
}));
