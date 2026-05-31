import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  // Plus, ArrowLeftRight, ChartPie, ChartBar, — quick actions (commented out)
  LogOut,
  ShoppingCart,
  Car,
  CircleArrowDown,
  Smartphone,
  ShoppingBag,
  Coffee,
  Laptop,
  HeartPulse,
} from "lucide-react-native";
import {
  MOCK_TRANSACTIONS,
  MOCK_MONTHLY_SPENDING,
  MOCK_USER,
  TOTAL_SPENT,
  REMAINING,
  TOTAL_INCOME,
} from "../../constants/mockData";

const C = {
  dark: "#0F1117",
  green: "#1D9E75",
  greenBg: "#E6F4EE",
  red: "#E24B4A",
  redBg: "#FCEBEB",
  amber: "#EF9F27",
  amberBg: "#FFF4E5",
  blue: "#4A7AFF",
  blueBg: "#EEF2FF",
  purple: "#9B6BFF",
  purpleBg: "#F3EEFF",
  text: "#0F1117",
  sub: "#94A3B8",
  border: "#E8EDF2",
  surface: "#F8F9FA",
  card: "#FFFFFF",
};

const fmt = (n: number) => `Rs ${n.toLocaleString()}`;

const TX_ICONS: Record<string, any> = {
  ShoppingCart,
  Car,
  CircleArrowDown,
  Smartphone,
  ShoppingBag,
  Coffee,
  Laptop,
  HeartPulse,
};

export default function HomeScreen() {
  const [showProfile, setShowProfile] = useState(false);

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
            paddingBottom: 34,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            marginBottom: 16,
          }}
        >
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
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 2,
                }}
              >
                Good morning, {MOCK_USER.name}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                May 2026
              </Text>
            </View>

            {/* Avatar button */}
            <TouchableOpacity
              onPress={() => setShowProfile(true)}
              activeOpacity={0.85}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: C.green,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                {MOCK_USER.name.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Balance */}
          <Text
            style={{
              fontSize: 38,
              fontWeight: "700",
              color: "#fff",
              fontFamily: "DMMono_400Regular",
              letterSpacing: -1,
              marginBottom: 4,
            }}
          >
            {fmt(TOTAL_SPENT)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 18,
            }}
          >
            spent this month
          </Text>

          {/* Stat chips */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: "rgba(226,75,74,0.15)",
                borderRadius: 99,
              }}
            >
              <Text style={{ fontSize: 11, color: C.red }}>↘</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: C.red,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                +12% vs last month
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: "rgba(29,158,117,0.18)",
                borderRadius: 99,
              }}
            >
              <Text style={{ fontSize: 12, color: C.green }}>◎</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: C.green,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                {fmt(REMAINING)} left
              </Text>
            </View>
          </View>
        </View>

        {/* ── Quick actions (commented out) ── */}

        {/* Income / Expense summary */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginHorizontal: 14,
            marginTop: 12,
            marginBottom: 16,
          }}
        >
          {/* Income */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#EDFAF4",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 5,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: C.green,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>
                  ↓
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: C.green,
                  fontWeight: "700",
                  letterSpacing: 0.4,
                }}
              >
                INCOME
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: C.green,
                fontFamily: "DMMono_400Regular",
                marginBottom: 2,
              }}
            >
              {fmt(TOTAL_INCOME)}
            </Text>
            <Text style={{ fontSize: 10, color: C.sub }}>
              received this month
            </Text>
          </View>

          {/* Expense */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#FDF0F0",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 5,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: C.red,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>
                  ↑
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: C.red,
                  fontWeight: "700",
                  letterSpacing: 0.4,
                }}
              >
                EXPENSE
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: C.red,
                fontFamily: "DMMono_400Regular",
                marginBottom: 2,
              }}
            >
              {fmt(TOTAL_SPENT)}
            </Text>
            <Text style={{ fontSize: 10, color: C.sub }}>
              {Math.round((TOTAL_SPENT / TOTAL_INCOME) * 100)}% of income used
            </Text>
          </View>
        </View>

        {/* ── Recent transactions ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 8,
            backgroundColor: C.card,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
              Recent Transactions
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/transactions")}
            >
              <Text style={{ fontSize: 12, color: C.green, fontWeight: "600" }}>
                See all →
              </Text>
            </TouchableOpacity>
          </View>

          {MOCK_TRANSACTIONS.slice(0, 5).map((tx) => {
            const Icon = TX_ICONS[tx.icon] || ShoppingCart;
            return (
              <View
                key={tx.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: tx.iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color={tx.iconColor} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                  >
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
            );
          })}
        </View>

        {/* ── 6-month bar chart ── */}
        {/* <View
          style={{
            marginHorizontal: 14, marginTop: 14, marginBottom: 20,
            backgroundColor: C.card, borderRadius: 20, padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
              Spending Trend
            </Text>
            <Text style={{ fontSize: 12, color: C.sub }}>6 months</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", height: 90, gap: 8 }}>
            {MOCK_MONTHLY_SPENDING.map((item, i) => {
              const max = Math.max(...MOCK_MONTHLY_SPENDING.map((s) => s.amount));
              const h = Math.round((item.amount / max) * 72) + 10;
              const isActive = i === MOCK_MONTHLY_SPENDING.length - 1;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1, alignItems: "center",
                    justifyContent: "flex-end", gap: 5,
                  }}
                >
                  {isActive && (
                    <Text
                      style={{
                        fontSize: 9, color: C.green,
                        fontWeight: "700", fontFamily: "DMMono_400Regular",
                      }}
                    >
                      {Math.round(item.amount / 1000)}k
                    </Text>
                  )}
                  <View
                    style={{
                      width: "100%", height: h,
                      borderTopLeftRadius: 8, borderTopRightRadius: 8,
                      backgroundColor: isActive ? C.green : C.border,
                      shadowColor: isActive ? C.green : "transparent",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: isActive ? 0.35 : 0,
                      shadowRadius: 6, elevation: isActive ? 4 : 0,
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
        </View> */}
      </ScrollView>

      {/* ── Profile bottom sheet modal ── */}
      <Modal
        visible={showProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowProfile(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.45)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={{
                  backgroundColor: C.card,
                  borderTopLeftRadius: 26,
                  borderTopRightRadius: 26,
                  paddingHorizontal: 24,
                  paddingTop: 12,
                  paddingBottom: 40,
                }}
              >
                {/* Handle */}
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: C.border,
                    alignSelf: "center",
                    marginBottom: 22,
                  }}
                />

                {/* User info */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 28,
                  }}
                >
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 27,
                      backgroundColor: C.green,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: C.green,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}
                    >
                      {MOCK_USER.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{ fontSize: 17, fontWeight: "700", color: C.text }}
                    >
                      {MOCK_USER.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
                      kasun@example.com
                    </Text>
                  </View>
                </View>

                {/* Sign out */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 15,
                    backgroundColor: C.redBg,
                    borderRadius: 14,
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowProfile(false);
                    router.replace("/login");
                  }}
                >
                  <LogOut size={18} color={C.red} strokeWidth={2} />
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: C.red }}
                  >
                    Sign out
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
