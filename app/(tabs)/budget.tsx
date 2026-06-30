import { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_BUDGETS, TOTAL_SPENT } from "@/constants/mockData";
import { fmt } from "@/utils/format";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CAT_ICONS } from "@/constants/icons";
import { useTheme } from "@/context/ThemeContext";

export default function BudgetScreen() {
  const { isDark } = useTheme();

  const totalLimit = useMemo(() => MOCK_BUDGETS.reduce((a, b) => a + b.limit, 0), []);
  const pctUsed = Math.round((TOTAL_SPENT / totalLimit) * 100);

  const iconColor = isDark ? '#a1a1aa' : '#71717a';
  const trackBg   = isDark ? '#18181b' : '#f4f4f5';
  const fillFg    = isDark ? '#fafafa' : '#18181b';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <UIText size="xl" variant="heading">Budget</UIText>
          <UIText size="sm" variant="muted">Edit</UIText>
        </View>

        {/* Monthly overview */}
        <Card>
          <View className="flex-row items-start justify-between">
            <View>
              <UIText size="lg" className="font-mono font-medium">{fmt(TOTAL_SPENT)}</UIText>
              <UIText size="xs" variant="muted" className="mt-0.5">of {fmt(totalLimit)}</UIText>
            </View>
            <Badge label={`${pctUsed}%`} variant="outline" />
          </View>

          {/* Progress track */}
          <View
            style={{ height: 6, backgroundColor: trackBg, borderRadius: 99, marginTop: 12, overflow: 'hidden' }}
          >
            <View
              style={{
                height: '100%',
                width: `${Math.min(pctUsed, 100)}%`,
                backgroundColor: fillFg,
                borderRadius: 99,
              }}
            />
          </View>

          <UIText size="xs" variant="muted" className="mt-2">12 days remaining</UIText>
        </Card>

        {/* Categories */}
        <UIText size="xs" variant="label" className="mt-6 mb-3">Categories</UIText>

        <View className="gap-3">
          {MOCK_BUDGETS.map((b) => {
            const pct = Math.round((b.spent / b.limit) * 100);
            const fillColor = pct > 100 ? '#ef4444' : pct >= 80 ? '#d97706' : fillFg;
            const Icon = CAT_ICONS[b.category];

            return (
              <Card key={b.category}>
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: trackBg }}
                  >
                    {Icon && <Icon size={15} color={iconColor} strokeWidth={1.8} />}
                  </View>

                  <View className="flex-1">
                    <UIText size="sm" variant="heading">{b.category}</UIText>
                    <UIText size="xs" variant="muted" className="mt-0.5">
                      {fmt(b.spent)} of {fmt(b.limit)}
                    </UIText>
                  </View>

                  <UIText size="xs" className="font-mono text-mutedFg dark:text-mutedFg-dark">
                    {pct}%
                  </UIText>
                </View>

                {/* Category progress */}
                <View
                  style={{ height: 4, backgroundColor: trackBg, borderRadius: 99, marginTop: 10, overflow: 'hidden' }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: fillColor,
                      borderRadius: 99,
                    }}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
