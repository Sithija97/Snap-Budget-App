import { memo } from "react";
import { View, Text } from "react-native";
import { ShoppingCart } from "lucide-react-native";
import { Budget } from "@/types";
import { CAT_ICONS } from "@/constants/icons";
import { Colors } from "@/constants/theme";
import { fmt } from "@/utils/format";
import AlertBanner from "@/components/ui/AlertBanner";

type Props = Pick<Budget, "category" | "spent" | "limit" | "color">;

function CategoryProgressBar({ category, spent, limit, color }: Props) {
  const Icon     = CAT_ICONS[category] || ShoppingCart;
  const pct      = Math.min(spent / limit, 1);
  const isOver   = spent > limit;
  const barColor = isOver ? Colors.red : color;

  return (
    <View className="bg-brand-card rounded-[18px] p-4">
      <View className="flex-row items-center gap-3 mb-3">
        <View
          className="w-[42px] h-[42px] rounded-[14px] items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={20} color={color} strokeWidth={1.8} />
        </View>

        <View className="flex-1">
          <Text className="text-[14px] font-semibold text-brand-black">{category}</Text>
          <Text className="text-[11px] text-brand-muted mt-0.5 font-mono">
            {fmt(spent)} of {fmt(limit)}
          </Text>
        </View>

        <View className="items-end">
          <Text className={`text-[13px] font-bold font-mono ${isOver ? "text-brand-red" : "text-brand-black"}`}>
            {fmt(isOver ? spent - limit : limit - spent)}
          </Text>
          <Text className="text-[10px] text-brand-muted mt-0.5">
            {isOver ? "over limit" : "remaining"}
          </Text>
        </View>
      </View>

      <View className="h-[7px] bg-brand-border rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct * 100}%` as any, backgroundColor: barColor }}
        />
      </View>

      {isOver && (
        <AlertBanner
          type="error"
          message={`Over budget by ${fmt(spent - limit)}`}
        />
      )}
    </View>
  );
}

export default memo(CategoryProgressBar);
