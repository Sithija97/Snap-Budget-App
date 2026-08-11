import { EventEmitter } from "expo-modules-core";
import type { CapturedNotification } from "./NotificationListenerModule";

type EventsMap = {
  onNotification: (event: CapturedNotification) => void;
  onListenerConnectionChange: (event: { connected: boolean }) => void;
};

// Shared by the .ios.ts and .web.ts platform variants — this module is
// Android-only (NotificationListenerService has no equivalent on iOS/web),
// so every method is a safe no-op rather than throwing.
export class UnsupportedNotificationListenerModule extends EventEmitter<EventsMap> {
  isAccessGranted(): boolean {
    return false;
  }

  openAccessSettings(): void {
    // No-op: notification listener capture is Android-only.
  }

  setAllowedPackages(_packages: string[]): void {
    // No-op: notification listener capture is Android-only.
  }
}
