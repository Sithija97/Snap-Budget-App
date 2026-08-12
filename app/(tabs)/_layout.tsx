import { View, Text } from "react-native";
import { Tabs, router } from "expo-router";
import {
  House,
  ScanLine,
  List,
  ChartPie,
  Settings2,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_BLUE } from "@/constants/colors";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type TabItem =
  | { isAction: true; name: string; Icon: LucideIcon; label: string }
  | { isAction?: false; name: string; Icon: LucideIcon; label: string };

const TABS: TabItem[] = [
  { name: "index", Icon: House, label: "Home" },
  { name: "transactions", Icon: List, label: "Transactions" },
  { name: "scan-tab", Icon: ScanLine, label: "Scan", isAction: true },
  { name: "budget", Icon: ChartPie, label: "Budget" },
  { name: "settings", Icon: Settings2, label: "Settings" },
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
  const { isDark } = useTheme();
  const activeColor = isDark ? "#fafafa" : "#09090b";
  const inactiveColor = isDark ? "#a1a1aa" : "#71717a";
  const borderColor = isDark ? "#27272a" : "#e4e4e7";
  const bgColor = isDark ? "#09090b" : "#ffffff";

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: bgColor,
        borderTopWidth: 1,
        borderTopColor: borderColor,
        height: 60 + Math.max(insets.bottom, 0),
        paddingBottom: Math.max(insets.bottom, 0),
      }}
    >
      {TABS.map((tab) => {
        if (tab.isAction) {
          return (
            <AnimatedPressable
              key={tab.name}
              pressScale={0.9}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
              }}
              contentStyle={{ alignItems: "center" }}
              onPress={() => router.push("/scan")}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: BRAND_BLUE,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <tab.Icon size={20} color="#ffffff" strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: inactiveColor,
                  marginTop: 2,
                  fontFamily: "DMSans_400Regular",
                }}
              >
                {/* {tab.label} */}
              </Text>
            </AnimatedPressable>
          );
        }

        // Match by route name — index positions shift as routes (e.g. analytics) register
        const isFocused = state.routes[state.index]?.name === tab.name;
        const color = isFocused ? activeColor : inactiveColor;

        return (
          <AnimatedPressable
            key={tab.name}
            pressScale={0.92}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            contentStyle={{ alignItems: "center" }}
            onPress={() => navigation.navigate(tab.name)}
          >
            <tab.Icon
              size={22}
              color={color}
              strokeWidth={isFocused ? 2.2 : 1.8}
            />
            <Text
              style={{
                fontSize: 11,
                color,
                marginTop: 2,
                fontFamily: isFocused ? "DMSans_500Medium" : "DMSans_400Regular",
              }}
            >
              {tab.label}
            </Text>
          </AnimatedPressable>
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
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
