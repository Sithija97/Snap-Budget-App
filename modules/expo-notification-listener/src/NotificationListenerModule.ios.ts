import { UnsupportedNotificationListenerModule } from "./UnsupportedNotificationListenerModule";

// iOS has no NotificationListenerService equivalent (see AGENTS.md-driven
// research: no public or private API lets one app read another app's
// notifications on iOS) — this module is never compiled/linked for iOS
// (expo-module.config.json restricts native code to "platforms": ["android"]),
// so without this .ios.ts variant, Metro would fall through to the plain
// NotificationListenerModule.ts, whose requireNativeModule() call throws
// synchronously at import time and crashes the app on launch.
export default new UnsupportedNotificationListenerModule();
