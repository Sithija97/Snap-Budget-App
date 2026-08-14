import { memo, useMemo } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight, Plus, TrendingUp, PiggyBank } from "lucide-react-native";
import { useBudgetStore, budgetsForMonth } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTransactionStore, spentByCategoryInMonth } from "@/store/useTransactionStore";
import { currentMonth } from "@/utils/dates";
import { fmt } from "@/utils/format";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { DataState } from "@/components/ui/DataState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedBar } from "@/components/ui/AnimatedBar";
import { TX_ICONS } from "@/constants/icons";
import { useTheme } from "@/context/ThemeContext";
import { useRefresh } from "@/hooks/useRefresh";
import { BRAND_BLUE } from "@/constants/colors";
import { chartTheme, budgetFillColor } from "@/constants/chartTheme";
import type { Budget } from "@/types";

interface CategoryRowProps {
  categoryName: string;
  categoryIcon: string;
  spent: number;
  limit: number;
  trackBg: string;
  isDark: boolean;
  iconColor: string;
  onPress: () => void;
}

const CategoryRow = memo(function CategoryRow({
  categoryName, categoryIcon, spent, limit, trackBg, isDark, iconColor, onPress,
}: CategoryRowProps) {
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const isOver = pct > 100;
  const isNear = pct >= 80 && !isOver;
  const fillColor = budgetFillColor(pct, isDark);
  const Icon = TX_ICONS[categoryIcon];

  return (
    <AnimatedPressable onPress={onPress} pressScale={0.98}>
      <View className="flex-row rounded-2xl overflow-hidden bg-card dark:bg-card-dark">
        {/* Status accent: only draws attention when a category actually needs it */}
        <View style={{ width: 3, backgroundColor: isOver || isNear ? fillColor : 'transparent' }} />
        <View className="flex-1 p-4">
          <View className="flex-row items-center gap-3">
            <View
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: trackBg }}
            >
              {Icon && <Icon size={16} color={iconColor} strokeWidth={1.8} />}
            </View>

            <View className="flex-1">
              <UIText size="sm" variant="heading">{categoryName}</UIText>
              <UIText size="xs" variant="muted" className="mt-0.5">
                {fmt(spent)} of {fmt(limit)}
              </UIText>
            </View>

            <Badge
              label={`${pct}%`}
              variant={isOver ? 'destructive' : isNear ? 'warning' : 'outline'}
            />
          </View>

          <View
            style={{ height: 6, backgroundColor: trackBg, borderRadius: 99, marginTop: 12, overflow: 'hidden' }}
          >
            <AnimatedBar
              axis="width"
              size={`${Math.min(pct, 100)}%`}
              color={fillColor}
              style={{ height: '100%', borderRadius: 99 }}
              accessibilityLabel={`${categoryName} budget usage`}
              accessibilityValue={{ min: 0, max: 100, now: Math.min(pct, 100), text: `${pct}%` }}
            />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
});

// Mirrors CategoryRow's layout (icon square, two text lines, percent, progress
// track) so the list doesn't jump when real budgets replace it.
function CategoryRowSkeleton() {
  return (
    <Card>
      <View className="flex-row items-center gap-3">
        <Skeleton width={36} height={36} className="rounded-lg" />
        <View className="flex-1">
          <Skeleton width={100} height={14} />
          <Skeleton width={130} height={11} className="mt-1.5" />
        </View>
        <Skeleton width={44} height={20} className="rounded-lg" />
      </View>
      <Skeleton width="100%" height={6} className="mt-3 rounded-full" />
    </Card>
  );
}

type BudgetRow =
  | { kind: "budget"; key: string; budget: Budget }
  | { kind: "unbudgeted"; key: string; categoryId: string };

