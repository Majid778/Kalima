// src/services/notifications/notificationRuntime.ts
// Thin runtime over expo-notifications for LOCAL, offline review reminders.
// Guarded by prefs.enabled; SM-2-tied via getDueCountsByDate. No network.

import * as Notifications from 'expo-notifications';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type * as schema from '../../data/schema';
import { useSettingsStore } from '../../stores/settingsStore';
import { getDueCountsByDate } from '../practiceService';
import { computeReviewSchedule } from './reviewSchedule';

type DB = ExpoSQLiteDatabase<typeof schema>;

const KALIMA_REVIEW_TAG = 'kalima-review';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelAllReviewNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content?.data?.tag === KALIMA_REVIEW_TAG)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // best-effort; never throw to the UI
  }
}

/**
 * Recompute and (re)schedule local review reminders. Offline; opt-in.
 */
export async function syncReviewNotifications(db: DB, today: string): Promise<void> {
  const prefs = useSettingsStore.getState().notifications;
  if (!prefs.enabled) {
    await cancelAllReviewNotifications();
    return;
  }
  try {
    await cancelAllReviewNotifications();
    const dueCountsByDate = await getDueCountsByDate(db, today, 7);
    const schedule = computeReviewSchedule({ dueCountsByDate, prefs, today });
    for (const item of schedule) {
      const when = new Date(`${item.date}T00:00:00`);
      when.setHours(item.hour, 0, 0, 0);
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body, data: { tag: KALIMA_REVIEW_TAG } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  } catch {
    // best-effort; never throw
  }
}
