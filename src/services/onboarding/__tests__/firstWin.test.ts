import { buildFirstWinQuestion } from '../firstWin';
import type { WordWithVerses } from '../../wordService';

const makeWord = (
  overrides: Partial<WordWithVerses> & Pick<WordWithVerses, 'id' | 'meaning'>,
): WordWithVerses => ({
  id: overrides.id,
  arabic: overrides.arabic ?? 'كلمة',
  transliteration: overrides.transliteration ?? 'kalimah',
  meaning: overrides.meaning,
  root: overrides.root ?? null,
  partOfSpeech: overrides.partOfSpeech ?? null,
  occurrenceCount: overrides.occurrenceCount ?? 1,
  verses: overrides.verses ?? [],
});

describe('buildFirstWinQuestion', () => {
  it('picks the first word with a positioned verse', () => {
    const unpositioned = makeWord({
      id: 1,
      meaning: 'mercy',
      verses: [
        {
          surahNumber: 1,
          ayahNumber: 1,
          arabicText: 'بسم الله الرحمن الرحيم',
          translation: 'In the name of Allah, the Most Compassionate, Most Merciful',
          wordPosition: null,
        },
      ],
    });
    const teachable = makeWord({
      id: 2,
      meaning: 'book',
      verses: [
        {
          surahNumber: 2,
          ayahNumber: 2,
          arabicText: 'ذلك الكتاب لا ريب فيه',
          translation: 'This is the Book about which there is no doubt',
          wordPosition: 1,
        },
      ],
    });

    const question = buildFirstWinQuestion([
      unpositioned,
      teachable,
      makeWord({ id: 3, meaning: 'guidance' }),
      makeWord({ id: 4, meaning: 'path' }),
    ]);

    expect(question?.word).toBe(teachable);
    expect(question?.verse).toBe(teachable.verses[0]);
  });

  it('includes the correct option exactly once', () => {
    const question = buildFirstWinQuestion([
      makeWord({
        id: 10,
        meaning: 'Allah',
        verses: [
          {
            surahNumber: 1,
            ayahNumber: 1,
            arabicText: 'بسم الله الرحمن الرحيم',
            translation: 'In the name of Allah, the Most Compassionate, Most Merciful',
            wordPosition: 1,
          },
        ],
      }),
      makeWord({ id: 11, meaning: 'mercy' }),
      makeWord({ id: 12, meaning: 'king' }),
      makeWord({ id: 13, meaning: 'day' }),
    ]);

    expect(question?.options.filter((option) => option.correct && option.meaning === 'Allah')).toHaveLength(1);
    expect(question?.options.filter((option) => option.meaning === 'Allah')).toHaveLength(1);
  });

  it('uses other words meanings as distractors', () => {
    const words = [
      makeWord({
        id: 20,
        meaning: 'Lord',
        verses: [
          {
            surahNumber: 1,
            ayahNumber: 2,
            arabicText: 'الحمد لله رب العالمين',
            translation: 'All praise is for Allah, Lord of all worlds',
            wordPosition: 2,
          },
        ],
      }),
      makeWord({ id: 21, meaning: 'worlds' }),
      makeWord({ id: 22, meaning: 'straight' }),
      makeWord({ id: 23, meaning: 'prayer' }),
      makeWord({ id: 24, meaning: 'Lord' }),
    ];

    const question = buildFirstWinQuestion(words);
    const distractors = question?.options.filter((option) => !option.correct).map((option) => option.meaning);

    expect(distractors).toEqual(expect.arrayContaining(['worlds', 'straight']));
    expect(distractors).not.toContain('Lord');
  });

  it('returns null when no verse has a target word position', () => {
    const question = buildFirstWinQuestion([
      makeWord({
        id: 30,
        meaning: 'light',
        verses: [
          {
            surahNumber: 24,
            ayahNumber: 35,
            arabicText: 'الله نور السماوات والأرض',
            translation: 'Allah is the Light of the heavens and the earth',
            wordPosition: null,
          },
        ],
      }),
      makeWord({ id: 31, meaning: 'earth' }),
    ]);

    expect(question).toBeNull();
  });
});