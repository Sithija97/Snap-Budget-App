import { TouchableOpacity } from 'react-native';
import { UIText } from './UIText';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive';

const base = 'h-11 rounded-lg px-4 items-center justify-center flex-row gap-2';

const containerStyles: Record<Variant, string> = {
  default:     `${base} bg-accent dark:bg-accent-dark`,
  outline:     `${base} border border-border dark:border-border-dark`,
  ghost:       base,
  destructive: `${base} bg-destructive`,
};

const textStyles: Record<Variant, string> = {
  default:     'text-accentFg dark:text-accentFg-dark',
  outline:     'text-foreground dark:text-foreground-dark',
  ghost:       'text-foreground dark:text-foreground-dark',
  destructive: 'text-white',
};

interface ButtonProps {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function Button({ label, variant = 'default', onPress, icon, className = '' }: ButtonProps) {
  return (
    <TouchableOpacity
      className={`${containerStyles[variant]} ${className}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <UIText size="sm" className={`font-medium ${textStyles[variant]}`}>
        {label}
      </UIText>
    </TouchableOpacity>
  );
}
