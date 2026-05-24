import { View, Text } from "react-native";
import {
  ShoppingCart,
  Car,
  Smartphone,
  ShoppingBag,
  Coffee,
  ArrowDownCircle,
  LucideProps,
} from "lucide-react-native";
import { Transaction } from "../../types";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  "shopping-cart": ShoppingCart,
  car: Car,
  smartphone: Smartphone,
  "shopping-bag": ShoppingBag,
  coffee: Coffee,
  "arrow-down-circle": ArrowDownCircle,
};

type Props = Pick<
  Transaction,
  "merchant" | "category" | "amount" | "time" | "iconBg" | "iconColor" | "icon"
> & {
  dateOrTime?: string;
};

export default function TransactionItem({
  merchant,
  category,
  amount,
  time,
  iconBg,
  iconColor,
  icon,
  dateOrTime,
}: Props) {
  const IconComponent = iconMap[icon] ?? ShoppingCart;
  const isPositive = amount > 0;
  const formatted = `${isPositive ? "+ " : "- "}Rs ${Math.abs(amount).toLocaleString()}`;

  return (
    <View className="flex-row items-center gap-3 py-2 border-b border-brand-border">
      {/* Icon box */}
      <View
        className="w-[34px] h-[34px] rounded-xl items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <IconComponent size={16} color={iconColor} />
      </View>

      {/* Middle */}
      <View className="flex-1">
        <Text className="text-slate-900 text-sm font-medium">{merchant}</Text>
        <Text className="text-brand-muted text-xs mt-0.5">{category}</Text>
      </View>

      {/* Right */}
      <View className="items-end">
        <Text
          className={`text-sm font-mono ${isPositive ? "text-brand-green" : "text-brand-red"}`}
        >
          {formatted}
        </Text>
        <Text className="text-brand-muted text-xs mt-0.5">
          {dateOrTime ?? time}
        </Text>
      </View>
    </View>
  );
}
