// src/services/progressService.ts
// Read-only progress and streak-adjacent aggregate queries

import { asc, eq, isNotNull, ne, sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { levels, levelProgress, words, wordProgress, wordVerses } from '../data/schema';
import type * as schema from '../data/schema';

type DB = ExpoSQLiteDatabase<typeof schema>;

export interface LevelProgressView {
  id: number;
  name: string;
  wordCount: number;
  cumulativeCoverage: number;
  unlocked: boolean;
  completed: boolean;
  bestQuizScore: number | null;
}

export const MILESTONES = [0.25, 0.5, 0.75, 1.0];

type LevelUnlockRow = {
  levelId: number;
  unlocked: number | boolean | null;
};

export function isLevelUnlocked(levelProgressRows: LevelUnlockRow[], levelId: number): boolean {
  if (levelId === 1) return true;

  const progress = levelProgressRows.find(row => row.levelId === levelId);
  return progress?.unlocked === true || progress?.unlocked === 1;
}

export function crossedMilestone(prevPct: number, newPct: number): number | null {
  let crossed: number | null = null;

  for (const milestone of MILESTONES) {
    if (milestone > prevPct && milestone <= newPct) {
      crossed = milestone;
    }
  }

  return crossed;
}

export async function getQuranPercent(db: DB): Promise<number> {
  const result = await db.select({
    reviewedCount: sql<number>`coalesce(sum(case when ${wordProgress.status} = 'review' then ${words.occurrenceCount} else 0 end), 0)`,
    totalCount: sql<number>`coalesce(sum(${words.occurrenceCount}), 0)`,
  })
    .from(words)
    .leftJoin(wordProgress, eq(wordProgress.wordId, words.id));

  const totalCount = Number(result[0]?.totalCount ?? 0);
  if (totalCount === 0) return 0;

  return Number(result[0]?.reviewedCount ?? 0) / totalCount;
}

export async function getWordsLearnedCount(db: DB): Promise<number> {
  const result = await db.select({
    count: sql<number>`count(*)`,
  })
    .from(wordProgress)
    .where(ne(wordProgress.status, 'new'));

  return Number(result[0]?.count ?? 0);
}

export async function getWordsMasteredCount(db: DB): Promise<number> {
  const result = await db.select({
    count: sql<number>`count(*)`,
  })
    .from(wordProgress)
    .where(eq(wordProgress.status, 'review'));

  return Number(result[0]?.count ?? 0);
}

export async function getLevelsCompletedCount(db: DB): Promise<number> {
  const result = await db.select({
    count: sql<number>`count(*)`,
  })
    .from(levelProgress)
    .where(isNotNull(levelProgress.completedAt));

  return Number(result[0]?.count ?? 0);
}

export async function getLevelProgressList(db: DB): Promise<LevelProgressView[]> {
  const rows = await db.select({
    id: levels.id,
    name: levels.name,
    wordCount: levels.wordCount,
    cumulativeCoverage: levels.cumulativeCoverage,
    unlocked: levelProgress.unlocked,
    completedAt: levelProgress.completedAt,
    bestQuizScore: levelProgress.bestQuizScore,
  })
    .from(levels)
    .leftJoin(levelProgress, eq(levelProgress.levelId, levels.id))
    .orderBy(asc(levels.id));

  const levelProgressRows = rows.map(row => ({
    levelId: row.id,
    unlocked: row.unlocked,
  }));

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    wordCount: row.wordCount,
    cumulativeCoverage: row.cumulativeCoverage,
    unlocked: isLevelUnlocked(levelProgressRows, row.id),
    completed: row.completedAt !== null,
    bestQuizScore: row.bestQuizScore,
  }));
}

export async function getTodaysVerse(
  db: DB,
  today: string,
): Promise<{
  verse: {
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    translation: string;
  };
  knownCount: number;
  totalCount: number;
} | null> {
  const verseCountResult = await db.select({
    count: sql<number>`count(*)`,
  })
    .from(sql`(
      select distinct surah_number, ayah_number
      from word_verses
    )`);

  const verseCount = Number(verseCountResult[0]?.count ?? 0);
  if (verseCount === 0) return null;

  const offset = daysSinceEpoch(today) % verseCount;
  const verseRows = await db.select({
    surahNumber: wordVerses.surahNumber,
    ayahNumber: wordVerses.ayahNumber,
    arabicText: wordVerses.arabicText,
    translation: wordVerses.translation,
  })
    .from(wordVerses)
    .groupBy(
      wordVerses.surahNumber,
      wordVerses.ayahNumber,
      wordVerses.arabicText,
      wordVerses.translation,
    )
    .orderBy(asc(wordVerses.surahNumber), asc(wordVerses.ayahNumber))
    .limit(1)
    .offset(offset);

  const verse = verseRows[0];
  if (!verse) return null;

  const counts = await db.select({
    knownCount: sql<number>`count(distinct case when ${wordProgress.status} != 'new' then ${wordVerses.wordId} end)`,
    totalCount: sql<number>`count(distinct ${wordVerses.wordId})`,
  })
    .from(wordVerses)
    .leftJoin(wordProgress, eq(wordProgress.wordId, wordVerses.wordId))
    .where(sql`${wordVerses.surahNumber} = ${verse.surahNumber} and ${wordVerses.ayahNumber} = ${verse.ayahNumber}`);

  const totalCount = Number(counts[0]?.totalCount ?? 0);
  if (totalCount === 0) return null;

  return {
    verse,
    knownCount: Number(counts[0]?.knownCount ?? 0),
    totalCount,
  };
}

function daysSinceEpoch(date: string): number {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Math.floor(parsed.getTime() / 86400000);
}
