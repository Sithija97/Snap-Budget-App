import { useCallback, useRef, useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Send, Sparkles } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { UIText } from "@/components/ui/UIText";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "How's my spending this month?",
  "Will I survive until my next payday?",
  "How much have I spent on food in the last 6 months?",
  "Am I over budget on anything this month?",
];

let nextId = 0;
const newId = () => `m-${nextId++}`;

export default function AssistantScreen() {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const iconColor = isDark ? "#a1a1aa" : "#71717a";
  const inputBg = isDark ? "#09090b" : "#ffffff";
  const inputBorder = isDark ? "#27272a" : "#e4e4e7";
  const inputText = isDark ? "#fafafa" : "#09090b";
  const placeholderClr = isDark ? "#71717a" : "#a1a1aa";

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || asking) return;

      setMessages((prev) => [...prev, { id: newId(), role: "user", text: trimmed }]);
      setInput("");
      setAsking(true);
      scrollToEnd();

      try {
        const { reply } = await api.post<{ reply: string }>("/api/assistant/ask", { question: trimmed });
        setMessages((prev) => [...prev, { id: newId(), role: "assistant", text: reply }]);
      } catch (e: any) {
        Alert.alert("Couldn't get an answer", e?.message ?? "Please try again.");
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", text: "Sorry, I couldn't answer that. Please try again." },
        ]);
      } finally {
        setAsking(false);
        scrollToEnd();
      }
    },
    [asking, scrollToEnd]
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={["top"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <IconButton onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={20} color={iconColor} />
          </IconButton>
          <UIText size="base" variant="heading" className="flex-1 text-center">Assistant</UIText>
          <View className="w-9" />
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-4 px-4">
              <View className="w-12 h-12 rounded-full bg-muted dark:bg-muted-dark items-center justify-center">
                <Sparkles size={22} color={iconColor} />
              </View>
              <UIText size="sm" variant="muted" className="text-center">
                Ask anything about your spending, income, or budgets — a category, a merchant, a date range, or whether you'll make it to your next payday.
              </UIText>
              <View className="gap-2 w-full">
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} activeOpacity={0.7} onPress={() => ask(s)}>
                    <Card bordered className="p-3">
                      <UIText size="sm" variant="heading">{s}</UIText>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View className="gap-3">
              {messages.map((m) => (
                <View key={m.id} className={m.role === "user" ? "items-end" : "items-start"}>
                  <Card
                    className={`p-3 max-w-[85%] ${m.role === "user" ? "bg-accent dark:bg-accent-dark" : ""}`}
                  >
                    <UIText
                      size="sm"
                      variant="unstyled"
                      style={{ color: m.role === "user" ? (isDark ? "#18181b" : "#ffffff") : inputText }}
                    >
                      {m.text}
                    </UIText>
                  </Card>
                </View>
              ))}
              {asking && (
                <View className="items-start">
                  <Card className="p-3">
                    <ActivityIndicator size="small" color={isDark ? "#fafafa" : "#18181b"} />
                  </Card>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View className="flex-row items-center gap-2 px-4 pb-4 pt-2">
          <TextInput
            style={{
              flex: 1,
              height: 44,
              borderWidth: 1,
              borderColor: inputBorder,
              borderRadius: 8,
              paddingHorizontal: 12,
              backgroundColor: inputBg,
              color: inputText,
              fontSize: 15,
            }}
            placeholder="Ask a question..."
            placeholderTextColor={placeholderClr}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => ask(input)}
            returnKeyType="send"
            editable={!asking}
          />
          <IconButton onPress={() => ask(input)} disabled={asking || input.trim().length === 0}>
            <Send size={18} color={iconColor} />
          </IconButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
