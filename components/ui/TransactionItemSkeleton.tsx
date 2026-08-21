import { View } from 'react-native';
import { Skeleton } from './Skeleton';
import { useThemeColors } from '@/context/ThemeContext';

interface Props {
  isFirst?: boolean;
  isLast?: boolean;
}

const ROW_RADIUS = 16;

// Mirrors TransactionItem's flat-row layout (icon square, two text lines,
// right-aligned amount + time) so the list doesn't jump when real rows
// replace it. Corner radius/background set via inline style, matching
// TransactionItem — see that component for why the className-based
// cardRowClassAt approach didn't reliably render on Android.
export function TransactionItemSkeleton({ isFirst = true, isLast = true }: Props) {
  const { card, border } = useThemeColors();

  return (
    <View
      className={`flex-row items-center gap-3 py-3 px-4 ${isLast ? '' : 'border-b'}`}
      style={{
        backgroundColor: card,
        borderColor: border,
        overflow: 'hidden',
        borderTopLeftRadius: isFirst ? ROW_RADIUS : 0,
        borderTopRightRadius: isFirst ? ROW_RADIUS : 0,
        borderBottomLeftRadius: isLast ? ROW_RADIUS : 0,
        borderBottomRightRadius: isLast ? ROW_RADIUS : 0,
      }}
    >
      <Skeleton width={36} height={36} className="rounded-lg" />

      <View className="flex-1">
        <Skeleton width={110} height={14} />
        <Skeleton width={70} height={11} className="mt-1.5" />
      </View>

      <View className="items-end">
        <Skeleton width={64} height={14} />
        <Skeleton width={40} height={11} className="mt-1.5" />
      </View>
    </View>
  );
}
