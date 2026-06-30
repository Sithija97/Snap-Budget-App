import { useCallback } from "react";
import { ScrollView, View, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { MOCK_TRANSACTIONS } from "@/constants/mockData";
import {
  useTransactionFilters,
  FILTER_OPTIONS,
  FilterOption,
} from "@/hooks/useTransactionFilters";
import TransactionItem from "@/components/ui/TransactionItem";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/context/ThemeContext";

export default function TransactionsScreen() {
  const { filter, setFilter, groups } = useTransactionFilters(MOCK_TRANSACTIONS);
  const { isDark } = useTheme();

  const handleFilterChange = useCallback((f: FilterOption) => setFilter(f), [setFilter]);

  const iconColor  = isDark ? '#a1a1aa' : '#71717a';
  const inputText  = isDark ? '#fafafa' : '#09090b';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
      >
        {/* Header */}
        <UIText size="xl" variant="heading" className="mb-4">Transactions</UIText>

        {/* Search bar */}
        <Card className="py-2.5 flex-row items-center gap-2">
          <Search size={16} color={iconColor} />
          <TextInput
            style={{ flex: 1, color: inputText, fontSize: 15 }}
            placeholder="Search..."
            placeholderTextColor={iconColor}
          />
        </Card>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        >
          {FILTER_OPTIONS.map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => handleFilterChange(f)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isActive ? (isDark ? '#fafafa' : '#18181b') : borderColor,
                  backgroundColor: isActive ? (isDark ? '#fafafa' : '#18181b') : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <UIText
                  size="sm"
                  className={isActive
                    ? 'font-medium text-accentFg dark:text-accentFg-dark'
                    : 'text-mutedFg dark:text-mutedFg-dark'
                  }
                >
                  {f}
                </UIText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grouped list */}
        <View className="gap-4">
          {groups.map((g) => (
            <View key={g.label}>
              <UIText size="xs" variant="label" className="py-2">{g.label}</UIText>
              <Card className="p-0 overflow-hidden">
                {g.txs.map((tx) => (
                  <View key={tx.id} className="px-4">
                    <TransactionItem {...tx} />
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
