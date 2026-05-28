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
  green: "#00C170",
  red: "#FF5A5F",
  text: "#1A1D23",
  sub: "#8A94A6",
  border: "#F0F2F7",
  bg: "#F5F7FC",
  card: "#FFFFFF",
};

const FILTERS = ["All", "Income", "Food", "Transport", "Shopping", "Bills"];
const fmt = (n: number) => `Rs ${n.toLocaleString()}`;

function groupByDate(txs: Transaction[]) {
  const TODAY = "2026-05-26";
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
        label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
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
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: C.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14 }}>🔍</Text>
            </View>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: C.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14 }}>⚙️</Text>
            </View>
          </View>
        </View>

        {/* Month navigator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, color: C.sub }}>‹</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
            May 2026
          </Text>
          <Text style={{ fontSize: 16, color: C.sub }}>›</Text>
        </View>

        {/* Inc / Exp summary */}
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: C.sub, marginBottom: 2 }}>
              INCOME
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: C.green,
                fontFamily: "DMMono_400Regular",
              }}
            >
              {fmt(TOTAL_INCOME)}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: C.border }} />
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: C.sub, marginBottom: 2 }}>
              EXPENSE
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: C.red,
                fontFamily: "DMMono_400Regular",
              }}
            >
              {fmt(TOTAL_SPENT)}
            </Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 6, paddingBottom: 12 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 99,
                  backgroundColor: filter === f ? C.green : C.bg,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
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
              marginHorizontal: 12,
              marginTop: 10,
              backgroundColor: C.card,
              borderRadius: 18,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
                paddingHorizontal: 16,
                paddingBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: C.sub,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {g.label}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: C.red,
                  fontFamily: "DMMono_400Regular",
                  fontWeight: "500",
                }}
              >
                {g.txs
                  .filter((t) => t.txType === "exp")
                  .reduce((a, t) => a + t.amount, 0) > 0
                  ? `\u2212${fmt(g.txs.filter((t) => t.txType === "exp").reduce((a, t) => a + t.amount, 0))}`
                  : ""}
              </Text>
            </View>
            {g.txs.map((tx, i) => (
              <View
                key={tx.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 11,
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderBottomWidth: i < g.txs.length - 1 ? 1 : 0,
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
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// const FILTERS = ["All", "Food", "Transport", "Bills", "Shopping"];

// function groupByDate(transactions: Transaction[]) {
//   const today = "2026-05-22";
//   const yesterday = "2026-05-21";

//   const groups: { title: string; data: Transaction[] }[] = [];
//   const dateMap: Record<string, Transaction[]> = {};

//   transactions.forEach((tx) => {
//     if (!dateMap[tx.date]) dateMap[tx.date] = [];
//     dateMap[tx.date].push(tx);
//   });

//   Object.keys(dateMap)
//     .sort((a, b) => b.localeCompare(a))
//     .forEach((date) => {
//       let title = date;
//       if (date === today) title = "Today";
//       else if (date === yesterday) title = "Yesterday";
//       else {
//         const d = new Date(date);
//         title = d.toLocaleDateString("en-US", {
//           month: "long",
//           day: "numeric",
//         });
//       }
//       groups.push({ title, data: dateMap[date] });
//     });

//   return groups;
// }
