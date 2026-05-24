import { View, Text } from "react-native";
import AlertBanner from "./AlertBanner";
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

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-1">
        <Text className="text-sm mr-1">{icon}</Text>
        <Text className="text-slate-900 text-xs font-medium flex-1">
          {category}
        </Text>
        <Text className="text-brand-muted text-xs">
          Rs {spent.toLocaleString()} / Rs {limit.toLocaleString()}
        </Text>
      </View>

      {/* Progress track */}
      <View
        className="h-1.5 rounded-full"
        style={{ backgroundColor: "#F1F5F9" }}
      >
        <View
          className="h-1.5 rounded-full"
          style={{ width: `${pct.toFixed(1)}%` as any, backgroundColor: color }}
        />
      </View>

      {isOver && (
        <AlertBanner
          type="error"
          message={`${category} budget exceeded by Rs ${(spent - limit).toLocaleString()}`}
        />
      )}
    </View>
  );
}
