import { View, Text } from "react-native";
import { MonthlySpending } from "../../types";

interface Props {
  data: MonthlySpending[];
  activeMonth?: string;
}

const MAX_HEIGHT = 100;

export default function SpendingBarChart({ data, activeMonth = "May" }: Props) {
  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <View>
      <View className="flex-row gap-1.5" style={{ height: MAX_HEIGHT + 24 }}>
        {data.map((item) => {
          const barHeight = Math.max((item.amount / maxAmount) * MAX_HEIGHT, 6);
          const isActive = item.month === activeMonth;
          return (
            <View
              key={item.month}
              className="flex-1 items-center justify-end"
              style={{ position: "relative" }}
            >
              {isActive && (
                <Text
                  className="text-[9px] font-semibold text-brand-green absolute left-0 right-0 text-center"
                  style={{ top: 0 }}
                >
                  Rs {(item.amount / 1000).toFixed(0)}k
                </Text>
              )}
              <View
                className={`w-full ${
                  isActive
                    ? "bg-brand-green rounded-t-xl"
                    : "bg-slate-200 rounded-t-lg"
                }`}
                style={{ height: barHeight }}
              />
            </View>
          );
        })}
      </View>

      {/* Month labels */}
      <View className="flex-row gap-1.5 mt-2">
        {data.map((item) => {
          const isActive = item.month === activeMonth;
          return (
            <View key={item.month} className="flex-1 items-center">
              <Text
                className={`text-[9px] ${
                  isActive
                    ? "text-brand-black font-semibold"
                    : "text-brand-muted"
                }`}
              >
                {item.month}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
