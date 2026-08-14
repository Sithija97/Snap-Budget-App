import { View } from 'react-native';
import { UIText } from './UIText';

type Variant = 'default' | 'outline' | 'destructive' | 'positive' | 'warning';

const containerStyles: Record<Variant, string> = {
  default:     'bg-accent dark:bg-accent-dark',
  outline:     'border border-border dark:border-border-dark',
  destructive: 'bg-negative/10 dark:bg-negative-dark/10',
  positive:    'bg-positive/10 dark:bg-positive-dark/10',
  warning:     'bg-warning/10 dark:bg-warning-dark/10',
};

const textStyles: Record<Variant, string> = {
  default:     'text-accentFg dark:text-accentFg-dark',
  outline:     'text-foreground dark:text-foreground-dark',
  destructive: 'text-negative dark:text-negative-dark',
  positive:    'text-positive dark:text-positive-dark',
  warning:     'text-warning dark:text-warning-dark',
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
