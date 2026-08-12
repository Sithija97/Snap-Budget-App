import { memo } from 'react';
import { View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { TxType } from '@/types';
import { TX_ICONS } from '@/constants/icons';
import { fmt } from '@/utils/format';
import { useTheme } from '@/context/ThemeContext';
import { UIText } from './UIText';
import { AnimatedPressable } from './AnimatedPressable';

interface Props {
  merchant: string;
  categoryName: string;
  txType: TxType;
  amount: number;
  time: string;
  icon: string;
  isLast?: boolean;
  onPress?: () => void;
  /** Replaces the category name on the second line when provided (e.g. Home shows the date) */
  subtitle?: string;
  /** Set false to drop the border between rows (still never drawn on the last row) */
  separator?: boolean;
}

function TransactionItem({ merchant, categoryName, txType, amount, time, icon, isLast, onPress, subtitle, separator = true }: Props) {
  const { isDark } = useTheme();
  const Icon = TX_ICONS[icon] || ShoppingCart;
  const isIncome = txType === TxType.Income;
  const iconColor = isDark ? '#a1a1aa' : '#71717a';

  return (
    <AnimatedPressable onPress={onPress} disabled={!onPress} pressScale={0.98}>
      <View className={`flex-row items-center gap-3 py-3 ${isLast || !separator ? '' : 'border-b border-border dark:border-border-dark'}`}>
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
            className={`font-mono ${isIncome ? 'text-positive dark:text-positive-dark' : 'text-negative dark:text-negative-dark'}`}
          >
            {isIncome ? '+' : '−'}{fmt(amount)}
          </UIText>
          <UIText size="xs" variant="muted" className="mt-0.5">{time}</UIText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default memo(TransactionItem);
