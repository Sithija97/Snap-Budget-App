import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MOCK_BUDGETS,
  MOCK_USER,
  TOTAL_SPENT,
  REMAINING,
} from "../../constants/mockData";
import CategoryProgressBar from "../../components/ui/CategoryProgressBar";

const DAYS_LEFT = 12;
const PCT_USED = ((TOTAL_SPENT / MOCK_USER.monthlyBudget) * 100).toFixed(1);

export default function BudgetScreen() {
  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xl font-semibold text-slate-900">Budget</Text>
            <Text className="text-brand-muted text-xs mt-0.5">May 2026</Text>
          </View>
          <TouchableOpacity className="bg-white rounded-full px-3 py-1.5">
            <Text className="text-brand-green text-xs font-medium">
              Edit limits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total budget card */}
        <View className="bg-brand-black rounded-3xl p-5 mb-5 overflow-hidden">
          {/* Background glow */}
          <View className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-green opacity-[0.07]" />
          <View className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-brand-green opacity-[0.04]" />

          {/* Top row: label + days badge */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#94A3B8] text-xs uppercase tracking-widest">
              Monthly budget
            </Text>
            <View className="rounded-full px-2.5 py-1 bg-[rgba(255,255,255,0.08)]">
              <Text className="text-white text-[10px]">
                {DAYS_LEFT} days left
              </Text>
            </View>
          </View>

          {/* Budget amount */}
          <Text className="text-white text-[32px] font-bold font-mono leading-none">
            Rs {MOCK_USER.monthlyBudget.toLocaleString()}
          </Text>

          {/* Spent / Remaining columns */}
          <View className="flex-row items-center gap-5 mt-4">
            <View>
              <Text className="text-[#64748B] text-[9px] uppercase tracking-wider">
                Spent
              </Text>
              <Text className="text-brand-red text-sm font-semibold mt-0.5">
                Rs {TOTAL_SPENT.toLocaleString()}
              </Text>
            </View>
            <View className="w-px h-7 bg-[#1e293b]" />
            <View>
              <Text className="text-[#64748B] text-[9px] uppercase tracking-wider">
                Remaining
              </Text>
              <Text className="text-brand-green text-sm font-semibold mt-0.5">
                Rs {REMAINING.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="mt-5">
            <View className="h-2 rounded-full bg-[#1e293b]">
              <View
                className="h-2 rounded-full bg-brand-green"
                style={{ width: `${PCT_USED}%` as any }}
              />
            </View>
            <View className="flex-row justify-between mt-1.5">
              <Text className="text-[#475569] text-[9px]">Rs 0</Text>
              <Text className="text-brand-green text-[9px] font-semibold">
                {PCT_USED}% used
              </Text>
              <Text className="text-[#475569] text-[9px]">
                Rs {MOCK_USER.monthlyBudget.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Categories label */}
        <Text className="text-brand-muted text-[11px] font-medium uppercase tracking-widest mb-3">
          Categories
        </Text>

        {/* Category cards */}
        <View className="gap-3">
          {MOCK_BUDGETS.map((budget) => (
            <CategoryProgressBar key={budget.category} {...budget} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
