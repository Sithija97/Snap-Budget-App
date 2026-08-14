import { EventEmitter, requireOptionalNativeModule } from "expo-modules-core";

import { UnsupportedNotificationListenerModule } from "./UnsupportedNotificationListenerModule";

export interface CapturedNotification {
  packageName: string;
  title: string;
  text: string;
  bigText: string;
  subText: string;
  postTime: number;
  key: string;
}

interface ListenerConnectionChange {
  connected: boolean;
}

type EventsMap = {
  onNotification: (event: CapturedNotification) => void;
  onListenerConnectionChange: (event: ListenerConnectionChange) => void;
};

declare class ExpoNotificationListenerModule extends EventEmitter<EventsMap> {
  isAccessGranted(): boolean;
  openAccessSettings(): void;
  setAllowedPackages(packages: string[]): void;
  /**
   * Must be called right after addListener("onNotification", ...) — flips
   * the native side into delivering notifications live and flushes anything
   * that queued up before this point (the native NotificationListenerService
   * can receive notifications independently of this module's lifecycle,
   * e.g. while the app process was killed in the background; without this
   * handshake those notifications would be lost rather than queued, since a
   * native event emitted before any JS listener subscribes is not buffered).
   */
  markListenerReady(): void;
}

// The native module is only registered in a real dev/production build (see
// expo-module.config.json) — Expo Go has no "ExpoNotificationListener" native
// module at all, and requireNativeModule() throws at import time in that
// case, which used to abort the whole route module graph (see the
// isNotificationCaptureSupported check in index.ts, which then never got a
// chance to short-circuit anything that imports this module). Falling back
// to the same no-op module used for iOS/web keeps Expo Go usable; real
// capture still requires a dev build regardless (Android-only, as enforced
// by isNotificationCaptureSupported).
export default (requireOptionalNativeModule<ExpoNotificationListenerModule>("ExpoNotificationListener") ??
  new UnsupportedNotificationListenerModule()) as ExpoNotificationListenerModule;
