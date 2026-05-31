import { View, Text, TouchableOpacity } from "react-native";
import { Tabs, router } from "expo-router";
import { House, List, ChartPie, ChartBar, ScanLine } from "lucide-react-native";

const C = {
  green:   "#1D9E75",
  dark:    "#0F1117",
  sub:     "#94A3B8",
  border:  "#E8EDF2",
  card:    "#FFFFFF",
};

const TAB_ITEMS = [
  { name: "index",        Icon: House,    label: "Home",    routeIndex: 0 },
  { name: "transactions", Icon: List,     label: "Records", routeIndex: 1 },
  null,
  { name: "budget",       Icon: ChartPie, label: "Budget",  routeIndex: 2 },
  { name: "analytics",   Icon: ChartBar,  label: "Reports", routeIndex: 3 },
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
        backgroundColor: C.card,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
        flexDirection: "row",
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
            <View
              key="scan"
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                activeOpacity={0.85}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: C.green,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -26,
                  shadowColor: C.green,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 8,
                  borderWidth: 3,
                  borderColor: C.card,
                }}
              >
                <ScanLine size={22} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          );
        }

        const isFocused = state.index === item.routeIndex;
        const iconColor = isFocused ? C.green : C.sub;

        return (
          <TouchableOpacity
            key={item.name}
            style={{ flex: 1, alignItems: "center", paddingVertical: 2 }}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <item.Icon size={20} color={iconColor} strokeWidth={isFocused ? 2.5 : 1.8} />
            <Text
              style={{
                fontSize: 9,
                fontWeight: "600",
                color: iconColor,
                marginTop: 3,
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
                  backgroundColor: C.green,
                  marginTop: 2,
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
