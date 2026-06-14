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

export interface LearnedWordStatus {
  arabic: string;
  status: string;
  interval: number;
  repetitions: number;
}

export interface ReaderVerse {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  wordPosition: number | null;
}

export type ReaderEntry = {
  wordId: number;
  arabic: string;
  meaning: string;
  transliteration: string;
  root: string | null;
  status: string;
  interval: number;
  repetitions: number;
  verses: ReaderVerse[];
};

type ReaderSortableEntry = ReaderEntry & { frequencyRank: number };

function readerNeedRank(status: string): number {
  return status === 'new' || status === 'learning' ? 0 : 1;
}

export function sortReaderEntriesByNeed<T extends ReaderSortableEntry>(entries: readonly T[]): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const needDelta = readerNeedRank(a.entry.status) - readerNeedRank(b.entry.status);
      if (needDelta !== 0) return needDelta;

      const frequencyDelta = a.entry.frequencyRank - b.entry.frequencyRank;
      if (frequencyDelta !== 0) return frequencyDelta;

      return a.index - b.index;
    })
    .map(({ entry }) => entry);
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
 * Introduce words into the spaced-repetition queue.
 *
 * Browsing a level in Learn mode seeds its words here as `new` and due today,
 * so they appear in Practice. Without this, nothing ever enters word_progress
 * (gradeCard only updates already-due cards), so Practice stays empty and
 * "% understood" can never move. Resolves the open question from Phase 3
 * RESEARCH ("how do new words enter the practice queue?"): they enter when
 * first explored in Learn. Existing progress is never overwritten.
 */
export async function introduceWords(
  db: DB,
  wordIds: number[],
  today: string,
): Promise<void> {
  if (wordIds.length === 0) return;

  await db.insert(wordProgress)
    .values(
      wordIds.map((wordId) => ({
        wordId,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: today,
        lastReviewed: null,
        status: 'new',
      })),
    )
    .onConflictDoNothing({ target: wordProgress.wordId });
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
