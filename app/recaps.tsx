import { useEffect } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Bell, BellOff } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useRecapStore } from "@/store/useRecapStore";
import { useRefresh } from "@/hooks/useRefresh";
import { markRecapsSeen } from "@/hooks/useUnseenRecaps";
import { formatFullDate } from "@/utils/dates";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataState } from "@/components/ui/DataState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RecapsScreen() {
  const { isDark } = useTheme();
  const recaps = useRecapStore((s) => s.recaps);
  const status = useRecapStore((s) => s.status);
  const fetchAll = useRecapStore((s) => s.fetchAll);
  const { refreshing, onRefresh } = useRefresh(fetchAll);

  const iconColor = isDark ? "#a1a1aa" : "#71717a";

  useEffect(() => {
    if (status === "idle" && recaps.length === 0) fetchAll().catch(() => {});
    markRecapsSeen();
  }, []);

  const isFirstLoad = status === "loading" && recaps.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <View className="flex-row items-center px-4 pt-3 pb-4">
        <IconButton onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={20} color={iconColor} />
        </IconButton>
        <UIText size="base" variant="heading" className="flex-1 text-center">Recaps</UIText>
        <View className="w-9" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isFirstLoad || recaps.length === 0 ? (
          <DataState
            status={status}
            isEmpty={recaps.length === 0}
            onRetry={fetchAll}
            emptyMessage="No recaps yet — check back after your first weekly or monthly summary."
            emptyIcon={BellOff}
            loadingSkeleton={
              <View className="gap-3 mt-1">
                {[0, 1, 2].map((i) => (
                  <Card key={i} className="p-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Skeleton width={28} height={28} className="rounded-full" />
                        <Skeleton width={60} height={18} className="rounded-lg" />
                      </View>
                      <Skeleton width={90} height={12} />
                    </View>
                    <Skeleton width="90%" height={14} />
                    <Skeleton width="60%" height={14} className="mt-1.5" />
                  </Card>
                ))}
              </View>
            }
          />
        ) : (
          <View className="gap-3 mt-1">
            {recaps.map((recap) => (
              <Card key={recap.id} className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-7 h-7 rounded-full items-center justify-center bg-muted dark:bg-muted-dark">
                      <Bell size={13} color={iconColor} />
                    </View>
                    <Badge label={recap.periodType === "weekly" ? "Weekly" : "Monthly"} />
                  </View>
                  <UIText size="xs" variant="muted">
                    {formatFullDate(recap.periodStart)} – {formatFullDate(recap.periodEnd)}
                  </UIText>
                </View>
                <UIText size="sm" variant="default">{recap.message}</UIText>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
