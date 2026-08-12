import { useState } from "react";
import { View, ScrollView, Alert, Share, Switch, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { ChevronRight, Download, LogOut, Trash2, Sunrise, Sunset } from "lucide-react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useTheme } from "@/context/ThemeContext";
import { useWalletStore } from "@/store/useWalletStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useMessagingStore } from "@/store/useMessagingStore";
import { useCaptureStore } from "@/store/useCaptureStore";
import { useReminderStore } from "@/store/useReminderStore";
import { isNotificationCaptureSupportedPlatform } from "@/lib/notificationCapture";
import { syncFinanceReminders } from "@/lib/financeReminders";
import { api } from "@/lib/api";
import { BRAND_BLUE } from "@/constants/colors";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TimeField } from "@/components/ui/TimeField";

type ThemeOption = 'light' | 'system' | 'dark';
const THEME_OPTIONS: ThemeOption[] = ['light', 'system', 'dark'];

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const wallets = useWalletStore((s) => s.wallets);
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const transactions = useTransactionStore((s) => s.transactions);
  const telegramLinked = useMessagingStore((s) => s.telegram.linked);
  const pendingCaptures = useCaptureStore((s) => s.suggestions.filter((sug) => sug.status === "pending").length);

  const reminderEnabled = useReminderStore((s) => s.enabled);
  const morningHour = useReminderStore((s) => s.morningHour);
  const morningMinute = useReminderStore((s) => s.morningMinute);
  const eveningHour = useReminderStore((s) => s.eveningHour);
  const eveningMinute = useReminderStore((s) => s.eveningMinute);
  const updateReminders = useReminderStore((s) => s.update);
  const [togglingReminders, setTogglingReminders] = useState(false);

  const iconColor   = isDark ? '#a1a1aa' : '#71717a';
  // Layout only — Chip computes selected/unselected color internally.
  const segmentStyle = { flex: 1, alignItems: 'center' as const, borderRadius: 6, paddingVertical: 7 };

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName = user?.fullName?.trim() || email || "Account";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You'll need to sign in again to access your data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            Alert.alert("Couldn't sign out", "Please try again.");
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        wallets,
        categories,
        budgets,
        transactions,
      };
      await Share.share({
        title: "SnapBudget data export",
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert("Couldn't export data", "Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear all data?",
      "This permanently deletes every wallet, category, budget, and transaction, and resets the app to a fresh state. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear everything",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            try {
              await api.del("/api/data");
              await Promise.all([
                useWalletStore.getState().fetchAll(),
                useCategoryStore.getState().fetchAll(),
                useBudgetStore.getState().fetchAll(),
                useTransactionStore.getState().fetchAll(),
              ]);
            } catch {
              Alert.alert("Couldn't clear data", "Please try again.");
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleReminders = async (next: boolean) => {
    setTogglingReminders(true);
    try {
      if (next) {
        // Local scheduled notifications still need the same OS permission as
        // any other notification — request it here rather than assuming
        // whatever was granted (or not) for the capture feature applies.
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Notifications disabled", "Enable notifications for SnapBudget in your device settings to get reminders.");
          return;
        }
      }
      await updateReminders({ enabled: next });
      await syncFinanceReminders(useReminderStore.getState().settings());
    } catch {
      Alert.alert("Couldn't update reminders", "Please try again.");
    } finally {
      setTogglingReminders(false);
    }
  };

  const handleReminderTimeChange = async (period: "morning" | "evening", hour: number, minute: number) => {
    setTogglingReminders(true);
    try {
      await updateReminders(
        period === "morning" ? { morningHour: hour, morningMinute: minute } : { eveningHour: hour, eveningMinute: minute }
      );
      await syncFinanceReminders(useReminderStore.getState().settings());
    } catch {
      Alert.alert("Couldn't update reminder time", "Please try again.");
    } finally {
      setTogglingReminders(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
      >
        <UIText size="xl" variant="heading" className="mb-4">Settings</UIText>

        {/* Profile */}
        <Card>
          <View className="flex-row items-center gap-3">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: `${BRAND_BLUE}1a` }}
            >
              <UIText size="sm" variant="unstyled" className="font-semibold" style={{ color: BRAND_BLUE }}>
                {initials}
              </UIText>
            </View>
            <View>
              <UIText size="base" variant="heading">{displayName}</UIText>
              {email.length > 0 && <UIText size="sm" variant="muted">{email}</UIText>}
            </View>
          </View>
        </Card>

        <Separator className="my-4" />

        {/* Appearance */}
        <UIText size="xs" variant="label" className="mb-2">Appearance</UIText>
        <Card>
          <UIText size="sm" variant="heading">Theme</UIText>
          <View
            className="flex-row mt-3"
            style={{
              backgroundColor: isDark ? '#09090b' : '#f4f4f5',
              borderRadius: 8,
              padding: 3,
            }}
          >
            {THEME_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                bordered={false}
                style={segmentStyle}
                label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                selected={theme === opt}
                onPress={() => setTheme(opt)}
              />
            ))}
          </View>
        </Card>

        {/* Manage */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Manage</UIText>
        <View className="gap-2">
          <Card onPress={() => router.push("/wallets")}>
            <View className="flex-row items-center justify-between">
              <UIText size="sm" variant="heading">Wallets</UIText>
              <ChevronRight size={16} color={iconColor} />
            </View>
          </Card>
          <Card onPress={() => router.push("/categories")}>
            <View className="flex-row items-center justify-between">
              <UIText size="sm" variant="heading">Categories</UIText>
              <ChevronRight size={16} color={iconColor} />
            </View>
          </Card>
        </View>

        {/* Connected apps */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Connected apps</UIText>
        <Card onPress={() => router.push("/telegram-link")}>
          <View className="flex-row items-center justify-between">
            <UIText size="sm" variant="heading">Telegram</UIText>
            <View className="flex-row items-center gap-2">
              <UIText size="sm" variant="muted">{telegramLinked ? "Connected" : "Not connected"}</UIText>
              <ChevronRight size={16} color={iconColor} />
            </View>
          </View>
        </Card>

        {/* Automatic capture — Android only, see lib/notificationCapture.ts */}
        {isNotificationCaptureSupportedPlatform && (
          <>
            <UIText size="xs" variant="label" className="mt-5 mb-2">Automation</UIText>
            <Card onPress={() => router.push("/notification-capture")}>
              <View className="flex-row items-center justify-between">
                <UIText size="sm" variant="heading">Automatic capture</UIText>
                <View className="flex-row items-center gap-2">
                  {pendingCaptures > 0 && (
                    <UIText size="sm" variant="muted">{pendingCaptures} waiting</UIText>
                  )}
                  <ChevronRight size={16} color={iconColor} />
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Finance-tip reminders — local scheduled notifications, see lib/financeReminders.ts */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Reminders</UIText>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <UIText size="sm" variant="heading">Daily finance tips</UIText>
              <UIText size="xs" variant="muted" className="mt-0.5">
                A morning and evening notification with a tip on building financial freedom
              </UIText>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminders}
              disabled={togglingReminders}
              trackColor={{ false: isDark ? "#27272a" : "#e4e4e7", true: BRAND_BLUE }}
              thumbColor={Platform.OS === "android" ? "#ffffff" : undefined}
            />
          </View>

          {reminderEnabled && (
            <>
              <Separator className="my-3" />
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                  <Sunrise size={15} color={isDark ? "#fbbf24" : "#d97706"} strokeWidth={2} />
                </View>
                <UIText size="sm" variant="default" className="flex-1">Morning</UIText>
                <View style={{ width: 130 }}>
                  <TimeField
                    hour={morningHour}
                    minute={morningMinute}
                    onChange={(h, m) => handleReminderTimeChange("morning", h, m)}
                    disabled={togglingReminders}
                  />
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
                  <Sunset size={15} color={isDark ? "#a5b4fc" : "#4f46e5"} strokeWidth={2} />
                </View>
                <UIText size="sm" variant="default" className="flex-1">Evening</UIText>
                <View style={{ width: 130 }}>
                  <TimeField
                    hour={eveningHour}
                    minute={eveningMinute}
                    onChange={(h, m) => handleReminderTimeChange("evening", h, m)}
                    disabled={togglingReminders}
                  />
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Data */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Data</UIText>
        <View className="gap-2">
          <Card className="flex-row items-center gap-3" onPress={handleExport} disabled={exporting}>
            <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
              <Download size={16} color={iconColor} strokeWidth={1.8} />
            </View>
            <UIText size="sm" variant="heading" className="flex-1">
              {exporting ? "Preparing export..." : "Export data"}
            </UIText>
            <ChevronRight size={16} color={iconColor} />
          </Card>
          <Card className="flex-row items-center gap-3" onPress={handleClearData} disabled={clearing}>
            <View className="w-9 h-9 rounded-lg items-center justify-center bg-red-100 dark:bg-red-900/30">
              <Trash2 size={16} color={isDark ? "#f87171" : "#dc2626"} strokeWidth={1.8} />
            </View>
            <UIText size="sm" variant="unstyled" className="flex-1 font-medium text-destructive">
              {clearing ? "Clearing..." : "Clear all data"}
            </UIText>
          </Card>
        </View>

        {/* Account */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Account</UIText>
        <Button
          label={signingOut ? "Signing out..." : "Sign out"}
          variant="outline"
          icon={<LogOut size={16} color={isDark ? "#fafafa" : "#09090b"} strokeWidth={1.8} />}
          disabled={signingOut}
          onPress={handleSignOut}
        />

        {/* Version */}
        <UIText size="xs" variant="muted" className="text-center mt-8">
          SnapBudget v1.0.0
        </UIText>
      </ScrollView>
    </SafeAreaView>
  );
}
