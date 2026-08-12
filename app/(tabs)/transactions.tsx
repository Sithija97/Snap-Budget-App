import { useCallback, useMemo, useState } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Search, X, Receipt } from "lucide-react-native";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useDisplayTransactions } from "@/hooks/useDisplayTransactions";
import {
  useTransactionFilters,
  FILTER_OPTIONS,
  FilterOption,
} from "@/hooks/useTransactionFilters";
import { TransactionGroup } from "@/utils/dates";
import { DisplayTransaction } from "@/hooks/useDisplayTransactions";
import { TxType } from "@/types";
import TransactionItem from "@/components/ui/TransactionItem";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { Skeleton } from "@/components/ui/Skeleton";
import { TransactionItemSkeleton } from "@/components/ui/TransactionItemSkeleton";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
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

  const renderGroup = useCallback(
    ({ item: g }: { item: TransactionGroup<DisplayTransaction> }) => {
      const net = g.txs.reduce((sum, tx) => sum + (tx.txType === TxType.Income ? tx.amount : -tx.amount), 0);
      return (
        <View className="mb-4">
          <View className="flex-row items-center justify-between py-2">
            <UIText size="xs" variant="label">{g.label}</UIText>
            <UIText
              size="xs"
              variant="unstyled"
              className={`font-mono ${net < 0 ? "text-negative dark:text-negative-dark" : "text-positive dark:text-positive-dark"}`}
            >
              {net < 0 ? "−" : "+"}{Math.abs(net).toLocaleString("en-US")}
            </UIText>
          </View>
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
      );
    },
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
            <View className="relative justify-center">
              <Search size={16} color={iconColor} style={{ position: "absolute", left: 12, zIndex: 1 }} />
              <Input
                style={{ paddingLeft: 36, paddingRight: searchQuery.length > 0 ? 36 : 12 }}
                placeholder="Search transactions..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <AnimatedPressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ position: "absolute", right: 12 }}
                >
                  <X size={15} color={iconColor} />
                </AnimatedPressable>
              )}
            </View>

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
          <DataState
            status={status}
            isEmpty={groups.length === 0}
            onRetry={fetchAll}
            emptyMessage={searchQuery.trim().length > 0 ? "No matching transactions" : "No transactions yet"}
            emptyIcon={Receipt}
            loadingSkeleton={
              // Mirrors a rendered group: date label, then a card of rows
              <View className="mb-4">
                <View className="py-2">
                  <Skeleton width={60} height={11} />
                </View>
                <Card className="p-0 px-4 overflow-hidden">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <TransactionItemSkeleton key={i} />
                  ))}
                </Card>
              </View>
            }
          />
        }
      />
    </SafeAreaView>
  );
}
