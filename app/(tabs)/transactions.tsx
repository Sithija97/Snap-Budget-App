import { useCallback, useMemo, useState } from "react";
import { View, TextInput, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useDisplayTransactions } from "@/hooks/useDisplayTransactions";
import {
  useTransactionFilters,
  FILTER_OPTIONS,
  FilterOption,
} from "@/hooks/useTransactionFilters";
import { TransactionGroup } from "@/utils/dates";
import { DisplayTransaction } from "@/hooks/useDisplayTransactions";
import TransactionItem from "@/components/ui/TransactionItem";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { Chip } from "@/components/ui/Chip";
import { useTheme } from "@/context/ThemeContext";
import { useRefresh } from "@/hooks/useRefresh";

export default function TransactionsScreen() {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const transactions = useDisplayTransactions();
  const status = useTransactionStore((s) => s.status);
  const fetchAll = useTransactionStore((s) => s.fetchAll);
  const { refreshing, onRefresh } = useRefresh(fetchAll);

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

  const renderGroup = useCallback(
    ({ item: g }: { item: TransactionGroup<DisplayTransaction> }) => (
      <View className="mb-4">
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
    ),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.label}
        renderItem={renderGroup}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
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
            <FlatList
              horizontal
              data={FILTER_OPTIONS}
              keyExtractor={(f) => f}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: f }) => (
                <Chip label={f} selected={filter === f} onPress={() => handleFilterChange(f)} />
              )}
            />
          </>
        }
        ListEmptyComponent={
          <DataState status={status} isEmpty={groups.length === 0} onRetry={fetchAll} emptyMessage="No transactions found" />
        }
      />
    </SafeAreaView>
  );
}
