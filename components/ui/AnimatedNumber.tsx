import { useEffect, useState } from "react";
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { UIText } from "./UIText";

interface AnimatedNumberProps {
  /** Target numeric value to count up (or down) to. */
  value: number;
  /** Formats the in-flight numeric value into display text, e.g. `fmt`. */
  format: (n: number) => string;
  size?: React.ComponentProps<typeof UIText>["size"];
  variant?: React.ComponentProps<typeof UIText>["variant"];
  className?: string;
  style?: React.ComponentProps<typeof UIText>["style"];
}

const DURATION = 600;

// Counts up from its previous value to `value` whenever it changes, instead
// of snapping — used for the one hero currency figure per screen (Home's
// "Total spent", Budget's "This month" total) so a pull-to-refresh or month
// change feels alive rather than a flicker. Drives a plain UIText re-render
// via useAnimatedReaction (runs on the UI thread, hops to JS only to commit
// the formatted string) rather than an Animated.Text hack, so it stays a
// normal <Text> for accessibility/layout purposes. Respects reduce-motion.
export function AnimatedNumber({ value, format, size, variant, className, style }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const animated = useSharedValue(value);
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    animated.value = withTiming(value, {
      duration: reduceMotion ? 0 : DURATION,
      easing: Easing.out(Easing.cubic),
    });
    if (reduceMotion) setDisplay(format(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduceMotion]);

  // `format` is a plain JS closure (e.g. `fmt`) — it must run on the JS
  // thread, not inside the worklet body, or Reanimated's worklet-ization
  // strips it down to something that isn't callable ("format is not a
  // function"). So the worklet only reads the shared value and hops to JS;
  // formatting happens in `commit`, after the runOnJS boundary.
  const commit = (current: number) => setDisplay(format(current));

  useAnimatedReaction(
    () => animated.value,
    (current) => {
      runOnJS(commit)(current);
    },
  );

  return (
    <UIText size={size} variant={variant} className={className} style={style}>
      {display}
    </UIText>
  );
}
