import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { MOCK_TRANSACTIONS } from "../../constants/mockData";
import { Transaction } from "../../types";
import SectionTitle from "../../components/ui/SectionTitle";
import TransactionItem from "../../components/ui/TransactionItem";

const FILTERS = ["All", "Food", "Transport", "Bills", "Shopping"];

function groupByDate(transactions: Transaction[]) {
  const today = "2026-05-22";
  const yesterday = "2026-05-21";

  const groups: { title: string; data: Transaction[] }[] = [];
  const dateMap: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    if (!dateMap[tx.date]) dateMap[tx.date] = [];
    dateMap[tx.date].push(tx);
  });

  Object.keys(dateMap)
    .sort((a, b) => b.localeCompare(a))
    .forEach((date) => {
      let title = date;
      if (date === today) title = "Today";
      else if (date === yesterday) title = "Yesterday";
      else {
        const d = new Date(date);
        title = d.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        });
      }
      groups.push({ title, data: dateMap[date] });
    });

  return groups;
}

export default function TransactionsScreen() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered =
    activeFilter === "All"
      ? MOCK_TRANSACTIONS
      : MOCK_TRANSACTIONS.filter((tx) =>
          tx.category.toLowerCase().includes(activeFilter.toLowerCase()),
        );

  const sections = groupByDate(filtered);

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-medium text-slate-900">Transactions</Text>

        {/* Search bar */}
        <View className="flex-row items-center bg-white rounded-xl px-3 h-10 mt-3 gap-2">
          <Search size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-xs text-slate-900"
            placeholder="Search transactions…"
            placeholderTextColor="#CBD5E1"
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-2 ${activeFilter === f ? "bg-brand-black" : "bg-white"}`}
            >
              <Text
                className={`text-sm ${activeFilter === f ? "text-white" : "text-brand-muted"}`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderSectionHeader={({ section }) => (
          <SectionTitle title={section.title} />
        )}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl px-3 mb-2">
            <TransactionItem {...item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
