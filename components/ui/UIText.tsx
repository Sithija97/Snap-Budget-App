import { Text, TextProps } from 'react-native';

type Variant = 'default' | 'muted' | 'heading' | 'label' | 'mono';
type Size = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

const variants: Record<Variant, string> = {
  default: 'text-foreground dark:text-foreground-dark font-sans',
  muted:   'text-mutedFg dark:text-mutedFg-dark font-sans',
  heading: 'text-foreground dark:text-foreground-dark font-medium',
  label:   'text-mutedFg dark:text-mutedFg-dark uppercase tracking-widest font-medium',
  mono:    'text-foreground dark:text-foreground-dark font-mono',
};

const sizes: Record<Size, string> = {
  xs:   'text-[11px]',
  sm:   'text-[13px]',
  base: 'text-[15px]',
  lg:   'text-lg',
  xl:   'text-xl',
  '2xl':'text-[28px]',
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
