import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AllowlistedApp, CapturedSuggestion } from "@/types/capture";

// Runtime guard for suggestions loaded from AsyncStorage — JSON.parse gives
// no type safety, and CapturedSuggestion's shape has changed over time (e.g.
// `amount` was once `number | null` and `source` once included "unparsed").
// A suggestion that predates one of those changes must be dropped here,
// once, rather than trusted as `CapturedSuggestion` everywhere it's read.
export function isValidSuggestion(s: any): s is CapturedSuggestion {
  return Boolean(
    s &&
    typeof s.id === "string" &&
    typeof s.amount === "number" &&
    Number.isFinite(s.amount) &&
    (s.source === "regex" || s.source === "gemini") &&
    (s.status === "pending" || s.status === "dismissed" || s.status === "saved")
  );
}

const ALLOWLIST_KEY = "capture_allowlisted_apps";
const SUGGESTIONS_KEY = "capture_suggestions";

// Suggestions are capped so a long-unopened app doesn't grow this list
// (and its AsyncStorage payload) without bound — old, unactioned ones are
// dropped oldest-first past the cap rather than saved forever.
const MAX_STORED_SUGGESTIONS = 200;

interface CaptureState {
  hydrated: boolean;
  allowlist: AllowlistedApp[];
  suggestions: CapturedSuggestion[];

  hydrate: () => Promise<void>;
  setAllowlist: (apps: AllowlistedApp[]) => Promise<void>;
  addSuggestion: (suggestion: CapturedSuggestion) => Promise<void>;
  dismissSuggestion: (id: string) => Promise<void>;
  markSaved: (id: string) => Promise<void>;
}

async function persistSuggestions(suggestions: CapturedSuggestion[]) {
  await AsyncStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
}

export const useCaptureStore = create<CaptureState>((set, get) => ({
  hydrated: false,
  allowlist: [],
  suggestions: [],

  hydrate: async () => {
    const [allowlistRaw, suggestionsRaw] = await Promise.all([
      AsyncStorage.getItem(ALLOWLIST_KEY),
      AsyncStorage.getItem(SUGGESTIONS_KEY),
    ]);
    const parsedSuggestions: unknown[] = suggestionsRaw ? JSON.parse(suggestionsRaw) : [];
    const suggestions = parsedSuggestions.filter(isValidSuggestion);
    // Drop the invalid ones from storage too, not just from memory — otherwise
    // every future hydrate() re-filters the same stale records forever.
    if (suggestions.length !== parsedSuggestions.length) {
      await persistSuggestions(suggestions).catch(() => {});
    }
    set({
      allowlist: allowlistRaw ? JSON.parse(allowlistRaw) : [],
      suggestions,
      hydrated: true,
    });
  },

  setAllowlist: async (apps) => {
    set({ allowlist: apps });
    await AsyncStorage.setItem(ALLOWLIST_KEY, JSON.stringify(apps));
  },

  addSuggestion: async (suggestion) => {
    const next = [suggestion, ...get().suggestions].slice(0, MAX_STORED_SUGGESTIONS);
    set({ suggestions: next });
    await persistSuggestions(next);
  },

  dismissSuggestion: async (id) => {
    const next = get().suggestions.map((s) => (s.id === id ? { ...s, status: "dismissed" as const } : s));
    set({ suggestions: next });
    await persistSuggestions(next);
  },

  markSaved: async (id) => {
    const next = get().suggestions.map((s) => (s.id === id ? { ...s, status: "saved" as const } : s));
    set({ suggestions: next });
    await persistSuggestions(next);
  },
}));
