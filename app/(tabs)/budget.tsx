import { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { MOCK_BUDGETS, TOTAL_SPENT, REMAINING } from "@/constants/mockData";
import { Colors } from "@/constants/theme";
import { fmt } from "@/utils/format";
import CategoryProgressBar from "@/components/ui/CategoryProgressBar";

const RING_SIZE = 96;
const RING_R    = 37;
const RING_CX   = RING_SIZE / 2;
const RING_CY   = RING_SIZE / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

export default function BudgetScreen() {
  const totalLimit = useMemo(
    () => MOCK_BUDGETS.reduce((a, b) => a + b.limit, 0),
    [],
  );

  const pctUsed = TOTAL_SPENT / totalLimit;
  const dash    = pctUsed * RING_CIRC;

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View className="bg-brand-card px-4 pt-[14px] pb-[14px]">
          <Text className="text-[17px] font-bold text-brand-black">Budget</Text>
        </View>

        {/* ── Summary ring card ── */}
        <View
          className="mx-[14px] mt-[14px] bg-brand-black rounded-[20px] p-5 flex-row items-center gap-5"
          style={{
            shadowColor: Colors.dark,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_CX} cy={RING_CY} r={RING_R}
                stroke="#1E293B" strokeWidth={11} fill="none"
              />
              <Circle
                cx={RING_CX} cy={RING_CY} r={RING_R}
                stroke={Colors.green}
                strokeWidth={11}
                fill="none"
                strokeDasharray={`${dash} ${RING_CIRC}`}
                strokeDashoffset={RING_CIRC / 4}
                strokeLinecap="round"
              />
            </Svg>
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-[17px] font-bold text-brand-green font-mono">
                {Math.round(pctUsed * 100)}%
              </Text>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-[11px] text-brand-muted mb-[3px]">Monthly budget</Text>
            <Text className="text-[18px] font-bold text-white font-mono">
              {fmt(TOTAL_SPENT)}
            </Text>
            <Text className="text-[12px] text-brand-muted mb-3">
              of {fmt(totalLimit)} total
            </Text>
            <View
              className="self-start px-[14px] py-[6px] rounded-full"
              style={{ backgroundColor: "rgba(29,158,117,0.2)" }}
            >
              <Text className="text-[12px] font-bold text-brand-green">
                {fmt(REMAINING)} left
              </Text>
            </View>
          </View>
        </View>

        {/* ── Category cards ── */}
        <View className="mx-[14px] mt-[14px] mb-6 gap-2.5">
          {MOCK_BUDGETS.map((b) => (
            <CategoryProgressBar key={b.category} {...b} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
