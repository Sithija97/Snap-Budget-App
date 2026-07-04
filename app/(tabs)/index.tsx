import { useMemo } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTransactionStore, totalsForMonth } from "@/store/useTransactionStore";
import { useDisplayTransactions } from "@/hooks/useDisplayTransactions";
import { currentMonth } from "@/utils/dates";
import { fmt } from "@/utils/format";
import TransactionItem from "@/components/ui/TransactionItem";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function HomeScreen() {
  const transactions = useTransactionStore((s) => s.transactions);
  const displayTransactions = useDisplayTransactions();

  const month = currentMonth();

  const { spent, income, remaining } = useMemo(
    () => totalsForMonth(transactions, month),
    [transactions, month]
  );

  const recent = useMemo(() => displayTransactions.slice(0, 4), [displayTransactions]);

  const monthLabel = useMemo(
    () =>
      new Date(`${month}-01`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [month]
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <UIText size="lg" variant="heading">{monthLabel}</UIText>
          <ThemeToggle />
        </View>

        {/* Summary card */}
        <Card>
          <UIText size="xs" variant="label">Total spent</UIText>
          <UIText size="2xl" className="font-mono font-medium mt-1">{fmt(spent)}</UIText>

          <Separator className="my-3" />

          <View className="flex-row">
            <View className="flex-1">
              <UIText size="xs" variant="label">Income</UIText>
              <UIText size="base" variant="heading" className="mt-0.5">{fmt(income)}</UIText>
            </View>
            <View className="flex-1">
              <UIText size="xs" variant="label">Remaining</UIText>
              <UIText size="base" className="mt-0.5 font-medium text-positive dark:text-positive-dark">
                {fmt(remaining)}
              </UIText>
            </View>
          </View>
        </Card>

        <TouchableOpacity
          className="mt-2 self-start"
          onPress={() => router.push("/(tabs)/analytics")}
          activeOpacity={0.7}
        >
          <UIText size="sm" variant="muted" className="py-2">See reports</UIText>
        </TouchableOpacity>

        {/* Recent transactions */}
        <UIText size="xs" variant="label" className="mt-4 mb-3">Recent transactions</UIText>

        {recent.length === 0 ? (
          <View className="items-center py-12">
            <UIText size="sm" variant="muted">No transactions yet</UIText>
          </View>
        ) : (
          <Card className="p-0 overflow-hidden">
            {recent.map((tx, i) => (
              <View key={tx.id} className="px-4">
                <TransactionItem
                  merchant={tx.merchant}
                  categoryName={tx.categoryName}
                  txType={tx.txType}
                  amount={tx.amount}
                  time={tx.time}
                  icon={tx.categoryIcon}
                  isLast={i === recent.length - 1}
                  onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: tx.id } })}
                />
              </View>
            ))}
          </Card>
        )}

        <TouchableOpacity
          className="mt-2 self-start"
          onPress={() => router.push("/(tabs)/transactions")}
          activeOpacity={0.7}
        >
          <UIText size="sm" variant="muted" className="py-2">View all transactions</UIText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
