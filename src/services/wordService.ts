// src/services/wordService.ts
// Data service for word and level queries

import { eq, asc } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { words, wordVerses, levels } from '../data/schema';
import type * as schema from '../data/schema';

export interface WordWithVerses {
  id: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  partOfSpeech: string | null;
  occurrenceCount: number;
  verses: {
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    translation: string;
    wordPosition: number | null;
  }[];
}

type DB = ExpoSQLiteDatabase<typeof schema>;

/**
 * Get all words for a level, grouped with their verses.
 * Uses Map-based post-processing to group flat join rows (Pitfall 6).
 */
export async function getWordsForLevel(db: DB, levelId: number): Promise<WordWithVerses[]> {
  const rows = await db.select()
    .from(words)
    .leftJoin(wordVerses, eq(wordVerses.wordId, words.id))
    .where(eq(words.levelId, levelId))
    .orderBy(asc(words.levelOrder));

  // Group by word, collecting verses
  const wordMap = new Map<number, WordWithVerses>();
  for (const row of rows) {
    const w = row.words;
    if (!wordMap.has(w.id)) {
      wordMap.set(w.id, {
        id: w.id,
        arabic: w.arabic,
        transliteration: w.transliteration,
        meaning: w.meaning,
        root: w.root,
        partOfSpeech: w.partOfSpeech,
        occurrenceCount: w.occurrenceCount,
        verses: [],
      });
    }
    if (row.word_verses) {
      wordMap.get(w.id)!.verses.push({
        surahNumber: row.word_verses.surahNumber,
        ayahNumber: row.word_verses.ayahNumber,
        arabicText: row.word_verses.arabicText,
        translation: row.word_verses.translation,
        wordPosition: row.word_verses.wordPosition,
      });
    }
  }
  return Array.from(wordMap.values());
}

/**
 * Get all levels ordered by id.
 */
export async function getLevels(db: DB) {
  return db.select().from(levels).orderBy(asc(levels.id));
}

/**
 * Highlight a target word within an Arabic verse by splitting on whitespace.
 * Returns { before, target, after } or null if wordPosition is invalid.
 */
export function highlightWordInVerse(
  verseText: string,
  wordPosition: number | null,
): { before: string; target: string; after: string } | null {
  if (wordPosition === null || wordPosition === undefined) return null;

  const tokens = verseText.split(/\s+/);
  if (wordPosition < 0 || wordPosition >= tokens.length) return null;

  const before = tokens.slice(0, wordPosition).join(' ');
  const target = tokens[wordPosition];
  const after = tokens.slice(wordPosition + 1).join(' ');

  return { before, target, after };
}
