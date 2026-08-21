import { ComponentType } from "react";
import { View, ActivityIndicator } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { UIText } from "./UIText";
import { useTheme } from "@/context/ThemeContext";
import { AnimatedPressable } from "./AnimatedPressable";
import { brandBlue } from "@/constants/colors";

interface DataStateProps {
  status: "idle" | "loading" | "error";
  isEmpty: boolean;
  onRetry: () => void;
  emptyMessage?: string;
  /** Optional icon shown above the empty message — a plain muted circle
   *  badge, matching the "icon in a tinted circle" pattern used elsewhere
   *  (e.g. the Assistant screen's empty state). Omit for a text-only empty
   *  state (the original, still-default look). */
  emptyIcon?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /** Rendered while loading instead of the spinner — pass skeleton rows that
   *  mirror the list's real layout so content doesn't jump when it arrives. */
  loadingSkeleton?: React.ReactNode;
  /** Optional call-to-action shown under the empty message (e.g. "Add a
   *  wallet") — without this, the empty state described the problem but
   *  gave no way to act on it, even though the fix (the header's + button)
   *  was one tap away the whole time. */
  emptyAction?: { label: string; onPress: () => void };
}

// Unifies the loading / error+retry / empty cases every list screen needs
// once data comes from the network instead of always-available local state.
export function DataState({ status, isEmpty, onRetry, emptyMessage = "Nothing here yet", emptyIcon: EmptyIcon, loadingSkeleton, emptyAction }: DataStateProps) {
  const { isDark } = useTheme();
  const iconColor = brandBlue(isDark);

  if (status === "loading" && isEmpty) {
    if (loadingSkeleton) return <>{loadingSkeleton}</>;
    return (
      <View className="items-center py-12">
        <ActivityIndicator color={brandBlue(isDark)} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View className="items-center py-12 gap-2">
        <UIText size="sm" variant="muted">Couldn't load data</UIText>
        <AnimatedPressable
          onPress={onRetry}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          contentStyle={{ paddingVertical: 4 }}
        >
          <UIText size="sm" variant="heading" className="underline" style={{ color: brandBlue(isDark) }}>Retry</UIText>
        </AnimatedPressable>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <Animated.View entering={FadeIn.duration(300)} className="items-center py-12 gap-3">
        {EmptyIcon && (
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: isDark ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.1)" }}
          >
            <EmptyIcon size={22} color={iconColor} strokeWidth={1.8} />
          </View>
        )}
        <UIText size="sm" variant="muted" className="text-center px-8">{emptyMessage}</UIText>
        {emptyAction && (
          <AnimatedPressable
            onPress={emptyAction.onPress}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            <UIText size="sm" variant="heading" className="underline" style={{ color: iconColor }}>
              {emptyAction.label}
            </UIText>
          </AnimatedPressable>
        )}
      </Animated.View>
    );
  }

  return null;
}
