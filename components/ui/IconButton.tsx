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
// the borderless design language.
export function IconButton({ children, className = '', ...props }: IconButtonProps) {
  return (
    <AnimatedPressable
      className={`w-9 h-9 items-center justify-center rounded-lg bg-card dark:bg-card-dark ${className}`}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
