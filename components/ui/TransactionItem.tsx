import { memo } from 'react';
import { View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { TxType } from '@/types';
import { TX_ICONS } from '@/constants/icons';
import { fmt } from '@/utils/format';
import { useThemeColors } from '@/context/ThemeContext';
import { UIText } from './UIText';
import { Card } from './Card';

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
}

// Each row is its own Card (not a shared list card divided by separators) —
// gives every transaction the same raised-surface treatment as the rest of
// the app's cards.
function TransactionItem({ merchant, categoryName, txType, amount, time, icon, onPress, subtitle }: Props) {
  const { mutedFg: iconColor } = useThemeColors();
  const Icon = TX_ICONS[icon] || ShoppingCart;
  const isIncome = txType === TxType.Income;

  return (
    <Card className="flex-row items-center gap-3" onPress={onPress}>
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
    </Card>
  );
}

export default memo(TransactionItem);
