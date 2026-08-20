import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Sparkles, ScanLine, MessageCircle, Bell, Radio } from "lucide-react-native";
import { useThemeColors } from "@/context/ThemeContext";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Receipt scanning",
    body: "The photo you take is sent to Gemini to read the merchant, amount, date, and category off the receipt.",
  },
  {
    icon: MessageCircle,
    title: "Chat assistant & quick-add",
    body: "Your typed question or \"spent 500 on lunch\" message is sent to Gemini to understand what you're asking for. Your totals and categories are computed by SnapBudget's own server first — Gemini only sees the already-computed numbers when phrasing a reply, never your raw transaction list.",
  },
  {
    icon: Bell,
    title: "Weekly / monthly recaps",
    body: "Same rule as the assistant: SnapBudget computes your totals and top categories on its own server, then sends only those computed numbers to Gemini to phrase into a short summary.",
  },
  {
    icon: Radio,
    title: "Automatic capture (Android)",
    body: "A captured notification's text is only sent to Gemini when on-device parsing can't read it. Nothing is saved until you review and confirm it yourself.",
  },
];

export default function AiDisclosureScreen() {
  const { mutedFg: iconColor, muted } = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <IconButton onPress={() => router.back()} className="mr-3" accessibilityLabel="Go back" accessibilityRole="button">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">AI & data</UIText>
          <View className="w-9" />
        </View>

        <Card className="mx-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: muted }}
            >
              <Sparkles size={18} color={iconColor} strokeWidth={1.8} />
            </View>
            <UIText size="base" variant="heading" className="flex-1">How SnapBudget uses AI</UIText>
          </View>
          <UIText size="sm" variant="muted" className="leading-5">
            SnapBudget uses Google's Gemini to power a few features below. This screen explains exactly what's sent, and
            what isn't.
          </UIText>
        </Card>

        <UIText size="xs" variant="label" className="mx-4 mt-5 mb-2">What's sent, and when</UIText>
        <Card className="mx-4">
          {FEATURES.map((f, i) => (
            <View key={f.title}>
              {i > 0 && <Separator className="my-3" />}
              <View className="flex-row items-start gap-3">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
                  style={{ backgroundColor: muted }}
                >
                  <f.icon size={15} color={iconColor} strokeWidth={1.8} />
                </View>
                <View className="flex-1">
                  <UIText size="sm" variant="heading">{f.title}</UIText>
                  <UIText size="xs" variant="muted" className="mt-0.5 leading-5">{f.body}</UIText>
                </View>
              </View>
            </View>
          ))}
        </Card>

        <UIText size="xs" variant="label" className="mx-4 mt-5 mb-2">What stays out of it</UIText>
        <Card className="mx-4">
          <UIText size="sm" variant="muted" className="leading-5">
            Nothing is sent to Gemini in the background — only when you take an action that needs it: scanning a
            receipt, asking a question, or a notification arriving that on-device parsing couldn't read. Every dollar
            figure Gemini talks about (spending totals, category breakdowns, survival estimates) is computed by
            SnapBudget's own server beforehand — Gemini phrases the sentence, it never calculates or invents a number
            itself.
          </UIText>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
