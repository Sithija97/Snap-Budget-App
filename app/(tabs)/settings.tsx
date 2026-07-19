import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useTheme } from "@/context/ThemeContext";
import { useWalletStore } from "@/store/useWalletStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useMessagingStore } from "@/store/useMessagingStore";
import { api } from "@/lib/api";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

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
            <View className="w-10 h-10 rounded-full bg-muted dark:bg-muted-dark items-center justify-center">
              <UIText size="sm" variant="heading">{initials}</UIText>
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
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/wallets")}>
            <Card>
              <View className="flex-row items-center justify-between">
                <UIText size="sm" variant="heading">Wallets</UIText>
                <ChevronRight size={16} color={iconColor} />
              </View>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/categories")}>
            <Card>
              <View className="flex-row items-center justify-between">
                <UIText size="sm" variant="heading">Categories</UIText>
                <ChevronRight size={16} color={iconColor} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Connected apps */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Connected apps</UIText>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/telegram-link")}>
          <Card>
            <View className="flex-row items-center justify-between">
              <UIText size="sm" variant="heading">Telegram</UIText>
              <View className="flex-row items-center gap-2">
                <UIText size="sm" variant="muted">{telegramLinked ? "Connected" : "Not connected"}</UIText>
                <ChevronRight size={16} color={iconColor} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Data */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Data</UIText>
        <View className="gap-2">
          <TouchableOpacity activeOpacity={0.7} onPress={handleExport} disabled={exporting}>
            <Card>
              <UIText size="sm" variant="heading">{exporting ? "Preparing export..." : "Export data"}</UIText>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={handleClearData} disabled={clearing}>
            <Card>
              <UIText size="sm" variant="unstyled" className="text-destructive">
                {clearing ? "Clearing..." : "Clear all data"}
              </UIText>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Account</UIText>
        <Button
          label={signingOut ? "Signing out..." : "Sign out"}
          variant="outline"
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
