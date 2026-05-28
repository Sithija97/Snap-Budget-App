import { View, Text } from "react-native";
import { Transaction } from "../../types";

const GREEN = "#00C170";
const RED = "#FF5A5F";
const TEXT = "#1A1D23";
const SUB = "#8A94A6";
const BORDER = "#F0F2F7";

type Props = Pick<
  Transaction,
  "merchant" | "category" | "txType" | "amount" | "time" | "emoji" | "iconBg"
> & {
  showBorder?: boolean;
};

export default function TransactionItem({
  merchant,
  category,
  txType,
  amount,
  time,
  emoji,
  iconBg,
  showBorder = true,
}: Props) {
  const isIncome = txType === "inc";
  const formatted = `${isIncome ? "+" : "\u2212"}Rs ${amount.toLocaleString()}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingVertical: 9,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: BORDER,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontWeight: "500", color: TEXT }}>
          {merchant}
        </Text>
        <Text style={{ fontSize: 11, color: SUB, marginTop: 1 }}>
          {category} · {time}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: "600",
          color: isIncome ? GREEN : RED,
          fontFamily: "DMMono_400Regular",
        }}
      >
        {formatted}
      </Text>
    </View>
  );
}
