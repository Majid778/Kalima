// src/services/wordService.ts
// Data service for word and level queries

import { and, eq, asc, inArray, ne }

export async function getWordsByRoot(
  db: DB,
  root: string | null,
  excludeWordId: number,
  limit = 12,
): Promise<{ id: number; arabic: string; meaning: string; root: string | null }[]> {
  const trimmedRoot = root?.trim();
  if (!trimmedRoot) return [];

  const rows = await db.select({
    id: words.id,
    arabic: words.arabic,
    meaning: words.meaning,
    root: words.root,
  })
    .from(words)
    .where(and(eq(words.root, trimmedRoot), ne(words.id, excludeWordId)))
    .orderBy(asc(words.frequencyRank))
    .limit(limit);

  return rows.map(row => ({
    id: row.id,
    arabic: row.arabic,
    meaning: row.meaning,
    root: row.root,
  }));
}

export async function getRootSiblingsForWords(
  db: DB,
  wordIds: number[],
): Promise<Map<number, RootSibling[]>> {
  const result = new Map<number, RootSibling[]>(
    wordIds.map(wordId => [wordId, []]),
  );

  if (wordIds.length === 0) return result;

  const rootRows = await db.select({
    id: words.id,
    root: words.root,
  })
    .from(words)
    .where(inArray(words.id, wordIds));

  const rootByWordId = new Map<number, string>();
  for (const row of rootRows) {
    if (row.root) {
      rootByWordId.set(row.id, row.root);
    }
  }

  const roots = Array.from(new Set(rootByWordId.values()));
  if (roots.length === 0) return result;

  const siblingRows = await db.select({
    id: words.id,
    arabic: words.arabic,
    meaning: words.meaning,
    root: words.root,
  })
    .from(words)
    .where(inArray(words.root, roots))
    .orderBy(asc(words.frequencyRank));

  const siblingsByRoot = new Map<string, RootSibling[]>();
  for (const row of siblingRows) {
    if (!row.root) continue;

    const siblings = siblingsByRoot.get(row.root) ?? [];
    siblings.push({
      id: row.id,
      arabic: row.arabic,
      meaning: row.meaning,
    });
    siblingsByRoot.set(row.root, siblings);
  }

  for (const wordId of wordIds) {
    const wordRoot = rootByWordId.get(wordId);
    if (!wordRoot) continue;

    result.set(
      wordId,
      (siblingsByRoot.get(wordRoot) ?? []).filter(sibling => sibling.id !== wordId),
    );
  }

  return result;
} from 'drizzle-orm';
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

export type RootSibling = {
  id: number;
  arabic: string;
  meaning: string;
};

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
