import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TrendingDown, Target, Wallet, LogOut } from "lucide-react-native";
import {
  MOCK_USER,
  MOCK_TRANSACTIONS,
  TOTAL_SPENT,
  REMAINING,
} from "../../constants/mockData";
import StatChip from "../../components/ui/StatChip";
import TransactionItem from "../../components/ui/TransactionItem";

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const recentFour = MOCK_TRANSACTIONS.slice(0, 4);
  const initials = MOCK_USER.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Greeting + Avatar */}
        <View className="flex-row items-center justify-between mx-4 mt-4 mb-3">
          <View>
            <Text className="text-brand-muted text-xs">Good morning,</Text>
            <Text className="text-slate-900 text-lg font-semibold">
              {MOCK_USER.name} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            className="w-10 h-10 rounded-full bg-brand-green items-center justify-center"
          >
            <Text className="text-white text-sm font-bold">{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Debit card header */}
        <View className="mx-4 mt-0 rounded-3xl overflow-hidden bg-brand-black">
          {/* Background glow circles */}
          <View className="absolute -top-[55px] -right-[55px] w-[210px] h-[210px] rounded-[105px] bg-brand-green opacity-[0.13]" />
          <View className="absolute -bottom-[70px] right-[5px] w-[250px] h-[250px] rounded-[125px] bg-brand-green opacity-[0.07]" />

          <View className="p-5">
            {/* Row 1: chip + logo */}
            <View className="flex-row items-center justify-between">
              {/* EMV chip */}
              <View className="w-[38px] h-[28px] rounded bg-[#B8892A] overflow-hidden">
                <View className="absolute h-px left-0 right-0 top-[9px] bg-black/30" />
                <View className="absolute h-px left-0 right-0 bottom-[9px] bg-black/30" />
                <View className="absolute w-px top-0 bottom-0 left-[13px] bg-black/25" />
                <View className="absolute w-px top-0 bottom-0 right-[13px] bg-black/25" />
              </View>

              {/* Logo area */}
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-[13px] font-medium opacity-[0.55] tracking-[0.5px]">
                  SnapBudget
                </Text>
                <View className="flex-row">
                  <View className="w-[22px] h-[22px] rounded-[11px] bg-brand-red opacity-[0.85]" />
                  <View className="w-[22px] h-[22px] rounded-[11px] bg-brand-amber opacity-[0.85] -ml-2" />
                </View>
              </View>
            </View>

            {/* Card number */}
            {/* <View className="flex-row items-center gap-3 mt-5">
              {["••••", "••••", "••••", "4821"].map((group, i) => (
                <Text
                  key={i}
                  className="text-white font-mono tracking-[2px] text-sm opacity-[0.45]"
                >
                  {group}
                </Text>
              ))}
            </View> */}

            {/* Amount */}
            <Text className="text-white font-mono text-[34px] font-semibold mt-4">
              Rs {TOTAL_SPENT.toLocaleString()}
            </Text>
            <Text className="text-brand-muted text-[11px] mt-0.5">
              spent this month
            </Text>

            {/* Trend badges */}
            <View className="flex-row gap-2 mt-3">
              <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1 bg-[rgba(226,75,74,0.15)]">
                <TrendingDown size={11} color="#E24B4A" />
                <Text className="text-brand-red text-[11px]">
                  12% vs last month
                </Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1 bg-[rgba(29,158,117,0.15)]">
                <Target size={11} color="#1D9E75" />
                <Text className="text-brand-green text-[11px]">
                  Rs {REMAINING.toLocaleString()} left
                </Text>
              </View>
            </View>

            {/* Bottom row: holder + period */}
            <View className="flex-row items-end justify-between mt-5">
              <View>
                <Text className="text-[#475569] text-[9px] tracking-[1px] uppercase">
                  Card Holder
                </Text>
                <Text className="text-white text-[13px] font-medium mt-[3px] tracking-[0.5px] uppercase">
                  {MOCK_USER.name}
                </Text>
              </View>
              <View>
                <Text className="text-[#475569] text-[9px] tracking-[1px] uppercase">
                  Period
                </Text>
                <Text className="text-white text-[13px] font-medium mt-[3px]">
                  05 / 2026
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stat chips grid */}
        <View className="flex-row gap-2 mx-4 mt-4">
          <StatChip
            label="Income"
            value="Rs 50k"
            sub="this month"
            trend="up"
            Icon={Wallet}
          />
          <StatChip
            label="Saved"
            value={`Rs ${REMAINING.toLocaleString()}`}
            sub="14.3% of income"
            valueColor="#1D9E75"
            trend="up"
            Icon={Target}
          />
        </View>

        {/* Recent transactions */}
        <View className="mx-4 mt-4 pb-6">
          <View className="flex-row items-center justify-between mb-3 mt-0.5">
            <Text className="text-brand-muted text-[11px] font-medium uppercase tracking-widest">
              Recent transactions
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/transactions")}
            >
              <Text className="text-brand-green text-xs font-medium">
                See all
              </Text>
            </TouchableOpacity>
          </View>
          <View className="gap-2">
            {recentFour.map((tx) => (
              <View key={tx.id} className="bg-white rounded-2xl px-3">
                <TransactionItem {...tx} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* User menu modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <View
            className="absolute right-4 bg-white rounded-2xl p-4"
            style={{ top: 60, width: 200 }}
          >
            {/* User info */}
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-10 h-10 rounded-full bg-brand-green items-center justify-center">
                <Text className="text-white font-bold text-sm">{initials}</Text>
              </View>
              <View>
                <Text className="text-slate-900 font-semibold text-sm">
                  {MOCK_USER.name}
                </Text>
                <Text className="text-brand-muted text-xs">
                  Personal account
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-brand-border mb-3" />

            {/* Sign out */}
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => {
                setMenuOpen(false);
                router.replace("/login");
              }}
            >
              <LogOut size={16} color="#E24B4A" />
              <Text className="text-brand-red font-medium text-sm">
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
