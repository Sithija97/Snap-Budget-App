import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MOCK_TRANSACTIONS,
  TOTAL_INCOME,
  TOTAL_SPENT,
} from "../../constants/mockData";
import { Transaction } from "../../types";

const C = {
  dark:    "#0F1117",
  green:   "#1D9E75",
  greenBg: "#E6F4EE",
  red:     "#E24B4A",
  redBg:   "#FCEBEB",
  text:    "#0F1117",
  sub:     "#94A3B8",
  border:  "#E8EDF2",
  surface: "#F8F9FA",
  card:    "#FFFFFF",
};

const FILTERS = ["All", "Income", "Food", "Transport", "Shopping", "Bills"];
const fmt = (n: number) => `Rs ${n.toLocaleString()}`;

function groupByDate(txs: Transaction[]) {
  const TODAY     = "2026-05-26";
  const YESTERDAY = "2026-05-25";
  const groups: { label: string; txs: Transaction[] }[] = [];
  const dateMap: Record<string, Transaction[]> = {};

  txs.forEach((tx) => {
    if (!dateMap[tx.date]) dateMap[tx.date] = [];
    dateMap[tx.date].push(tx);
  });

  Object.keys(dateMap)
    .sort((a, b) => b.localeCompare(a))
    .forEach((date) => {
      let label = date;
      if (date === TODAY) label = "Today";
      else if (date === YESTERDAY) label = "Yesterday";
      else {
        const d = new Date(date);
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      groups.push({ label, txs: dateMap[date] });
    });

  return groups;
}

export default function TransactionsScreen() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? MOCK_TRANSACTIONS
      : filter === "Income"
        ? MOCK_TRANSACTIONS.filter((tx) => tx.txType === "inc")
        : MOCK_TRANSACTIONS.filter((tx) =>
            tx.category.toLowerCase().includes(filter.toLowerCase()),
          );

  const groups = groupByDate(filtered);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={["top"]}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: C.card,
          paddingHorizontal: 16,
          paddingTop: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
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
            Records
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["🔍", "⚙️"].map((icon) => (
              <View
                key={icon}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: C.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14 }}>{icon}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Month navigator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 18, color: C.sub }}>‹</Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>
            May 2026
          </Text>
          <Text style={{ fontSize: 18, color: C.sub }}>›</Text>
        </View>

        {/* Income / Expense summary — solid style */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: C.green,
              borderRadius: 14,
              padding: 12,
              shadowColor: C.green,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 3 }}>
              ↓ INCOME
            </Text>
            <Text
              style={{
                fontSize: 15,
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
              backgroundColor: C.red,
              borderRadius: 14,
              padding: 12,
              shadowColor: C.red,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 3 }}>
              ↑ EXPENSE
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#fff",
                fontFamily: "DMMono_400Regular",
              }}
            >
              {fmt(TOTAL_SPENT)}
            </Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 7, paddingBottom: 12 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 99,
                  backgroundColor: filter === f ? C.dark : C.surface,
                  borderWidth: filter === f ? 0 : 1,
                  borderColor: C.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: filter === f ? "#fff" : C.sub,
                  }}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── Transaction groups ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {groups.map((g) => (
          <View
            key={g.label}
            style={{
              marginHorizontal: 14,
              marginTop: 12,
              backgroundColor: C.card,
              borderRadius: 18,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            {/* Group header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.sub,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {g.label}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: C.red,
                  fontFamily: "DMMono_400Regular",
                  fontWeight: "600",
                }}
              >
                {g.txs.filter((t) => t.txType === "exp").reduce((a, t) => a + t.amount, 0) > 0
                  ? `−${fmt(g.txs.filter((t) => t.txType === "exp").reduce((a, t) => a + t.amount, 0))}`
                  : ""}
              </Text>
            </View>

            {/* Rows */}
            {g.txs.map((tx, i) => (
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
                  {tx.txType === "inc" ? "+" : "−"}{fmt(tx.amount)}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
