import { UIText } from './UIText';
import { useTheme, useThemeColors } from '@/context/ThemeContext';
import { brandBlue } from '@/constants/colors';
import { AnimatedPressable } from './AnimatedPressable';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive';

const base = 'h-11 rounded-lg px-4 items-center justify-center flex-row gap-2';

const containerStyles: Record<Variant, string> = {
  default:     base,
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
  const { foreground } = useThemeColors();

  const textColor = (() => {
    switch (variant) {
      case 'default':     return '#ffffff';
      case 'destructive': return '#ffffff';
      case 'outline':
      case 'ghost':       return foreground;
    }
  })();

  // default (primary) is the app's single brand blue in both themes,
  // matching Chip's selected-pill fill — set via style since it's not one
  // of the paired DEFAULT/dark tailwind tokens (see constants/colors.ts).
  const containerBg = variant === 'default' ? { backgroundColor: brandBlue(isDark) } : undefined;

  return (
    <AnimatedPressable
      // Caller-supplied className (e.g. "flex-1", "w-full", "mt-4") is a
      // sizing/spacing concern for the button as a whole, so it goes on the
      // outer wrapper — passing it to the inner content box instead would
      // silently no-op flex-sizing classes, since that box isn't the flex
      // child its sibling elements actually lay out against.
      wrapperClassName={className}
      className={`${containerStyles[variant]} ${disabled ? 'opacity-50' : ''}`}
      contentStyle={containerBg}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
      <UIText size="sm" variant="unstyled" className="font-medium" style={{ color: textColor }}>
        {label}
      </UIText>
    </AnimatedPressable>
  );
}
