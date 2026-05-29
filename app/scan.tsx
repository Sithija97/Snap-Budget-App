import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const C = {
  green: "#00C170",
  greenBg: "#E6FAF4",
  text: "#1A1D23",
  sub: "#8A94A6",
  border: "#F0F2F7",
  bg: "#F5F7FC",
  card: "#FFFFFF",
};

export default function ScanScreen() {
  const [scanned, setScanned] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
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
            paddingTop: 10,
            paddingBottom: 12,
            backgroundColor: C.card,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: C.bg,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Text style={{ fontSize: 16, color: C.text }}>←</Text>
          </TouchableOpacity>
          <Text
            style={{ flex: 1, fontSize: 16, fontWeight: "600", color: C.text }}
          >
            Scan Receipt
          </Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 12, color: C.green, fontWeight: "500" }}>
              Manual Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Camera box ── */}
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 14,
            borderRadius: 20,
            backgroundColor: "#1A1D23",
            height: 220,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Corner brackets */}
          {[
            { top: 10, left: 10, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
            { top: 10, right: 10, borderTopWidth: 2.5, borderRightWidth: 2.5 },
            {
              bottom: 10,
              left: 10,
              borderBottomWidth: 2.5,
              borderLeftWidth: 2.5,
            },
            {
              bottom: 10,
              right: 10,
              borderBottomWidth: 2.5,
              borderRightWidth: 2.5,
            },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                width: 24,
                height: 24,
                borderColor: C.green,
                borderRadius: 2,
                ...s,
              }}
            />
          ))}

          <Text style={{ fontSize: 32, marginBottom: 8 }}>🧾</Text>
          <Text style={{ fontSize: 12, color: "#8A94A6" }}>
            Point camera at receipt
          </Text>
        </View>

        {/* Tip + AI badge */}
        <Text
          style={{
            fontSize: 11,
            color: C.sub,
            textAlign: "center",
            paddingHorizontal: 24,
            marginTop: 10,
          }}
        >
          Keep receipt flat and well-lit for best results.
        </Text>
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 99,
              backgroundColor: "#E6FAF4",
            }}
          >
            <Text style={{ fontSize: 12 }}>✨</Text>
            <Text style={{ fontSize: 11, color: "#00875A", fontWeight: "500" }}>
              AI-powered categorization
            </Text>
          </View>
        </View>

        {/* Capture button */}
        {!scanned && (
          <TouchableOpacity
            style={{
              marginHorizontal: 12,
              marginTop: 16,
              height: 50,
              backgroundColor: C.green,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setScanned(true)}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              📷 Capture Receipt
            </Text>
          </TouchableOpacity>
        )}

        {/* Detected result card */}
        {scanned && (
          <View
            style={{
              marginHorizontal: 12,
              marginTop: 14,
              backgroundColor: C.card,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>🧾</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                Receipt detected
              </Text>
            </View>

            {[
              { label: "Merchant", value: "Cargills Food City" },
              { label: "Date", value: "19 May 2026" },
              { label: "Total", value: "Rs 3,680" },
              { label: "Category", value: "🛒 Groceries" },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 9,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}
              >
                <Text style={{ fontSize: 12, color: C.sub }}>{row.label}</Text>
                <Text
                  style={{ fontSize: 12, fontWeight: "600", color: C.text }}
                >
                  {row.value}
                </Text>
              </View>
            ))}

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: C.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setScanned(false)}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: C.sub }}>
                  Re-scan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: C.green,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => {
                  Alert.alert("Saved!", "Transaction saved successfully.", [
                    { text: "OK", onPress: () => router.back() },
                  ]);
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}
                >
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
