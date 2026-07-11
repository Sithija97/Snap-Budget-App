import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { UIText } from "./UIText";
import { useTheme } from "@/context/ThemeContext";

interface DataStateProps {
  status: "idle" | "loading" | "error";
  isEmpty: boolean;
  onRetry: () => void;
  emptyMessage?: string;
  /** Rendered while loading instead of the spinner — pass skeleton rows that
   *  mirror the list's real layout so content doesn't jump when it arrives. */
  loadingSkeleton?: React.ReactNode;
}

// Unifies the loading / error+retry / empty cases every list screen needs
// once data comes from the network instead of always-available local state.
export function DataState({ status, isEmpty, onRetry, emptyMessage = "Nothing here yet", loadingSkeleton }: DataStateProps) {
  const { isDark } = useTheme();

  if (status === "loading" && isEmpty) {
    if (loadingSkeleton) return <>{loadingSkeleton}</>;
    return (
      <View className="items-center py-12">
        <ActivityIndicator color={isDark ? "#fafafa" : "#18181b"} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View className="items-center py-12 gap-2">
        <UIText size="sm" variant="muted">Couldn't load data</UIText>
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
          <UIText size="sm" variant="heading" className="underline">Retry</UIText>
        </TouchableOpacity>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="items-center py-12">
        <UIText size="sm" variant="muted">{emptyMessage}</UIText>
      </View>
    );
  }

  return null;
}
