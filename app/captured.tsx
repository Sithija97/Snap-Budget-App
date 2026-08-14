import { useMemo } from "react";
import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Inbox, Sparkles, Cpu } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCaptureStore } from "@/store/useCaptureStore";
import { CaptureSource } from "@/types/capture";
import { TxType } from "@/types";
import { formatFullDate } from "@/utils/dates";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

// Keyed by CaptureSource (not string) so removing/renaming a source is a
// compile error here instead of a silently-undefined label at render time.
const SOURCE_LABEL: Record<CaptureSource, string> = {
  regex: "Parsed on-device",
  gemini: "Parsed with AI",
};

export default function CapturedScreen() {
  const { isDark } = useTheme();
  const suggestions = useCaptureStore((s) => s.suggestions);
  const dismissSuggestion = useCaptureStore((s) => s.dismissSuggestion);

  const iconColor = isDark ? "#a1a1aa" : "#71717a";

  const pending = useMemo(() => suggestions.filter((s) => s.status === "pending"), [suggestions]);

  const handleDismiss = (id: string) => {
    dismissSuggestion(id).catch(() => Alert.alert("Couldn't dismiss", "Please try again."));
  };

  const handleReview = (suggestionId: string) => {
    const s = pending.find((x) => x.id === suggestionId);
    if (!s) return;
    const params = new URLSearchParams({
      manual: "true",
      type: s.txType === TxType.Income ? "income" : "expense",
      captureId: s.id,
      amount: String(s.amount),
    });
    if (s.merchant) params.set("merchant", s.merchant);
    if (s.categoryName) params.set("category", s.categoryName);
    if (s.date) params.set("date", s.date);
    router.push(`/scan?${params.toString()}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <View className="flex-row items-center px-4 pt-3 pb-4">
        <IconButton onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={20} color={iconColor} />
        </IconButton>
        <UIText size="base" variant="heading" className="flex-1 text-center">Captured transactions</UIText>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}>
        {pending.length === 0 ? (
          <DataState
            status="idle"
            isEmpty
            onRetry={() => {}}
            emptyMessage="Nothing waiting for review. Payments detected from your allowlisted apps will show up here."
            emptyIcon={Inbox}
          />
        ) : (
          <View className="gap-3 mt-1">
            {pending.map((s) => {
              const isIncome = s.txType === TxType.Income;
              return (
                <Card key={s.id} className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <UIText size="xs" variant="label">{s.appLabel}</UIText>
                    <View className="flex-row items-center gap-1">
                      {s.source === "gemini" ? (
                        <Sparkles size={11} color={iconColor} />
                      ) : (
                        <Cpu size={11} color={iconColor} />
                      )}
                      <UIText size="xs" variant="muted">{SOURCE_LABEL[s.source]}</UIText>
                    </View>
                  </View>

                  <UIText
                    size="lg"
                    variant="unstyled"
                    className={`font-mono font-semibold ${isIncome ? "text-positive dark:text-positive-dark" : "text-negative dark:text-negative-dark"}`}
                  >
                    {isIncome ? "+" : "−"}Rs {s.amount.toLocaleString("en-US")}
                  </UIText>
                  {s.merchant && <UIText size="sm" variant="default" className="mt-0.5">{s.merchant}</UIText>}
                  <UIText size="xs" variant="muted" className="mt-1">
                    {formatFullDate(s.date)}
                  </UIText>

                  <View className="flex-row gap-2 mt-3">
                    <Button label="Review" variant="default" className="flex-1" onPress={() => handleReview(s.id)} />
                    <AnimatedPressable
                      onPress={() => handleDismiss(s.id)}
                      className="px-4 items-center justify-center"
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <UIText size="sm" variant="muted">Dismiss</UIText>
                    </AnimatedPressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
