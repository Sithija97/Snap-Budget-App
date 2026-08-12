import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
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
import { useMessagingStore } from "@/store/useMessagingStore";
import { useRecapStore } from "@/store/useRecapStore";
import { useCaptureStore } from "@/store/useCaptureStore";
import {
  startNotificationCapture,
  stopNotificationCapture,
  registerCaptureNotificationTapHandler,
} from "@/lib/notificationCapture";

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
      useMessagingStore.getState().reset();
      useRecapStore.getState().reset();
      stopNotificationCapture();
      return;
    }
    // Fire the four core fetches in parallel once signed in (and again on any
    // future sign-in, e.g. after a sign-out/sign-in cycle in the same session)
    Promise.all([
      useWalletStore.getState().fetchAll(),
      useCategoryStore.getState().fetchAll(),
      useBudgetStore.getState().fetchAll(),
      useTransactionStore.getState().fetchAll(),
    ]).catch((e) => console.error("Initial data fetch failed", e));

    // Kept out of the Promise.all above: a failure here (e.g. the API not
    // having the messaging routes deployed yet) is a real, expected
    // possibility during rollout and shouldn't be logged as if core app data
    // failed to load — the store's default (not linked) is a fine fallback.
    useMessagingStore.getState().fetchStatus().catch((e) => console.warn("Messaging status fetch failed", e));
    useRecapStore.getState().fetchAll().catch((e) => console.warn("Recap fetch failed", e));

    // Capture's allowlist/inbox is local-only (AsyncStorage, no backend), so
    // it's hydrated rather than fetched — then the native listener (Android
    // only, no-ops elsewhere) is started against whatever allowlist was saved.
    useCaptureStore
      .getState()
      .hydrate()
      .then(() => startNotificationCapture())
      .catch((e) => console.warn("Capture hydration failed", e));
  }, [isSignedIn]);

  return <>{children}</>;
}

function InnerLayout() {
  const { isSignedIn } = useAuth();
  const { isDark, hydrated } = useTheme();

  // Splash screen stays up (see RootLayout) until fonts AND the saved theme
  // are both ready — hides here, inside ThemeProvider, since that's the only
  // place `hydrated` is available. Gating hideAsync() on this is what
  // prevents the "wrong theme for a moment" flash on cold start: the first
  // frame the user ever sees already has the correct dark: resolution.
  useEffect(() => {
    if (!hydrated) return;
    // hideAsync() can reject (e.g. called when there's no splash screen left
    // to hide) — never let that surface as an unhandled promise rejection.
    SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

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
          <Stack.Screen name="captured" />
          <Stack.Screen name="notification-capture" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  // Blocks first render — DM Sans is used everywhere (headings, body text),
  // so it must be ready before anything paints. DM Mono is split into its
  // own non-blocking call below: it's only used for money amounts, which
  // are never shown before real data arrives (skeletons cover that gap on
  // every screen), and it's unused on the login screen entirely — loading it
  // here would otherwise serialize font-loading in front of Clerk's own
  // (larger) init instead of letting the two overlap.
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  useFonts({ DMMono_400Regular });

  // Registered once at the root (not sign-in-gated) so a tap that arrives
  // while the app is cold-starting isn't missed — Stack.Protected still
  // keeps the destination screen itself behind auth.
  useEffect(() => {
    const subscription = registerCaptureNotificationTapHandler();
    return () => subscription.remove();
  }, []);

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
