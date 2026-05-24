import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { CategoryBreakdown } from "../../types";

interface Props {
  data: CategoryBreakdown[];
  size?: number;
}

const STROKE_WIDTH = 10;

export default function DonutChart({ data, size = 72 }: Props) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;

  return (
    <View className="flex-row items-center gap-4">
      {/* SVG Donut */}
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

      {/* Legend */}
      <View className="flex-1 gap-1.5">
        {data.map((item) => (
          <View key={item.category} className="flex-row items-center gap-2">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <Text className="text-xs text-slate-900">
              {item.category} — {item.pct}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
