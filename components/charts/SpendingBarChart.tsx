import { View, Text } from "react-native";
import { MonthlySpending } from "../../types";

interface Props {
  data: MonthlySpending[];
  activeMonth?: string;
}

const MAX_HEIGHT = 72;

export default function SpendingBarChart({ data, activeMonth = "May" }: Props) {
  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <View>
      <View className="flex-row items-end gap-2" style={{ height: MAX_HEIGHT }}>
        {data.map((item) => {
          const barHeight = Math.max((item.amount / maxAmount) * MAX_HEIGHT, 6);
          const isActive = item.month === activeMonth;
          return (
            <View
              key={item.month}
              className="flex-1 items-center"
              style={{ justifyContent: "flex-end" }}
            >
              <View
                className="w-full rounded-t-md"
                style={{
                  height: barHeight,
                  backgroundColor: isActive ? "#1D9E75" : "#E2E8F0",
                }}
              />
            </View>
          );
        })}
      </View>

      {/* Month labels */}
      <View className="flex-row gap-2 mt-1">
        {data.map((item) => (
          <View key={item.month} className="flex-1 items-center">
            <Text className="text-[8px] text-brand-muted">{item.month}</Text>
          </View>
        ))}
      </View>

      {/* Y-axis hint */}
      <View className="flex-row justify-between mt-1">
        <Text className="text-[8px] text-brand-muted">0</Text>
        <Text className="text-[8px] text-brand-muted">Rs 20k</Text>
        <Text className="text-[8px] text-brand-muted">Rs 50k</Text>
      </View>
    </View>
  );
}
