import * as Notifications from "expo-notifications";
import { randomFinanceTip } from "@/constants/financeTips";
import { ReminderSettings } from "@/store/useReminderStore";

export const REMINDER_CHANNEL_ID = "finance-reminders";

// Tags in each scheduled notification's data payload — used to find and
// cancel exactly these two notifications (and no others, e.g. the unrelated
// "Transaction captured" ones from lib/notificationCapture.ts) without
// storing identifiers anywhere ourselves.
const MORNING_TAG = "finance-reminder-morning";
const EVENING_TAG = "finance-reminder-evening";

async function ensureChannel() {
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Finance tips",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function cancelReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter(
    (n) => n.content.data?.tag === MORNING_TAG || n.content.data?.tag === EVENING_TAG
  );
  await Promise.all(ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

async function doSync(settings: ReminderSettings) {
  await cancelReminderNotifications();
  if (!settings.enabled) return;

  await ensureChannel();

  await Promise.all([
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Good morning",
        body: randomFinanceTip(),
        data: { tag: MORNING_TAG },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.morningHour,
        minute: settings.morningMinute,
        channelId: REMINDER_CHANNEL_ID,
      },
    }),
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Evening check-in",
        body: randomFinanceTip(),
        data: { tag: EVENING_TAG },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.eveningHour,
        minute: settings.eveningMinute,
        channelId: REMINDER_CHANNEL_ID,
      },
    }),
  ]);
}

// Serializes overlapping calls instead of letting them race — the
// cancel-then-schedule sequence isn't safe to run concurrently (two
// simultaneous callers can both read the "before" scheduled list and both
// reschedule, leaving duplicates). Chaining onto the previous call's promise
// (success or failure) means a caller that fires while another sync is still
// in flight simply queues behind it rather than interleaving with it.
let syncChain: Promise<void> = Promise.resolve();
let lastSyncedAt = 0;

export function syncFinanceReminders(settings: ReminderSettings): Promise<void> {
  lastSyncedAt = Date.now();
  syncChain = syncChain.catch(() => {}).then(() => doSync(settings));
  return syncChain;
}

// A DAILY trigger is an OS-native repeating alarm that persists and refires
// on its own — re-syncing on every foreground return would just be a
// redundant cancel+reschedule round-trip. The only reason to re-sync
// opportunistically (rather than only on an explicit settings change) is to
// rotate in a fresh random tip roughly once a day; anything sooner than that
// is wasted work, so callers should gate on this rather than syncing
// unconditionally on every AppState "active" event.
const RESYNC_INTERVAL_MS = 20 * 60 * 60 * 1000; // 20h — comfortably under a day

export function shouldResyncFinanceReminders(): boolean {
  return Date.now() - lastSyncedAt >= RESYNC_INTERVAL_MS;
}
