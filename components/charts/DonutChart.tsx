import { memo } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { CategoryBreakdown } from "@/types";

interface Props {
  data:          CategoryBreakdown[];
  size?:         number;
  centerLabel?:  string;
  centerValue?:  string;
}

const STROKE_WIDTH = 22;

function DonutChart({
  data,
  size         = 120,
  centerLabel  = "",
  centerValue  = "",
}: Props) {
  const R             = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * R;
  const cx            = size / 2;
  const cy            = size / 2;

  let offset = 0;

  return (
    <View className="flex-row items-center gap-4">
      <View style={{ width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          <Circle
            cx={cx} cy={cy} r={R}
            stroke="#E8EDF2"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {data.map((item) => {
            const segLength  = (item.pct / 100) * circumference;
            const dashOffset = -offset;
            offset += segLength;
            return (
              <Circle
                key={item.category}
                cx={cx} cy={cy} r={R}
                stroke={item.color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${segLength} ${circumference - segLength}`}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </Svg>

        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-[10px] text-brand-muted">{centerLabel}</Text>
          <Text className="text-[12px] font-bold text-brand-black font-mono">{centerValue}</Text>
        </View>
      </View>

      <View className="flex-1 gap-2">
        {data.map((c) => (
          <View key={c.category} className="flex-row items-center gap-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <Text className="flex-1 text-[12px] text-brand-muted">{c.category}</Text>
            <Text className="text-[12px] font-semibold text-brand-black font-mono">{c.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(DonutChart);
