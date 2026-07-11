import { TouchableOpacity } from 'react-native';
import { UIText } from './UIText';
import { useTheme } from '@/context/ThemeContext';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive';

const base = 'h-11 rounded-lg px-4 items-center justify-center flex-row gap-2';

const containerStyles: Record<Variant, string> = {
  default:     `${base} bg-accent dark:bg-accent-dark`,
  outline:     `${base} border border-border dark:border-border-dark`,
  ghost:       base,
  destructive: `${base} bg-destructive`,
};

interface ButtonProps {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Button({ label, variant = 'default', onPress, icon, className = '', disabled = false }: ButtonProps) {
  const { isDark } = useTheme();

  const textColor = (() => {
    switch (variant) {
      case 'default':     return isDark ? '#18181b' : '#ffffff';
      case 'destructive': return '#ffffff';
      case 'outline':
      case 'ghost':       return isDark ? '#fafafa' : '#09090b';
    }
  })();

  return (
    <TouchableOpacity
      className={`${containerStyles[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {icon}
      <UIText size="sm" variant="unstyled" style={{ fontWeight: '500', color: textColor }}>
        {label}
      </UIText>
    </TouchableOpacity>
  );
}
