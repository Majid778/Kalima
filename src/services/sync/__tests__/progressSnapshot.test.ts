import {
  isValidSnapshot,
  mergeWordProgress,
  type ProgressSnapshot,
  type WordProgressRow,
} from '../progressSnapshot';

const baseWordRow: WordProgressRow = {
  wordId: 1,
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  dueDate: '2026-06-14',
  lastReviewed: null,
  status: 'new',
};

const validSnapshot: ProgressSnapshot = {
  schemaVersion: 1,
  exportedAt: '2026-06-14T00:00:00.000Z',
  wordProgress: [baseWordRow],
  levelProgress: [{
    levelId: 1,
    unlocked: 1,
    bestQuizScore: 0.9,
    completedAt: '2026-06-14',
  }],
  streak: {
    activityDates: { '2026-06-14': 2 },
    celebratedMilestones: [7],
  },
  settings: {
    theme: 'dark',
    reciterId: 'alafasy',
    showTransliteration: true,
    autoPlayAudio: false,
  },
};

describe('isValidSnapshot', () => {
  it('accepts a complete progress snapshot', () => {
    expect(isValidSnapshot(validSnapshot)).toBe(true);
  });

  it('rejects invalid snapshot shapes', () => {
    expect(isValidSnapshot(null)).toBe(false);
    expect(isValidSnapshot({ ...validSnapshot, schemaVersion: 2 })).toBe(false);
    expect(isValidSnapshot({ ...validSnapshot, wordProgress: [{ ...baseWordRow, wordId: '1' }] })).toBe(false);
    expect(isValidSnapshot({ ...validSnapshot, streak: { activityDates: { '2026-06-14': '2' }, celebratedMilestones: [] } })).toBe(false);
    expect(isValidSnapshot({ ...validSnapshot, settings: { ...validSnapshot.settings, autoPlayAudio: 'false' } })).toBe(false);
  });
});

describe('mergeWordProgress', () => {
  it('keeps the row with higher repetitions for the same word', () => {
    const local = [{ ...baseWordRow, wordId: 10, repetitions: 2, interval: 10 }];
    const incoming = [{ ...baseWordRow, wordId: 10, repetitions: 3, interval: 1 }];

    expect(mergeWordProgress(local, incoming)).toEqual(incoming);
  });

  it('uses higher interval as the first tie-breaker', () => {
    const local = [{ ...baseWordRow, wordId: 10, repetitions: 3, interval: 8 }];
    const incoming = [{ ...baseWordRow, wordId: 10, repetitions: 3, interval: 9 }];

    expect(mergeWordProgress(local, incoming)).toEqual(incoming);
  });

  it('uses later lastReviewed as the second tie-breaker', () => {
    const local = [{ ...baseWordRow, wordId: 10, repetitions: 3, interval: 9, lastReviewed: '2026-06-14' }];
    const incoming = [{ ...baseWordRow, wordId: 10, repetitions: 3, interval: 9, lastReviewed: '2026-06-15' }];

    expect(mergeWordProgress(local, incoming)).toEqual(incoming);
  });

  it('keeps local progress when incoming would regress and returns rows in wordId order', () => {
    const local = [{ ...baseWordRow, wordId: 20, repetitions: 5 }];
    const incoming = [
      { ...baseWordRow, wordId: 30, repetitions: 1 },
      { ...baseWordRow, wordId: 20, repetitions: 4, interval: 99 },
    ];

    expect(mergeWordProgress(local, incoming)).toEqual([
      local[0],
      incoming[0],
    ]);
  });
});
