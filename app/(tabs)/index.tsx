import { useMemo } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Plus, ArrowDownLeft, Wallet, Sparkles, Bell, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_BLUE } from "@/constants/colors";
import {
  useTransactionStore,
  totalsForMonth,
  spentByCategoryInMonth,
} from "@/store/useTransactionStore";
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
import { useRefresh } from "@/hooks/useRefresh";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { isDark } = useTheme();
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

  const firstName = user?.firstName?.trim();
  const headline = firstName ? `${greeting(new Date().getHours())}, ${firstName}` : greeting(new Date().getHours());

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
              <Sparkles size={18} color={isDark ? "#a1a1aa" : "#71717a"} />
            </IconButton>
            <IconButton onPress={() => router.push("/recaps")} className="relative">
              <Bell size={18} color={isDark ? "#a1a1aa" : "#71717a"} />
              {hasUnseenRecaps && (
                <View
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-negative dark:bg-negative-dark"
                  style={{ borderWidth: 1.5, borderColor: isDark ? "#18181b" : "#ffffff" }}
                />
              )}
            </IconButton>
          </View>
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
                <UIText size="2xl" className="font-mono font-semibold mt-1">
                  {fmt(spent)}
                </UIText>
              )}
            </View>
            {/* Visible "add expense" affordance — solid brand fill so it reads as
                the one actionable control in the card, distinct from the
                decorative icon circles below it */}
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              <Plus size={18} color="#ffffff" strokeWidth={2.5} />
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
                      ? isDark ? "#f87171" : "#dc2626"
                      : isDark ? "#22c55e" : "#16a34a"
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
                    size="lg"
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
          <UIText size="sm" variant="heading">
            Budget health
          </UIText>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/analytics")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center gap-0.5"
          >
            <UIText size="xs" variant="muted">
              See more
            </UIText>
            <ChevronRight size={13} color={isDark ? "#a1a1aa" : "#71717a"} />
          </TouchableOpacity>
        </View>

        <BudgetHealthCard health={health} loading={healthLoading} />

        {/* Recent transactions */}
        <View className="flex-row items-center justify-between mt-4 mb-3">
          <UIText size="sm" variant="heading">
            Recent transactions
          </UIText>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/transactions")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center gap-0.5"
          >
            <UIText size="xs" variant="muted">
              See all
            </UIText>
            <ChevronRight size={13} color={isDark ? "#a1a1aa" : "#71717a"} />
          </TouchableOpacity>
        </View>

        {isFirstLoad ? (
          <Card className="p-0 px-1 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <TransactionItemSkeleton key={i} />
            ))}
          </Card>
        ) : recent.length === 0 ? (
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
