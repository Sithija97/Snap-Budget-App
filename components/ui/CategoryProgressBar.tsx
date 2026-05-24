import { View, Text } from "react-native";
import { Budget } from "../../types";

export default function CategoryProgressBar({
  category,
  spent,
  limit,
  icon,
  color,
}: Budget) {
  const pct = Math.min((spent / limit) * 100, 100);
  const isOver = spent > limit;
  const barColor = isOver ? "#E24B4A" : color;
  const remaining = Math.max(limit - spent, 0);

  return (
    <View className="bg-white rounded-2xl p-4">
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center"
          style={{ backgroundColor: barColor + "18" }}
        >
          <Text className="text-xl">{icon}</Text>
        </View>

        {/* Name + remaining */}
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-slate-900">
            {category}
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: isOver ? "#E24B4A" : "#94A3B8" }}
          >
            {isOver
              ? `Rs ${(spent - limit).toLocaleString()} over budget`
              : `Rs ${remaining.toLocaleString()} remaining`}
          </Text>
        </View>

        {/* Spent / Limit */}
        <View className="items-end">
          <Text
            className="text-[15px] font-semibold"
            style={{ color: isOver ? "#E24B4A" : "#0f172a" }}
          >
            Rs {spent.toLocaleString()}
          </Text>
          <Text className="text-brand-muted text-xs mt-0.5">
            of Rs {limit.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Progress track */}
      <View className="mt-3 h-2 rounded-full bg-[#F1F5F9]">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${pct.toFixed(1)}%` as any,
            backgroundColor: barColor,
          }}
        />
      </View>

      <Text className="text-[9px] text-brand-muted mt-1.5">
        {pct.toFixed(0)}% of budget used
      </Text>
    </View>
  );
}
