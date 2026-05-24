import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface Props {
  message: string;
  type: "error" | "warning";
}

export default function AlertBanner({ message, type }: Props) {
  const isError = type === "error";
  const bg = isError ? "#FCEBEB" : "#FAEEDA";
  const color = isError ? "#b91c1c" : "#92400e";

  return (
    <View
      className="rounded-xl p-2 flex-row items-center gap-2 mt-1"
      style={{ backgroundColor: bg }}
    >
      <AlertCircle size={14} color={color} />
      <Text className="text-xs flex-1" style={{ color }}>
        {message}
      </Text>
    </View>
  );
}
