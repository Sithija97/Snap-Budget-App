import { View, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useWalletStore } from "@/store/useWalletStore";
import { fmt } from "@/utils/format";
import { cardRowClass } from "@/utils/cardRow";
import { UIText } from "@/components/ui/UIText";
import { DataState } from "@/components/ui/DataState";
import { useRefresh } from "@/hooks/useRefresh";
import type { Wallet } from "@/types";

export default function WalletsScreen() {
  const { isDark } = useTheme();
  const wallets = useWalletStore((s) => s.wallets);
  const status = useWalletStore((s) => s.status);
  const fetchAll = useWalletStore((s) => s.fetchAll);
  const { refreshing, onRefresh } = useRefresh(fetchAll);

  const iconColor = isDark ? "#a1a1aa" : "#71717a";

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <FlatList
        data={wallets}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="flex-row items-center px-4 pt-3 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-9 h-9 items-center justify-center rounded-lg border border-border dark:border-border-dark mr-3"
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={iconColor} />
            </TouchableOpacity>
            <UIText size="base" variant="heading" className="flex-1 text-center">Wallets</UIText>
            <TouchableOpacity
              onPress={() => router.push("/wallet-form")}
              className="w-9 h-9 items-center justify-center rounded-lg border border-border dark:border-border-dark"
              activeOpacity={0.7}
            >
              <Plus size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <DataState status={status} isEmpty={wallets.length === 0} onRetry={fetchAll} emptyMessage="No wallets yet" />
        }
        renderItem={({ item: w, index }: { item: Wallet; index: number }) => (
          <TouchableOpacity onPress={() => router.push(`/wallet-form?id=${w.id}`)} activeOpacity={0.7}>
            <View
              className={`flex-row items-center gap-3 py-3 mx-4 ${cardRowClass(index, wallets.length)} ${
                index === wallets.length - 1 ? "" : "border-b"
              }`}
            >
              <View className="flex-1">
                <UIText size="sm" variant="heading">{w.name}</UIText>
                {w.balance === null ? (
                  <UIText size="xs" variant="muted" className="mt-0.5">Balance not set</UIText>
                ) : (
                  <UIText size="xs" variant="muted" className="mt-0.5 font-mono">{fmt(w.balance)}</UIText>
                )}
              </View>
              <ChevronRight size={16} color={iconColor} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
