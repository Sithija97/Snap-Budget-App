import { useMemo, useState } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { useThemeColors } from "@/context/ThemeContext";
import { useCategoryStore } from "@/store/useCategoryStore";
import { CategoryType, Category } from "@/types";
import { TX_ICONS } from "@/constants/icons";
import { cardRowClass } from "@/utils/cardRow";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { Chip } from "@/components/ui/Chip";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { useRefresh } from "@/hooks/useRefresh";

const TYPES: { key: CategoryType; label: string }[] = [
  { key: "expense", label: "Expense" },
  { key: "income",  label: "Income" },
];

export default function CategoriesScreen() {
  const categories = useCategoryStore((s) => s.categories);
  const status = useCategoryStore((s) => s.status);
  const fetchAll = useCategoryStore((s) => s.fetchAll);
  const { refreshing, onRefresh } = useRefresh(fetchAll);
  const [type, setType] = useState<CategoryType>("expense");

  const { mutedFg: iconColor } = useThemeColors();

  const filtered = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <View className="flex-row items-center px-4 pt-3 pb-4">
              <IconButton onPress={() => router.back()} className="mr-3">
                <ChevronLeft size={20} color={iconColor} />
              </IconButton>
              <UIText size="base" variant="heading" className="flex-1 text-center">Categories</UIText>
              <View className="flex-row gap-4">
                {TYPES.map((t) => (
                  <Chip
                    key={t.key}
                    variant="underline"
                    label={t.label}
                    selected={type === t.key}
                    onPress={() => setType(t.key)}
                  />
                ))}
              </View>
            </View>

            <Card
              className="mx-4 mb-3 flex-row items-center gap-3"
              onPress={() => router.push(`/category-form?type=${type}`)}
            >
              <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
                <Plus size={16} color={iconColor} strokeWidth={1.8} />
              </View>
              <UIText size="sm" variant="heading">New category</UIText>
            </Card>
          </>
        }
        ListEmptyComponent={
          <DataState
            status={status}
            isEmpty={filtered.length === 0}
            onRetry={fetchAll}
            emptyMessage={`No ${type} categories yet`}
          />
        }
        renderItem={({ item: c, index }: { item: Category; index: number }) => (
          <AnimatedPressable onPress={() => router.push(`/category-form?id=${c.id}`)} pressScale={0.98}>
            <View
              className={`flex-row items-center gap-3 py-3 mx-4 ${cardRowClass(index, filtered.length)} ${
                index === filtered.length - 1 ? "" : "border-b"
              }`}
            >
              <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
                {TX_ICONS[c.icon] && (() => {
                  const Icon = TX_ICONS[c.icon];
                  return <Icon size={16} color={iconColor} strokeWidth={1.8} />;
                })()}
              </View>
              <View className="flex-1">
                <UIText size="sm" variant="heading">{c.name}</UIText>
                {c.parentId && (
                  <UIText size="xs" variant="muted" className="mt-0.5">
                    {categories.find((p) => p.id === c.parentId)?.name ?? "Subcategory"}
                  </UIText>
                )}
              </View>
              <ChevronRight size={16} color={iconColor} />
            </View>
          </AnimatedPressable>
        )}
      />
    </SafeAreaView>
  );
}
