import { ViewStyle, StyleProp } from 'react-native';
import { UIText } from './UIText';
import { useTheme } from '@/context/ThemeContext';
import { brandBlue } from '@/constants/colors';
import { AnimatedPressable } from './AnimatedPressable';

type Variant = 'pill' | 'underline';
type Size = 'xs' | 'sm' | 'base';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: Variant;
  /** Pill only. Deprecated no-op — pills are borderless app-wide now (matches Card's borderless-by-default surface design); kept only so existing call sites with bordered={false} (e.g. a segmented-control track) don't need updating. */
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

  // Pill selected fill: brand blue in both themes — dark mode uses a
  // lightened variant (brandBlue's dark branch) tuned to read clearly
  // against dark surfaces, replacing the earlier white-fill fallback so
  // selection state carries the same brand color app-wide.
  const accentFill   = brandBlue(isDark);
  const accentText   = '#ffffff';
  const mutedText    = isDark ? '#a1a1aa' : '#71717a';
  const foreground    = isDark ? '#fafafa' : '#09090b';
  // Pill unselected surface: an explicit white card-like surface in light
  // mode (previously transparent, which read as borderless/washed-out
  // against the page background) — dark mode is unaffected (card is already
  // near-black, indistinguishable from transparent). Only for `bordered`
  // pills (standalone filter/picker chips) — a `bordered={false}` chip lives
  // inside its own track (e.g. Settings' theme segmented control), where an
  // opaque unselected fill would flatten the track/selected-segment contrast
  // the segmented-control pattern depends on.
  const unselectedFill = !bordered ? 'transparent' : isDark ? 'transparent' : '#ffffff';

  // Borderless by design (matches Card) — separation comes from the
  // fill/page-background contrast, not an outline.
  const containerStyle: ViewStyle =
    variant === 'pill'
      ? {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          backgroundColor: selected ? accentFill : unselectedFill,
        }
      : {};

  const textColor = variant === 'pill' ? (selected ? accentText : mutedText) : selected ? foreground : mutedText;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      contentStyle={containerStyle}
      style={style}
    >
      <UIText
        size={size}
        variant="unstyled"
        className={selected ? (variant === 'underline' ? 'font-medium underline' : 'font-medium') : undefined}
        style={{ color: textColor }}
      >
        {label}
      </UIText>
    </AnimatedPressable>
  );
}
