import { memo } from "react";
import { View, Text } from "react-native";
import { ShoppingCart } from "lucide-react-native";
import { Transaction, TxType } from "@/types";
import { TX_ICONS } from "@/constants/icons";
import { fmt } from "@/utils/format";

type Props = Pick<
  Transaction,
  "merchant" | "category" | "txType" | "amount" | "time" | "icon" | "iconBg" | "iconColor"
>;

function TransactionItem({
  merchant,
  category,
  txType,
  amount,
  time,
  icon,
  iconBg,
  iconColor,
}: Props) {
  const Icon     = TX_ICONS[icon] || ShoppingCart;
  const isIncome = txType === TxType.Income;

  return (
    <View className="flex-row items-center gap-3 py-[7px] px-4">
      <View
        className="w-[38px] h-[38px] rounded-xl items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
      </View>

      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-brand-black">{merchant}</Text>
        <Text className="text-[11px] text-brand-muted mt-0.5">
          {category} · {time}
        </Text>
      </View>

      <Text className={`text-[13px] font-bold font-mono ${isIncome ? "text-brand-green" : "text-brand-red"}`}>
        {isIncome ? "+" : "−"}{fmt(amount)}
      </Text>
    </View>
  );
}

export default memo(TransactionItem);
