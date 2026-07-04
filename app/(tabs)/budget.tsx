import { memo, useMemo } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useBudgetStore, budgetsForMonth } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTransactionStore, spentByCategoryInMonth } from "@/store/useTransactionStore";
import { currentMonth } from "@/utils/dates";
import { fmt } from "@/utils/format";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TX_ICONS } from "@/constants/icons";
import { useTheme } from "@/context/ThemeContext";

interface CategoryRowProps {
  categoryName: string;
  categoryIcon: string;
  spent: number;
  limit: number;
  trackBg: string;
  fillFg: string;
  iconColor: string;
  onPress: () => void;
}

const CategoryRow = memo(function CategoryRow({
  categoryName, categoryIcon, spent, limit, trackBg, fillFg, iconColor, onPress,
}: CategoryRowProps) {
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const fillColor = pct > 100 ? '#ef4444' : pct >= 80 ? '#d97706' : fillFg;
  const Icon = TX_ICONS[categoryIcon];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View className="flex-row items-center gap-3">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: trackBg }}
          >
            {Icon && <Icon size={15} color={iconColor} strokeWidth={1.8} />}
          </View>

          <View className="flex-1">
            <UIText size="sm" variant="heading">{categoryName}</UIText>
            <UIText size="xs" variant="muted" className="mt-0.5">
              {fmt(spent)} of {fmt(limit)}
            </UIText>
          </View>

          <UIText size="xs" className="font-mono text-mutedFg dark:text-mutedFg-dark">
            {pct}%
          </UIText>
        </View>

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
    </TouchableOpacity>
  );
});

export default function BudgetScreen() {
  const { isDark } = useTheme();
  const budgets = useBudgetStore((s) => s.budgets);
  const categories = useCategoryStore((s) => s.categories);
  const transactions = useTransactionStore((s) => s.transactions);

  const month = currentMonth();

  const monthBudgets = useMemo(() => budgetsForMonth(budgets, month), [budgets, month]);
  const spentByCategory = useMemo(
    () => spentByCategoryInMonth(transactions, month),
    [transactions, month]
  );
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const totalLimit = useMemo(
    () => monthBudgets.reduce((a, b) => a + b.limitAmount, 0),
    [monthBudgets]
  );
  const totalSpent = useMemo(
    () => Object.values(spentByCategory).reduce((a, n) => a + n, 0),
    [spentByCategory]
  );

  // Categories with spending this month but no budget limit set yet
  const unbudgeted = useMemo(() => {
    const budgetedIds = new Set(monthBudgets.map((b) => b.categoryId));
    return Object.keys(spentByCategory).filter((id) => !budgetedIds.has(id));
  }, [monthBudgets, spentByCategory]);

  const daysRemaining = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  }, []);

  const pctUsed = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const trackBg  = isDark ? '#18181b' : '#f4f4f5';
  const fillFg   = isDark ? '#fafafa' : '#18181b';
  const iconColor = isDark ? '#a1a1aa' : '#71717a';

  const overviewFillColor =
    pctUsed > 100 ? '#ef4444' :
    pctUsed >= 80 ? '#d97706' :
    fillFg;

  const overviewBadgeVariant: 'outline' | 'warning' | 'destructive' =
    pctUsed > 100 ? 'destructive' :
    pctUsed >= 80 ? 'warning' :
    'outline';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <UIText size="xl" variant="heading">Budget</UIText>
          <TouchableOpacity onPress={() => router.push("/budget-form")} activeOpacity={0.7}>
            <UIText size="sm" variant="muted">Add</UIText>
          </TouchableOpacity>
        </View>

        {/* Monthly overview */}
        <Card>
          <View className="flex-row items-start justify-between">
            <View>
              <UIText size="lg" className="font-mono font-medium">{fmt(totalSpent)}</UIText>
              <UIText size="xs" variant="muted" className="mt-0.5">of {fmt(totalLimit)}</UIText>
            </View>
            <Badge label={`${pctUsed}%`} variant={overviewBadgeVariant} />
          </View>

          <View
            style={{ height: 6, backgroundColor: trackBg, borderRadius: 99, marginTop: 12, overflow: 'hidden' }}
          >
            <View
              style={{
                height: '100%',
                width: `${Math.min(pctUsed, 100)}%`,
                backgroundColor: overviewFillColor,
                borderRadius: 99,
              }}
            />
          </View>

          <UIText size="xs" variant="muted" className="mt-2">
            {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
          </UIText>
        </Card>

        <TouchableOpacity
          className="mt-2 self-start"
          onPress={() => router.push("/(tabs)/analytics")}
          activeOpacity={0.7}
        >
          <UIText size="sm" variant="muted" className="py-2">View trends</UIText>
        </TouchableOpacity>

        {/* Categories */}
        <UIText size="xs" variant="label" className="mt-4 mb-3">Categories</UIText>

        {monthBudgets.length === 0 && unbudgeted.length === 0 ? (
          <View className="items-center py-12">
            <UIText size="sm" variant="muted">No budgets yet</UIText>
          </View>
        ) : (
          <View className="gap-3">
            {monthBudgets.map((b) => {
              const cat = catById.get(b.categoryId);
              return (
                <CategoryRow
                  key={b.id}
                  categoryName={cat?.name ?? "Uncategorized"}
                  categoryIcon={cat?.icon ?? "ShoppingCart"}
                  spent={spentByCategory[b.categoryId] ?? 0}
                  limit={b.limitAmount}
                  trackBg={trackBg}
                  fillFg={fillFg}
                  iconColor={iconColor}
                  onPress={() => router.push(`/budget-form?id=${b.id}`)}
                />
              );
            })}

            {/* Spending without a budget limit yet */}
            {unbudgeted.map((categoryId) => {
              const cat = catById.get(categoryId);
              if (!cat) return null;
              return (
                <TouchableOpacity
                  key={categoryId}
                  onPress={() => router.push(`/budget-form?categoryId=${categoryId}`)}
                  activeOpacity={0.7}
                >
                  <Card>
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: trackBg }}
                      >
                        <Plus size={15} color={iconColor} strokeWidth={1.8} />
                      </View>
                      <View className="flex-1">
                        <UIText size="sm" variant="heading">{cat.name}</UIText>
                        <UIText size="xs" variant="muted" className="mt-0.5">
                          {fmt(spentByCategory[categoryId] ?? 0)} spent · no limit set
                        </UIText>
                      </View>
                      <UIText size="xs" variant="muted">Add budget</UIText>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
