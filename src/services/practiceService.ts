// src/services/practiceService.ts
// Data service for spaced repetition practice queries

import { eq, lte, asc, count, sql, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { wordProgress, words, wordVerses } from '../data/schema';
import type * as schema from '../data/schema';
import { gradeSM2, SM2State, SM2Result, Grade } from './sm2';
import type { WordWithVerses } from './wordService';

type DB = ExpoSQLiteDatabase<typeof schema>;

export interface DueCard extends WordWithVerses {
  easeFactor: number;
  interval: number;
  repetitions: number;
  status: string;
}

/**
 * Get cards due for review, with verse data attached.
 * D-17: 200 card cap per session.
 */
export async function getDueCards(db: DB, today: string, limit: number = 200): Promise<DueCard[]> {
  // First: get due word_progress rows joined with words
  const rows = await db.select()
    .from(wordProgress)
    .innerJoin(words, eq(words.id, wordProgress.wordId))
    .where(lte(wordProgress.dueDate, today))
    .orderBy(asc(wordProgress.dueDate))
    .limit(limit);

  if (rows.length === 0) return [];

  // Batch-load verses for all due words
  const wordIds = rows.map(r => r.words.id);
  const verseRows = await db.select()
    .from(wordVerses)
    .where(inArray(wordVerses.wordId, wordIds));

  // Group verses by wordId
  const verseMap = new Map<number, DueCard['verses']>();
  for (const v of verseRows) {
    if (!verseMap.has(v.wordId)) {
      verseMap.set(v.wordId, []);
    }
    verseMap.get(v.wordId)!.push({
      surahNumber: v.surahNumber,
      ayahNumber: v.ayahNumber,
      arabicText: v.arabicText,
      translation: v.translation,
      wordPosition: v.wordPosition,
    });
  }

  // Combine into DueCard objects
  return rows.map(row => ({
    id: row.words.id,
    arabic: row.words.arabic,
    transliteration: row.words.transliteration,
    meaning: row.words.meaning,
    root: row.words.root,
    partOfSpeech: row.words.partOfSpeech,
    occurrenceCount: row.words.occurrenceCount,
    verses: verseMap.get(row.words.id) ?? [],
    easeFactor: row.word_progress.easeFactor,
    interval: row.word_progress.interval,
    repetitions: row.word_progress.repetitions,
    status: row.word_progress.status,
  }));
}

/**
 * Grade a card: runs SM-2 algorithm and upserts result into word_progress.
 */
export async function gradeCard(
  db: DB,
  wordId: number,
  currentState: SM2State,
  grade: Grade,
  today: string,
): Promise<SM2Result> {
  const result = gradeSM2(currentState, grade, today);

  await db.insert(wordProgress)
    .values({
      wordId,
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      dueDate: result.dueDate,
      lastReviewed: today,
      status: result.status,
    })
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

  return result;
}

/**
 * Get practice statistics: counts by status and total due.
 */
export async function getPracticeStats(db: DB, today: string): Promise<{
  dueCount: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
}> {
  const statusCounts = await db.select({
    status: wordProgress.status,
    count: count(),
  })
    .from(wordProgress)
    .groupBy(wordProgress.status);

  const dueResult = await db.select({ count: count() })
    .from(wordProgress)
    .where(lte(wordProgress.dueDate, today));

  const countByStatus = (s: string) =>
    statusCounts.find(r => r.status === s)?.count ?? 0;

  return {
    dueCount: dueResult[0]?.count ?? 0,
    newCount: countByStatus('new'),
    learningCount: countByStatus('learning'),
    reviewCount: countByStatus('review'),
  };
}

/**
 * Get the earliest next review date, or null if no progress exists.
 */
export async function getNextReviewDate(db: DB): Promise<string | null> {
  const result = await db.select({ dueDate: wordProgress.dueDate })
    .from(wordProgress)
    .orderBy(asc(wordProgress.dueDate))
    .limit(1);

  return result[0]?.dueDate ?? null;
}
