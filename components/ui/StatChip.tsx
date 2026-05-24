import { View, Text } from "react-native";
import { ArrowUp, ArrowDown } from "lucide-react-native";

interface Props {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  trend?: "up" | "down";
}

export default function StatChip({
  label,
  value,
  sub,
  valueColor,
  trend,
}: Props) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-brand-muted text-[10px] uppercase tracking-wide">
          {label}
        </Text>
        {trend === "up" && (
          <View className="w-5 h-5 rounded-full items-center justify-center bg-[rgba(29,158,117,0.12)]">
            <ArrowUp size={10} color="#1D9E75" />
          </View>
        )}
        {trend === "down" && (
          <View className="w-5 h-5 rounded-full items-center justify-center bg-[rgba(226,75,74,0.12)]">
            <ArrowDown size={10} color="#E24B4A" />
          </View>
        )}
      </View>
      <Text
        className="text-[22px] font-semibold mt-0.5"
        style={{ color: valueColor ?? "#0f172a" }}
      >
        {value}
      </Text>
      <Text className="text-brand-muted text-[10px] mt-1">{sub}</Text>
    </View>
  );
}
