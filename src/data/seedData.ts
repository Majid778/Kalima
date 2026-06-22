// Seed data for web preview — includes enough content to render all screens realistically
// This is used only on web (Platform.OS === 'web'); native always uses real SQLite

export const seedLevels = [
  { id: 1, name: 'The Essentials', wordCount: 50, cumulativeCoverage: 0.278 },
  { id: 2, name: 'Words of Worship', wordCount: 50, cumulativeCoverage: 0.356 },
  { id: 3, name: 'The Divine', wordCount: 50, cumulativeCoverage: 0.404 },
  { id: 4, name: 'The Faithful', wordCount: 50, cumulativeCoverage: 0.439 },
  { id: 5, name: 'The Straight Path', wordCount: 50, cumulativeCoverage: 0.466 },
];

export const seedWords = [
  {
    id: 1,
    arabic: 'مِن',
    transliteration: 'min',
    meaning: 'from, of',
    root: null,
    partOfSpeech: 'preposition',
    frequencyRank: 1,
    occurrenceCount: 2438,
    levelId: 1,
    levelOrder: 1,
  },
  {
    id: 2,
    arabic: 'ٱللَّهِ',
    transliteration: 'alllahi',
    meaning: 'Allah (God)',
    root: 'اله',
    partOfSpeech: 'proper noun',
    frequencyRank: 2,
    occurrenceCount: 2697,
    levelId: 1,
    levelOrder: 2,
  },
  {
    id: 3,
    arabic: 'فِى',
    transliteration: 'fia',
    meaning: 'in',
    root: null,
    partOfSpeech: 'preposition',
    frequencyRank: 3,
    occurrenceCount: 1768,
    levelId: 1,
    levelOrder: 3,
  },
  {
    id: 4,
    arabic: 'مَا',
    transliteration: 'maa',
    meaning: 'what, not',
    root: null,
    partOfSpeech: 'relative pronoun',
    frequencyRank: 4,
    occurrenceCount: 1539,
    levelId: 1,
    levelOrder: 4,
  },
  {
    id: 5,
    arabic: 'إِنَّ',
    transliteration: 'iinna',
    meaning: 'indeed, verily',
    root: null,
    partOfSpeech: 'accusative particle',
    frequencyRank: 5,
    occurrenceCount: 1291,
    levelId: 1,
    levelOrder: 5,
  },
  {
    id: 14,
    arabic: 'قَالَ',
    transliteration: 'qaala',
    meaning: 'said, to say',
    root: 'قول',
    partOfSpeech: 'verb',
    frequencyRank: 14,
    occurrenceCount: 612,
    levelId: 2,
    levelOrder: 1,
  },
  {
    id: 20,
    arabic: 'رَبِّ',
    transliteration: 'rabbi',
    meaning: 'my Lord',
    root: 'ربب',
    partOfSpeech: 'noun',
    frequencyRank: 20,
    occurrenceCount: 358,
    levelId: 2,
    levelOrder: 7,
  },
];

export const seedWordVerses = [
  {
    id: 1,
    wordId: 1,
    surahNumber: 2,
    ayahNumber: 5,
    arabicText:
      'أُو۟لَٰٓئِكَ عَلَىٰ هُدًۭى مِّن رَّبِّهِمْ ۖ وَأُو۟لَٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ',
    translation:
      'Those are upon [right] guidance from their Lord, and it is those who are the successful.',
    wordPosition: 3,
  },
  {
    id: 2,
    wordId: 1,
    surahNumber: 2,
    ayahNumber: 8,
    arabicText:
      'وَمِنَ ٱلنَّاسِ مَن يَقُولُ ءَامَنَّا بِٱللَّهِ وَبِٱلْيَوْمِ ٱلْءَاخِرِ وَمَا هُم بِمُؤْمِنِينَ',
    translation:
      'And of the people are some who say, "We believe in Allah and the Last Day," but they are not believers.',
    wordPosition: 2,
  },
  {
    id: 3,
    wordId: 2,
    surahNumber: 1,
    ayahNumber: 1,
    arabicText: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation:
      'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    wordPosition: 1,
  },
  {
    id: 4,
    wordId: 14,
    surahNumber: 3,
    ayahNumber: 1,
    arabicText: 'ٱلمُ',
    translation: 'Alif, Lam, Meem. [These letters are one of the miracles of the Quran]',
    wordPosition: null,
  },
];

export const seedWordProgress = [
  {
    wordId: 1,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date().toISOString().split('T')[0],
    lastReviewed: null,
    status: 'new',
  },
  {
    wordId: 2,
    easeFactor: 2.6,
    interval: 3,
    repetitions: 2,
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    lastReviewed: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    status: 'learning',
  },
  {
    wordId: 3,
    easeFactor: 2.8,
    interval: 14,
    repetitions: 5,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days out
    lastReviewed: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
    status: 'learning',
  },
  {
    wordId: 4,
    easeFactor: 3.0,
    interval: 30,
    repetitions: 12,
    dueDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    lastReviewed: new Date(Date.now() - 86400000 * 25).toISOString().split('T')[0],
    status: 'known',
  },
  {
    wordId: 5,
    easeFactor: 3.2,
    interval: 45,
    repetitions: 18,
    dueDate: new Date(Date.now() + 86400000 * 35).toISOString().split('T')[0],
    lastReviewed: new Date(Date.now() - 86400000 * 40).toISOString().split('T')[0],
    status: 'known',
  },
];

export const seedLevelProgress = [
  { levelId: 1, unlocked: 1, bestQuizScore: 0.95, completedAt: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0] },
  { levelId: 2, unlocked: 1, bestQuizScore: 0.88, completedAt: null },
  { levelId: 3, unlocked: 0, bestQuizScore: null, completedAt: null },
];
