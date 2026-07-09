import { useState } from "react";
import { View, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Check, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { parseAmount } from "@/utils/format";
import { currentMonth } from "@/utils/dates";
import { UIText } from "@/components/ui/UIText";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function BudgetFormScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams<{ id?: string; categoryId?: string }>();

  const budgets = useBudgetStore((s) => s.budgets);
  const addBudget = useBudgetStore((s) => s.addBudget);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const categories = useCategoryStore((s) => s.categories);

  const editing = budgets.find((b) => b.id === params.id);
  const month = editing?.month ?? currentMonth();

  const [categoryId, setCategoryId] = useState<string | null>(
    editing?.categoryId ?? params.categoryId ?? null
  );
  const [amount, setAmount] = useState(editing ? String(editing.limitAmount) : "");
  const [repeat, setRepeat] = useState(editing?.repeat ?? false);
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

  // Budgets are for expense categories only
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const canSave = categoryId !== null && parseAmount(amount) > 0 && !saving;

  const handleSave = async () => {
    if (!categoryId) return;
    const limitAmount = parseAmount(amount);
    setSaving(true);
    try {
      if (editing) {
        await updateBudget(editing.id, { categoryId, limitAmount, repeat });
      } else {
        await addBudget({ categoryId, limitAmount, month, repeat });
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save budget", e?.message ?? "Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert("Delete budget?", "This budget limit will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBudget(editing.id);
            router.back();
          } catch (e: any) {
            Alert.alert("Couldn't delete budget", e?.message ?? "Please try again.");
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
            {editing ? "Edit budget" : "New budget"}
          </UIText>
          <View className="w-9" />
        </View>

        <Card className="mx-4 mt-4 gap-3">
          <UIText size="xs" variant="label">Category</UIText>
          <View className="flex-row flex-wrap gap-2">
            {expenseCategories.map((c) => {
              const isActive = categoryId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isActive ? accentFill : borderColor,
                    backgroundColor: isActive ? accentFill : "transparent",
                  }}
                >
                  <UIText
                    size="sm"
                    className={isActive
                      ? "font-medium text-accentFg dark:text-accentFg-dark"
                      : "text-mutedFg dark:text-mutedFg-dark"
                    }
                  >
                    {c.name}
                  </UIText>
                </TouchableOpacity>
              );
            })}
          </View>

          <UIText size="xs" variant="label" className="mt-2">Monthly limit</UIText>
          <TextInput
            style={inputStyle}
            placeholder="Rs 0"
            placeholderTextColor={iconColor}
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
            keyboardType="numeric"
            returnKeyType="done"
          />

          <View className="flex-row items-center justify-between mt-2">
            <UIText size="xs" variant="label">Period</UIText>
            <UIText size="sm" variant="muted">{monthLabel}</UIText>
          </View>

          {/* Repeat checkbox */}
          <TouchableOpacity
            onPress={() => setRepeat(!repeat)}
            activeOpacity={0.7}
            className="flex-row items-center gap-3 mt-2"
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: repeat ? accentFill : borderColor,
                backgroundColor: repeat ? accentFill : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {repeat && <Check size={14} color={isDark ? "#18181b" : "#ffffff"} strokeWidth={2.5} />}
            </View>
            <UIText size="sm">Repeat this budget monthly</UIText>
          </TouchableOpacity>

          <Button
            label={saving ? "Saving..." : "Save Budget"}
            variant="default"
            className="mt-2"
            disabled={!canSave}
            onPress={handleSave}
          />

          {editing && (
            <Button
              label="Delete Budget"
              variant="destructive"
              onPress={handleDelete}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
