import { memo } from 'react';
import { View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { TxType } from '@/types';
import { TX_ICONS } from '@/constants/icons';
import { fmt } from '@/utils/format';
import { useThemeColors } from '@/context/ThemeContext';
import { UIText } from './UIText';
import { AnimatedPressable } from './AnimatedPressable';

const ROW_RADIUS = 16;

interface Props {
  merchant: string;
  categoryName: string;
  txType: TxType;
  amount: number;
  time: string;
  icon: string;
  onPress?: () => void;
  /** Replaces the category name on the second line when provided (e.g. Home shows the date) */
  subtitle?: string;
  /** Position within its group — rounds the top corners and omits the row divider. Defaults true so a lone/unlisted item (rare) still renders sensibly. */
  isFirst?: boolean;
  /** Position within its group — rounds the bottom corners and omits the row divider below it. Defaults true. */
  isLast?: boolean;
}

// Flat divided row, not a standalone Card per item — matches the list
// pattern Categories/Wallets already use. A Card-per-row here used to stack
// repeating shadow/radius on every transaction, which reads as a wall of
// identical boxes at real data volume; Card is now reserved for
// standalone/summary surfaces (hero card, gauge, recap cards).
//
// Corner radius/background are set via inline style (contentStyle), not
// className — className-based directional radius (rounded-t-2xl/
// rounded-b-2xl) combined with AnimatedPressable's Reanimated transform
// wasn't reliably clipping the row's background to the radius on Android;
// only the plain inline borderRadius/overflow style did.
function TransactionItem({ merchant, categoryName, txType, amount, time, icon, onPress, subtitle, isFirst = true, isLast = true }: Props) {
  const { mutedFg: iconColor, card, border } = useThemeColors();
  const Icon = TX_ICONS[icon] || ShoppingCart;
  const isIncome = txType === TxType.Income;

  return (
    <AnimatedPressable
      onPress={onPress}
      pressScale={0.98}
      className={`flex-row items-center gap-3 py-3 px-4 ${isLast ? '' : 'border-b'}`}
      contentStyle={{
        backgroundColor: card,
        borderColor: border,
        overflow: 'hidden',
        borderTopLeftRadius: isFirst ? ROW_RADIUS : 0,
        borderTopRightRadius: isFirst ? ROW_RADIUS : 0,
        borderBottomLeftRadius: isLast ? ROW_RADIUS : 0,
        borderBottomRightRadius: isLast ? ROW_RADIUS : 0,
      }}
    >
      <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
        <Icon size={16} color={iconColor} strokeWidth={1.8} />
      </View>

      <View className="flex-1">
        <UIText size="sm" variant="heading">{merchant}</UIText>
        <UIText size="xs" variant="muted" className="mt-0.5">{subtitle ?? categoryName}</UIText>
      </View>

      <View className="items-end">
        <UIText
          size="sm"
          variant="unstyled"
          className={`font-semibold ${isIncome ? 'text-positive dark:text-positive-dark' : 'text-negative dark:text-negative-dark'}`}
        >
          {isIncome ? '+' : '−'}{fmt(amount)}
        </UIText>
        <UIText size="xs" variant="muted" className="mt-0.5">{time}</UIText>
      </View>
    </AnimatedPressable>
  );
}

export default memo(TransactionItem);
