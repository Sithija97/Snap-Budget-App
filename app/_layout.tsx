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
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { tokenCache } from "@/lib/tokenCache";
import { setTokenGetter } from "@/lib/api";
import { useWalletStore } from "@/store/useWalletStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useTransactionStore } from "@/store/useTransactionStore";

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Feeds the current Clerk session's getToken() into the module-level api
// client (see lib/api.ts) — needed because Zustand store actions run outside
// React and can't call the useAuth() hook directly.
function AuthBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn) {
      useWalletStore.getState().reset();
      useCategoryStore.getState().reset();
      useBudgetStore.getState().reset();
      useTransactionStore.getState().reset();
      return;
    }
    // Fire all four fetches in parallel once signed in (and again on any
    // future sign-in, e.g. after a sign-out/sign-in cycle in the same session)
    Promise.all([
      useWalletStore.getState().fetchAll(),
      useCategoryStore.getState().fetchAll(),
      useBudgetStore.getState().fetchAll(),
      useTransactionStore.getState().fetchAll(),
    ]).catch((e) => console.error("Initial data fetch failed", e));
  }, [isSignedIn]);

  return <>{children}</>;
}

function InnerLayout() {
  const { isSignedIn } = useAuth();
  const { isDark } = useTheme();

  // NativeWind's colorScheme.set() (see ThemeContext) drives dark: variant
  // resolution on native, but on web Tailwind's darkMode:"class" strategy
  // still needs a real `.dark` ancestor class in the DOM — without this,
  // every `dark:*` className in the app silently never activates.
  return (
    <View className={isDark ? "dark flex-1" : "flex-1"}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scan" options={{ presentation: "modal" }} />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="login" />
        </Stack.Protected>
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
  }, [loaded]);

  if (!loaded) return null;

  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set — check your .env file");
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthBridge>
              <InnerLayout />
            </AuthBridge>
          </ThemeProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
