import { memo } from 'react';
import { View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { Transaction, TxType } from '@/types';
import { TX_ICONS } from '@/constants/icons';
import { fmt } from '@/utils/format';
import { useTheme } from '@/context/ThemeContext';
import { UIText } from './UIText';

type Props = Pick<
  Transaction,
  'merchant' | 'category' | 'txType' | 'amount' | 'time' | 'icon'
> & { isLast?: boolean };

function TransactionItem({ merchant, category, txType, amount, time, icon, isLast }: Props) {
  const { isDark } = useTheme();
  const Icon = TX_ICONS[icon] || ShoppingCart;
  const isIncome = txType === TxType.Income;
  const iconColor = isDark ? '#a1a1aa' : '#71717a';

  return (
    <View className={`flex-row items-center gap-3 py-3 ${isLast ? '' : 'border-b border-border dark:border-border-dark'}`}>
      <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
        <Icon size={16} color={iconColor} strokeWidth={1.8} />
      </View>

      <View className="flex-1">
        <UIText size="sm" variant="heading">{merchant}</UIText>
        <UIText size="xs" variant="muted" className="mt-0.5">{category}</UIText>
      </View>

      <View className="items-end">
        <UIText
          size="sm"
          className={`font-mono ${isIncome ? 'text-positive dark:text-positive-dark' : 'text-negative dark:text-negative-dark'}`}
        >
          {isIncome ? '+' : '−'}{fmt(amount)}
        </UIText>
        <UIText size="xs" variant="muted" className="mt-0.5">{time}</UIText>
      </View>
    </View>
  );
}

export default memo(TransactionItem);
