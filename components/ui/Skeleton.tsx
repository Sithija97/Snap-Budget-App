import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
}

// A neutral placeholder shape for numeric/text content that hasn't loaded
// yet — shown instead of real-looking-but-wrong values (e.g. "Rs 0" before
// the first fetch resolves), which reads as a bug even when it's "just"
// a loading state. Pair with a loading condition that only fires before the
// first successful fetch, not on every refresh (see callers).
export function Skeleton({ width = 60, height = 14, className = '' }: SkeletonProps) {
  const { isDark } = useTheme();
  return (
    <View
      className={`rounded ${className}`}
      style={{ width, height, backgroundColor: isDark ? '#27272a' : '#e4e4e7' }}
    />
  );
}
