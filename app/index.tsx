import { useMemo } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import {
  Plus,
  ArrowDownLeft,
  Wallet,
  Sparkles,
  Bell,
  Settings2,
  ScanLine,
  ChevronRight,
} from "lucide-react-native";
import { useTheme, useThemeColors } from "@/context/ThemeContext";
import { brandBlue } from "@/constants/colors";
import { heroShadow, fabShadow } from "@/constants/shadows";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useTransactionStore, totalsForMonth } from "@/store/useTransactionStore";
import { useBudgetStore, budgetsForMonth } from "@/store/useBudgetStore";
import { budgetHealth } from "@/utils/budgetHealth";
import { BudgetHealthCard } from "@/components/BudgetHealthCard";
import { useDisplayTransactions } from "@/hooks/useDisplayTransactions";
import { useUnseenRecaps } from "@/hooks/useUnseenRecaps";
import { currentMonth, formatFullDate } from "@/utils/dates";
import { fmt } from "@/utils/format";
import TransactionItem from "@/components/ui/TransactionItem";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { DataState } from "@/components/ui/DataState";
import { Skeleton } from "@/components/ui/Skeleton";
import { TransactionItemSkeleton } from "@/components/ui/TransactionItemSkeleton";
import { IconButton } from "@/components/ui/IconButton";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { useRefresh } from "@/hooks/useRefresh";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { isDark } = useTheme();
  const { mutedFg, card } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const hasUnseenRecaps = useUnseenRecaps();
  const transactions = useTransactionStore((s) => s.transactions);
  const status = useTransactionStore((s) => s.status);
  const fetchAll = useTransactionStore((s) => s.fetchAll);
  const { refreshing, onRefresh } = useRefresh(fetchAll);
  const displayTransactions = useDisplayTransactions();
  const budgets = useBudgetStore((s) => s.budgets);
  const budgetStatus = useBudgetStore((s) => s.status);

  const month = currentMonth();

  // True only before the first fetch resolves — not on pull-to-refresh of
  // already-loaded data (status flips back to "idle" once real data, even
  // genuinely empty data, has loaded once). Shows a skeleton instead of a
  // misleading "Rs 0" that would otherwise flash before real totals arrive.
  const isFirstLoad = status === "loading" && transactions.length === 0;

  const { spent, income, remaining } = useMemo(
    () => totalsForMonth(transactions, month),
    [transactions, month],
  );

  const recent = useMemo(
    () => displayTransactions.slice(0, 5),
    [displayTransactions],
  );

  const monthBudget = useMemo(
    () => budgetsForMonth(budgets, month)[0],
    [budgets, month],
  );
  const health = useMemo(
    () => budgetHealth(monthBudget, spent),
    [monthBudget, spent],
  );
  const healthLoading =
    isFirstLoad || (budgetStatus === "loading" && budgets.length === 0);

  const monthLabel = useMemo(
    () =>
      new Date(`${month}-01`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [month],
  );

  const firstName = user?.firstName?.trim();
  const headline = firstName
    ? `${greeting(new Date().getHours())}, ${firstName}`
    : greeting(new Date().getHours());

  return (
    <SafeAreaView
      className="flex-1 bg-background dark:bg-background-dark"
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 96,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-4">
          <View>
            <UIText size="lg" variant="heading">
              {headline}
            </UIText>
            <UIText size="xs" variant="muted" className="mt-0.5">
              {monthLabel}
            </UIText>
          </View>
          <View className="flex-row items-center gap-2">
            <IconButton onPress={() => router.push("/assistant")}>
              <Sparkles size={18} color={mutedFg} />
            </IconButton>
            <IconButton
              onPress={() => router.push("/recaps")}
              className="relative"
            >
              <Bell size={18} color={mutedFg} />
              {hasUnseenRecaps && (
                <View
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-negative dark:bg-negative-dark"
                  style={{
                    borderWidth: 1.5,
                    borderColor: card,
                  }}
                />
              )}
            </IconButton>
            <IconButton onPress={() => router.push("/settings")}>
              <Settings2 size={18} color={mutedFg} />
            </IconButton>
          </View>
        </View>

        {/* Summary card — hero stat + icon-anchored secondary stats. Tinted
            shadow so this one surface per screen reads as "raised", distinct
            from the flat list cards below it. */}
        <View style={heroShadow(isDark)}>
          <Card>
            <AnimatedPressable
              onPress={() => router.push("/scan?manual=true&type=expense")}
              wrapperClassName="w-full"
              className="flex-row items-center justify-between"
            >
              <View>
                <UIText size="xs" variant="label">
                  Total Spent
                </UIText>
                {isFirstLoad ? (
                  <Skeleton width={140} height={36} className="mt-1.5" />
                ) : (
                  <AnimatedNumber
                    value={spent}
                    format={fmt}
                    size="3xl"
                    className="font-black tracking-tight mt-1"
                  />
                )}
              </View>
              {/* Visible "add expense" affordance — solid brand fill so it reads as
                  the one actionable control in the card, distinct from the
                  decorative icon circles below it */}
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: brandBlue(isDark) }}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.5} />
              </View>
            </AnimatedPressable>

            <Separator className="my-4" />

            <View className="flex-row items-center">
              <AnimatedPressable
                wrapperClassName="flex-1"
                className="flex-row items-center gap-2.5"
                onPress={() => router.push("/scan?manual=true&type=income")}
              >
                <View className="w-8 h-8 rounded-full items-center justify-center bg-positive/10 dark:bg-positive-dark/10">
                  <ArrowDownLeft
                    size={15}
                    color={isDark ? "#22c55e" : "#16a34a"}
                    strokeWidth={2}
                  />
                </View>
                <View>
                  <UIText size="xs" variant="label">
                    Income
                  </UIText>
                  {isFirstLoad ? (
                    <Skeleton width={70} height={18} className="mt-1" />
                  ) : (
                    <UIText
                      size="base"
                      variant="heading"
                      className="mt-0.5 font-semibold"
                    >
                      {fmt(income)}
                    </UIText>
                  )}
                </View>
              </AnimatedPressable>

              <View className="w-px h-8 bg-border dark:bg-border-dark mx-3" />

              <View className="flex-1 flex-row items-center gap-2.5">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    remaining < 0
                      ? "bg-negative/10 dark:bg-negative-dark/10"
                      : "bg-positive/10 dark:bg-positive-dark/10"
                  }`}
                >
                  <Wallet
                    size={15}
                    color={
                      remaining < 0
                        ? isDark
                          ? "#f87171"
                          : "#dc2626"
                        : isDark
                          ? "#22c55e"
                          : "#16a34a"
                    }
                    strokeWidth={2}
                  />
                </View>
                <View>
                  <UIText size="xs" variant="label">
                    Remaining
                  </UIText>
                  {isFirstLoad ? (
                    <Skeleton width={70} height={18} className="mt-1" />
                  ) : (
                    <UIText
                      size="base"
                      variant="unstyled"
                      className={`mt-0.5 font-semibold ${
                        remaining < 0
                          ? "text-negative dark:text-negative-dark"
                          : "text-positive dark:text-positive-dark"
                      }`}
                    >
                      {fmt(remaining)}
                    </UIText>
                  )}
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Budget health */}
        <View className="flex-row items-center justify-between mt-4 mb-3">
          <UIText size="sm" variant="heading">
            Budget health
          </UIText>
          <AnimatedPressable
            onPress={() => router.push("/analytics")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center gap-0.5"
          >
            <UIText size="xs" variant="muted">
              See more
            </UIText>
            <ChevronRight size={13} color={mutedFg} />
          </AnimatedPressable>
        </View>

        <BudgetHealthCard health={health} loading={healthLoading} />

        {/* Recent transactions */}
        <View className="flex-row items-center justify-between mt-4 mb-3">
          <UIText size="sm" variant="heading">
            Recent transactions
          </UIText>
          <AnimatedPressable
            onPress={() => router.push("/transactions")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center gap-0.5"
          >
            <UIText size="xs" variant="muted">
              See all
            </UIText>
            <ChevronRight size={13} color={mutedFg} />
          </AnimatedPressable>
        </View>

        {isFirstLoad ? (
          <View className="gap-2.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <TransactionItemSkeleton key={i} />
            ))}
          </View>
        ) : recent.length === 0 ? (
          <DataState
            status={status}
            isEmpty
            onRetry={fetchAll}
            emptyMessage="No transactions yet"
          />
        ) : (
          <View className="gap-2.5">
            {recent.map((tx) => (
              <TransactionItem
                key={tx.id}
                merchant={tx.merchant}
                categoryName={tx.categoryName}
                subtitle={formatFullDate(tx.date)}
                txType={tx.txType}
                amount={tx.amount}
                time={tx.time}
                icon={tx.categoryIcon}
                onPress={() =>
                  router.push({
                    pathname: "/transaction/[id]",
                    params: { id: tx.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Single floating action button — replaces the removed bottom tab
          bar's center Scan button. Absolutely positioned as a sibling to the
          ScrollView (not inside scrollable content) so it stays fixed while
          the page scrolls. */}
      <AnimatedPressable
        pressScale={0.92}
        style={[
          {
            position: "absolute",
            right: 16,
            bottom: insets.bottom + 16,
            width: 56,
            height: 56,
            borderRadius: 28,
          },
          fabShadow(isDark),
        ]}
        contentStyle={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: brandBlue(isDark),
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => router.push("/scan")}
      >
        <ScanLine size={24} color="#ffffff" strokeWidth={2} />
      </AnimatedPressable>
    </SafeAreaView>
  );
}
