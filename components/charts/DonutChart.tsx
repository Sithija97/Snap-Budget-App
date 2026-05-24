import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { CategoryBreakdown } from "../../types";

interface Props {
  data: CategoryBreakdown[];
  size?: number;
}

const STROKE_WIDTH = 14;

export default function DonutChart({ data, size = 110 }: Props) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const topCategory = data.reduce((a, b) => (a.pct > b.pct ? a : b), data[0]);

  return (
    <View className="flex-row items-center gap-4">
      {/* SVG Donut with center label */}
      <View style={{ width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          {/* Background ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {data.map((item) => {
            const segLength = (item.pct / 100) * circumference;
            const dashOffset = -offset;
            offset += segLength;
            return (
              <Circle
                key={item.category}
                cx={cx}
                cy={cy}
                r={radius}
                stroke={item.color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${segLength} ${circumference - segLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </Svg>

        {/* Center label */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-[18px] font-semibold text-slate-900">
            {topCategory.pct}%
          </Text>
          <Text className="text-[9px] text-brand-muted">
            {topCategory.category}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View className="flex-1 gap-2">
        {data.map((item) => (
          <View key={item.category} className="flex-row items-center gap-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <Text className="text-[11px] text-slate-900 flex-1">
              {item.category}
            </Text>
            <Text className="text-[11px] text-brand-muted font-mono">
              Rs {(item.amount / 1000).toFixed(1)}k
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
