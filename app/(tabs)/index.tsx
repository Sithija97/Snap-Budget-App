import { useMemo } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Plus, ArrowDownLeft, Wallet } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import {
  useTransactionStore,
  totalsForMonth,
  spentByCategoryInMonth,
} from "@/store/useTransactionStore";
import { useBudgetStore, budgetsForMonth } from "@/store/useBudgetStore";
import { budgetHealth } from "@/utils/budgetHealth";
import { BudgetHealthCard } from "@/components/BudgetHealthCard";
import { useDisplayTransactions } from "@/hooks/useDisplayTransactions";
import { currentMonth, formatFullDate } from "@/utils/dates";
import { fmt } from "@/utils/format";
import TransactionItem from "@/components/ui/TransactionItem";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { DataState } from "@/components/ui/DataState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRefresh } from "@/hooks/useRefresh";

export default function HomeScreen() {
  const { isDark } = useTheme();
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
    () => displayTransactions.slice(0, 4),
    [displayTransactions],
  );

  const health = useMemo(
    () =>
      budgetHealth(
        budgetsForMonth(budgets, month),
        spentByCategoryInMonth(transactions, month),
      ),
    [budgets, transactions, month],
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
        <View className="flex-row items-center justify-between mb-4">
          <UIText size="lg" variant="heading">
            {monthLabel}
          </UIText>
          <ThemeToggle />
        </View>

        {/* Summary card — hero stat + icon-anchored secondary stats */}
        <Card>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/scan?manual=true&type=expense")}
            className="flex-row items-center justify-between"
          >
            <View>
              <UIText size="xs" variant="label">
                Total spent
              </UIText>
              {isFirstLoad ? (
                <Skeleton width={120} height={28} className="mt-1.5" />
              ) : (
                <UIText size="2xl" className="font-mono font-medium mt-1">
                  {fmt(spent)}
                </UIText>
              )}
            </View>
            {/* Visible "add expense" affordance — replaces the old hint text */}
            <View className="w-9 h-9 rounded-full items-center justify-center bg-muted dark:bg-muted-dark">
              <Plus
                size={18}
                color={isDark ? "#a1a1aa" : "#71717a"}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>

          <Separator className="my-4" />

          <View className="flex-row items-center">
            <TouchableOpacity
              className="flex-1 flex-row items-center gap-2.5"
              activeOpacity={0.7}
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
                    className="mt-0.5 font-mono"
                  >
                    {fmt(income)}
                  </UIText>
                )}
              </View>
            </TouchableOpacity>

            <View className="w-px h-8 bg-border dark:bg-border-dark mx-3" />

            <View className="flex-1 flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-full items-center justify-center bg-muted dark:bg-muted-dark">
                <Wallet
                  size={15}
                  color={isDark ? "#a1a1aa" : "#71717a"}
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
                    className={`mt-0.5 font-medium font-mono ${
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

        {/* Budget health */}
        <View className="flex-row items-center justify-between mt-4 mb-3">
          <UIText size="xs" variant="heading">
            Budget health
          </UIText>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/analytics")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UIText size="xs" variant="muted">
              See more
            </UIText>
          </TouchableOpacity>
        </View>

        <BudgetHealthCard health={health} loading={healthLoading} />

        {/* Recent transactions */}
        <View className="flex-row items-center justify-between mt-4 mb-3">
          <UIText size="xs" variant="heading">
            Recent transactions
          </UIText>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/transactions")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <UIText size="xs" variant="muted">
              See all
            </UIText>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <DataState
            status={status}
            isEmpty
            onRetry={fetchAll}
            emptyMessage="No transactions yet"
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            {recent.map((tx, i) => (
              <View key={tx.id} className="px-1">
                <TransactionItem
                  merchant={tx.merchant}
                  categoryName={tx.categoryName}
                  subtitle={formatFullDate(tx.date)}
                  separator={false}
                  txType={tx.txType}
                  amount={tx.amount}
                  time={tx.time}
                  icon={tx.categoryIcon}
                  isLast={i === recent.length - 1}
                  onPress={() =>
                    router.push({
                      pathname: "/transaction/[id]",
                      params: { id: tx.id },
                    })
                  }
                />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
