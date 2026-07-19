import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  bordered?: boolean;
}

export function Card({ children, className = '', bordered = false, ...props }: CardProps) {
  // Borderless by default: cards read as surfaces via the card/background
  // token contrast (see tailwind.config.js). `bordered` remains for the rare
  // case that needs an explicit outline.
  const frame = bordered
    ? 'bg-card dark:bg-card-dark border border-border dark:border-border-dark'
    : 'bg-card dark:bg-card-dark';
  return (
    <View
      className={`${frame} rounded-2xl p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
