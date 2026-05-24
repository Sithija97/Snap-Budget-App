import { View, TouchableOpacity, Platform } from "react-native";
import { Tabs, router } from "expo-router";
import { Home, List, ScanLine, PieChart, BarChart2 } from "lucide-react-native";

const TAB_ITEMS = [
  { name: "index", icon: Home, routeIndex: 0 },
  { name: "transactions", icon: List, routeIndex: 1 },
  null,
  { name: "budget", icon: PieChart, routeIndex: 2 },
  { name: "analytics", icon: BarChart2, routeIndex: 3 },
] as const;

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
      className="bg-brand-surface px-5"
      style={{ paddingBottom: Math.max(insets.bottom, 12), paddingTop: 8 }}
    >
      <View
        className="flex-row rounded-full bg-brand-black items-center"
        style={{
          height: 64,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        {TAB_ITEMS.map((item, index) => {
          if (!item) {
            return (
              <View key="scan" className="flex-1 items-center justify-center">
                <TouchableOpacity
                  onPress={() => router.push("/scan")}
                  activeOpacity={0.85}
                  className="w-[50px] h-[50px] rounded-full bg-brand-green items-center justify-center"
                  style={{
                    shadowColor: "#1D9E75",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <ScanLine size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }

          const isFocused = state.index === item.routeIndex;
          const IconComponent = item.icon;

          return (
            <TouchableOpacity
              key={item.name}
              className="flex-1 items-center justify-center gap-1"
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <IconComponent
                size={22}
                color={isFocused ? "#1D9E75" : "rgba(255,255,255,0.4)"}
              />
              {isFocused && (
                <View className="w-1 h-1 rounded-full bg-brand-green" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
