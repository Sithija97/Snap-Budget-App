import { View, Text, TouchableOpacity } from "react-native";
import { Tabs, router } from "expo-router";

const GREEN = "#00C170";
const SUB = "#8A94A6";
const BORDER = "#F0F2F7";
const CARD = "#FFFFFF";

const TAB_ITEMS = [
  { name: "index", emoji: "🏠", label: "Home", routeIndex: 0 },
  { name: "transactions", emoji: "📋", label: "Records", routeIndex: 1 },
  null,
  { name: "budget", emoji: "📊", label: "Budget", routeIndex: 2 },
  { name: "analytics", emoji: "📈", label: "Reports", routeIndex: 3 },
];

function CustomTabBar({
  state,
  navigation,
  insets,
}: {
  state: any;
  navigation: any;
  descriptors: any;
  insets: any;
}) {
  return (
    <View
      style={{
        backgroundColor: CARD,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 6,
        flexDirection: "row",
      }}
    >
      {TAB_ITEMS.map((item, index) => {
        if (!item) {
          return (
            <View
              key="scan"
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                activeOpacity={0.85}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: GREEN,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -20,
                }}
              >
                <Text style={{ fontSize: 22 }}>➕</Text>
              </TouchableOpacity>
            </View>
          );
        }

        const isFocused = state.index === item.routeIndex;

        return (
          <TouchableOpacity
            key={item.name}
            style={{ flex: 1, alignItems: "center", paddingVertical: 2 }}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 17, opacity: isFocused ? 1 : 0.45 }}>
              {item.emoji}
            </Text>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "500",
                color: isFocused ? GREEN : SUB,
                marginTop: 2,
              }}
            >
              {item.label}
            </Text>
            {isFocused && (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: GREEN,
                  marginTop: 1,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="budget" />
      <Tabs.Screen name="analytics" />
    </Tabs>
  );
}
