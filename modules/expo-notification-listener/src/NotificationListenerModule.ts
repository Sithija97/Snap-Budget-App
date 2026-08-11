import { EventEmitter, requireNativeModule } from "expo-modules-core";

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
}

export default requireNativeModule<ExpoNotificationListenerModule>("ExpoNotificationListener");
