import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingDown, Target } from "lucide-react-native";
import {
  MOCK_USER,
  MOCK_TRANSACTIONS,
  TOTAL_SPENT,
  REMAINING,
} from "../../constants/mockData";
import SectionTitle from "../../components/ui/SectionTitle";
import StatChip from "../../components/ui/StatChip";
import TransactionItem from "../../components/ui/TransactionItem";

export default function HomeScreen() {
  const recentFour = MOCK_TRANSACTIONS.slice(0, 4);

  return (
    <SafeAreaView className="flex-1 bg-brand-surface" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Debit card header */}
        <View
          className="mx-4 mt-0 rounded-3xl overflow-hidden"
          style={{ backgroundColor: "#0F1117" }}
        >
          {/* Background glow circles */}
          <View
            style={{
              position: "absolute",
              top: -55,
              right: -55,
              width: 210,
              height: 210,
              borderRadius: 105,
              backgroundColor: "#1D9E75",
              opacity: 0.13,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -70,
              right: 5,
              width: 250,
              height: 250,
              borderRadius: 125,
              backgroundColor: "#1D9E75",
              opacity: 0.07,
            }}
          />

          <View style={{ padding: 20 }}>
            {/* Row 1: chip + logo */}
            <View className="flex-row items-center justify-between">
              {/* EMV chip */}
              <View
                style={{
                  width: 38,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: "#B8892A",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    height: 1,
                    left: 0,
                    right: 0,
                    top: 9,
                    backgroundColor: "rgba(0,0,0,0.3)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    height: 1,
                    left: 0,
                    right: 0,
                    bottom: 9,
                    backgroundColor: "rgba(0,0,0,0.3)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    width: 1,
                    top: 0,
                    bottom: 0,
                    left: 13,
                    backgroundColor: "rgba(0,0,0,0.25)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    width: 1,
                    top: 0,
                    bottom: 0,
                    right: 13,
                    backgroundColor: "rgba(0,0,0,0.25)",
                  }}
                />
              </View>

              {/* Logo area */}
              <View className="flex-row items-center gap-2">
                <Text
                  style={{
                    color: "white",
                    fontSize: 13,
                    fontWeight: "500",
                    opacity: 0.55,
                    letterSpacing: 0.5,
                  }}
                >
                  SnapBudget
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#E24B4A",
                      opacity: 0.85,
                    }}
                  />
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#EF9F27",
                      opacity: 0.85,
                      marginLeft: -8,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Amount */}
            <Text
              className="text-white font-mono"
              style={{ fontSize: 34, fontWeight: "600", marginTop: 28 }}
            >
              Rs {TOTAL_SPENT.toLocaleString()}
            </Text>
            <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>
              spent this month
            </Text>

            {/* Trend badges */}
            <View className="flex-row gap-2 mt-3">
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                style={{ backgroundColor: "rgba(226,75,74,0.15)" }}
              >
                <TrendingDown size={11} color="#E24B4A" />
                <Text style={{ color: "#E24B4A", fontSize: 11 }}>
                  12% vs last month
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                style={{ backgroundColor: "rgba(29,158,117,0.15)" }}
              >
                <Target size={11} color="#1D9E75" />
                <Text style={{ color: "#1D9E75", fontSize: 11 }}>
                  Rs {REMAINING.toLocaleString()} left
                </Text>
              </View>
            </View>

            {/* Bottom row: holder + period */}
            <View className="flex-row items-end justify-between mt-5">
              <View>
                <Text
                  style={{
                    color: "#475569",
                    fontSize: 9,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Card Holder
                </Text>
                <Text
                  style={{
                    color: "white",
                    fontSize: 13,
                    fontWeight: "500",
                    marginTop: 3,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {MOCK_USER.name}
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    color: "#475569",
                    fontSize: 9,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Period
                </Text>
                <Text
                  style={{
                    color: "white",
                    fontSize: 13,
                    fontWeight: "500",
                    marginTop: 3,
                  }}
                >
                  05 / 2026
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stat chips grid */}
        <View className="flex-row gap-2 mx-4 mt-4">
          <StatChip label="Income" value="Rs 50k" sub="this month" />
          <StatChip
            label="Saved"
            value={`Rs ${REMAINING.toLocaleString()}`}
            sub="14.3% of income"
            valueColor="#1D9E75"
          />
        </View>

        {/* Recent transactions */}
        <View className="mx-4 mt-4 pb-6">
          <SectionTitle title="Recent transactions" />
          {recentFour.map((tx) => (
            <TransactionItem key={tx.id} {...tx} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
