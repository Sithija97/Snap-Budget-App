import { create } from "zustand";
import { TelegramLinkCode, TelegramLinkStatus } from "@/types";
import { api } from "@/lib/api";

interface MessagingState {
  telegram: TelegramLinkStatus;
  status: "idle" | "loading" | "error";
  fetchStatus: () => Promise<void>;
  requestLinkCode: () => Promise<TelegramLinkCode>;
  unlinkTelegram: () => Promise<void>;
  reset: () => void;
}

const initialTelegram: TelegramLinkStatus = { linked: false };

export const useMessagingStore = create<MessagingState>((set) => ({
  telegram: initialTelegram,
  status: "idle",

  fetchStatus: async () => {
    set({ status: "loading" });
    try {
      const telegram = await api.get<TelegramLinkStatus>("/api/messaging/telegram");
      set({ telegram, status: "idle" });
    } catch (e) {
      set({ status: "error" });
      throw e;
    }
  },

  // Not optimistic — a link code has no meaningful local shape to show before
  // the server generates it, unlike the CRUD stores.
  requestLinkCode: async () => {
    return api.post<TelegramLinkCode>("/api/messaging/telegram/link-code", {});
  },

  unlinkTelegram: async () => {
    const previous = useMessagingStore.getState().telegram;
    set({ telegram: initialTelegram });
    try {
      await api.del("/api/messaging/telegram");
    } catch (e) {
      set({ telegram: previous });
      throw e;
    }
  },

  reset: () => set({ telegram: initialTelegram, status: "idle" }),
}));
