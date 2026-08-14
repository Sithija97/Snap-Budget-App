import { Text, TextProps } from 'react-native';

type Variant = 'default' | 'muted' | 'heading' | 'strong' | 'label' | 'mono' | 'unstyled';
type Size = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';

const variants: Record<Variant, string> = {
  default:  'text-foreground dark:text-foreground-dark font-sans',
  muted:    'text-mutedFg dark:text-mutedFg-dark font-sans',
  heading:  'text-foreground dark:text-foreground-dark font-medium',
  // For content that needs to outrank a heading — hero amounts, gauge totals,
  // the one number on a screen the eye should land on first.
  strong:   'text-foreground dark:text-foreground-dark font-semibold',
  label:    'text-mutedFg dark:text-mutedFg-dark uppercase tracking-widest font-medium',
  mono:     'text-foreground dark:text-foreground-dark font-mono',
  // No text-color class — for callers that need to fully control color via `style`
  // (e.g. Button, which computes a per-variant contrasting color against its own background).
  unstyled: 'font-sans',
};

const sizes: Record<Size, string> = {
  xs:   'text-[11px]',
  sm:   'text-[13px]',
  base: 'text-[15px]',
  lg:   'text-lg',
  xl:   'text-xl',
  '2xl':'text-[28px]',
  // Display size for the single hero currency figure on a screen (Home's
  // "Total spent", Budget's "This month" total) — the 2xl step below it stays
  // the ceiling for everything else, so this is used sparingly by design.
  '3xl':'text-[36px]',
};

interface UITextProps extends TextProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function UIText({ variant = 'default', size = 'base', className = '', style, ...props }: UITextProps) {
  return (
    <Text
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      style={style}
      {...props}
    />
  );
}
