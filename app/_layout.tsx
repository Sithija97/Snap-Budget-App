import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from "@expo-google-fonts/dm-sans";
import { DMMono_400Regular } from "@expo-google-fonts/dm-mono";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider } from "@/context/ThemeContext";
import { useWalletStore } from "@/store/useWalletStore";

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" options={{ presentation: "modal" }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMMono_400Regular,
  });

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();

    // Silently guarantee at least one wallet exists — but only after the
    // persisted state has rehydrated, so we don't duplicate it on later launches
    if (useWalletStore.persist.hasHydrated()) {
      useWalletStore.getState().ensureDefaultWallet();
      return;
    }
    return useWalletStore.persist.onFinishHydration(() =>
      useWalletStore.getState().ensureDefaultWallet()
    );
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
