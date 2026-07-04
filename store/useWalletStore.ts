import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Wallet } from "@/types";
import { generateId } from "@/utils/id";

interface WalletState {
  wallets: Wallet[];
  addWallet: (w: Omit<Wallet, "id" | "createdAt">) => void;
  updateWallet: (id: string, updates: Partial<Omit<Wallet, "id">>) => void;
  deleteWallet: (id: string) => void;
  ensureDefaultWallet: () => void;
  getTotalBalance: () => number;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],

      addWallet: (w) =>
        set((s) => ({
          wallets: [
            ...s.wallets,
            { ...w, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),

      updateWallet: (id, updates) =>
        set((s) => ({
          wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),

      deleteWallet: (id) =>
        set((s) => ({
          wallets: s.wallets.filter((w) => w.id !== id),
        })),

      // The app always needs at least one wallet — runs silently at startup
      ensureDefaultWallet: () => {
        if (get().wallets.length === 0) {
          get().addWallet({ name: "My Wallet", balance: null, isDefault: true });
        }
      },

      // null balances count as 0 here, but the Wallets list still shows "not set" per-row
      getTotalBalance: () =>
        get().wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0),
    }),
    { name: "snapbudget-wallets", storage: createJSONStorage(() => AsyncStorage) }
  )
);
