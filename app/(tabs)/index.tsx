import { memo, useCallback, useMemo, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  MOCK_TRANSACTIONS,
  MOCK_USER,
  TOTAL_SPENT,
  REMAINING,
  TOTAL_INCOME,
} from "@/constants/mockData";
import { Colors } from "@/constants/theme";
import { fmt } from "@/utils/format";
import TransactionItem from "@/components/ui/TransactionItem";
import SummaryCards from "@/components/ui/SummaryCards";
import ProfileModal from "@/components/home/ProfileModal";

const RECENT_COUNT = 5;

const StatChip = memo(function StatChip({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
      style={{ backgroundColor: bg }}
    >
      <Text className="text-[11px] font-mono" style={{ color }}>
        {label}
      </Text>
    </View>
  );
});

export default function HomeScreen() {
  const [showProfile, setShowProfile] = useState(false);

  const recentTransactions = useMemo(
    () => MOCK_TRANSACTIONS.slice(0, RECENT_COUNT),
    [],
  );

  const openProfile  = useCallback(() => setShowProfile(true), []);
  const closeProfile = useCallback(() => setShowProfile(false), []);

  return (
    <SafeAreaView className="flex-1 bg-brand-black" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-brand-surface">

        {/* ── Wallet card ── */}
        <View className="bg-brand-black px-5 pt-4 pb-[34px] rounded-b-[32px] mb-4">
          <View className="flex-row justify-between items-center mb-[18px]">
            <View>
              <Text className="text-[11px] text-white/50 mb-0.5">
                Good morning, {MOCK_USER.name}
              </Text>
              <Text className="text-[15px] font-semibold text-white">May 2026</Text>
            </View>

            <TouchableOpacity
              onPress={openProfile}
              activeOpacity={0.85}
              className="w-[38px] h-[38px] rounded-full bg-brand-green items-center justify-center"
            >
              <Text className="text-[15px] font-bold text-white">
                {MOCK_USER.name.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            className="text-[38px] font-bold text-white font-mono mb-1"
            style={{ letterSpacing: -1 }}
          >
            {fmt(TOTAL_SPENT)}
          </Text>
          <Text className="text-[12px] text-white/45 mb-[18px]">spent this month</Text>

          <View className="flex-row gap-2.5">
            <StatChip
              label="+12% vs last month"
              color={Colors.red}
              bg="rgba(226,75,74,0.15)"
            />
            <StatChip
              label={`${fmt(REMAINING)} left`}
              color={Colors.green}
              bg="rgba(29,158,117,0.18)"
            />
          </View>
        </View>

        {/* ── Income / Expense summary ── */}
        <View className="mx-[14px] mt-3 mb-4">
          <SummaryCards income={TOTAL_INCOME} spent={TOTAL_SPENT} showSubText />
        </View>

        {/* ── Recent transactions ── */}
        <View className="mx-[14px] mt-2 mb-6 bg-brand-card rounded-[20px] overflow-hidden">
          <View className="flex-row justify-between items-center px-4 pt-[10px] pb-[6px]">
            <Text className="text-[14px] font-semibold text-brand-black">Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text className="text-[12px] text-brand-green font-semibold">See all →</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((tx) => (
            <TransactionItem key={tx.id} {...tx} />
          ))}
        </View>
      </ScrollView>

      <ProfileModal
        visible={showProfile}
        name={MOCK_USER.name}
        email="kasun@example.com"
        onClose={closeProfile}
      />
    </SafeAreaView>
  );
}
