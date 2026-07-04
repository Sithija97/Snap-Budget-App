import { useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCategoryStore } from "@/store/useCategoryStore";
import { CategoryType } from "@/types";
import { TX_ICONS } from "@/constants/icons";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";

const TYPES: { key: CategoryType; label: string }[] = [
  { key: "expense", label: "Expense" },
  { key: "income",  label: "Income" },
];

export default function CategoriesScreen() {
  const { isDark } = useTheme();
  const categories = useCategoryStore((s) => s.categories);
  const [type, setType] = useState<CategoryType>("expense");

  const iconColor = isDark ? "#a1a1aa" : "#71717a";

  const filtered = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center rounded-lg border border-border dark:border-border-dark mr-3"
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={iconColor} />
          </TouchableOpacity>
          <UIText size="base" variant="heading" className="flex-1 text-center">Categories</UIText>
          <View className="flex-row gap-4">
            {TYPES.map((t) => (
              <TouchableOpacity key={t.key} onPress={() => setType(t.key)} activeOpacity={0.7}>
                <UIText
                  size="sm"
                  className={type === t.key
                    ? "font-medium underline text-foreground dark:text-foreground-dark"
                    : "text-mutedFg dark:text-mutedFg-dark"
                  }
                >
                  {t.label}
                </UIText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* New category action */}
        <TouchableOpacity
          onPress={() => router.push(`/category-form?type=${type}`)}
          activeOpacity={0.7}
        >
          <Card className="mx-4 flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
              <Plus size={16} color={iconColor} strokeWidth={1.8} />
            </View>
            <UIText size="sm" variant="heading">New category</UIText>
          </Card>
        </TouchableOpacity>

        {filtered.length === 0 ? (
          <View className="items-center py-12">
            <UIText size="sm" variant="muted">No {type} categories yet</UIText>
          </View>
        ) : (
          <Card className="mx-4 mt-3 p-0 overflow-hidden">
            {filtered.map((c, i) => {
              const Icon = TX_ICONS[c.icon];
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => router.push(`/category-form?id=${c.id}`)}
                  activeOpacity={0.7}
                >
                  <View
                    className={`flex-row items-center gap-3 px-4 py-3 ${
                      i === filtered.length - 1 ? "" : "border-b border-border dark:border-border-dark"
                    }`}
                  >
                    <View className="w-9 h-9 rounded-lg items-center justify-center bg-muted dark:bg-muted-dark">
                      {Icon && <Icon size={16} color={iconColor} strokeWidth={1.8} />}
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
                </TouchableOpacity>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
