import { TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { UIText } from './UIText';
import { useTheme } from '@/context/ThemeContext';

type Variant = 'pill' | 'underline';
type Size = 'xs' | 'sm' | 'base';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: Variant;
  /** Pill only. Set false for a chip living inside a shared track (e.g. a segmented control) that already draws its own border. */
  bordered?: boolean;
  size?: Size;
  disabled?: boolean;
  /** Layout-only overrides (flex, padding, margin) — color is always computed internally, never overridable, so this component can't reintroduce the dark:-className text-color bug it replaces. */
  style?: StyleProp<ViewStyle>;
}

// Single source of truth for "selectable chip/tab" styling across the app.
// Every one of these used to be hand-rolled per screen with a `dark:`
// Tailwind className for text color alongside a JS-computed background —
// two independent color sources that could (and did) fall out of sync,
// leaving text the same color as its own background. Colors here are 100%
// JS-driven from useTheme(), matching Button's existing convention, so
// there's no `dark:` variant in the loop to drift.
export function Chip({
  label,
  selected,
  onPress,
  variant = 'pill',
  bordered = true,
  size = 'sm',
  disabled = false,
  style,
}: ChipProps) {
  const { isDark } = useTheme();

  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const accentFill   = isDark ? '#fafafa' : '#18181b';
  const accentText   = isDark ? '#18181b' : '#fafafa';
  const mutedText    = isDark ? '#a1a1aa' : '#71717a';
  const foreground    = isDark ? '#fafafa' : '#09090b';

  const containerStyle: ViewStyle =
    variant === 'pill'
      ? {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          ...(bordered ? { borderWidth: 1, borderColor: selected ? accentFill : borderColor } : null),
          backgroundColor: selected ? accentFill : 'transparent',
        }
      : {};

  const textColor = variant === 'pill' ? (selected ? accentText : mutedText) : selected ? foreground : mutedText;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={[containerStyle, style]}
    >
      <UIText
        size={size}
        variant="unstyled"
        className={selected ? (variant === 'underline' ? 'font-medium underline' : 'font-medium') : undefined}
        style={{ color: textColor }}
      >
        {label}
      </UIText>
    </TouchableOpacity>
  );
}
