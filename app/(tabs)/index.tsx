import { useMemo } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  MOCK_TRANSACTIONS,
  MOCK_USER,
  TOTAL_SPENT,
  REMAINING,
  TOTAL_INCOME,
} from "@/constants/mockData";
import { fmt } from "@/utils/format";
import TransactionItem from "@/components/ui/TransactionItem";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const RECENT_COUNT = 4;

export default function HomeScreen() {
  const recentTransactions = useMemo(() => MOCK_TRANSACTIONS.slice(0, RECENT_COUNT), []);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <UIText size="lg" variant="heading">May 2026</UIText>
          <ThemeToggle />
        </View>

        {/* Summary card */}
        <Card>
          <UIText size="xs" variant="label">Total spent</UIText>
          <UIText size="2xl" className="font-mono font-medium mt-1">{fmt(TOTAL_SPENT)}</UIText>

          <Separator className="my-3" />

          <View className="flex-row">
            <View className="flex-1">
              <UIText size="xs" variant="label">Income</UIText>
              <UIText size="base" variant="heading" className="mt-0.5">{fmt(TOTAL_INCOME)}</UIText>
            </View>
            <View className="flex-1">
              <UIText size="xs" variant="label">Remaining</UIText>
              <UIText size="base" className="mt-0.5 font-medium text-positive dark:text-positive-dark">
                {fmt(REMAINING)}
              </UIText>
            </View>
          </View>
        </Card>

        {/* Recent transactions */}
        <UIText size="xs" variant="label" className="mt-6 mb-3">Recent transactions</UIText>

        <Card className="p-0 overflow-hidden">
          {recentTransactions.map((tx, i) => (
            <View key={tx.id} className={`px-4 ${i === recentTransactions.length - 1 ? '' : ''}`}>
              <TransactionItem {...tx} />
            </View>
          ))}
        </Card>

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
