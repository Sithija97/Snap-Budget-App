import { memo } from "react";
import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface Props {
  message: string;
  type: "error" | "warning";
}

function AlertBanner({ message, type }: Props) {
  const isError = type === "error";

  return (
    <View
      className={`rounded-xl p-2 flex-row items-center gap-2 mt-2 ${
        isError ? "bg-brand-redBg" : "bg-brand-amberBg"
      }`}
    >
      <AlertCircle
        size={14}
        color={isError ? "#b91c1c" : "#92400e"}
        strokeWidth={2}
      />
      <Text className={`text-xs flex-1 ${isError ? "text-[#b91c1c]" : "text-[#92400e]"}`}>
        {message}
      </Text>
    </View>
  );
}

export default memo(AlertBanner);
