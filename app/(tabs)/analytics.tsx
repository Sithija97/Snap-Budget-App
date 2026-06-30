import { useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MOCK_MONTHLY_SPENDING,
  MOCK_CATEGORY_BREAKDOWN,
} from "@/constants/mockData";
import { fmt } from "@/utils/format";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/context/ThemeContext";

const PERIODS = ["Monthly", "Weekly"] as const;
type Period = typeof PERIODS[number];

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<Period>("Monthly");

  const cats  = MOCK_CATEGORY_BREAKDOWN;
  const total = useMemo(() => cats.reduce((a, c) => a + c.amount, 0), [cats]);

  const maxAmount = Math.max(...MOCK_MONTHLY_SPENDING.map((m) => m.amount));
  const trackBg   = isDark ? '#18181b' : '#f4f4f5';
  const barActive = isDark ? '#fafafa' : '#18181b';
  const barMuted  = isDark ? '#27272a' : '#e4e4e7';
  const textMuted = isDark ? '#a1a1aa' : '#71717a';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <UIText size="xl" variant="heading">Analytics</UIText>
          <View className="flex-row gap-4">
            {PERIODS.map((p) => (
              <TouchableOpacity key={p} onPress={() => setPeriod(p)} activeOpacity={0.7}>
                <UIText
                  size="sm"
                  className={period === p
                    ? 'font-medium underline text-foreground dark:text-foreground-dark'
                    : 'text-mutedFg dark:text-mutedFg-dark'
                  }
                >
                  {p}
                </UIText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spending bar chart card */}
        <Card>
          <UIText size="xs" variant="label" className="mb-3">Spending — last 6 months</UIText>
          <View className="flex-row items-end justify-between" style={{ height: 120 }}>
            {MOCK_MONTHLY_SPENDING.map((m, i) => {
              const isLast = i === MOCK_MONTHLY_SPENDING.length - 1;
              const barHeight = Math.max((m.amount / maxAmount) * 100, 8);
              return (
                <View key={i} className="flex-1 items-center gap-1">
                  <View
                    style={{
                      width: '60%',
                      height: barHeight,
                      backgroundColor: isLast ? barActive : barMuted,
                      borderRadius: 4,
                    }}
                  />
                  <UIText size="xs" style={{ color: textMuted }}>{m.month}</UIText>
                </View>
              );
            })}
          </View>
        </Card>

        {/* By category */}
        <Card className="mt-3">
          <UIText size="xs" variant="label" className="mb-3">By category</UIText>
          {cats.map((c, i) => (
            <View
              key={c.category}
              className={`flex-row items-center gap-2 py-2 ${i < cats.length - 1 ? 'border-b border-border dark:border-border-dark' : ''}`}
            >
              <View
                style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: c.color }}
              />
              <UIText size="sm" className="flex-1">{c.category}</UIText>
              <UIText size="sm" className="font-mono text-mutedFg dark:text-mutedFg-dark">{c.pct}%</UIText>
              <UIText size="sm" className="font-mono">{fmt(c.amount)}</UIText>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
