import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
}

// A neutral placeholder shape for numeric/text content that hasn't loaded
// yet — shown instead of real-looking-but-wrong values (e.g. "Rs 0" before
// the first fetch resolves), which reads as a bug even when it's "just"
// a loading state. Pair with a loading condition that only fires before the
// first successful fetch, not on every refresh (see callers).
//
// Pulses gently so the wait reads as activity rather than a frozen screen;
// stays static when the OS reduce-motion setting is on.
export function Skeleton({ width = 60, height = 14, className = '' }: SkeletonProps) {
  const { isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`rounded ${className}`}
      style={[{ width, height, backgroundColor: isDark ? '#27272a' : '#e4e4e7' }, pulse]}
    />
  );
}
