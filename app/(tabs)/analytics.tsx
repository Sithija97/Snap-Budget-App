import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MOCK_MONTHLY_SPENDING,
  MOCK_CATEGORY_BREAKDOWN,
} from "@/constants/mockData";
import { fmt } from "@/utils/format";
import DonutChart from "@/components/charts/DonutChart";
import SpendingBarChart from "@/components/charts/SpendingBarChart";

const TABS = ["Expense", "Income", "All"];

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState("Expense");

  const cats  = MOCK_CATEGORY_BREAKDOWN;
  const total = useMemo(() => cats.reduce((a, c) => a + c.amount, 0), [cats]);

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View className="bg-brand-card px-4 pt-[14px] pb-[14px]">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[17px] font-bold text-brand-black">Reports</Text>
            <Text className="text-[12px] text-brand-muted">May 2026</Text>
          </View>

          {/* Tabs */}
          <View className="flex-row bg-brand-surface rounded-xl p-[3px]">
            {TABS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                className={`flex-1 items-center py-[7px] rounded-[9px] ${
                  activeTab === t ? "bg-brand-card" : ""
                }`}
                style={
                  activeTab === t
                    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 }
                    : undefined
                }
              >
                <Text
                  className={`text-[12px] ${
                    activeTab === t
                      ? "font-semibold text-brand-black"
                      : "font-normal text-brand-muted"
                  }`}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Donut chart + legend ── */}
        <View className="mx-[14px] mt-[14px] bg-brand-card rounded-[20px] p-4">
          <Text className="text-[14px] font-semibold text-brand-black mb-4">
            Category breakdown
          </Text>
          <DonutChart
            data={cats}
            size={120}
            centerLabel="Total"
            centerValue={fmt(total)}
          />
        </View>

        {/* ── By category progress ── */}
        <View className="mx-[14px] mt-[14px] bg-brand-card rounded-[20px] p-4">
          <Text className="text-[14px] font-semibold text-brand-black mb-4">
            By category
          </Text>
          {cats.map((c) => (
            <View key={c.category} className="mb-[14px]">
              <View className="flex-row items-center gap-2 mb-[6px]">
                <View
                  className="w-[30px] h-[30px] rounded-[10px] items-center justify-center"
                  style={{ backgroundColor: c.color + "20" }}
                >
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                </View>
                <Text className="flex-1 text-[13px] font-medium text-brand-black">
                  {c.category}
                </Text>
                <Text className="text-[12px] font-semibold text-brand-black font-mono">
                  {fmt(c.amount)}
                </Text>
                <Text className="text-[11px] text-brand-muted w-[30px] text-right">
                  {c.pct}%
                </Text>
              </View>
              <View className="h-[6px] bg-brand-border rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${c.pct}%` as any, backgroundColor: c.color }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── Monthly bar chart ── */}
        <View className="mx-[14px] mt-[14px] mb-6 bg-brand-card rounded-[20px] p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[14px] font-semibold text-brand-black">Monthly trend</Text>
            <View className="flex-row gap-[14px]">
              {[
                { color: "#1D9E75", label: "Income" },
                { color: "#E24B4A", label: "Expense" },
              ].map((l) => (
                <View key={l.label} className="flex-row items-center gap-[5px]">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <Text className="text-[10px] text-brand-muted">{l.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <SpendingBarChart data={MOCK_MONTHLY_SPENDING} activeMonth="M" />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
