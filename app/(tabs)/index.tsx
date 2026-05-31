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
  dark:     "#0F1117",
  green:    "#1D9E75",
  greenBg:  "#E6F4EE",
  red:      "#E24B4A",
  redBg:    "#FCEBEB",
  amber:    "#EF9F27",
  amberBg:  "#FFF4E5",
  blue:     "#4A7AFF",
  blueBg:   "#EEF2FF",
  purple:   "#9B6BFF",
  purpleBg: "#F3EEFF",
  text:     "#0F1117",
  sub:      "#94A3B8",
  border:   "#E8EDF2",
  surface:  "#F8F9FA",
  card:     "#FFFFFF",
};

const fmt = (n: number) => `Rs ${n.toLocaleString()}`;

export default function HomeScreen() {
  const [walletIdx, setWalletIdx] = useState(0);
  const w = WALLETS[walletIdx];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.dark }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: C.surface }}
      >
        {/* ── Wallet card ── */}
        <View
          style={{
            backgroundColor: C.dark,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 32,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: "hidden",
          }}
        >
          {/* Glow circle — wallet accent colour */}
          <View
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: w.color,
              opacity: 0.15,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -40,
              left: -20,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: w.color,
              opacity: 0.08,
            }}
          />

          {/* Header row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <View>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>
                May 2026
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: w.color,
                  }}
                />
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                  {w.name}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setWalletIdx((walletIdx + 1) % WALLETS.length)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16 }}>{w.emoji}</Text>
              </TouchableOpacity>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14 }}>🔔</Text>
              </View>
            </View>
          </View>

          {/* Balance */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
              Total Balance
            </Text>
            <Text
              style={{
                fontSize: 36,
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
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: C.green,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 9, color: "#fff" }}>↓</Text>
                </View>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
                  Income
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
                {fmt(TOTAL_INCOME)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: C.red,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 9, color: "#fff" }}>↑</Text>
                </View>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
                  Expense
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
                {fmt(TOTAL_SPENT)}
              </Text>
            </View>
          </View>

          {/* Wallet dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 5,
              marginTop: 16,
            }}
          >
            {WALLETS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === walletIdx ? 20 : 5,
                  height: 5,
                  borderRadius: 99,
                  backgroundColor:
                    i === walletIdx ? "#fff" : "rgba(255,255,255,0.3)",
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
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 8,
          }}
        >
          {[
            { label: "Add",      icon: "➕", bg: C.greenBg,  color: C.green  },
            { label: "Transfer", icon: "🔄", bg: C.blueBg,   color: C.blue   },
            { label: "Budget",   icon: "📊", bg: C.purpleBg, color: C.purple },
            { label: "Report",   icon: "📈", bg: C.amberBg,  color: C.amber  },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={{ alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: a.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: a.color,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: "500", color: C.sub }}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent transactions ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 8,
            backgroundColor: C.card,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text style={{ fontSize: 12, color: C.green, fontWeight: "600" }}>
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
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: C.border,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: tx.iconBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>{tx.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
                  {tx.merchant}
                </Text>
                <Text style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                  {tx.category} · {tx.time}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: tx.txType === "inc" ? C.green : C.red,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                {tx.txType === "inc" ? "+" : "−"}
                {fmt(tx.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── 6-month bar chart ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 14,
            marginBottom: 20,
            backgroundColor: C.card,
            borderRadius: 20,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
              Spending Trend
            </Text>
            <Text style={{ fontSize: 12, color: C.sub }}>6 months</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              height: 90,
              gap: 8,
            }}
          >
            {MOCK_MONTHLY_SPENDING.map((item, i) => {
              const max = Math.max(...MOCK_MONTHLY_SPENDING.map((s) => s.amount));
              const h = Math.round((item.amount / max) * 72) + 10;
              const isActive = i === MOCK_MONTHLY_SPENDING.length - 1;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 5,
                  }}
                >
                  {isActive && (
                    <Text
                      style={{
                        fontSize: 9,
                        color: C.green,
                        fontWeight: "700",
                        fontFamily: "DMMono_400Regular",
                      }}
                    >
                      {Math.round(item.amount / 1000)}k
                    </Text>
                  )}
                  <View
                    style={{
                      width: "100%",
                      height: h,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      backgroundColor: isActive ? C.green : C.border,
                      shadowColor: isActive ? C.green : "transparent",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: isActive ? 0.35 : 0,
                      shadowRadius: 6,
                      elevation: isActive ? 4 : 0,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: isActive ? "700" : "400",
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
