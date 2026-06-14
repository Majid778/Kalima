import type { WordWithVerses } from '../wordService';

export type FirstWinQuestion = {
  word: WordWithVerses;
  verse: WordWithVerses['verses'][number];
  options: { meaning: string; correct: boolean }[];
};

const rotate = <T>(items: T[], offset: number): T[] => {
  if (items.length === 0) return items;
  const normalizedOffset = offset % items.length;
  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
};

export function buildFirstWinQuestion(levelWords: WordWithVerses[]): FirstWinQuestion | null {
  const word = levelWords.find((candidate) =>
    candidate.verses.some((verse) => verse.wordPosition !== null),
  );
  const verse = word?.verses.find((candidate) => candidate.wordPosition !== null);

  if (!word || !verse) return null;

  const distractorMeanings: string[] = [];
  const seenMeanings = new Set([word.meaning]);

  for (const candidate of levelWords) {
    if (candidate.id === word.id || seenMeanings.has(candidate.meaning)) continue;

    seenMeanings.add(candidate.meaning);
    distractorMeanings.push(candidate.meaning);
  }

  if (distractorMeanings.length < 2) return null;

  const selectedDistractors = rotate(distractorMeanings, word.id).slice(0, 3);
  const options = rotate(
    [
      { meaning: word.meaning, correct: true },
      ...selectedDistractors.map((meaning) => ({ meaning, correct: false })),
    ],
    word.id,
  );

  return {
    word,
    verse,
    options,
  };
}