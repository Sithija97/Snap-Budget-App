import NotificationListener, {
  CapturedNotification,
  isNotificationCaptureSupported,
} from "expo-notification-listener";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { AppState, NativeEventSubscription } from "react-native";
import { useCaptureStore } from "@/store/useCaptureStore";
import { CapturedSuggestion } from "@/types/capture";
import { TxType } from "@/types";
import { parseNotificationText, isDuplicateNotification } from "@/utils/notificationParser";
import { api } from "@/lib/api";
import { toISODate } from "@/utils/dates";
import { tempId } from "@/utils/tempId";

export const CAPTURE_CHANNEL_ID = "transaction-capture";
const CAPTURE_ROUTE = "/captured";

export const isNotificationCaptureSupportedPlatform = isNotificationCaptureSupported;

let subscription: { remove: () => void } | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel() {
  await Notifications.setNotificationChannelAsync(CAPTURE_CHANNEL_ID, {
    name: "Captured transactions",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 150],
  });
}

// Fire-and-forget FYI local notification — no push token, no server
// round-trip, just "we found this and put it in your inbox" (see the
// 2026-08-10 scoping decision in PLAN.md §7: full push-driven review is a
// follow-up once this can be tested on a device).
async function notifyCaptured(suggestion: CapturedSuggestion) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  const amountText = `Rs ${suggestion.amount.toLocaleString("en-US")}`;
  const merchantText = suggestion.merchant ? ` from ${suggestion.merchant}` : "";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Transaction captured",
      body: `Added ${amountText} transaction${merchantText} to your review inbox.`,
      data: { url: CAPTURE_ROUTE },
    },
    trigger: null,
  });
}

async function handleNotification(event: CapturedNotification) {
  const fullText = [event.title, event.text, event.bigText, event.subText].filter(Boolean).join(" ").trim();
  const { addSuggestion, allowlist } = useCaptureStore.getState();

  const parsed = parseNotificationText(event.packageName, fullText);

  let amount = parsed?.amount ?? null;
  let merchant = parsed?.merchant ?? null;
  let categoryName: string | null = null;
  let txType: TxType = parsed?.txType ?? TxType.Expense;
  let source: CapturedSuggestion["source"] = parsed ? "regex" : "gemini";
  // Prefer the date printed in the notification text (e.g. a card
  // authorisation SMS's "on 07/08/26") over when Android delivered it — a
  // delayed SMS relay would otherwise misattribute the transaction to the
  // wrong day.
  let date = parsed?.date ?? toISODate(new Date(event.postTime));

  if (!parsed && fullText) {
    // On-device regex found nothing — try the Gemini fallback
    // (server/src/lib/assistant.ts's extractTransactionFromText), which also
    // classifies the notification (OTP, marketing, statement-ready, etc. all
    // come back as isTransaction: false / draft: undefined) rather than just
    // attempting extraction — a network/API failure here just means this
    // notification is silently skipped, same as any other non-transaction.
    try {
      const { draft } = await api.post<{ draft: null | { merchant: string; amount: number; categoryName: string; txType: "inc" | "exp"; date: string } }>(
        "/api/assistant/parse-notification",
        { text: fullText, postedAt: new Date(event.postTime).toISOString() }
      );
      if (draft) {
        amount = draft.amount;
        merchant = draft.merchant;
        categoryName = draft.categoryName;
        txType = draft.txType === "inc" ? TxType.Income : TxType.Expense;
        date = draft.date;
      }
    } catch (e) {
      console.warn("Notification Gemini fallback failed", e);
    }
  }

  // Neither the on-device templates nor Gemini found a real transaction
  // amount — this covers OTPs, marketing, balance-check confirmations,
  // and every other non-transactional notification from an allowlisted
  // app/source. Only a confirmed amount ever reaches the review inbox or
  // triggers a "Transaction captured" push, per the app's "only capture
  // real transactions" contract — nothing generic gets surfaced just
  // because it came from a watched package.
  if (amount === null) return;

  // Re-read from the store rather than a snapshot taken before the Gemini
  // fallback's await — two near-simultaneous notifications for the same
  // payment (e.g. an app push + an SMS relay) can both reach here after
  // both took the async fallback path, and a pre-await snapshot would miss
  // whichever one's addSuggestion() already landed in the meantime.
  const dupHistory = useCaptureStore
    .getState()
    .suggestions.filter((s) => s.status !== "dismissed")
    .map((s) => ({ amount: s.amount ?? -1, postTimeMs: s.postTimeMs }));
  if (isDuplicateNotification(amount, event.postTime, dupHistory)) return;

  const appLabel = allowlist.find((a) => a.packageName === event.packageName)?.label ?? event.packageName;

  const suggestion: CapturedSuggestion = {
    id: tempId(),
    packageName: event.packageName,
    appLabel,
    rawText: fullText,
    postTimeMs: event.postTime,
    source,
    amount,
    merchant,
    categoryName,
    txType,
    date,
    status: "pending",
  };

  await addSuggestion(suggestion);
  await notifyCaptured(suggestion);
}

// Wired from AuthBridge (app/_layout.tsx), matching the other stores'
// sign-in-gated setup — starts the native listener and keeps its allowlist
// in sync with useCaptureStore. No-ops entirely on iOS/web (see
// isNotificationCaptureSupported), so callers don't need their own platform
// checks.
export function startNotificationCapture() {
  if (!isNotificationCaptureSupported) return;

  // Calling this twice without an intervening stopNotificationCapture() (Fast
  // Refresh during dev, or isSignedIn flipping true twice before the async
  // hydrate().then(startNotificationCapture) chain in AuthBridge resolves)
  // would otherwise overwrite `subscription`/`appStateSubscription` and leak
  // the previous listener — it'd keep firing, so a single real notification
  // would be handled once per orphaned listener. Tearing down first makes
  // this function safe to call repeatedly.
  stopNotificationCapture();

  ensureAndroidChannel().catch((e) => console.warn("Failed to set up capture notification channel", e));

  const applyAllowlist = () => {
    const packages = useCaptureStore.getState().allowlist.map((a) => a.packageName);
    NotificationListener.setAllowedPackages(packages);
  };
  applyAllowlist();

  subscription = NotificationListener.addListener("onNotification", (event) => {
    handleNotification(event).catch((e) => console.error("Failed to handle captured notification", e));
  });

  // The listener service can be created by Android independently of app
  // foreground state; re-applying the allowlist when the app returns to
  // foreground guards against it having started with a stale/default list.
  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") applyAllowlist();
  });
}

export function stopNotificationCapture() {
  subscription?.remove();
  subscription = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
}

export function isCaptureAccessGranted(): boolean {
  if (!isNotificationCaptureSupported) return false;
  return NotificationListener.isAccessGranted();
}

export function openCaptureAccessSettings(): void {
  if (!isNotificationCaptureSupported) return;
  NotificationListener.openAccessSettings();
}

// Tapping the "Transaction captured" notification should open the inbox —
// registered once from the root layout.
export function registerCaptureNotificationTapHandler(): { remove: () => void } {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === "string") router.push(url as any);
  });
}
