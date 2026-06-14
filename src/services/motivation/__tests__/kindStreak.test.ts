import { computeKindStreak } from '../kindStreak';

describe('computeKindStreak', () => {
  it('counts a consecutive rhythm ending today without using grace', () => {
    expect(computeKindStreak({
      '2026-06-12': 1,
      '2026-06-13': 1,
      '2026-06-14': 2,
    }, '2026-06-14', 1)).toBe(3);
  });

  it('bridges one single-day gap when grace is available', () => {
    expect(computeKindStreak({
      '2026-06-10': 1,
      '2026-06-11': 1,
      '2026-06-13': 1,
      '2026-06-14': 1,
    }, '2026-06-14', 1)).toBe(4);
  });

  it('stops at a second single-day gap when allowance is already used', () => {
    expect(computeKindStreak({
      '2026-06-08': 1,
      '2026-06-10': 1,
      '2026-06-12': 1,
      '2026-06-14': 1,
    }, '2026-06-14', 1)).toBe(2);
  });

  it('keeps the rhythm visible when today has no activity but yesterday does', () => {
    expect(computeKindStreak({
      '2026-06-11': 1,
      '2026-06-12': 1,
      '2026-06-13': 1,
    }, '2026-06-14', 1)).toBe(3);
  });

  it('returns 0 when today and yesterday have no activity', () => {
    expect(computeKindStreak({
      '2026-06-11': 1,
      '2026-06-12': 1,
    }, '2026-06-14', 1)).toBe(0);
  });
});