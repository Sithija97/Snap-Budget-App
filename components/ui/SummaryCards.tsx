import { memo } from "react";
import { View, Text } from "react-native";
import { fmt } from "@/utils/format";

interface Props {
  income: number;
  spent:  number;
  showSubText?: boolean;
}

function SummaryCards({ income, spent, showSubText = false }: Props) {
  const pctUsed = Math.round((spent / income) * 100);

  return (
    <View className="flex-row gap-2.5">
      <View className="flex-1 bg-brand-incomeBg rounded-[14px] p-3">
        <View className="flex-row items-center gap-1.5 mb-[5px]">
          <View className="w-5 h-5 rounded-full bg-brand-green items-center justify-center">
            <Text className="text-[9px] text-white font-bold">↓</Text>
          </View>
          <Text className="text-[10px] text-brand-green font-bold tracking-[0.4px]">INCOME</Text>
        </View>
        <Text className="text-[15px] font-bold text-brand-green font-mono mb-0.5">
          {fmt(income)}
        </Text>
        {showSubText && (
          <Text className="text-[10px] text-brand-muted">received this month</Text>
        )}
      </View>

      <View className="flex-1 bg-brand-expenseBg rounded-[14px] p-3">
        <View className="flex-row items-center gap-1.5 mb-[5px]">
          <View className="w-5 h-5 rounded-full bg-brand-red items-center justify-center">
            <Text className="text-[9px] text-white font-bold">↑</Text>
          </View>
          <Text className="text-[10px] text-brand-red font-bold tracking-[0.4px]">EXPENSE</Text>
        </View>
        <Text className="text-[15px] font-bold text-brand-red font-mono mb-0.5">
          {fmt(spent)}
        </Text>
        {showSubText && (
          <Text className="text-[10px] text-brand-muted">{pctUsed}% of income used</Text>
        )}
      </View>
    </View>
  );
}

export default memo(SummaryCards);
