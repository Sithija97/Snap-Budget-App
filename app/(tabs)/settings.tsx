import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { MOCK_USER } from "@/constants/mockData";
import { useTheme } from "@/context/ThemeContext";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";

type ThemeOption = 'light' | 'system' | 'dark';
const THEME_OPTIONS: ThemeOption[] = ['light', 'system', 'dark'];

export default function SettingsScreen() {
  const { theme, setTheme, isDark } = useTheme();

  const iconColor   = isDark ? '#a1a1aa' : '#71717a';
  const activeStyle = {
    flex: 1,
    alignItems: 'center' as const,
    backgroundColor: isDark ? '#fafafa' : '#18181b',
    borderRadius: 6,
    paddingVertical: 7,
  };
  const inactiveStyle = {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 7,
  };

  const initials = MOCK_USER.name.slice(0, 2).toUpperCase();

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
              <UIText size="base" variant="heading">{MOCK_USER.name}</UIText>
              <UIText size="sm" variant="muted">kasun@example.com</UIText>
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
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={isActive ? activeStyle : inactiveStyle}
                  onPress={() => setTheme(opt)}
                  activeOpacity={0.7}
                >
                  <UIText
                    size="sm"
                    className={isActive
                      ? 'font-medium text-accentFg dark:text-accentFg-dark'
                      : 'text-mutedFg dark:text-mutedFg-dark'
                    }
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </UIText>
                </TouchableOpacity>
              );
            })}
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

        {/* Budget */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Budget</UIText>
        <TouchableOpacity activeOpacity={0.7}>
          <Card>
            <View className="flex-row items-center justify-between">
              <UIText size="sm" variant="heading">Monthly budget</UIText>
              <View className="flex-row items-center gap-2">
                <UIText size="sm" className="font-mono text-mutedFg dark:text-mutedFg-dark">
                  Rs 50,000
                </UIText>
                <ChevronRight size={16} color={iconColor} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Data */}
        <UIText size="xs" variant="label" className="mt-5 mb-2">Data</UIText>
        <View className="gap-2">
          <TouchableOpacity activeOpacity={0.7}>
            <Card>
              <UIText size="sm" variant="heading">Export data</UIText>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Card>
              <UIText size="sm" className="text-destructive">Clear all data</UIText>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <UIText size="xs" variant="muted" className="text-center mt-8">
          SnapBudget v1.0.0
        </UIText>
      </ScrollView>
    </SafeAreaView>
  );
}
