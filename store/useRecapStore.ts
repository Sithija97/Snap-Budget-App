import { create } from "zustand";
import { Recap } from "@/types";
import { api } from "@/lib/api";

interface RecapState {
  recaps: Recap[];
  status: "idle" | "loading" | "error";
  fetchAll: () => Promise<void>;
  reset: () => void;
}

// Read-only — recaps are generated server-side by the cron handler, never
// created/edited/deleted from the app, so this store has no mutation
// actions unlike the four CRUD stores.
export const useRecapStore = create<RecapState>((set) => ({
  recaps: [],
  status: "idle",

  fetchAll: async () => {
    set({ status: "loading" });
    try {
      const { recaps } = await api.get<{ recaps: Recap[] }>("/api/recaps");
      set({ recaps, status: "idle" });
    } catch (e) {
      set({ status: "error" });
      throw e;
    }
  },

  reset: () => set({ recaps: [], status: "idle" }),
}));
