import { getWordStrength, type WordStrength } from './wordStrengthService';

const ARABIC_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const ALIF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;

export type TokenStatus = WordStrength | 'target' | 'neutral';

type KnownWordRow = {
  arabic: string;
  status: string;
  interval: number;
  repetitions: number;
};

const strengthRank: Record<WordStrength, number> = {
  new: 0,
  shaky: 1,
  strong: 2,
  mastered: 3,
};

/**
 * Conservative Arabic normalization for exact curriculum-word matching.
 * Does not strip prefixes or infer morphology.
 */
export function normalizeArabic(s: string): string {
  return s
    .replace(TATWEEL, '')
    .replace(ALIF_VARIANTS, 'ا')
    .replace(/\u0649/g, 'ي')
    .replace(/\u0629/g, 'ه')
    .replace(ARABIC_DIACRITICS, '')
    .trim();
}

export function tokenizeVerse(text: string): string[] {
  return text.split(/\s+/).filter(token => token.length > 0);
}

export function classifyVerseTokens(
  verseText: string,
  targetPosition: number | null,
  knownMap: Map<string, WordStrength>,
): { token: string; status: TokenStatus }[] {
  return tokenizeVerse(verseText).map((token, index) => {
    if (targetPosition !== null && index === targetPosition) {
      return { token, status: 'target' };
    }

    const knownStatus = knownMap.get(normalizeArabic(token));
    return { token, status: knownStatus ?? 'neutral' };
  });
}

export function buildKnownWordMap(rows: KnownWordRow[]): Map<string, WordStrength> {
  const map = new Map<string, WordStrength>();

  for (const row of rows) {
    const key = normalizeArabic(row.arabic);
    const strength = getWordStrength({
      status: row.status as 'new' | 'learning' | 'review',
      interval: row.interval,
      repetitions: row.repetitions,
    });
    const existing = map.get(key);

    if (!existing || strengthRank[strength] > strengthRank[existing]) {
      map.set(key, strength);
    }
  }

  return map;
}