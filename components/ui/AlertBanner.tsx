import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";

interface Props {
  message: string;
  type: "error" | "warning";
}

export default function AlertBanner({ message, type }: Props) {
  const isError = type === "error";
  const iconColor = isError ? "#b91c1c" : "#92400e";

  return (
    <View
      className={`rounded-xl p-2 flex-row items-center gap-2 mt-1 ${
        isError ? "bg-[#FCEBEB]" : "bg-[#FAEEDA]"
      }`}
    >
      <AlertCircle size={14} color={iconColor} />
      <Text
        className={`text-xs flex-1 ${
          isError ? "text-[#b91c1c]" : "text-[#92400e]"
        }`}
      >
        {message}
      </Text>
    </View>
  );
}
