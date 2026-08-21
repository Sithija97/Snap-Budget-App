import "../global.css";
import { useEffect } from "react";
import { View, AppState } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
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
import { useReminderStore } from "@/store/useReminderStore";
import { syncFinanceReminders, shouldResyncFinanceReminders } from "@/lib/financeReminders";

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
      {/* Edge-to-edge (android/gradle.properties: edgeToEdgeEnabled=true)
          means the OS status bar is a transparent overlay drawn on top of
          app content, not a colored native chrome bar — style="auto" then
          picks light/dark status bar icons to match the current theme so
          they stay legible against whatever's underneath. */}
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          // Native screen transitions briefly reveal this container's own
          // background at the edge before the incoming screen's content
          // paints — without an explicit dark value here it defaults to
          // white, showing as a flash/sliver during push/pop in dark mode.
          // Values match tailwind.config.js's background token.
          contentStyle: { backgroundColor: isDark ? "#0b0f19" : "#f1f5f9" },
        }}
      >
        <Stack.Protected guard={!!isSignedIn}>
          <Stack.Screen name="index" />
          <Stack.Screen name="scan" options={{ presentation: "modal" }} />
          <Stack.Screen name="budget-form" options={{ presentation: "modal" }} />
          <Stack.Screen name="wallet-form" options={{ presentation: "modal" }} />
          <Stack.Screen name="category-form" options={{ presentation: "modal" }} />
          <Stack.Screen name="transaction/[id]" options={{ presentation: "modal" }} />
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
  // Blocks first render — 400/500/600/700 cover every UIText variant used
  // app-wide, so they must be ready before anything paints. Stands in for
  // SF Pro Display/Rounded (iOS system font): Apple's license doesn't permit
  // bundling the actual SF Pro font files in a cross-platform app, so Inter
  // is used as the closest open-license match on both platforms.
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // 800/900 are only reached for the one Home-screen hero number — split out
  // non-blocking (same reasoning DM Mono used to get) so first paint isn't
  // gated on two extra, heavier font files that most screens never touch.
  useFonts({ Inter_800ExtraBold, Inter_900Black });

  // Registered once at the root (not sign-in-gated) so a tap that arrives
  // while the app is cold-starting isn't missed — Stack.Protected still
  // keeps the destination screen itself behind auth.
  useEffect(() => {
    const subscription = registerCaptureNotificationTapHandler();
    return () => subscription.remove();
  }, []);

  // Morning/evening finance-tip reminders are device-local settings (like
  // theme), not user data — hydrated and synced here regardless of sign-in
  // state. DAILY triggers are OS-native repeating alarms that persist and
  // refire on their own, so the foreground listener only re-syncs when
  // shouldResyncFinanceReminders() says enough time has passed to be worth
  // rotating in a fresh random tip — not on every single foreground return.
  useEffect(() => {
    useReminderStore
      .getState()
      .hydrate()
      .then(() => syncFinanceReminders(useReminderStore.getState().settings()))
      .catch((e) => console.warn("Failed to hydrate finance reminders", e));

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (!useReminderStore.getState().hydrated) return;
      if (!shouldResyncFinanceReminders()) return;
      syncFinanceReminders(useReminderStore.getState().settings()).catch((e) =>
        console.warn("Failed to sync finance reminders", e)
      );
    });
    return () => sub.remove();
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
