import {
  buildTodaySession,
  reinsertAtEnd,
  computeNewWords,
  computeDueReviews,
  type SessionConfig,
  type SessionItem,
} from '../sessionService';
import type { WordWithVerses } from '../wordService';
import type { DueCard } from '../practiceService';

const cfg: SessionConfig = { dailyNewTarget: 10, maxSessionSize: 30 };

function word(id: number): WordWithVerses {
  return {
    id,
    arabic: `w${id}`,
    transliteration: `t${id}`,
    meaning: `m${id}`,
    root: null,
    partOfSpeech: null,
    occurrenceCount: 1,
    verses: [],
  };
}

function due(id: number): DueCard {
  return {
    ...word(id),
    easeFactor: 2.5,
    interval: 5,
    repetitions: 1,
    status: 'learning',
  };
}

describe('computeNewWords', () => {
  it('caps at dailyNewTarget', () => {
    const avail = Array.from({ length: 25 }, (_, i) => word(i + 1));
    expect(computeNewWords(avail, cfg)).toHaveLength(10);
  });
  it('returns all when fewer than the target', () => {
    expect(computeNewWords([word(1), word(2)], cfg)).toHaveLength(2);
  });
});

describe('computeDueReviews', () => {
  it('is capped by remaining capacity after new items', () => {
    const dues = Array.from({ length: 40 }, (_, i) => due(i + 100));
    const reviews = computeDueReviews(dues, cfg, 10); // 10 new already → 20 capacity
    expect(reviews).toHaveLength(20);
  });
});

describe('buildTodaySession', () => {
  it('never exceeds maxSessionSize', () => {
    const avail = Array.from({ length: 50 }, (_, i) => word(i + 1));
    const dues = Array.from({ length: 50 }, (_, i) => due(i + 1000));
    const seq = buildTodaySession(dues, avail, cfg);
    expect(seq.totalCount).toBeLessThanOrEqual(cfg.maxSessionSize);
    expect(seq.totalCount).toBe(seq.items.length);
    expect(seq.newCount + seq.reviewCount + seq.checkCount).toBe(seq.totalCount);
  });

  it('orders new before review before check', () => {
    const seq = buildTodaySession([due(900)], [word(1)], cfg);
    const types = seq.items.map((i) => i.type);
    const firstReview = types.indexOf('review');
    const firstCheck = types.indexOf('check');
    expect(types[0]).toBe('new');
    if (firstReview !== -1 && firstCheck !== -1) {
      expect(firstReview).toBeLessThan(firstCheck);
    }
  });

  it('produces an empty session when nothing is available', () => {
    const seq = buildTodaySession([], [], cfg);
    expect(seq.totalCount).toBe(0);
    expect(seq.items).toEqual([]);
  });
});

describe('reinsertAtEnd (bounded retry — guarantees termination)', () => {
  const seq = buildTodaySession([], [word(1)], cfg);
  const item: SessionItem = seq.items[0];

  it('appends a copy with incremented reviewCount', () => {
    const next = reinsertAtEnd(seq, item, 2);
    expect(next.totalCount).toBe(seq.totalCount + 1);
    expect(next.items[next.items.length - 1].reviewCount).toBe(item.reviewCount + 1);
  });

  it('DROPS the item (unchanged length) once the retry cap is exhausted', () => {
    const exhausted: SessionItem = { ...item, reviewCount: 2 };
    const next = reinsertAtEnd(seq, exhausted, 2);
    expect(next.totalCount).toBe(seq.totalCount); // no growth → session terminates
  });

  it('does not mutate the input sequence', () => {
    const before = seq.items.length;
    reinsertAtEnd(seq, item, 2);
    expect(seq.items.length).toBe(before);
  });
});
