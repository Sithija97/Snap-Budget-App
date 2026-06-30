import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
