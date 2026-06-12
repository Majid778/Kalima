// src/services/quizService.ts
// Quiz generation, grading, and persistence

import { eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { levelProgress, levels, words, wordProgress } from '../data/schema';
import type * as schema from '../data/schema';

type DB = ExpoSQLiteDatabase<typeof schema>;

// === Types ===

export interface QuizWord {
  id: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  levelId: number;
}

export type QuizQuestion =
  | {
      kind: 'multiple-choice';
      wordId: number;
      arabic: string;
      transliteration: string;
      correct: string;
      options: string[];
    }
  | {
      kind: 'matching';
      pairs: { wordId: number; arabic: string; meaning: string }[];
      meaningBank: string[];
    };

// === RNG and shuffle utilities ===

/**
 * Pure deterministic RNG using mulberry32 algorithm.
 * Same seed always produces the same sequence.
 */
export function mulberry32(seed: number): () => number {
  let m_w = seed;
  let m_z = 987654321;
  const mask = 0xffffffff;

  return () => {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  };
}

/**
 * Fisher-Yates shuffle using provided RNG (pure function).
 */
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// === Quiz generation ===

/**
 * Get words for a level and a bounded global pool of distractors.
 */
export async function getQuizWords(
  db: DB,
  levelId: number,
): Promise<{ levelWords: QuizWord[]; globalPool: QuizWord[] }> {
  // Get all words for this level
  const levelWordsResult = await db.select({
    id: words.id,
    arabic: words.arabic,
    transliteration: words.transliteration,
    meaning: words.meaning,
    levelId: words.levelId,
  })
    .from(words)
    .where(eq(words.levelId, levelId));

  // Get a bounded sample of words from other levels (~200 words)
  const otherWordsResult = await db.select({
    id: words.id,
    arabic: words.arabic,
    transliteration: words.transliteration,
    meaning: words.meaning,
    levelId: words.levelId,
  })
    .from(words)
    .where(ne(words.levelId, levelId))
    .limit(200);

  return {
    levelWords: levelWordsResult as QuizWord[],
    globalPool: otherWordsResult as QuizWord[],
  };
}

/**
 * Generate a quiz (pure function with injectable RNG seed).
 * - 20 questions alternating between multiple-choice and matching.
 * - MC: 1 word + 3 distractor meanings (same-level first, then global).
 * - Matching: groups of 4 words.
 * - No word repeats back-to-back.
 * - Graceful fallback if <4 words.
 */
export function generateQuiz(
  levelWords: QuizWord[],
  globalPool: QuizWord[],
  rng: () => number,
  count: number = 20,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usedWordIds = new Set<number>();

  // If fewer than 4 words, fall back to all multiple-choice, no back-to-back check
  if (levelWords.length < 4) {
    return generateMultipleChoiceQuestions(levelWords, globalPool, rng, count, usedWordIds);
  }

  // Alternate between MC and matching. When the level has fewer than `count`
  // words the used-set will exhaust mid-quiz; we then reset it so words cycle
  // (never back-to-back, enforced via lastWordId). A hard iteration guard
  // guarantees termination regardless of input.
  let i = 0;
  let lastWordId: number | null = null;
  const maxIterations = count * 6 + 20;
  let iter = 0;

  while (questions.length < count && iter < maxIterations) {
    iter++;
    const before = questions.length;

    if (i % 2 === 0) {
      // Multiple choice
      const question = generateSingleMCQuestion(levelWords, globalPool, rng, usedWordIds, lastWordId);
      if (question && question.kind === 'multiple-choice') {
        questions.push(question);
        lastWordId = question.wordId;
      }
    } else {
      // Matching (4 words)
      const question = generateMatchingQuestion(levelWords, globalPool, rng, usedWordIds, lastWordId);
      if (question && question.kind === 'matching') {
        questions.push(question);
        lastWordId = question.pairs[question.pairs.length - 1].wordId;
      }
    }
    i++;

    // Nothing added this round → the current kind ran out of unused words.
    // Reset the used-set to let words cycle; break only if there is truly
    // nothing to draw from (guards against an infinite loop).
    if (questions.length === before) {
      if (usedWordIds.size === 0) break;
      usedWordIds.clear();
    }
  }

  return questions.slice(0, count);
}

/**
 * Generate a single multiple-choice question.
 */
function generateSingleMCQuestion(
  levelWords: QuizWord[],
  globalPool: QuizWord[],
  rng: () => number,
  usedWordIds: Set<number>,
  lastWordId: number | null = null,
): QuizQuestion | null {
  // Pick an unused word, never the immediately-preceding one (no back-to-back)
  const available = levelWords.filter(w => !usedWordIds.has(w.id) && w.id !== lastWordId);
  if (available.length === 0) return null;

  const wordIndex = Math.floor(rng() * available.length);
  const word = available[wordIndex];
  usedWordIds.add(word.id);

  // Get 3 distractor meanings
  const distractors = getDistractorMeanings(word, levelWords, globalPool, rng, 3);

  // Shuffle options
  const options = shuffle([word.meaning, ...distractors], rng).slice(0, 4);

  return {
    kind: 'multiple-choice',
    wordId: word.id,
    arabic: word.arabic,
    transliteration: word.transliteration,
    correct: word.meaning,
    options,
  };
}

/**
 * Generate a matching question (4 pairs).
 */
function generateMatchingQuestion(
  levelWords: QuizWord[],
  globalPool: QuizWord[],
  rng: () => number,
  usedWordIds: Set<number>,
  lastWordId: number | null = null,
): QuizQuestion | null {
  // Pick 4 unused words for this matching group, excluding the previous
  // question's word so no word appears back-to-back.
  const available = levelWords.filter(w => !usedWordIds.has(w.id) && w.id !== lastWordId);
  if (available.length < 4) return null;

  const selected = shuffle(available, rng).slice(0, 4);
  selected.forEach(w => usedWordIds.add(w.id));

  const pairs = selected.map(w => ({
    wordId: w.id,
    arabic: w.arabic,
    meaning: w.meaning,
  }));

  // Shuffle the meaning bank
  const meaningBank = shuffle(
    pairs.map(p => p.meaning),
    rng,
  );

  return {
    kind: 'matching',
    pairs,
    meaningBank,
  };
}

/**
 * Get N distractor meanings, preferring same-level words first, then global.
 */
function getDistractorMeanings(
  correctWord: QuizWord,
  levelWords: QuizWord[],
  globalPool: QuizWord[],
  rng: () => number,
  count: number,
): string[] {
  const distractors: string[] = [];
  const usedMeanings = new Set([correctWord.meaning]);

  // Same level
  const sameLevelOptions = levelWords.filter(w => w.id !== correctWord.id);
  const sameLevelShuffled = shuffle(sameLevelOptions, rng);

  for (const word of sameLevelShuffled) {
    if (distractors.length >= count) break;
    if (!usedMeanings.has(word.meaning)) {
      distractors.push(word.meaning);
      usedMeanings.add(word.meaning);
    }
  }

  // Global pool
  const globalShuffled = shuffle(globalPool, rng);
  for (const word of globalShuffled) {
    if (distractors.length >= count) break;
    if (!usedMeanings.has(word.meaning)) {
      distractors.push(word.meaning);
      usedMeanings.add(word.meaning);
    }
  }

  return distractors;
}

/**
 * Fallback: all multiple-choice questions when level has < 4 words.
 */
function generateMultipleChoiceQuestions(
  levelWords: QuizWord[],
  globalPool: QuizWord[],
  rng: () => number,
  count: number,
  usedWordIds: Set<number>,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const availableWords = levelWords;

  for (let i = 0; i < count && availableWords.length > 0; i++) {
    const wordIndex = i % availableWords.length;
    const word = availableWords[wordIndex];

    const distractors = getDistractorMeanings(word, availableWords, globalPool, rng, 3);
    const options = shuffle([word.meaning, ...distractors], rng).slice(0, 4);

    questions.push({
      kind: 'multiple-choice',
      wordId: word.id,
      arabic: word.arabic,
      transliteration: word.transliteration,
      correct: word.meaning,
      options,
    });
  }

  return questions.slice(0, count);
}

// === Quiz grading ===

export interface GradeResult {
  score: number;
  total: number;
  percent: number;
  passed: boolean;
}

/**
 * Grade a quiz (pure function).
 * MC: correct if answer matches the correct meaning.
 * Matching: all 4 pairs must be correct (atomic) to score 1.
 */
export function gradeQuiz(
  questions: QuizQuestion[],
  answers: (string | Record<number, string>)[],
): GradeResult {
  let score = 0;
  let total = 0;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const answer = answers[i];

    if (question.kind === 'multiple-choice') {
      total += 1;
      if (answer === question.correct) {
        score += 1;
      }
    } else if (question.kind === 'matching') {
      total += 1;
      // All 4 pairs must be correct for 1 point (atomic)
      if (typeof answer === 'object') {
        let allCorrect = true;
        for (const pair of question.pairs) {
          if (answer[pair.wordId] !== pair.meaning) {
            allCorrect = false;
            break;
          }
        }
        if (allCorrect) {
          score += 1;
        }
      }
    }
  }

  const percent = total === 0 ? 0 : score / total;
  const passed = percent >= 0.8;

  return { score, total, percent, passed };
}

