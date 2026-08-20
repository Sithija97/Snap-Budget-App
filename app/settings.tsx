import { useState, ReactNode } from "react";
import { View, ScrollView, Alert, Switch, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  Trash2,
  Sunrise,
  Sunset,
  Sparkles,
  WalletCards,
  Shapes,
  Send,
  BellRing,
  Bell,
} from "lucide-react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useTheme, useThemeColors } from "@/context/ThemeContext";
import { useWalletStore } from "@/store/useWalletStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useMessagingStore } from "@/store/useMessagingStore";
import { useCaptureStore } from "@/store/useCaptureStore";
import { useReminderStore } from "@/store/useReminderStore";
import { isNotificationCaptureSupportedPlatform } from "@/lib/notificationCapture";
import { syncFinanceReminders } from "@/lib/financeReminders";
import { exportDataAsExcel } from "@/utils/exportExcel";
import { api } from "@/lib/api";
import { BRAND_BLUE } from "@/constants/colors";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TimeField } from "@/components/ui/TimeField";
import { IconButton } from "@/components/ui/IconButton";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

type ThemeOption = 'light' | 'system' | 'dark';
const THEME_OPTIONS: ThemeOption[] = ['light', 'system', 'dark'];

// One row inside a multi-row settings Card — icon, label, optional trailing
// value, and a chevron. Keeps the "Data & automation" / "Data management"
// groups visually consistent instead of each screen hand-rolling row markup.
function SettingsRow({
  icon,
  iconBgClassName = 'bg-muted dark:bg-muted-dark',
  label,
  labelClassName = '',
  value,
  onPress,
  disabled,
  hideChevron,
  iconColor,
}: {
  icon: ReactNode;
  iconBgClassName?: string;
  label: string;
  labelClassName?: string;
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  hideChevron?: boolean;
  iconColor: string;
}) {
  return (
    <AnimatedPressable
      className="flex-row items-center gap-3 px-4 py-3.5"
      onPress={onPress}
      disabled={disabled}
      pressScale={0.99}
    >
      <View className={`w-9 h-9 rounded-lg items-center justify-center ${iconBgClassName}`}>
        {icon}
      </View>
      <UIText size="sm" variant={labelClassName ? "unstyled" : "heading"} className={`flex-1 ${labelClassName ? `font-medium ${labelClassName}` : ''}`}>
        {label}
      </UIText>
      {value && <UIText size="sm" variant="muted">{value}</UIText>}
      {!hideChevron && <ChevronRight size={16} color={iconColor} />}
    </AnimatedPressable>
  );
}

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useTheme();
  const { mutedFg, border, muted } = useThemeColors();
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

  const iconColor   = mutedFg;
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
      await exportDataAsExcel({ wallets, categories, budgets, transactions });
    } catch (e) {
      Alert.alert("Couldn't export data", e instanceof Error ? e.message : "Please try again.");
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
    } catch (e) {
      // Includes the underlying error message (not just "please try again")
      // since this is the only failure in the app that's essentially
      // impossible to reproduce outside a release build — a silent generic
      // alert here means every report requires a full EAS build cycle just
      // to learn what actually went wrong.
      console.error("Failed to update reminders", e);
      Alert.alert("Couldn't update reminders", e instanceof Error ? e.message : "Please try again.");
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
    } catch (e) {
      console.error("Failed to update reminder time", e);
      Alert.alert("Couldn't update reminder time", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setTogglingReminders(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <IconButton onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={20} color={mutedFg} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">
            Settings
          </UIText>
          <View className="w-9" />
        </View>

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

        {/* Preferences — how the app looks and speaks up, grouped together */}
        <UIText size="xs" variant="label" className="mb-2">Preferences</UIText>
        <Card>
          <UIText size="sm" variant="heading">Theme</UIText>
          <View
            className="flex-row mt-3"
            style={{
              backgroundColor: muted,
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

          <Separator className="my-4" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
                <BellRing size={16} color={iconColor} strokeWidth={1.8} />
              </View>
              <View className="flex-1">
                <UIText size="sm" variant="heading">Daily finance tips</UIText>
                <UIText size="xs" variant="muted" className="mt-0.5">
                  Morning and evening reminders with a tip on building financial freedom
                </UIText>
              </View>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminders}
              disabled={togglingReminders}
              trackColor={{ false: border, true: BRAND_BLUE }}
              thumbColor={Platform.OS === "android" ? "#ffffff" : undefined}
            />
          </View>

          {reminderEnabled && (
            <>
              <Separator className="my-3" />
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center bg-warning/10 dark:bg-warning-dark/10">
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

        {/* Data & automation — everything that feeds transactions/budgets in, one scannable card */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Data & automation</UIText>
        <Card className="p-0 overflow-hidden">
          <SettingsRow
            icon={<WalletCards size={16} color={iconColor} strokeWidth={1.8} />}
            label="Wallets"
            onPress={() => router.push("/wallets")}
            iconColor={iconColor}
          />
          <Separator />
          <SettingsRow
            icon={<Shapes size={16} color={iconColor} strokeWidth={1.8} />}
            label="Categories"
            onPress={() => router.push("/categories")}
            iconColor={iconColor}
          />
          <Separator />
          <SettingsRow
            icon={<Send size={16} color={iconColor} strokeWidth={1.8} />}
            label="Telegram"
            value={telegramLinked ? "Connected" : "Not connected"}
            onPress={() => router.push("/telegram-link")}
            iconColor={iconColor}
          />
          {isNotificationCaptureSupportedPlatform && (
            <>
              <Separator />
              <SettingsRow
                icon={<Bell size={16} color={iconColor} strokeWidth={1.8} />}
                label="Automatic capture"
                value={pendingCaptures > 0 ? `${pendingCaptures} waiting` : undefined}
                onPress={() => router.push("/notification-capture")}
                iconColor={iconColor}
              />
            </>
          )}
        </Card>

        {/* Data management — export, disclosure, and the destructive action, kept apart from data sources above */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Data management</UIText>
        <Card className="p-0 overflow-hidden">
          <SettingsRow
            icon={<Sparkles size={16} color={iconColor} strokeWidth={1.8} />}
            label="AI & data"
            onPress={() => router.push("/ai-disclosure")}
            iconColor={iconColor}
          />
          <Separator />
          <SettingsRow
            icon={<Download size={16} color={iconColor} strokeWidth={1.8} />}
            label={exporting ? "Preparing Excel file..." : "Export data (Excel)"}
            onPress={handleExport}
            disabled={exporting}
            iconColor={iconColor}
          />
          <Separator />
          <SettingsRow
            icon={<Trash2 size={16} color={isDark ? "#f87171" : "#dc2626"} strokeWidth={1.8} />}
            iconBgClassName="bg-negative/10 dark:bg-negative-dark/10"
            label={clearing ? "Clearing..." : "Clear all data"}
            labelClassName="text-destructive"
            onPress={handleClearData}
            disabled={clearing}
            iconColor={iconColor}
            hideChevron
          />
        </Card>

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
