import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MOCK_MONTHLY_SPENDING,
  MOCK_CATEGORY_BREAKDOWN,
} from "../../constants/mockData";
import SectionTitle from "../../components/ui/SectionTitle";
import SpendingBarChart from "../../components/charts/SpendingBarChart";
import DonutChart from "../../components/charts/DonutChart";

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<"Monthly" | "Weekly">("Monthly");

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-medium text-slate-900">Analytics</Text>
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

        {/* Bar chart card */}
        <View className="bg-white border border-brand-border rounded-2xl p-4 mb-3">
          <Text className="text-brand-muted text-xs mb-3">
            Spending last 6 months
          </Text>
          <SpendingBarChart data={MOCK_MONTHLY_SPENDING} activeMonth="May" />
        </View>

        {/* Breakdown card */}
        <View className="bg-white border border-brand-border rounded-2xl p-4">
          <SectionTitle title="Spending breakdown — May" />
          <DonutChart data={MOCK_CATEGORY_BREAKDOWN} size={80} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
