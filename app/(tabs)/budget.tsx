import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { MOCK_BUDGETS, TOTAL_SPENT, REMAINING } from "../../constants/mockData";
import {
  ShoppingCart, Coffee, Car, ShoppingBag, Smartphone, HeartPulse,
} from "lucide-react-native";

const C = {
  dark:    "#0F1117",
  green:   "#1D9E75",
  greenBg: "#E6F4EE",
  red:     "#E24B4A",
  redBg:   "#FCEBEB",
  amber:   "#EF9F27",
  amberBg: "#FFF4E5",
  text:    "#0F1117",
  sub:     "#94A3B8",
  border:  "#E8EDF2",
  surface: "#F8F9FA",
  card:    "#FFFFFF",
};

const fmt        = (n: number) => `Rs ${n.toLocaleString()}`;
const RING_SIZE  = 96;
const RING_R     = 37;
const RING_CX    = RING_SIZE / 2;
const RING_CY    = RING_SIZE / 2;
const RING_CIRC  = 2 * Math.PI * RING_R;
const TOTAL_LIMIT = MOCK_BUDGETS.reduce((a, b) => a + b.limit, 0);

const CAT_ICONS: Record<string, any> = {
  Groceries: ShoppingCart, Food: Coffee, Transport: Car,
  Shopping: ShoppingBag, Bills: Smartphone, Health: HeartPulse,
};

export default function BudgetScreen() {
  const pctUsed = TOTAL_SPENT / TOTAL_LIMIT;
  const dash    = pctUsed * RING_CIRC;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={["top"]}>
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
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
            Budget
          </Text>
        </View>

        {/* ── Summary ring card ── */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 14,
            backgroundColor: C.dark,
            borderRadius: 20,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
            shadowColor: C.dark,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {/* Ring */}
          <View style={{ width: RING_SIZE, height: RING_SIZE, position: "relative" }}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_CX} cy={RING_CY} r={RING_R}
                stroke="#1E293B" strokeWidth={11} fill="none"
              />
              <Circle
                cx={RING_CX} cy={RING_CY} r={RING_R}
                stroke={C.green}
                strokeWidth={11}
                fill="none"
                strokeDasharray={`${dash} ${RING_CIRC}`}
                strokeDashoffset={RING_CIRC / 4}
                strokeLinecap="round"
              />
            </Svg>
            <View
              style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: C.green,
                  fontFamily: "DMMono_400Regular",
                }}
              >
                {Math.round(pctUsed * 100)}%
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>
              Monthly budget
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#fff",
                fontFamily: "DMMono_400Regular",
              }}
            >
              {fmt(TOTAL_SPENT)}
            </Text>
            <Text style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
              of {fmt(TOTAL_LIMIT)} total
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 99,
                backgroundColor: "rgba(29,158,117,0.2)",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.green }}>
                {fmt(REMAINING)} left
              </Text>
            </View>
          </View>
        </View>

        {/* ── Category cards ── */}
        <View style={{ marginHorizontal: 14, marginTop: 14, marginBottom: 24, gap: 10 }}>
          {MOCK_BUDGETS.map((b) => {
            const pct   = Math.min(b.spent / b.limit, 1);
            const isOver = b.spent > b.limit;
            const barColor = isOver ? C.red : b.color;
            const BIcon = CAT_ICONS[b.category] || ShoppingCart;

            return (
              <View
                key={b.category}
                style={{
                  backgroundColor: C.card,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: b.color + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BIcon size={20} color={b.color} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                      {b.category}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.sub, marginTop: 2, fontFamily: "DMMono_400Regular" }}>
                      {fmt(b.spent)} of {fmt(b.limit)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        fontFamily: "DMMono_400Regular",
                        color: isOver ? C.red : C.text,
                      }}
                    >
                      {fmt(isOver ? b.spent - b.limit : b.limit - b.spent)}
                    </Text>
                    <Text style={{ fontSize: 10, color: C.sub, marginTop: 1 }}>
                      {isOver ? "over limit" : "remaining"}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{ height: 7, backgroundColor: C.border, borderRadius: 99, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${pct * 100}%` as any,
                      height: "100%",
                      backgroundColor: barColor,
                      borderRadius: 99,
                    }}
                  />
                </View>

                {isOver && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 10,
                      backgroundColor: C.redBg,
                      borderRadius: 10,
                      padding: 9,
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>⚠️</Text>
                    <Text style={{ fontSize: 11, color: C.red, fontWeight: "500" }}>
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
