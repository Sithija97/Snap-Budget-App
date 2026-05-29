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

const C = {
  green: "#00C170",
  greenBg: "#E6FAF4",
  red: "#FF5A5F",
  redBg: "#FFF0F1",
  blue: "#4A7AFF",
  amber: "#FF9F40",
  amberBg: "#FFF4E5",
  purple: "#9B6BFF",
  teal: "#00B8D9",
  text: "#1A1D23",
  sub: "#8A94A6",
  border: "#F0F2F7",
  bg: "#F5F7FC",
  card: "#FFFFFF",
};

const fmt = (n: number) => `Rs ${n.toLocaleString()}`;
const TABS = ["Expense", "Income", "All"];

// Donut chart constants
const DONUT_SIZE = 110;
const DONUT_R = 40;
const DONUT_CX = DONUT_SIZE / 2;
const DONUT_CY = DONUT_SIZE / 2;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState("Expense");

  const cats = MOCK_CATEGORY_BREAKDOWN;
  const total = cats.reduce((a, c) => a + c.amount, 0);

  // Build donut arcs
  let offset = DONUT_CIRC / 4; // start at top
  const arcs = cats.map((c) => {
    const arc = (c.pct / 100) * DONUT_CIRC;
    const o = offset;
    offset += arc;
    return { ...c, arc, dashOffset: DONUT_CIRC - o };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
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

          {/* Expense / Income / All tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: C.bg,
              borderRadius: 10,
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
                  paddingVertical: 6,
                  borderRadius: 8,
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

        {/* ── Donut + legend ── */}
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 12,
            backgroundColor: C.card,
            borderRadius: 18,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: C.text,
              marginBottom: 14,
            }}
          >
            Category breakdown
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {/* Donut */}
            <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
              <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                {/* Track */}
                <Circle
                  cx={DONUT_CX}
                  cy={DONUT_CY}
                  r={DONUT_R}
                  stroke={C.border}
                  strokeWidth={20}
                  fill="none"
                />
                {/* Arcs */}
                {arcs.map((a, i) => (
                  <Circle
                    key={i}
                    cx={DONUT_CX}
                    cy={DONUT_CY}
                    r={DONUT_R}
                    stroke={a.color}
                    strokeWidth={20}
                    fill="none"
                    strokeDasharray={`${a.arc} ${DONUT_CIRC - a.arc}`}
                    strokeDashoffset={a.dashOffset}
                  />
                ))}
              </Svg>
              {/* Center text */}
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
                <Text style={{ fontSize: 11, color: C.sub }}>Total</Text>
                <Text
                  style={{
                    fontSize: 13,
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
            <View style={{ flex: 1, gap: 6 }}>
              {cats.map((c) => (
                <View
                  key={c.category}
                  style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      backgroundColor: c.color,
                    }}
                  />
                  <Text style={{ flex: 1, fontSize: 11, color: C.sub }}>
                    {c.emoji} {c.category}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
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

        {/* ── By category list ── */}
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 12,
            backgroundColor: C.card,
            borderRadius: 18,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: C.text,
              marginBottom: 14,
            }}
          >
            By category
          </Text>
          {cats.map((c) => (
            <View key={c.category} style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 12,
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
                <Text style={{ fontSize: 11, color: C.sub }}>{c.pct}%</Text>
              </View>
              <View
                style={{
                  height: 5,
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
          ))}
        </View>

        {/* ── Monthly bar chart ── */}
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 12,
            marginBottom: 20,
            backgroundColor: C.card,
            borderRadius: 18,
            padding: 16,
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
              Monthly trend
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: C.green,
                  }}
                />
                <Text style={{ fontSize: 10, color: C.sub }}>Income</Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: C.red,
                  }}
                />
                <Text style={{ fontSize: 10, color: C.sub }}>Expense</Text>
              </View>
            </View>
          </View>

          {/* Summary row */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: C.greenBg,
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 10, color: C.sub, marginBottom: 2 }}>
                Total Income
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: C.green,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                {fmt(TOTAL_INCOME)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: C.redBg,
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 10, color: C.sub, marginBottom: 2 }}>
                Total Expense
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: C.red,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                {fmt(TOTAL_SPENT)}
              </Text>
            </View>
          </View>

          {/* Bar chart */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              height: 80,
              gap: 6,
            }}
          >
            {MOCK_MONTHLY_SPENDING.map((item, i) => {
              const maxVal = Math.max(
                ...MOCK_MONTHLY_SPENDING.map((s) => s.amount),
              );
              const h = Math.round((item.amount / maxVal) * 68) + 8;
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
