import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "finance_reminder_settings";

export interface ReminderSettings {
  enabled: boolean;
  morningHour: number;
  morningMinute: number;
  eveningHour: number;
  eveningMinute: number;
}

const DEFAULTS: ReminderSettings = {
  enabled: false,
  morningHour: 8,
  morningMinute: 0,
  eveningHour: 20,
  eveningMinute: 0,
};

interface ReminderState extends ReminderSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<ReminderSettings>) => Promise<void>;
  /** Just the persisted fields, without hydrated/hydrate/update — the shape lib/financeReminders.ts's syncFinanceReminders() expects. */
  settings: () => ReminderSettings;
}

async function persist(settings: ReminderSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Tracks the in-flight hydrate() call (if any) so update() can wait for it
// instead of racing ahead — calling update() before hydrate() resolves would
// otherwise merge a patch onto the module's initial DEFAULTS rather than the
// real persisted values, silently reverting whatever the user had saved.
let hydratePromise: Promise<void> | null = null;

export const useReminderStore = create<ReminderState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: () => {
    if (!hydratePromise) {
      hydratePromise = AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        set({ ...(raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS), hydrated: true });
      });
    }
    return hydratePromise;
  },

  update: async (patch) => {
    // Safe even if hydrate() was never called (e.g. a test using this store
    // directly) — hydratePromise stays null and this resolves immediately.
    if (hydratePromise) await hydratePromise;
    const next: ReminderSettings = { ...get().settings(), ...patch };
    set(next);
    await persist(next);
  },

  settings: () => {
    const { enabled, morningHour, morningMinute, eveningHour, eveningMinute } = get();
    return { enabled, morningHour, morningMinute, eveningHour, eveningMinute };
  },
}));
