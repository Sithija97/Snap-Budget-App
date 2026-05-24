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
          <Text className="text-xl font-medium text-slate-900">Budget</Text>
          <TouchableOpacity>
            <Text className="text-brand-green text-xs">Edit limits</Text>
          </TouchableOpacity>
        </View>

        {/* Total budget card */}
        <View className="bg-brand-black rounded-2xl p-4 mb-4">
          <Text className="text-brand-muted text-xs">Monthly budget</Text>
          <View className="flex-row items-end justify-between mt-1">
            <Text className="text-white text-2xl font-mono font-medium">
              Rs {MOCK_USER.monthlyBudget.toLocaleString()}
            </Text>
            <Text className="text-brand-muted text-xs">
              Rs {REMAINING.toLocaleString()} remaining
            </Text>
          </View>

          {/* Progress bar */}
          <View className="mt-3 h-1 rounded-full bg-[#1e293b]">
            <View
              className="h-1 rounded-full bg-brand-green"
              style={{ width: `${PCT_USED}%` as any }}
            />
          </View>
          <Text className="text-brand-muted text-xs mt-1">
            {PCT_USED}% used · {DAYS_LEFT} days left
          </Text>
        </View>

        {/* Category progress bars */}
        <View className="bg-white rounded-2xl p-4">
          {MOCK_BUDGETS.map((budget) => (
            <CategoryProgressBar key={budget.category} {...budget} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
