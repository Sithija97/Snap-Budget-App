import { View, Text } from "react-native";

interface Props {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}

export default function StatChip({ label, value, sub, valueColor }: Props) {
  return (
    <View className="flex-1 bg-white border border-brand-border rounded-2xl p-3">
      <Text className="text-brand-muted text-[10px]">{label}</Text>
      <Text
        className="text-xl font-medium mt-0.5"
        style={{ color: valueColor ?? "#0f172a" }}
      >
        {value}
      </Text>
      <Text className="text-brand-muted text-[10px] mt-0.5">{sub}</Text>
    </View>
  );
}
