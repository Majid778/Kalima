import { sortReaderEntriesByNeed, type ReaderEntry } from '../practiceService';

type SortableReaderEntry = ReaderEntry & { frequencyRank: number };

function createEntry(
  wordId: number,
  status: string,
  frequencyRank: number,
): SortableReaderEntry {
  return {
    wordId,
    arabic: `word-${wordId}`,
    meaning: `meaning-${wordId}`,
    transliteration: `transliteration-${wordId}`,
    root: null,
    status,
    interval: status === 'review' ? 21 : 0,
    repetitions: status === 'review' ? 4 : 0,
    frequencyRank,
    verses: [],
  };
}

describe('practiceService', () => {
  describe('sortReaderEntriesByNeed', () => {
    it('orders weak words before review words, then by frequency rank', () => {
      const entries = [
        createEntry(1, 'review', 1),
        createEntry(2, 'learning', 12),
        createEntry(3, 'new', 3),
        createEntry(4, 'review', 2),
        createEntry(5, 'learning', 4),
      ];

      const sorted = sortReaderEntriesByNeed(entries);

      expect(sorted.map(entry => entry.wordId)).toEqual([3, 5, 2, 1, 4]);
      expect(entries.map(entry => entry.wordId)).toEqual([1, 2, 3, 4, 5]);
    });
  });
});