import { View, Text } from "react-native";
import { ArrowUp, ArrowDown, LucideProps } from "lucide-react-native";

interface Props {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  trend?: "up" | "down";
  Icon?: React.ComponentType<LucideProps>;
}

export default function StatChip({
  label,
  value,
  sub,
  valueColor,
  trend,
  Icon,
}: Props) {
  const accent = valueColor ?? "#1D9E75";
  const trendUp = trend !== "down";
  const trendColor = trendUp ? "#1D9E75" : "#E24B4A";

  return (
    <View className="flex-1 bg-white rounded-2xl p-4 overflow-hidden">
      {/* Decorative faint circle */}
      <View
        className="absolute -right-5 -bottom-5 w-24 h-24 rounded-full"
        style={{ backgroundColor: accent + "0D" }}
      />

      {/* Icon + trend badge row */}
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: accent + "1A" }}
        >
          {Icon && <Icon size={20} color={accent} />}
        </View>
        {trend && (
          <View
            className="flex-row items-center gap-0.5 rounded-full px-2 py-1"
            style={{ backgroundColor: trendColor + "15" }}
          >
            {trendUp ? (
              <ArrowUp size={10} color={trendColor} />
            ) : (
              <ArrowDown size={10} color={trendColor} />
            )}
          </View>
        )}
      </View>

      {/* Value */}
      <Text
        className="text-2xl font-bold text-slate-900"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Text>

      {/* Label */}
      <Text className="text-brand-muted text-[11px] mt-0.5">{label}</Text>

      {/* Sub */}
      <Text
        className="text-[10px] font-medium mt-2"
        style={{ color: trendColor }}
      >
        {sub}
      </Text>
    </View>
  );
}
