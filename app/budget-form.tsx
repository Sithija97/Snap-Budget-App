import { useState } from "react";
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Check, ChevronLeft } from "lucide-react-native";
import { useTheme, useThemeColors } from "@/context/ThemeContext";
import { useBudgetStore } from "@/store/useBudgetStore";
import { parseAmount } from "@/utils/format";
import { currentMonth } from "@/utils/dates";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

export default function BudgetFormScreen() {
  const { isDark } = useTheme();

  const budgets = useBudgetStore((s) => s.budgets);
  const addBudget = useBudgetStore((s) => s.addBudget);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);

  const month = currentMonth();
  // At most one budget per (user, month), enforced by the backend's unique
  // index — the screen determines edit-vs-create itself rather than taking
  // an id/categoryId param, since there's nothing else to disambiguate.
  const editing = budgets.find((b) => b.month === month);

  const [amount, setAmount] = useState(editing ? String(editing.limitAmount) : "");
  const [repeat, setRepeat] = useState(editing?.repeat ?? false);
  const [saving, setSaving] = useState(false);

  const { border: borderColor, mutedFg: iconColor } = useThemeColors();
  const accentFill = isDark ? "#fafafa" : "#18181b";

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const canSave = parseAmount(amount) > 0 && !saving;

  const handleSave = async () => {
    const limitAmount = parseAmount(amount);
    setSaving(true);
    try {
      if (editing) {
        await updateBudget(editing.id, { limitAmount, repeat });
      } else {
        await addBudget({ limitAmount, month, repeat });
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 44 : 0}
      >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <IconButton onPress={() => router.back()} className="mr-3" accessibilityLabel="Go back" accessibilityRole="button">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">
            {editing ? "Edit budget" : "New budget"}
          </UIText>
          <View className="w-9" />
        </View>

        {/* Amount — the one number that matters on this screen, given room
            to breathe on its own card rather than sharing one long stack
            with the period readout and the repeat toggle below it. */}
        <Card className="mx-4 mt-4 gap-3">
          <View className="flex-row items-center justify-between">
            <UIText size="xs" variant="label">Monthly limit</UIText>
            <UIText size="xs" variant="muted">{monthLabel}</UIText>
          </View>
          <Input
            placeholder="Rs 0"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
            keyboardType="numeric"
            returnKeyType="done"
            autoFocus
            style={{ fontSize: 24, height: 56 }}
          />
        </Card>

        {/* Repeat — its own card so the toggle reads as a distinct decision,
            not a trailing checkbox tacked onto the amount field. */}
        <Card className="mx-4 mt-3">
          <AnimatedPressable
            onPress={() => setRepeat(!repeat)}
            pressScale={0.98}
            className="flex-row items-center gap-3"
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: repeat ? accentFill : borderColor,
                backgroundColor: repeat ? accentFill : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {repeat && <Check size={15} color={isDark ? "#18181b" : "#ffffff"} strokeWidth={2.5} />}
            </View>
            <View className="flex-1">
              <UIText size="sm" variant="heading">Repeat monthly</UIText>
              <UIText size="xs" variant="muted" className="mt-0.5">Keep this limit as your default for future months</UIText>
            </View>
          </AnimatedPressable>
        </Card>

        <View className="mx-4 mt-4 gap-2">
          <Button
            label={saving ? "Saving..." : "Save Budget"}
            variant="default"
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
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
