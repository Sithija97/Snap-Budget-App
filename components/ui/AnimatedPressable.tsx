import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

interface AnimatedPressableProps extends PressableProps {
  children: ReactNode;
  /** How far to scale down on press. Smaller/subtler for large surfaces (cards), more noticeable for compact controls (buttons/chips). */
  pressScale?: number;
  className?: string;
  /** Visual surface styling (background, radius, padding) — lands on the inner animated view, same element `className` targets. Plain `style` stays on the outer Pressable for layout-only concerns (margins, flex). */
  contentStyle?: StyleProp<ViewStyle>;
}

const SPRING = { damping: 18, stiffness: 400, mass: 0.5 };

// Single source of truth for "physical" press feedback — a spring-back scale
// instead of TouchableOpacity's flat opacity flicker. The scale lives on an
// inner Animated.View (a NativeWind-registered component, so `className`
// keeps working) rather than on the Pressable itself — wrapping Pressable in
// Animated.createAnimatedComponent would produce a component NativeWind has
// never seen and silently drop `className` support, the same class of bug
// this codebase has been bitten by before (see Chip/Card comments). Runs on
// the UI thread (Reanimated, already installed for Skeleton's pulse), so it
// stays smooth even while JS is busy with a fetch/nav transition. Respects
// the OS reduce-motion setting the same way Skeleton does.
export function AnimatedPressable({
  children,
  pressScale = 0.97,
  className = '',
  style,
  contentStyle,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: AnimatedPressableProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduceMotion) scale.value = withSpring(pressScale, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduceMotion) scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      style={style}
      {...props}
    >
      <Animated.View className={className} style={[contentStyle, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
