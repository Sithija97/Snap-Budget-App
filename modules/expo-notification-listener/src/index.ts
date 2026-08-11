import { Platform } from "react-native";

import NotificationListenerModule from "./NotificationListenerModule";

export type { CapturedNotification } from "./NotificationListenerModule";

export const isNotificationCaptureSupported = Platform.OS === "android";

export default NotificationListenerModule;
