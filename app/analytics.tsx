import { useMemo, useState } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { ChartNoAxesCombined, ChevronLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { monthlySpendingSeries, weeklySpendingSeries, categoryBreakdownForMonth } from "@/utils/analytics";
import { currentMonth } from "@/utils/dates";
import { fmt } from "@/utils/format";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { Chip } from "@/components/ui/Chip";
import { AnimatedBar } from "@/components/ui/AnimatedBar";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme, useThemeColors } from "@/context/ThemeContext";
import { useRefresh } from "@/hooks/useRefresh";
import { chartTheme, barRampColor } from "@/constants/chartTheme";

const PERIODS = ['Monthly', 'Weekly'] as const;
type Period = typeof PERIODS[number];

export default function AnalyticsScreen() {
  const { isDark } = useTheme();
  const { mutedFg: iconColor } = useThemeColors();
  const [period, setPeriod] = useState<Period>('Monthly');

  const transactions = useTransactionStore((s) => s.transactions);
  const txStatus = useTransactionStore((s) => s.status);
  const fetchTransactions = useTransactionStore((s) => s.fetchAll);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchAll);

  const monthlySpending = useMemo(() => monthlySpendingSeries(transactions), [transactions]);
  const weeklySpending = useMemo(() => weeklySpendingSeries(transactions), [transactions]);
  const breakdown = useMemo(
    () => categoryBreakdownForMonth(transactions, categories, currentMonth()),
    [transactions, categories]
  );

  const isMonthly   = period === 'Monthly';
  const chartData   = isMonthly ? monthlySpending : weeklySpending;
  const chartMax    = Math.max(...chartData.map(m => m.amount), 1);
  const chartLabel  = isMonthly ? 'Spending — last 6 months' : 'Spending — last 6 weeks';

  const { track: barTrack, axisText: textMuted } = chartTheme(isDark);

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([fetchTransactions(), fetchCategories()]);
  });

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center mb-4 gap-3">
          <IconButton onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1">Analytics</UIText>
          <View className="flex-row gap-4">
            {PERIODS.map((p) => (
              <Chip key={p} variant="underline" label={p} selected={period === p} onPress={() => setPeriod(p)} />
            ))}
          </View>
        </View>

        {transactions.length === 0 ? (
          <DataState
            status={txStatus}
            isEmpty
            onRetry={onRefresh}
            emptyMessage="No spending data yet"
            emptyIcon={ChartNoAxesCombined}
          />
        ) : (
          <>
            {/* Bar chart */}
            <Card>
              <UIText size="xs" variant="label" className="mb-3">{chartLabel}</UIText>
              <View className="flex-row items-end justify-between" style={{ height: 120 }}>
                {chartData.map((m, i) => {
                  const barHeightPct = Math.max((m.amount / chartMax) * 100, 6);
                  const color = barRampColor(isDark, i, chartData.length);
                  return (
                    <View key={i} className="flex-1 items-center" style={{ gap: 4, height: '100%' }}>
                      <View style={{ width: '60%', flex: 1, justifyContent: 'flex-end', backgroundColor: barTrack, borderRadius: 4, overflow: 'hidden' }}>
                        <AnimatedBar
                          axis="height"
                          size={`${barHeightPct}%`}
                          color={color}
                          delay={i * 40}
                          style={{ width: '100%', borderRadius: 4 }}
                          accessibilityLabel={`${m.month}: ${fmt(m.amount)}`}
                          accessibilityValue={{ min: 0, max: Math.round(chartMax), now: Math.round(m.amount), text: fmt(m.amount) }}
                        />
                      </View>
                      <UIText size="xs" variant="unstyled" style={{ color: textMuted }}>{m.month}</UIText>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* By category */}
            <Card className="mt-3">
              <UIText size="xs" variant="label" className="mb-3">By category — this month</UIText>
              {breakdown.length === 0 ? (
                <UIText size="sm" variant="muted" className="py-2">No expenses yet this month</UIText>
              ) : (
                breakdown.map((c, i) => (
                  <View
                    key={c.category}
                    className={`flex-row items-center gap-2 py-2 ${
                      i < breakdown.length - 1
                        ? 'border-b border-border dark:border-border-dark'
                        : ''
                    }`}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: c.color }} />
                    <UIText size="sm" className="flex-1">{c.category}</UIText>
                    <UIText size="sm" variant="unstyled" className="font-sans text-mutedFg dark:text-mutedFg-dark">{c.pct}%</UIText>
                    <UIText size="sm" className="font-semibold">{fmt(c.amount)}</UIText>
                  </View>
                ))
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
