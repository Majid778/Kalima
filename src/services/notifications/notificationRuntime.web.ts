// Web-only notification shim — all notifications are no-ops on web
// Native builds use src/services/notifications/notificationRuntime.ts

import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type * as schema from '../../data/schema';

type DB = ExpoSQLiteDatabase<typeof schema>;

export async function requestNotificationPermission(): Promise<boolean> {
  // No-op on web; always return true to allow app flow
  return true;
}

export async function cancelAllReviewNotifications(): Promise<void> {
  // No-op on web
}

export async function syncReviewNotifications(_db: DB, _today: string): Promise<void> {
  // No-op on web
}
