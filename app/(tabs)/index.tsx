import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  WALLETS,
  MOCK_TRANSACTIONS,
  MOCK_MONTHLY_SPENDING,
  TOTAL_INCOME,
  TOTAL_SPENT,
} from "../../constants/mockData";

const C = {
  green: "#00C170",
  greenBg: "#E6FAF4",
  red: "#FF5A5F",
  blue: "#4A7AFF",
  amber: "#FF9F40",
  purple: "#9B6BFF",
  text: "#1A1D23",
  sub: "#8A94A6",
  border: "#F0F2F7",
  bg: "#F5F7FC",
  card: "#FFFFFF",
};

const fmt = (n: number) => `Rs ${n.toLocaleString()}`;

export default function HomeScreen() {
  const [walletIdx, setWalletIdx] = useState(0);
  const w = WALLETS[walletIdx];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: w.color }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: C.bg }}
      >
        {/* ── Wallet card ── */}
        <View
          style={{
            backgroundColor: w.color,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <View
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -30,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />

          {/* Header row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 2,
                }}
              >
                May 2026
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                {w.name}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setWalletIdx((walletIdx + 1) % WALLETS.length)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16 }}>👛</Text>
              </TouchableOpacity>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14 }}>🔔</Text>
              </View>
            </View>
          </View>

          {/* Balance */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 4,
              }}
            >
              Total Balance
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: "#fff",
                fontFamily: "DMMono_400Regular",
                letterSpacing: -1,
              }}
            >
              {fmt(w.balance)}
            </Text>
          </View>

          {/* Inc / Exp chips */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              {
                label: "Income",
                val: TOTAL_INCOME,
                icon: "⬇️",
                bg: "rgba(255,255,255,0.2)",
              },
              {
                label: "Expense",
                val: TOTAL_SPENT,
                icon: "⬆️",
                bg: "rgba(255,255,255,0.15)",
              },
            ].map((chip) => (
              <View
                key={chip.label}
                style={{
                  flex: 1,
                  backgroundColor: chip.bg,
                  borderRadius: 14,
                  padding: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 11 }}>{chip.icon}</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.75)",
                      fontWeight: "500",
                    }}
                  >
                    {chip.label}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#fff",
                    fontFamily: "DMMono_400Regular",
                  }}
                >
                  {fmt(chip.val)}
                </Text>
              </View>
            ))}
          </View>

          {/* Wallet dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 5,
              marginTop: 14,
            }}
          >
            {WALLETS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === walletIdx ? 18 : 5,
                  height: 5,
                  borderRadius: 99,
                  backgroundColor:
                    i === walletIdx ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            paddingHorizontal: 12,
            paddingTop: 18,
            paddingBottom: 8,
          }}
        >
          {[
            { label: "Add", icon: "➕", bg: C.greenBg, color: C.green },
            { label: "Transfer", icon: "🔄", bg: "#EEF2FF", color: C.blue },
            { label: "Budget", icon: "📊", bg: "#F3EEFF", color: C.purple },
            { label: "Report", icon: "📈", bg: "#FFF4E5", color: C.amber },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={{ alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: a.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>{a.icon}</Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: "500", color: C.sub }}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent transactions ── */}
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 8,
            backgroundColor: C.card,
            borderRadius: 18,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              paddingBottom: 6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
              Recent transactions
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/transactions")}
            >
              <Text style={{ fontSize: 11, color: C.green, fontWeight: "500" }}>
                See all →
              </Text>
            </TouchableOpacity>
          </View>
          {MOCK_TRANSACTIONS.slice(0, 4).map((tx, i) => (
            <View
              key={tx.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 11,
                paddingVertical: 9,
                paddingHorizontal: 16,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: C.border,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: tx.iconBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>{tx.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13.5, fontWeight: "500", color: C.text }}
                >
                  {tx.merchant}
                </Text>
                <Text style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
                  {tx.category} · {tx.time}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13.5,
                  fontWeight: "600",
                  color: tx.txType === "inc" ? C.green : C.red,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                {tx.txType === "inc" ? "+" : "\u2212"}
                {fmt(tx.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── 6-month spending bar chart ── */}
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 12,
            marginBottom: 16,
            backgroundColor: C.card,
            borderRadius: 18,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
              6-month spending
            </Text>
            <Text style={{ fontSize: 11, color: C.sub }}>May 2026</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              height: 80,
              gap: 6,
            }}
          >
            {MOCK_MONTHLY_SPENDING.map((item, i) => {
              const max = Math.max(
                ...MOCK_MONTHLY_SPENDING.map((s) => s.amount),
              );
              const h = Math.round((item.amount / max) * 68) + 8;
              const isActive = i === MOCK_MONTHLY_SPENDING.length - 1;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: h,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                      backgroundColor: isActive ? C.green : C.border,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: isActive ? "600" : "400",
                      color: isActive ? C.green : C.sub,
                    }}
                  >
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
