import { useCallback } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_TRANSACTIONS, TOTAL_INCOME, TOTAL_SPENT } from "@/constants/mockData";
import { fmt } from "@/utils/format";
import {
  useTransactionFilters,
  FILTER_OPTIONS,
  FilterOption,
} from "@/hooks/useTransactionFilters";
import TransactionItem from "@/components/ui/TransactionItem";
import SummaryCards from "@/components/ui/SummaryCards";

export default function TransactionsScreen() {
  const { filter, setFilter, groups } = useTransactionFilters(MOCK_TRANSACTIONS);

  const handleFilterChange = useCallback(
    (f: FilterOption) => setFilter(f),
    [setFilter],
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      {/* ── Header ── */}
      <View className="bg-brand-card px-4 pt-[14px]">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[17px] font-bold text-brand-black">Records</Text>
          <View className="flex-row gap-2">
            {["🔍", "⚙️"].map((icon) => (
              <View
                key={icon}
                className="w-8 h-8 rounded-[10px] bg-brand-surface items-center justify-center"
              >
                <Text className="text-[14px]">{icon}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Month navigator */}
        <View className="flex-row items-center justify-center gap-[18px] mb-[14px]">
          <Text className="text-[18px] text-brand-muted">‹</Text>
          <Text className="text-[14px] font-bold text-brand-black">May 2026</Text>
          <Text className="text-[18px] text-brand-muted">›</Text>
        </View>

        {/* Summary */}
        <View className="mb-[14px]">
          <SummaryCards income={TOTAL_INCOME} spent={TOTAL_SPENT} />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-[7px] pb-3">
            {FILTER_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => handleFilterChange(f)}
                className={`px-[14px] py-[6px] rounded-full border ${
                  filter === f
                    ? "bg-brand-black border-brand-black"
                    : "bg-brand-surface border-brand-border"
                }`}
              >
                <Text
                  className={`text-[12px] font-semibold ${
                    filter === f ? "text-white" : "text-brand-muted"
                  }`}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── Transaction groups ── */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {groups.map((g) => {
          const groupTotal = g.txs
            .filter((t) => t.txType !== "inc")
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <View
              key={g.label}
              className="mx-[14px] mt-3 bg-brand-card rounded-[18px] overflow-hidden"
            >
              <View className="flex-row justify-between items-center px-4 pt-3 pb-[6px]">
                <Text className="text-[11px] font-bold text-brand-muted uppercase tracking-widest">
                  {g.label}
                </Text>
                {groupTotal > 0 && (
                  <Text className="text-[11px] text-brand-red font-mono font-semibold">
                    −{fmt(groupTotal)}
                  </Text>
                )}
              </View>

              {g.txs.map((tx) => (
                <TransactionItem key={tx.id} {...tx} />
              ))}
            </View>
          );
        })}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
