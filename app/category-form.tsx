import { useState } from "react";
import { View, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCategoryStore } from "@/store/useCategoryStore";
import { CategoryType } from "@/types";
import { TX_ICONS } from "@/constants/icons";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

const ICON_KEYS = Object.keys(TX_ICONS);

export default function CategoryFormScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams<{ id?: string; type?: string }>();

  const categories = useCategoryStore((s) => s.categories);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);
  const categoryHasTransactions = useCategoryStore((s) => s.categoryHasTransactions);

  const editing = categories.find((c) => c.id === params.id);

  // Type is locked: to the existing value when editing, to the originating tab when creating
  const type: CategoryType =
    editing?.type ?? (params.type === "income" ? "income" : "expense");

  const [name, setName] = useState(editing?.name ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? ICON_KEYS[0]);
  const [parentId, setParentId] = useState<string | null>(editing?.parentId ?? null);
  const [saving, setSaving] = useState(false);

  const borderColor = isDark ? "#27272a" : "#e4e4e7";
  const iconColor   = isDark ? "#a1a1aa" : "#71717a";
  const inputText   = isDark ? "#fafafa" : "#09090b";
  const inputBg     = isDark ? "#09090b" : "#ffffff";
  const accentFill  = isDark ? "#fafafa" : "#18181b";

  const inputStyle = {
    height: 44,
    borderWidth: 1,
    borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: inputBg,
    color: inputText,
    fontSize: 15,
  } as const;

  // Same-type, top-level categories only — a subcategory can't be a parent
  const parentOptions = categories.filter(
    (c) => c.type === type && c.parentId === null && c.id !== editing?.id
  );

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), icon, parentId });
      } else {
        await addCategory({ name: name.trim(), type, icon, parentId });
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save category", e?.message ?? "Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    if (categoryHasTransactions(editing.id)) {
      Alert.alert(
        "Can't delete category",
        "Transactions still use this category. Reassign or delete them first."
      );
      return;
    }
    Alert.alert("Delete category?", `"${editing.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCategory(editing.id);
            router.back();
          } catch (e: any) {
            Alert.alert("Couldn't delete category", e?.message ?? "Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
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
          <UIText size="base" variant="heading" className="flex-1 text-center">
            {editing ? "Edit category" : "New category"}
          </UIText>
          <View className="w-9" />
        </View>

        <Card className="mx-4 mt-4 gap-3">
          <View className="flex-row items-center justify-between">
            <UIText size="xs" variant="label">Type</UIText>
            <Badge label={type === "expense" ? "Expense" : "Income"} variant="outline" />
          </View>

          <UIText size="xs" variant="label" className="mt-2">Name</UIText>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Groceries"
            placeholderTextColor={iconColor}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <UIText size="xs" variant="label" className="mt-2">Icon</UIText>
          <View className="flex-row flex-wrap gap-2">
            {ICON_KEYS.map((key) => {
              const Icon = TX_ICONS[key];
              const isActive = icon === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setIcon(key)}
                  activeOpacity={0.7}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: isActive ? accentFill : borderColor,
                  }}
                >
                  <Icon size={16} color={isActive ? accentFill : iconColor} strokeWidth={1.8} />
                </TouchableOpacity>
              );
            })}
          </View>

          <UIText size="xs" variant="label" className="mt-2">Parent category (optional)</UIText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {[null, ...parentOptions.map((p) => p.id)].map((pid) => {
              const label = pid === null
                ? "None"
                : parentOptions.find((p) => p.id === pid)?.name ?? "";
              return (
                <Chip
                  key={pid ?? "none"}
                  label={label}
                  selected={parentId === pid}
                  onPress={() => setParentId(pid)}
                />
              );
            })}
          </ScrollView>

          <Button
            label={saving ? "Saving..." : "Save Category"}
            variant="default"
            className="mt-2"
            disabled={!canSave}
            onPress={handleSave}
          />

          {editing && !editing.isDefault && (
            <Button
              label="Delete Category"
              variant="destructive"
              onPress={handleDelete}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
