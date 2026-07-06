import { useCallback, useMemo, useState } from "react";
import { ScrollView, View, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useDisplayTransactions } from "@/hooks/useDisplayTransactions";
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
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const transactions = useDisplayTransactions();

  // Filter by search query first, then hand off to category filter hook
  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      tx =>
        tx.merchant.toLowerCase().includes(q) ||
        tx.categoryName.toLowerCase().includes(q),
    );
  }, [transactions, searchQuery]);

  const { filter, setFilter, groups } = useTransactionFilters(searchFiltered);
  const handleFilterChange = useCallback((f: FilterOption) => setFilter(f), [setFilter]);

  const iconColor   = isDark ? '#a1a1aa' : '#71717a';
  const inputText   = isDark ? '#fafafa' : '#09090b';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const accentFill  = isDark ? '#fafafa' : '#18181b';

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <UIText size="xl" variant="heading" className="mb-4">Transactions</UIText>

        {/* Search bar */}
        <Card className="py-2.5 flex-row items-center gap-2">
          <Search size={16} color={iconColor} />
          <TextInput
            style={{ flex: 1, color: inputText, fontSize: 15 }}
            placeholder="Search transactions..."
            placeholderTextColor={iconColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={15} color={iconColor} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
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
                  borderColor: isActive ? accentFill : borderColor,
                  backgroundColor: isActive ? accentFill : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <UIText
                  size="sm"
                  variant="unstyled"
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

        {/* Empty state */}
        {groups.length === 0 && (
          <View className="items-center py-12">
            <UIText size="sm" variant="muted">No transactions found</UIText>
          </View>
        )}

        {/* Grouped list */}
        <View className="gap-4">
          {groups.map((g) => (
            <View key={g.label}>
              <UIText size="xs" variant="label" className="py-2">{g.label}</UIText>
              <Card className="p-0 overflow-hidden">
                {g.txs.map((tx, i) => (
                  <View key={tx.id} className="px-4">
                    <TransactionItem
                      merchant={tx.merchant}
                      categoryName={tx.categoryName}
                      txType={tx.txType}
                      amount={tx.amount}
                      time={tx.time}
                      icon={tx.categoryIcon}
                      isLast={i === g.txs.length - 1}
                      onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: tx.id } })}
                    />
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
