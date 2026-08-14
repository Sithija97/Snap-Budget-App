import { View, ViewProps } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';

interface CardProps extends ViewProps {
  className?: string;
  bordered?: boolean;
  /** Makes the card tappable with spring press feedback — replaces the ad-hoc TouchableOpacity wrapper every screen previously hand-rolled around a plain Card. */
  onPress?: () => void;
  disabled?: boolean;
}

export function Card({ children, className = '', bordered = false, onPress, disabled, ...props }: CardProps) {
  // Borderless by default: cards read as surfaces via the card/background
  // token contrast (see tailwind.config.js). `bordered` remains for the rare
  // case that needs an explicit outline.
  const frame = bordered
    ? 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
    : 'bg-card dark:bg-card-dark';

  if (onPress) {
    return (
      <AnimatedPressable
        className={`${frame} rounded-2xl p-4 ${className}`}
        onPress={onPress}
        disabled={disabled}
        pressScale={0.98}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      className={`${frame} rounded-2xl p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
