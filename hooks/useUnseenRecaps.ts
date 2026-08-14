import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRecapStore } from "@/store/useRecapStore";

const LAST_SEEN_KEY = "recaps_last_seen_at";

// Lightweight "unread" signal for Home's Bell icon — compares the newest
// recap's createdAt against a locally-persisted last-seen timestamp (same
// AsyncStorage convention as ThemeContext's theme preference), rather than a
// full read/unread schema on the server. Good enough for a single-device
// "is there something new" dot; not synced across devices.
export function useUnseenRecaps(): boolean {
  const recaps = useRecapStore((s) => s.recaps);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_SEEN_KEY).then(setLastSeenAt);
  }, []);

  if (recaps.length === 0) return false;
  if (lastSeenAt === null) return true;
  return recaps[0].createdAt > lastSeenAt;
}

export async function markRecapsSeen(): Promise<void> {
  await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}
