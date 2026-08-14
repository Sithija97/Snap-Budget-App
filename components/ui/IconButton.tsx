import { ReactNode } from 'react';
import { PressableProps } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';

interface IconButtonProps extends PressableProps {
  children: ReactNode;
  /** Layout-only additions (margins); the surface styling is fixed here */
  className?: string;
}

// Single source of truth for the square icon button (screen-header back
// buttons, edit/add actions, theme toggle). Previously hand-rolled as an
// outlined TouchableOpacity in 8 files; now a filled card surface to match
// the borderless design language. The visible surface stays 36x36 (matches
// the compact header rhythm every screen was built around), but hitSlop pads
// the actual touch target out to the 44x44 minimum from iOS HIG / Material —
// callers don't need to opt in individually.
export function IconButton({ children, className = '', hitSlop, ...props }: IconButtonProps) {
  return (
    <AnimatedPressable
      className={`w-9 h-9 items-center justify-center rounded-lg bg-card dark:bg-card-dark ${className}`}
      hitSlop={hitSlop ?? { top: 4, bottom: 4, left: 4, right: 4 }}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
