import { create } from "zustand";
import { Wallet } from "@/types";
import { api } from "@/lib/api";
import { tempId } from "@/utils/tempId";

interface WalletState {
  wallets: Wallet[];
  status: "idle" | "loading" | "error";
  fetchAll: () => Promise<void>;
  addWallet: (w: Omit<Wallet, "id" | "createdAt">) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Omit<Wallet, "id">>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  getTotalBalance: () => number;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  status: "idle",

  fetchAll: async () => {
    set({ status: "loading" });
    try {
      const wallets = await api.get<Wallet[]>("/api/wallets");
      set({ wallets, status: "idle" });
    } catch (e) {
      set({ status: "error" });
      throw e;
    }
  },

  // Optimistic: the wallet appears instantly under a temp id, then gets
  // swapped for the server's real row — or removed if the request fails.
  addWallet: async (w) => {
    const optimisticId = tempId();
    const optimistic: Wallet = { ...w, id: optimisticId, createdAt: new Date().toISOString() };
    set((s) => ({ wallets: [...s.wallets, optimistic] }));
    try {
      const wallet = await api.post<Wallet>("/api/wallets", w);
      set((s) => ({ wallets: s.wallets.map((x) => (x.id === optimisticId ? wallet : x)) }));
    } catch (e) {
      set((s) => ({ wallets: s.wallets.filter((x) => x.id !== optimisticId) }));
      throw e;
    }
  },

  updateWallet: async (id, updates) => {
    const previous = get().wallets.find((w) => w.id === id);
    set((s) => ({ wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)) }));
    try {
      const wallet = await api.patch<Wallet>(`/api/wallets/${id}`, updates);
      set((s) => ({ wallets: s.wallets.map((w) => (w.id === id ? wallet : w)) }));
    } catch (e) {
      if (previous) set((s) => ({ wallets: s.wallets.map((w) => (w.id === id ? previous : w)) }));
      throw e;
    }
  },

  deleteWallet: async (id) => {
    const previous = get().wallets;
    set((s) => ({ wallets: s.wallets.filter((w) => w.id !== id) }));
    try {
      await api.del(`/api/wallets/${id}`);
    } catch (e) {
      set({ wallets: previous });
      throw e;
    }
  },

  // null balances count as 0 here, but the Wallets list still shows "not set" per-row
  getTotalBalance: () => get().wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0),

  // Clears local state on sign-out so the next user never sees a flash of stale data
  reset: () => set({ wallets: [], status: "idle" }),
}));