export default function BudgetScreen() {
  const { isDark } = useTheme();
  const budgets = useBudgetStore((s) => s.budgets);
  const budgetsStatus = useBudgetStore((s) => s.status);
  const fetchBudgets = useBudgetStore((s) => s.fetchAll);
  const categories = useCategoryStore((s) => s.categories);
  const transactions = useTransactionStore((s) => s.transactions);
  const transactionsStatus = useTransactionStore((s) => s.status);
  const fetchTransactions = useTransactionStore((s) => s.fetchAll);

  // Overview card depends on both stores — only skeleton-gate before either's
  // first fetch resolves, not on every pull-to-refresh (see index.tsx for the
  // same reasoning).
  const isFirstLoad =
    (budgetsStatus === "loading" && budgets.length === 0) ||
    (transactionsStatus === "loading" && transactions.length === 0);

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

  const rows = useMemo<BudgetRow[]>(() => [
    ...monthBudgets.map((b) => ({ kind: "budget" as const, key: b.id, budget: b })),
    ...unbudgeted.map((categoryId) => ({ kind: "unbudgeted" as const, key: categoryId, categoryId })),
  ], [monthBudgets, unbudgeted]);

  const daysRemaining = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  }, []);

  const pctUsed = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  // One step above the dark card surface (#18181b) so tracks stay visible on it
  const trackBg  = isDark ? '#27272a' : '#f4f4f5';
  const iconColor = isDark ? '#a1a1aa' : '#71717a';

  const overviewFillColor = budgetFillColor(pctUsed, isDark);

  const overviewBadgeVariant: 'outline' | 'warning' | 'destructive' =
    pctUsed > 100 ? 'destructive' :
    pctUsed >= 80 ? 'warning' :
    'outline';

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([fetchBudgets(), fetchTransactions()]);
  });

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="mb-4" style={{ gap: 12 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <UIText size="xl" variant="heading">Budget</UIText>
              <IconButton onPress={() => router.push("/budget-form")}>
                <Plus size={18} color={iconColor} strokeWidth={2} />
              </IconButton>
            </View>

            {/* Monthly overview */}
            <Card>
              {isFirstLoad ? (
                <>
                  <Skeleton width={70} height={12} />
                  <View className="flex-row items-end justify-between mt-2">
                    <View>
                      <Skeleton width={150} height={38} />
                      <Skeleton width={70} height={13} className="mt-1.5" />
                    </View>
                    <Skeleton width={64} height={24} className="rounded-lg" />
                  </View>
                  <Skeleton width="100%" height={8} className="mt-4" />
                </>
              ) : (
                <>
                  <UIText size="xs" variant="label">This month</UIText>
                  <View className="flex-row items-end justify-between mt-1.5">
                    <View>
                      <UIText size="3xl" className="font-mono font-semibold">{fmt(totalSpent)}</UIText>
                      <UIText size="xs" variant="muted" className="mt-0.5">of {fmt(totalLimit)} budgeted</UIText>
                    </View>
                    <Badge label={`${pctUsed}%`} variant={overviewBadgeVariant} />
                  </View>

                  <View
                    style={{ height: 8, backgroundColor: trackBg, borderRadius: 99, marginTop: 14, overflow: 'hidden' }}
                  >
                    <AnimatedBar
                      axis="width"
                      size={`${Math.min(pctUsed, 100)}%`}
                      color={overviewFillColor}
                      style={{ height: '100%', borderRadius: 99 }}
                      accessibilityLabel="Monthly budget usage"
                      accessibilityValue={{ min: 0, max: 100, now: Math.min(pctUsed, 100), text: `${pctUsed}%` }}
                    />
                  </View>

                  <UIText size="xs" variant="muted" className="mt-2">
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining this month
                  </UIText>
                </>
              )}
            </Card>

            <Card className="flex-row items-center gap-3" onPress={() => router.push("/(tabs)/analytics")}>
              <View
                className="w-9 h-9 rounded-lg items-center justify-center"
                style={{ backgroundColor: `${BRAND_BLUE}1a` }}
              >
                <TrendingUp size={16} color={BRAND_BLUE} strokeWidth={2} />
              </View>
              <UIText size="sm" variant="heading" className="flex-1">View spending trends</UIText>
              <ChevronRight size={16} color={iconColor} />
            </Card>

            {/* Categories */}
            <UIText size="xs" variant="label" className="mt-2">Categories</UIText>
          </View>
        }
        ListEmptyComponent={
          <DataState
            status={budgetsStatus}
            isEmpty={rows.length === 0}
            onRetry={onRefresh}
            emptyMessage="No budgets yet"
            emptyIcon={PiggyBank}
            loadingSkeleton={
              <View style={{ gap: 12 }}>
                {[0, 1, 2].map((i) => (
                  <CategoryRowSkeleton key={i} />
                ))}
              </View>
            }
          />
        }
        renderItem={({ item }) => {
          if (item.kind === "budget") {
            const b = item.budget;
            const cat = catById.get(b.categoryId);
            return (
              <CategoryRow
                categoryName={cat?.name ?? "Uncategorized"}
                categoryIcon={cat?.icon ?? "ShoppingCart"}
                spent={spentByCategory[b.categoryId] ?? 0}
                limit={b.limitAmount}
                trackBg={trackBg}
                isDark={isDark}
                iconColor={iconColor}
                onPress={() => router.push(`/budget-form?id=${b.id}`)}
              />
            );
          }
          const cat = catById.get(item.categoryId);
          if (!cat) return null;
          const Icon = TX_ICONS[cat.icon];
          return (
            <Card
              bordered
              className="flex-row items-center gap-3"
              onPress={() => router.push(`/budget-form?categoryId=${item.categoryId}`)}
            >
              <View
                className="w-9 h-9 rounded-lg items-center justify-center"
                style={{ backgroundColor: trackBg }}
              >
                {Icon && <Icon size={16} color={iconColor} strokeWidth={1.8} />}
              </View>
              <View className="flex-1">
                <UIText size="sm" variant="heading">{cat.name}</UIText>
                <UIText size="xs" variant="muted" className="mt-0.5">
                  {fmt(spentByCategory[item.categoryId] ?? 0)} spent · no limit set
                </UIText>
              </View>
              <View className="flex-row items-center gap-1">
                <Plus size={13} color={BRAND_BLUE} strokeWidth={2.5} />
                <UIText size="xs" style={{ color: BRAND_BLUE }} className="font-medium">
                  Set budget
                </UIText>
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}
