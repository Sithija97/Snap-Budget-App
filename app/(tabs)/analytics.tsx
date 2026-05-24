import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import {
  MOCK_MONTHLY_SPENDING,
  MOCK_CATEGORY_BREAKDOWN,
  TOTAL_SPENT,
} from "../../constants/mockData";
import SpendingBarChart from "../../components/charts/SpendingBarChart";
import DonutChart from "../../components/charts/DonutChart";

const DAILY_AVG = Math.round(TOTAL_SPENT / 31);
const APR_SPEND =
  MOCK_MONTHLY_SPENDING.find((d) => d.month === "Apr")?.amount ?? 0;
const MOM_PCT = (((TOTAL_SPENT - APR_SPEND) / APR_SPEND) * 100).toFixed(1);
const MOM_UP = TOTAL_SPENT > APR_SPEND;

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<"Monthly" | "Weekly">("Monthly");

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-xl font-semibold text-slate-900">
              Analytics
            </Text>
            <Text className="text-brand-muted text-xs mt-0.5">May 2026</Text>
          </View>
          <View className="flex-row rounded-full p-0.5 bg-brand-border">
            {(["Monthly", "Weekly"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full ${period === p ? "bg-brand-black" : "bg-transparent"}`}
              >
                <Text
                  className={`text-xs ${period === p ? "text-white" : "text-brand-muted"}`}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary stat cards */}
        <View className="flex-row gap-3 mb-4">
          {/* Total spent */}
          <View className="flex-1 bg-brand-black rounded-2xl p-4 overflow-hidden">
            <View className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-brand-green opacity-[0.08]" />
            <Text className="text-[#94A3B8] text-[10px] uppercase tracking-wider">
              Total spent
            </Text>
            <Text className="text-white text-[22px] font-bold font-mono mt-1 leading-tight">
              Rs {(TOTAL_SPENT / 1000).toFixed(1)}k
            </Text>
            <View className="flex-row items-center gap-1 mt-2">
              {MOM_UP ? (
                <TrendingUp size={10} color="#E24B4A" />
              ) : (
                <TrendingDown size={10} color="#1D9E75" />
              )}
              <Text
                className="text-[10px]"
                style={{ color: MOM_UP ? "#E24B4A" : "#1D9E75" }}
              >
                {MOM_UP ? "+" : "-"}
                {Math.abs(Number(MOM_PCT))}% vs Apr
              </Text>
            </View>
          </View>

          {/* Daily avg */}
          <View className="flex-1 bg-white rounded-2xl p-4">
            <Text className="text-brand-muted text-[10px] uppercase tracking-wider">
              Daily avg
            </Text>
            <Text className="text-slate-900 text-[22px] font-bold font-mono mt-1 leading-tight">
              Rs {(DAILY_AVG / 1000).toFixed(1)}k
            </Text>
            <Text className="text-brand-muted text-[10px] mt-2">
              per day · May
            </Text>
          </View>
        </View>

        {/* Bar chart card */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <View className="flex-row items-start justify-between mb-4">
            <View>
              <Text className="text-brand-muted text-xs">Spending trends</Text>
              <Text className="text-slate-900 text-lg font-bold mt-0.5">
                Rs {TOTAL_SPENT.toLocaleString()}
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{
                backgroundColor: MOM_UP
                  ? "rgba(226,75,74,0.1)"
                  : "rgba(29,158,117,0.1)",
              }}
            >
              <Text
                className="text-[10px] font-medium"
                style={{ color: MOM_UP ? "#E24B4A" : "#1D9E75" }}
              >
                {MOM_UP ? "↑" : "↓"} {Math.abs(Number(MOM_PCT))}% vs Apr
              </Text>
            </View>
          </View>
          <SpendingBarChart data={MOCK_MONTHLY_SPENDING} activeMonth="May" />
        </View>

        {/* Breakdown card */}
        <View className="bg-white rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-brand-muted text-xs">Breakdown</Text>
              <Text className="text-slate-900 text-base font-semibold mt-0.5">
                May 2026
              </Text>
            </View>
            <View className="rounded-full px-2.5 py-1 bg-brand-surface">
              <Text className="text-brand-muted text-[10px]">
                {MOCK_CATEGORY_BREAKDOWN.length} categories
              </Text>
            </View>
          </View>
          <DonutChart data={MOCK_CATEGORY_BREAKDOWN} size={140} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
