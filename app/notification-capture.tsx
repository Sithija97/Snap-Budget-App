import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Alert, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { ChevronLeft, ChevronRight, Bell, BellRing } from "lucide-react-native";
import { useTheme, useThemeColors } from "@/context/ThemeContext";
import { useCaptureStore } from "@/store/useCaptureStore";
import {
  isCaptureAccessGranted,
  isNotificationCaptureSupportedPlatform,
  openCaptureAccessSettings,
} from "@/lib/notificationCapture";
import { KNOWN_CAPTURE_APPS, MESSAGING_APP_PACKAGES } from "@/utils/knownCaptureApps";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";

export default function NotificationCaptureScreen() {
  const { isDark } = useTheme();
  const { mutedFg: iconColor, muted } = useThemeColors();
  const allowlist = useCaptureStore((s) => s.allowlist);
  const setAllowlist = useCaptureStore((s) => s.setAllowlist);

  const [accessGranted, setAccessGranted] = useState(isCaptureAccessGranted());
  // Two distinct Android permissions, tracked separately: "notification
  // access" (the special listener permission, above) lets SnapBudget READ
  // other apps' notifications; POST_NOTIFICATIONS (Android 13+) lets it SHOW
  // its own "Transaction captured" alert back to the user. Granting one does
  // not grant the other — without this row, a user who enabled access
  // through some other path (or had push permission separately revoked)
  // would keep capturing transactions silently, with no visible way to tell
  // why they never see a "Transaction captured" notification arrive live.
  const [pushGranted, setPushGranted] = useState<boolean | null>(null);
  const [customPackage, setCustomPackage] = useState("");

  const refreshPushStatus = useCallback(() => {
    Notifications.getPermissionsAsync().then(({ status }) => setPushGranted(status === "granted"));
  }, []);

  useEffect(() => {
    refreshPushStatus();
  }, [refreshPushStatus]);

  // Neither permission has an in-app callback when changed from system
  // Settings — the only way to know either changed is to re-check when the
  // user returns to the app.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setAccessGranted(isCaptureAccessGranted());
        refreshPushStatus();
      }
    });
    return () => sub.remove();
  }, [refreshPushStatus]);

  const requestPushPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPushGranted(status === "granted");
  };

  const isSelected = (packageName: string) => allowlist.some((a) => a.packageName === packageName);
  const watchingMessagingApp = allowlist.some((a) => MESSAGING_APP_PACKAGES.has(a.packageName));

  const toggleApp = (app: { packageName: string; label: string }) => {
    const next = isSelected(app.packageName)
      ? allowlist.filter((a) => a.packageName !== app.packageName)
      : [...allowlist, app];
    setAllowlist(next).catch(() => Alert.alert("Couldn't save", "Please try again."));
  };

  const addCustomPackage = () => {
    const trimmed = customPackage.trim();
    if (!trimmed) return;
    if (isSelected(trimmed)) {
      setCustomPackage("");
      return;
    }
    setAllowlist([...allowlist, { packageName: trimmed, label: trimmed }]).catch(() =>
      Alert.alert("Couldn't save", "Please try again.")
    );
    setCustomPackage("");
  };

  const customApps = allowlist.filter(
    (a) => !KNOWN_CAPTURE_APPS.some((known) => known.packageName === a.packageName)
  );

  if (!isNotificationCaptureSupportedPlatform) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <IconButton onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">Automatic capture</UIText>
          <View className="w-9" />
        </View>
        <Card className="mx-4 mt-4">
          <UIText size="sm" variant="muted">
            Automatic transaction capture reads bank/payment notifications and is only available on Android — this device can't use it.
          </UIText>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <IconButton onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">Automatic capture</UIText>
          <View className="w-9" />
        </View>

        {/* Notification access — reads other apps' notifications */}
        <Card className="mx-4 mt-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: accessGranted ? "rgba(34,197,94,0.12)" : muted }}
            >
              <Bell size={18} color={accessGranted ? (isDark ? "#22c55e" : "#16a34a") : iconColor} strokeWidth={1.8} />
            </View>
            <View className="flex-1">
              <UIText size="base" variant="heading">Notification access</UIText>
              <UIText size="sm" variant="muted">
                Lets SnapBudget read notifications from apps you choose below, so payments can be logged without typing them in
              </UIText>
            </View>
          </View>

          <UIText size="xs" variant="muted" className="mb-3 leading-5">
            This is a special Android permission — SnapBudget only reads notifications from the apps you allow, only looks for
            payment amounts, and nothing is ever saved as a transaction without your review and approval.
          </UIText>

          {accessGranted ? (
            <Badge label="Access granted" variant="positive" />
          ) : (
            <View className="gap-3">
              <Badge label="Access not granted" variant="outline" />
              <Button
                label="Enable in Settings"
                variant="default"
                onPress={async () => {
                  await requestPushPermission();
                  openCaptureAccessSettings();
                }}
              />
            </View>
          )}
        </Card>

        {/* Push permission — lets SnapBudget show its own "Transaction
            captured" alert. A separate Android permission from notification
            access above; granting one never grants the other, and without
            this its own status was previously invisible — capture kept
            working silently while the user just never saw a live alert. */}
        <Card className="mx-4 mt-3">
          <View className="flex-row items-center gap-3 mb-4">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: pushGranted ? "rgba(34,197,94,0.12)" : muted }}
            >
              <BellRing size={18} color={pushGranted ? (isDark ? "#22c55e" : "#16a34a") : iconColor} strokeWidth={1.8} />
            </View>
            <View className="flex-1">
              <UIText size="base" variant="heading">Capture alerts</UIText>
              <UIText size="sm" variant="muted">
                Lets SnapBudget notify you the moment a transaction is captured, so it doesn't just wait silently in the app
              </UIText>
            </View>
          </View>

          {pushGranted === null ? null : pushGranted ? (
            <Badge label="Enabled" variant="positive" />
          ) : (
            <View className="gap-3">
              <Badge label="Not enabled" variant="outline" />
              <Button label="Enable alerts" variant="default" onPress={requestPushPermission} />
            </View>
          )}
        </Card>

        {/* Allowlist */}
        <UIText size="xs" variant="label" className="mx-4 mt-5 mb-2">Apps to watch</UIText>
        <Card className="mx-4">
          <View className="flex-row flex-wrap gap-2">
            {KNOWN_CAPTURE_APPS.map((app) => (
              <Chip
                key={app.packageName}
                label={app.label}
                selected={isSelected(app.packageName)}
                onPress={() => toggleApp(app)}
              />
            ))}
          </View>

          {watchingMessagingApp && (
            <UIText size="xs" variant="muted" className="mt-3 leading-5">
              Your bank's card-purchase alerts usually arrive as a text message, so watching Messages catches those — but it
              means SnapBudget reads the text of every SMS you receive, not just bank ones (though only to look for a payment
              amount; nothing is stored or sent anywhere unless it looks like a transaction).
            </UIText>
          )}

          {customApps.length > 0 && (
            <>
              <Separator className="my-3" />
              <UIText size="xs" variant="label" className="mb-2">Custom</UIText>
              <View className="flex-row flex-wrap gap-2">
                {customApps.map((app) => (
                  <Chip key={app.packageName} label={app.label} selected onPress={() => toggleApp(app)} />
                ))}
              </View>
            </>
          )}

          <Separator className="my-3" />
          <UIText size="xs" variant="label" className="mb-2">Add another app</UIText>
          <View className="flex-row gap-2">
            <Input
              style={{ flex: 1 }}
              placeholder="e.g. com.yourbank.app"
              value={customPackage}
              onChangeText={setCustomPackage}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={addCustomPackage}
            />
            <Button label="Add" variant="default" onPress={addCustomPackage} />
          </View>
          <UIText size="xs" variant="muted" className="mt-2">
            Find this in the app's Play Store URL, e.g. play.google.com/store/apps/details?id=<UIText size="xs" variant="unstyled" className="font-medium">com.yourbank.app</UIText>
          </UIText>
        </Card>

        <Card className="mx-4 mt-4 flex-row items-center gap-3" onPress={() => router.push("/captured")}>
          <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
            <Bell size={16} color={iconColor} strokeWidth={1.8} />
          </View>
          <UIText size="sm" variant="heading" className="flex-1">Review captured transactions</UIText>
          <ChevronRight size={16} color={iconColor} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