// === DB persistence ===

/**
 * Record quiz result: upsert level_progress and unlock next level if passed.
 */
export async function recordQuizResult(
  db: DB,
  levelId: number,
  percent: number,
  today: string,
): Promise<void> {
  const score = percent; // Store as 0.0-1.0

  // Upsert this level's progress: keep best score
  await db.insert(levelProgress)
    .values({
      levelId,
      unlocked: 1,
      bestQuizScore: score,
      completedAt: percent >= 0.8 ? today : null,
    })
    .onConflictDoUpdate({
      target: levelProgress.levelId,
      set: {
        unlocked: 1,
        bestQuizScore: sql`case when excluded.best_quiz_score > ${levelProgress.bestQuizScore} then excluded.best_quiz_score else ${levelProgress.bestQuizScore} end`,
        completedAt: sql`case when excluded.completed_at is not null then excluded.completed_at else ${levelProgress.completedAt} end`,
      },
    });

  // If passed, unlock the next level
  if (percent >= 0.8) {
    const nextLevelId = levelId + 1;
    // Check if next level exists
    const nextLevel = await db.select().from(levels).where(eq(levels.id, nextLevelId));
    if (nextLevel.length > 0) {
      await db.insert(levelProgress)
        .values({
          levelId: nextLevelId,
          unlocked: 1,
        })
        .onConflictDoUpdate({
          target: levelProgress.levelId,
          set: {
            unlocked: 1,
          },
        });
    }
  }
}
