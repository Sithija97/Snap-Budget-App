import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  MOCK_MONTHLY_SPENDING,
  MOCK_CATEGORY_BREAKDOWN,
  TOTAL_SPENT,
  TOTAL_INCOME,
} from "../../constants/mockData";
import {
  ShoppingCart,
  Coffee,
  Car,
  ShoppingBag,
  Smartphone,
  HeartPulse,
} from "lucide-react-native";

const C = {
  dark: "#0F1117",
  green: "#1D9E75",
  greenBg: "#E6F4EE",
  red: "#E24B4A",
  redBg: "#FCEBEB",
  amber: "#EF9F27",
  text: "#0F1117",
  sub: "#94A3B8",
  border: "#E8EDF2",
  surface: "#F8F9FA",
  card: "#FFFFFF",
};

const fmt = (n: number) => `Rs ${n.toLocaleString()}`;
const TABS = ["Expense", "Income", "All"];

const DONUT_SIZE = 120;
const DONUT_R = 44;
const DONUT_CX = DONUT_SIZE / 2;
const DONUT_CY = DONUT_SIZE / 2;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

const CAT_ICONS: Record<string, any> = {
  Groceries: ShoppingCart,
  Food: Coffee,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Smartphone,
  Health: HeartPulse,
};

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState("Expense");

  const cats = MOCK_CATEGORY_BREAKDOWN;
  const total = cats.reduce((a, c) => a + c.amount, 0);

  let offset = DONUT_CIRC / 4;
  const arcs = cats.map((c) => {
    const arc = (c.pct / 100) * DONUT_CIRC;
    const o = offset;
    offset += arc;
    return { ...c, arc, dashOffset: DONUT_CIRC - o };
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.surface }}
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View
          style={{
            backgroundColor: C.card,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
              Reports
            </Text>
            <Text style={{ fontSize: 12, color: C.sub }}>May 2026</Text>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: C.surface,
              borderRadius: 12,
              padding: 3,
            }}
          >
            {TABS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 7,
                  borderRadius: 9,
                  backgroundColor: activeTab === t ? C.card : "transparent",
                  shadowColor: activeTab === t ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: activeTab === t ? 0.08 : 0,
                  shadowRadius: 2,
                  elevation: activeTab === t ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: activeTab === t ? "600" : "400",
                    color: activeTab === t ? C.text : C.sub,
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Income / Expense solid cards (reference style) ── */}
        {/* <View style={{ flexDirection: "row", gap: 12, marginHorizontal: 14, marginTop: 14 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: C.dark,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(29,158,117,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 11, color: C.green, fontWeight: "700" }}>↓</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.green, fontWeight: "600" }}>
                Total Income
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#fff",
                fontFamily: "DMMono_400Regular",
              }}
            >
              {fmt(TOTAL_INCOME)}
            </Text>
            <Text style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>
              Bank Account
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: C.dark,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(226,75,74,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 11, color: C.red, fontWeight: "700" }}>↑</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.red, fontWeight: "600" }}>
                Total Expense
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#fff",
                fontFamily: "DMMono_400Regular",
              }}
            >
              {fmt(TOTAL_SPENT)}
            </Text>
            <Text style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>
              Bank Account
            </Text>
          </View>
        </View> */}

        {/* ── Donut + legend ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 14,
            backgroundColor: C.card,
            borderRadius: 20,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: C.text,
              marginBottom: 16,
            }}
          >
            Category breakdown
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {/* Donut */}
            <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
              <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                <Circle
                  cx={DONUT_CX}
                  cy={DONUT_CY}
                  r={DONUT_R}
                  stroke={C.border}
                  strokeWidth={22}
                  fill="none"
                />
                {arcs.map((a, i) => (
                  <Circle
                    key={i}
                    cx={DONUT_CX}
                    cy={DONUT_CY}
                    r={DONUT_R}
                    stroke={a.color}
                    strokeWidth={22}
                    fill="none"
                    strokeDasharray={`${a.arc} ${DONUT_CIRC - a.arc}`}
                    strokeDashoffset={a.dashOffset}
                  />
                ))}
              </Svg>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 10, color: C.sub }}>Total</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: C.text,
                    fontFamily: "DMMono_400Regular",
                  }}
                >
                  {fmt(total)}
                </Text>
              </View>
            </View>

            {/* Legend */}
            <View style={{ flex: 1, gap: 8 }}>
              {cats.map((c) => (
                <View
                  key={c.category}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: c.color,
                    }}
                  />
                  <Text style={{ flex: 1, fontSize: 12, color: C.sub }}>
                    {c.category}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: C.text,
                      fontFamily: "DMMono_400Regular",
                    }}
                  >
                    {c.pct}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── By category progress ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 14,
            backgroundColor: C.card,
            borderRadius: 20,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: C.text,
              marginBottom: 16,
            }}
          >
            By category
          </Text>
          {cats.map((c) => {
            const CatIcon = CAT_ICONS[c.category] || ShoppingCart;
            return (
              <View key={c.category} style={{ marginBottom: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      backgroundColor: c.color + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CatIcon size={15} color={c.color} strokeWidth={1.8} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: "500",
                      color: C.text,
                    }}
                  >
                    {c.category}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: C.text,
                      fontFamily: "DMMono_400Regular",
                    }}
                  >
                    {fmt(c.amount)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: C.sub,
                      width: 30,
                      textAlign: "right",
                    }}
                  >
                    {c.pct}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: C.border,
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${c.pct}%` as any,
                      height: "100%",
                      backgroundColor: c.color,
                      borderRadius: 99,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Monthly bar chart ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 14,
            marginBottom: 24,
            backgroundColor: C.card,
            borderRadius: 20,
            padding: 16,
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
              Monthly trend
            </Text>
            <View style={{ flexDirection: "row", gap: 14 }}>
              {[
                { color: C.green, label: "Income" },
                { color: C.red, label: "Expense" },
              ].map((l) => (
                <View
                  key={l.label}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: l.color,
                    }}
                  />
                  <Text style={{ fontSize: 10, color: C.sub }}>{l.label}</Text>
                </View>
              ))}
            </View>
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
              const max = Math.max(
                ...MOCK_MONTHLY_SPENDING.map((s) => s.amount),
              );
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
