import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  Receipt,
  Sparkles,
  CheckCircle2,
} from "lucide-react-native";

export default function ScanScreen() {
  const handleSave = () => {
    Alert.alert("Saved!", "Transaction saved successfully.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-surface">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-slate-900 text-base font-medium flex-1">
            Scan receipt
          </Text>
          <TouchableOpacity>
            <Text className="text-brand-green text-xs">Manual entry</Text>
          </TouchableOpacity>
        </View>

        {/* Camera finder box */}
        <View className="mx-3 rounded-3xl items-center justify-center bg-brand-black h-[220px]">
          <View className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-brand-green rounded-[2px]" />
          <View className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-brand-green rounded-[2px]" />
          <View className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-brand-green rounded-[2px]" />
          <View className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-brand-green rounded-[2px]" />

          {/* Center content */}
          <Receipt size={32} color="#94A3B8" />
          <Text className="text-brand-muted text-xs mt-2">
            Point camera at receipt
          </Text>

          {/* Scan line */}
          <View className="absolute rounded-full bg-brand-green opacity-70 h-[1.5px] w-4/5" />
        </View>

        {/* Tip text */}
        <Text className="text-brand-muted text-xs text-center px-4 mt-3">
          Keep receipt flat and well-lit for best results. AI will auto-detect
          merchant, items and total.
        </Text>

        {/* AI badge */}
        <View className="items-center mt-3">
          <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 bg-[#E1F5EE]">
            <Sparkles size={12} color="#085041" />
            <Text className="text-xs text-[#085041]">
              AI-powered categorization
            </Text>
          </View>
        </View>

        {/* Detected result card */}
        <View className="bg-white rounded-2xl mx-3 p-3 mt-4">
          {/* Card header */}
          <View className="flex-row items-center gap-2 mb-2">
            <CheckCircle2 size={16} color="#1D9E75" />
            <Text className="text-sm font-medium text-slate-900">
              Receipt detected
            </Text>
          </View>

          {/* Rows */}
          {[
            { label: "Merchant", value: "Cargills Food City", isPlain: true },
            { label: "Date", value: "19 May 2026", isPlain: true },
          ].map((row) => (
            <View
              key={row.label}
              className="flex-row justify-between py-1.5 border-b border-brand-surface"
            >
              <Text className="text-xs text-brand-muted">{row.label}</Text>
              <Text className="text-xs font-medium text-slate-900">
                {row.value}
              </Text>
            </View>
          ))}

          {/* Category row with pill */}
          <View className="flex-row justify-between items-center py-1.5 border-b border-brand-surface">
            <Text className="text-xs text-brand-muted">Category</Text>
            <View className="rounded-full px-2 py-0.5 bg-[#E1F5EE]">
              <Text className="text-xs text-[#085041]">Groceries</Text>
            </View>
          </View>

          {/* Total */}
          <View className="flex-row justify-between items-center pt-2">
            <Text className="text-xs text-brand-muted">Total</Text>
            <Text className="text-sm font-medium text-brand-green">
              Rs 3,680
            </Text>
          </View>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          className="bg-brand-green rounded-xl mx-3 h-12 items-center justify-center mt-4"
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text className="text-white font-medium">Save transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
