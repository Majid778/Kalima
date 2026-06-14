import { selectExampleVerses } from '../WordCard';
import type { WordWithVerses } from '../../services/wordService';

type Verse = WordWithVerses['verses'][number];

const makeVerse = (surahNumber: number, ayahNumber: number): Verse => ({
  surahNumber,
  ayahNumber,
  arabicText: `verse ${surahNumber}:${ayahNumber}`,
  translation: `translation ${surahNumber}:${ayahNumber}`,
  wordPosition: 0,
});

describe('selectExampleVerses', () => {
  it('returns up to three verses by default', () => {
    const verses = [
      makeVerse(1, 1),
      makeVerse(1, 2),
      makeVerse(1, 3),
      makeVerse(1, 4),
    ];

    expect(selectExampleVerses(verses)).toEqual(verses.slice(0, 3));
  });

  it('returns all verses when fewer than the maximum exist', () => {
    const verses = [makeVerse(2, 255), makeVerse(3, 18)];

    expect(selectExampleVerses(verses)).toEqual(verses);
  });

  it('supports a custom maximum count', () => {
    const verses = [makeVerse(4, 1), makeVerse(4, 2), makeVerse(4, 3)];

    expect(selectExampleVerses(verses, 2)).toEqual(verses.slice(0, 2));
  });
});