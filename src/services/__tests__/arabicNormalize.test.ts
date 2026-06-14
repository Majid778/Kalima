import {
  buildKnownWordMap,
  classifyVerseTokens,
  normalizeArabic,
  tokenizeVerse,
} from '../arabicNormalize';

describe('normalizeArabic', () => {
  it('strips Arabic diacritics and tatweel', () => {
    expect(normalizeArabic('ٱلْحَمْدُ لِلّٰهِ')).toBe('الحمد لله');
    expect(normalizeArabic('قُــــرْآنٌ')).toBe('قران');
  });

  it('normalizes alif, yaa, and taa variants conservatively', () => {
    expect(normalizeArabic('آمَنَ إِلَى ٱلصَّلَاةِ')).toBe('امن الي الصلاه');
    expect(normalizeArabic('هُدَىٰ رَحْمَةٌ')).toBe('هدي رحمه');
  });
});

describe('tokenizeVerse', () => {
  it('splits on whitespace and drops empty tokens', () => {
    expect(tokenizeVerse('  قُلْ   هُوَ\nٱللَّهُ\tأَحَدٌ  ')).toEqual([
      'قُلْ',
      'هُوَ',
      'ٱللَّهُ',
      'أَحَدٌ',
    ]);
  });
});

describe('classifyVerseTokens', () => {
  it('classifies the target by position before known-word lookup', () => {
    const knownMap = new Map([['الله', 'mastered' as const]]);

    expect(classifyVerseTokens('قُلْ هُوَ ٱللَّهُ أَحَدٌ', 2, knownMap)).toEqual([
      { token: 'قُلْ', status: 'neutral' },
      { token: 'هُوَ', status: 'neutral' },
      { token: 'ٱللَّهُ', status: 'target' },
      { token: 'أَحَدٌ', status: 'neutral' },
    ]);
  });

  it('classifies known exact normalized matches', () => {
    const knownMap = new Map([
      ['قل', 'strong' as const],
      ['احد', 'shaky' as const],
    ]);

    expect(classifyVerseTokens('قُلْ هُوَ ٱللَّهُ أَحَدٌ', null, knownMap)).toEqual([
      { token: 'قُلْ', status: 'strong' },
      { token: 'هُوَ', status: 'neutral' },
      { token: 'ٱللَّهُ', status: 'neutral' },
      { token: 'أَحَدٌ', status: 'shaky' },
    ]);
  });

  it('falls back to neutral when no exact normalized match exists', () => {
    const knownMap = new Map([['حمد', 'mastered' as const]]);

    expect(classifyVerseTokens('ٱلْحَمْدُ لِلّٰهِ', null, knownMap)).toEqual([
      { token: 'ٱلْحَمْدُ', status: 'neutral' },
      { token: 'لِلّٰهِ', status: 'neutral' },
    ]);
  });

  it('handles a realistic vocalized ayah with target and known statuses', () => {
    const knownMap = new Map([
      ['الحمد', 'mastered' as const],
      ['رب', 'strong' as const],
      ['العلمين', 'new' as const],
    ]);

    expect(classifyVerseTokens('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', 1, knownMap)).toEqual([
      { token: 'ٱلْحَمْدُ', status: 'mastered' },
      { token: 'لِلَّهِ', status: 'target' },
      { token: 'رَبِّ', status: 'strong' },
      { token: 'ٱلْعَـٰلَمِينَ', status: 'new' },
    ]);
  });
});

describe('buildKnownWordMap', () => {
  it('prefers the stronger status on normalized-key collisions', () => {
    const map = buildKnownWordMap([
      { arabic: 'هُدَىٰ', status: 'learning', interval: 2, repetitions: 1 },
      { arabic: 'هُدًى', status: 'learning', interval: 8, repetitions: 3 },
      { arabic: 'هُدَى', status: 'new', interval: 0, repetitions: 0 },
    ]);

    expect(map.get('هدي')).toBe('strong');
  });
});