import { View, Text, TouchableOpacity } from "react-native";
import { Tabs, router } from "expo-router";
import { House, List, ChartPie, ChartBar, ScanLine } from "lucide-react-native";
import { Colors } from "@/constants/theme";

const TAB_ITEMS = [
  { name: "index",        Icon: House,    label: "Home",    routeIndex: 0 },
  { name: "transactions", Icon: List,     label: "Records", routeIndex: 1 },
  null,
  { name: "budget",       Icon: ChartPie, label: "Budget",  routeIndex: 2 },
  { name: "analytics",    Icon: ChartBar, label: "Reports", routeIndex: 3 },
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
      className="bg-brand-card border-t border-brand-border flex-row pt-2"
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {TAB_ITEMS.map((item, _index) => {
        if (!item) {
          return (
            <View key="scan" className="flex-1 items-center justify-center">
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                activeOpacity={0.85}
                className="w-[52px] h-[52px] rounded-full bg-brand-green items-center justify-center border-[3px] border-brand-card"
                style={{
                  marginTop: -26,
                  shadowColor: Colors.green,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 8,
                }}
              >
                <ScanLine size={22} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          );
        }

        const isFocused  = state.index === item.routeIndex;
        const iconColor  = isFocused ? Colors.green : Colors.muted;

        return (
          <TouchableOpacity
            key={item.name}
            className="flex-1 items-center py-0.5"
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <item.Icon size={20} color={iconColor} strokeWidth={isFocused ? 2.5 : 1.8} />
            <Text
              className="text-[9px] font-semibold mt-[3px]"
              style={{ color: iconColor }}
            >
              {item.label}
            </Text>
            {isFocused && (
              <View className="w-1 h-1 rounded-full bg-brand-green mt-0.5" />
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
