import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ViewStyle } from "react-native";

interface AnimatedBarProps {
  /** Animates on this axis — 'height' for vertical bar charts, 'width' for horizontal progress fills. */
  axis: "height" | "width";
  /** Target size, e.g. `72` (px) or `'64%'`. */
  size: number | `${number}%`;
  color: string;
  style?: ViewStyle;
  /** Delay before this bar starts growing — lets a row of bars stagger instead of rising in lockstep. */
  delay?: number;
  accessibilityLabel?: string;
  accessibilityValue?: { min?: number; max?: number; now?: number; text?: string };
}

const DURATION = 450;

// Shared grow-in for bar charts and progress fills: animates from 0 to its
// target size on mount/update instead of snapping instantly, and re-plays
// whenever `size` or `color` changes (e.g. switching Monthly/Weekly, or a
// budget crossing into "near limit"). Respects reduce-motion.
export function AnimatedBar({
  axis,
  size,
  color,
  style,
  delay = 0,
  accessibilityLabel,
  accessibilityValue,
}: AnimatedBarProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, color, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const numeric = typeof size === "number" ? size : parseFloat(size);
    const unit = typeof size === "number" ? "" : "%";
    const value = numeric * progress.value;
    return axis === "height"
      ? { height: `${value}${unit}` as any }
      : { width: `${value}${unit}` as any };
  });

  return (
    <Animated.View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "progressbar" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}
      style={[{ backgroundColor: color }, style, animatedStyle]}
    />
  );
}
