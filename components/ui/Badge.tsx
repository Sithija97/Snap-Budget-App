import { View } from 'react-native';
import { UIText } from './UIText';

type Variant = 'default' | 'outline' | 'destructive' | 'positive' | 'warning';

const containerStyles: Record<Variant, string> = {
  default:     'bg-accent dark:bg-accent-dark',
  outline:     'border border-border dark:border-border-dark',
  destructive: 'bg-red-100 dark:bg-red-900/30',
  positive:    'bg-green-100 dark:bg-green-900/30',
  warning:     'bg-amber-100 dark:bg-amber-900/30',
};

const textStyles: Record<Variant, string> = {
  default:     'text-accentFg dark:text-accentFg-dark',
  outline:     'text-foreground dark:text-foreground-dark',
  destructive: 'text-red-700 dark:text-red-400',
  positive:    'text-green-700 dark:text-green-400',
  warning:     'text-amber-700 dark:text-amber-400',
};

interface BadgeProps {
  label: string;
  variant?: Variant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View className={`rounded-lg px-2 py-0.5 self-start ${containerStyles[variant]}`}>
      <UIText size="xs" className={textStyles[variant]}>{label}</UIText>
    </View>
  );
}
