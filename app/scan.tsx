import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";

const RECEIPT_ROWS = [
  { label: "Merchant",  value: "Cargills Food City" },
  { label: "Date",      value: "19 May 2026" },
  { label: "Total",     value: "Rs 3,680",           highlight: true },
  { label: "Category",  value: "🛒  Groceries" },
] as const;

const CORNER_STYLES = [
  { top: 14,    left: 14,  borderTopWidth: 3,    borderLeftWidth: 3 },
  { top: 14,    right: 14, borderTopWidth: 3,    borderRightWidth: 3 },
  { bottom: 14, left: 14,  borderBottomWidth: 3, borderLeftWidth: 3 },
  { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3 },
] as const;

export default function ScanScreen() {
  const [scanned, setScanned] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ── */}
        <View
          className="flex-row items-center px-4 pt-3 pb-[14px] bg-brand-card"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-[34px] h-[34px] rounded-[11px] bg-brand-surface items-center justify-center mr-3"
          >
            <Text className="text-[18px] text-brand-black">←</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-[16px] font-bold text-brand-black">Scan Receipt</Text>
          <TouchableOpacity>
            <Text className="text-[13px] text-brand-green font-semibold">Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* ── Camera box ── */}
        <View className="mx-[14px] mt-4 rounded-[22px] bg-brand-black h-[230px] items-center justify-center overflow-hidden">
          {/* Glow */}
          <View
            className="absolute w-[120px] h-[120px] rounded-full opacity-[0.12]"
            style={{ top: -30, right: -30, backgroundColor: Colors.green }}
          />

          {/* Corner brackets */}
          {CORNER_STYLES.map((s, i) => (
            <View
              key={i}
              className="absolute w-[26px] h-[26px] rounded-[3px]"
              style={{ borderColor: Colors.green, ...s }}
            />
          ))}

          <Text className="text-[36px] mb-2.5">🧾</Text>
          <Text className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
            Point camera at receipt
          </Text>
        </View>

        {/* Tip */}
        <Text className="text-[12px] text-brand-muted text-center px-7 mt-3 leading-[18px]">
          Keep receipt flat and well-lit for best results.
        </Text>

        {/* AI badge */}
        <View className="items-center mt-2.5">
          <View className="flex-row items-center gap-1.5 px-[14px] py-[6px] rounded-full bg-brand-greenBg">
            <Text className="text-[13px]">✨</Text>
            <Text className="text-[12px] text-brand-green font-semibold">
              AI-powered categorization
            </Text>
          </View>
        </View>

        {/* Capture button */}
        {!scanned && (
          <TouchableOpacity
            className="mx-[14px] mt-[18px] h-[52px] bg-brand-green rounded-[15px] items-center justify-center"
            style={{
              shadowColor: Colors.green,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
            onPress={() => setScanned(true)}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-[15px]">📷  Capture Receipt</Text>
          </TouchableOpacity>
        )}

        {/* Detected result card */}
        {scanned && (
          <View className="mx-[14px] mt-4 bg-brand-card rounded-[20px] p-4">
            <View className="flex-row items-center gap-2 mb-[14px]">
              <View className="w-[34px] h-[34px] rounded-[11px] bg-brand-greenBg items-center justify-center">
                <Text className="text-[18px]">✅</Text>
              </View>
              <Text className="text-[15px] font-bold text-brand-black">Receipt detected</Text>
            </View>

            {RECEIPT_ROWS.map((row, i) => (
              <View
                key={row.label}
                className={`flex-row justify-between items-center py-2.5 ${
                  i < RECEIPT_ROWS.length - 1 ? "border-b border-brand-border" : ""
                }`}
              >
                <Text className="text-[13px] text-brand-muted">{row.label}</Text>
                <Text
                  className={`text-[13px] font-bold ${
                    row.highlight ? "text-brand-green font-mono" : "text-brand-black"
                  }`}
                >
                  {row.value}
                </Text>
              </View>
            ))}

            <View className="flex-row gap-2.5 mt-4">
              <TouchableOpacity
                className="flex-1 h-[46px] rounded-[13px] border border-brand-border items-center justify-center bg-brand-surface"
                onPress={() => setScanned(false)}
              >
                <Text className="text-[13px] font-semibold text-brand-muted">Re-scan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] h-[46px] rounded-[13px] bg-brand-green items-center justify-center"
                style={{
                  shadowColor: Colors.green,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() =>
                  Alert.alert("Saved!", "Transaction saved successfully.", [
                    { text: "OK", onPress: () => router.back() },
                  ])
                }
              >
                <Text className="text-[13px] font-bold text-white">Save Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
