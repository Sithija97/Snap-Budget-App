import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { MOCK_BUDGETS, TOTAL_SPENT, REMAINING } from "../../constants/mockData";
const C = {
  green: "#00C170",
  greenBg: "#E6FAF4",
  red: "#FF5A5F",
  redBg: "#FFF0F1",
  blue: "#4A7AFF",
  blueBg: "#EEF2FF",
  amber: "#FF9F40",
  amberBg: "#FFF4E5",
  purple: "#9B6BFF",
  purpleBg: "#F3EEFF",
  teal: "#00B8D9",
  tealBg: "#E5F8FC",
  text: "#1A1D23",
  sub: "#8A94A6",
  border: "#F0F2F7",
  bg: "#F5F7FC",
  card: "#FFFFFF",
};

const fmt = (n: number) => `Rs ${n.toLocaleString()}`;
const RING_SIZE = 92;
const RING_R = 36;
const RING_CX = RING_SIZE / 2;
const RING_CY = RING_SIZE / 2;
const RING_CIRC = 2 * Math.PI * RING_R;
const TOTAL_LIMIT = MOCK_BUDGETS.reduce((a, b) => a + b.limit, 0);

export default function BudgetScreen() {
  const pctUsed = TOTAL_SPENT / TOTAL_LIMIT;
  const dash = pctUsed * RING_CIRC;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- Summary Card --- */}
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 12,
            backgroundColor: C.card,
            borderRadius: 18,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 18,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Chart on the left */}
          <View
            style={{
              position: "relative",
              width: RING_SIZE,
              height: RING_SIZE,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Svg width={RING_SIZE} height={RING_SIZE}>
              {/* Track */}
              <Circle
                cx={RING_CX}
                cy={RING_CY}
                r={RING_R}
                stroke={C.border}
                strokeWidth={10}
                fill="none"
              />
              {/* Progress */}
              <Circle
                cx={RING_CX}
                cy={RING_CY}
                r={RING_R}
                stroke={C.green}
                strokeWidth={10}
                fill="none"
                strokeDasharray={`${dash} ${RING_CIRC}`}
                strokeDashoffset={RING_CIRC / 4}
                strokeLinecap="round"
              />
            </Svg>
            {/* Center label */}
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
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: C.green,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                {Math.round(pctUsed * 100)}%
              </Text>
            </View>
          </View>

          {/* Info on the right */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: C.text,
                fontFamily: "DMMono_400Regular",
                marginBottom: 2,
              }}
            >
              {fmt(TOTAL_SPENT)}
              <Text style={{ fontSize: 13, fontWeight: "400", color: C.sub }}>
                {" "}
                / {fmt(TOTAL_LIMIT)}
              </Text>
            </Text>
            <Text style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>
              spent this month
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: C.greenBg,
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "700", color: C.green }}
                >
                  {fmt(REMAINING)} remaining
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Category cards ── */}
        <View style={{ marginHorizontal: 12, marginTop: 12, marginBottom: 20 }}>
          {MOCK_BUDGETS.map((b) => {
            const pct = Math.min(b.spent / b.limit, 1);
            const isOver = b.spent > b.limit;
            return (
              <View
                key={b.category}
                style={{
                  backgroundColor: C.card,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: b.color + "22",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{b.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                    >
                      {b.category}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.sub }}>
                      {fmt(b.spent)} of {fmt(b.limit)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      fontFamily: "DMMono_400Regular",
                      color: isOver ? C.red : C.text,
                    }}
                  >
                    {fmt(
                      b.limit - b.spent > 0
                        ? b.limit - b.spent
                        : b.spent - b.limit,
                    )}
                    <Text
                      style={{ fontSize: 10, fontWeight: "400", color: C.sub }}
                    >
                      {" "}
                      {isOver ? "over" : "left"}
                    </Text>
                  </Text>
                </View>

                {/* Progress bar */}
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
                      width: `${pct * 100}%` as any,
                      height: "100%",
                      backgroundColor: isOver ? C.red : b.color,
                      borderRadius: 99,
                    }}
                  />
                </View>

                {isOver && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 8,
                      backgroundColor: C.redBg,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>⚠️</Text>
                    <Text
                      style={{ fontSize: 11, color: C.red, fontWeight: "500" }}
                    >
                      Over budget by {fmt(b.spent - b.limit)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// const DAYS_LEFT = 12;
// const PCT_USED = ((TOTAL_SPENT / MOCK_USER.monthlyBudget) * 100).toFixed(1);
