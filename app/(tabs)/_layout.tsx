import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Tabs, router } from "expo-router";
import { Home, List, ScanLine, PieChart, BarChart2 } from "lucide-react-native";

const TAB_ITEMS = [
  { name: "index", icon: Home, label: "Home", routeIndex: 0 },
  { name: "transactions", icon: List, label: "History", routeIndex: 1 },
  null,
  { name: "budget", icon: PieChart, label: "Budget", routeIndex: 2 },
  { name: "analytics", icon: BarChart2, label: "Stats", routeIndex: 3 },
] as const;

function CustomTabBar({
  state,
  navigation,
}: {
  state: any;
  navigation: any;
  descriptors: any;
  insets: any;
}) {
  const bottomPad = Platform.OS === "ios" ? 20 : 8;

  return (
    <View
      className="flex-row bg-white border-t border-brand-border pt-2"
      style={{ paddingBottom: bottomPad }}
    >
      {TAB_ITEMS.map((item, index) => {
        if (!item) {
          return (
            <View key="scan" className="flex-1 items-center justify-end mb-1">
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                activeOpacity={0.85}
                className="w-[46px] h-[46px] rounded-[23px] bg-brand-green items-center justify-center mb-4 border-[3px] border-white"
                style={{
                  shadowColor: "#1D9E75",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <ScanLine size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }

        const isFocused = state.index === item.routeIndex;
        const IconComponent = item.icon;

        return (
          <TouchableOpacity
            key={item.name}
            className="flex-1 items-center justify-center gap-0.5"
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <IconComponent
              size={22}
              color={isFocused ? "#0F1117" : "#94A3B8"}
            />
            <Text
              className={`text-[10px] ${isFocused ? "text-brand-black" : "text-brand-muted"}`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="transactions" options={{ title: "History" }} />
      <Tabs.Screen name="budget" options={{ title: "Budget" }} />
      <Tabs.Screen name="analytics" options={{ title: "Stats" }} />
    </Tabs>
  );
}
