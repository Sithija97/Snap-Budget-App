import { View } from 'react-native';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

// Mirrors TransactionItem's layout (icon square, two text lines, right-aligned
// amount + time) so the list doesn't jump when real rows replace it.
export function TransactionItemSkeleton() {
  return (
    <Card className="flex-row items-center gap-3">
      <Skeleton width={36} height={36} className="rounded-lg" />

      <View className="flex-1">
        <Skeleton width={110} height={14} />
        <Skeleton width={70} height={11} className="mt-1.5" />
      </View>

      <View className="items-end">
        <Skeleton width={64} height={14} />
        <Skeleton width={40} height={11} className="mt-1.5" />
      </View>
    </Card>
  );
}
