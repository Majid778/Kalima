import { sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { levelProgress, wordProgress } from '../../data/schema';
import type * as schema from '../../data/schema';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  computeLongest,
  computeStreak,
  useStreakStore,
} from '../../stores/streakStore';
import type { ThemeName } from '../../theme/theme';
import { getLocalToday } from '../sm2';
import {
  isValidSnapshot,
  mergeWordProgress,
  type LevelProgressRow,
  type ProgressSnapshot,
  type WordProgressRow,
} from './progressSnapshot';

type DB = ExpoSQLiteDatabase<typeof schema>;

export async function buildProgressSnapshot(
  db: DB,
  now: string,
): Promise<ProgressSnapshot> {
  const [wordProgressRows, levelProgressRows] = await Promise.all([
    db.select().from(wordProgress),
    db.select().from(levelProgress),
  ]);
  const streak = useStreakStore.getState();
  const settings = useSettingsStore.getState();

  return {
    schemaVersion: 1,
    exportedAt: now,
    wordProgress: wordProgressRows,
    levelProgress: levelProgressRows,
    streak: {
      activityDates: streak.activityDates,
      celebratedMilestones: streak.celebratedMilestones,
    },
    settings: {
      theme: settings.theme,
      reciterId: settings.reciterId,
      showTransliteration: settings.showTransliteration,
      autoPlayAudio: settings.autoPlayAudio,
    },
  };
}

export async function restoreProgressSnapshot(
  db: DB,
  snapshot: ProgressSnapshot,
): Promise<void> {
  if (!isValidSnapshot(snapshot)) {
    throw new Error('Invalid progress snapshot');
  }

  const localWordProgress = await db.select().from(wordProgress);
  const mergedWordProgress = mergeWordProgress(localWordProgress, snapshot.wordProgress);

  await upsertWordProgress(db, mergedWordProgress);
  await upsertLevelProgress(db, snapshot.levelProgress);

  const today = getLocalToday();
  const lastActivityDate = getLastActivityDate(snapshot.streak.activityDates);
  useStreakStore.setState({
    activityDates: snapshot.streak.activityDates,
    celebratedMilestones: snapshot.streak.celebratedMilestones,
    currentStreak: computeStreak(snapshot.streak.activityDates, today),
    longestStreak: computeLongest(snapshot.streak.activityDates),
    lastActivityDate,
  });

  useSettingsStore.setState({
    theme: snapshot.settings.theme as ThemeName,
    reciterId: snapshot.settings.reciterId,
    showTransliteration: snapshot.settings.showTransliteration,
    autoPlayAudio: snapshot.settings.autoPlayAudio,
  });
}

async function upsertWordProgress(db: DB, rows: WordProgressRow[]): Promise<void> {
  if (rows.length === 0) return;

  await db.insert(wordProgress)
    .values(rows)
    .onConflictDoUpdate({
      target: wordProgress.wordId,
      set: {
        easeFactor: sql`excluded.ease_factor`,
        interval: sql`excluded.interval`,
        repetitions: sql`excluded.repetitions`,
        dueDate: sql`excluded.due_date`,
        lastReviewed: sql`excluded.last_reviewed`,
        status: sql`excluded.status`,
      },
    });
}

async function upsertLevelProgress(db: DB, rows: LevelProgressRow[]): Promise<void> {
  if (rows.length === 0) return;

  await db.insert(levelProgress)
    .values(rows)
    .onConflictDoUpdate({
      target: levelProgress.levelId,
      set: {
        unlocked: sql`excluded.unlocked`,
        bestQuizScore: sql`excluded.best_quiz_score`,
        completedAt: sql`excluded.completed_at`,
      },
    });
}

function getLastActivityDate(activityDates: Record<string, number>): string | null {
  const activeDates = Object.entries(activityDates)
    .filter(([, count]) => count > 0)
    .map(([date]) => date)
    .sort();

  return activeDates.at(-1) ?? null;
}
