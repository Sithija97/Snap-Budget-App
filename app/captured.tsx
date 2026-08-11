import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Sparkles, HelpCircle } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCaptureStore } from "@/store/useCaptureStore";
import { TxType } from "@/types";
import { formatFullDate } from "@/utils/dates";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const SOURCE_LABEL: Record<string, string> = {
  regex: "Parsed on-device",
  gemini: "Parsed with AI",
  unparsed: "Couldn't parse",
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
    const params = new URLSearchParams({ manual: "true", type: s.txType === TxType.Income ? "income" : "expense", captureId: s.id });
    if (s.amount !== null) params.set("amount", String(s.amount));
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
          <View className="items-center py-12 gap-2">
            <Sparkles size={20} color={iconColor} />
            <UIText size="sm" variant="muted" className="text-center">
              Nothing waiting for review. Payments detected from your allowlisted apps will show up here.
            </UIText>
          </View>
        ) : (
          <View className="gap-3 mt-1">
            {pending.map((s) => (
              <Card key={s.id} className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <UIText size="sm" variant="muted">{s.appLabel}</UIText>
                  <View className="flex-row items-center gap-1.5">
                    {s.source === "unparsed" && <HelpCircle size={12} color={iconColor} />}
                    <Badge
                      label={SOURCE_LABEL[s.source]}
                      variant={s.source === "unparsed" ? "outline" : "default"}
                    />
                  </View>
                </View>

                {s.amount !== null ? (
                  <UIText size="lg" variant="heading">
                    {s.txType === TxType.Income ? "+" : "-"}Rs {s.amount.toLocaleString("en-US")}
                  </UIText>
                ) : (
                  <UIText size="sm" variant="muted">Amount not detected — enter it on review</UIText>
                )}
                {s.merchant && <UIText size="sm" variant="default">{s.merchant}</UIText>}
                <UIText size="xs" variant="muted" className="mt-1">
                  {formatFullDate(s.date)}
                </UIText>

                {s.source === "unparsed" && (
                  <UIText size="xs" variant="muted" className="mt-2" numberOfLines={2}>
                    "{s.rawText}"
                  </UIText>
                )}

                <View className="flex-row gap-2 mt-3">
                  <Button label="Review" variant="default" className="flex-1" onPress={() => handleReview(s.id)} />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDismiss(s.id)}
                    className="px-4 items-center justify-center"
                  >
                    <UIText size="sm" variant="muted">Dismiss</UIText>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
