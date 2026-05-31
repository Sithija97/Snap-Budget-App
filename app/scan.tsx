import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const C = {
  dark:    "#0F1117",
  green:   "#1D9E75",
  greenBg: "#E6F4EE",
  text:    "#0F1117",
  sub:     "#94A3B8",
  border:  "#E8EDF2",
  surface: "#F8F9FA",
  card:    "#FFFFFF",
};

export default function ScanScreen() {
  const [scanned, setScanned] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 14,
            backgroundColor: C.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              backgroundColor: C.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 18, color: C.text }}>←</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: C.text }}>
            Scan Receipt
          </Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 13, color: C.green, fontWeight: "600" }}>
              Manual Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Camera box ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 16,
            borderRadius: 22,
            backgroundColor: C.dark,
            height: 230,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <View
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: C.green,
              opacity: 0.12,
            }}
          />

          {/* Corner brackets */}
          {[
            { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3 },
            { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3 },
            { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3 },
            { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3 },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                width: 26,
                height: 26,
                borderColor: C.green,
                borderRadius: 3,
                ...s,
              }}
            />
          ))}

          <Text style={{ fontSize: 36, marginBottom: 10 }}>🧾</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: "500" }}>
            Point camera at receipt
          </Text>
        </View>

        {/* Tip */}
        <Text
          style={{
            fontSize: 12,
            color: C.sub,
            textAlign: "center",
            paddingHorizontal: 28,
            marginTop: 12,
            lineHeight: 18,
          }}
        >
          Keep receipt flat and well-lit for best results.
        </Text>

        {/* AI badge */}
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 99,
              backgroundColor: C.greenBg,
            }}
          >
            <Text style={{ fontSize: 13 }}>✨</Text>
            <Text style={{ fontSize: 12, color: C.green, fontWeight: "600" }}>
              AI-powered categorization
            </Text>
          </View>
        </View>

        {/* Capture button */}
        {!scanned && (
          <TouchableOpacity
            style={{
              marginHorizontal: 14,
              marginTop: 18,
              height: 52,
              backgroundColor: C.green,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: C.green,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
            onPress={() => setScanned(true)}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              📷  Capture Receipt
            </Text>
          </TouchableOpacity>
        )}

        {/* Detected result card */}
        {scanned && (
          <View
            style={{
              marginHorizontal: 14,
              marginTop: 16,
              backgroundColor: C.card,
              borderRadius: 20,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 11,
                  backgroundColor: C.greenBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>✅</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
                Receipt detected
              </Text>
            </View>

            {[
              { label: "Merchant",  value: "Cargills Food City" },
              { label: "Date",      value: "19 May 2026" },
              { label: "Total",     value: "Rs 3,680", highlight: true },
              { label: "Category",  value: "🛒  Groceries" },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}
              >
                <Text style={{ fontSize: 13, color: C.sub }}>{row.label}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: (row as any).highlight ? C.green : C.text,
                    fontFamily: (row as any).highlight ? "DMMono_400Regular" : undefined,
                  }}
                >
                  {row.value}
                </Text>
              </View>
            ))}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor: C.border,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: C.surface,
                }}
                onPress={() => setScanned(false)}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.sub }}>
                  Re-scan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  height: 46,
                  borderRadius: 13,
                  backgroundColor: C.green,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: C.green,
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
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
                  Save Transaction
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
