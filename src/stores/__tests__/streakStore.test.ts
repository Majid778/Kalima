import { computeLongest, computeStreak } from '../streakStore';

describe('computeStreak', () => {
  it('returns 0 for empty activity', () => {
    expect(computeStreak({}, '2025-01-10')).toBe(0);
  });

  it('counts today only as a 1-day streak', () => {
    expect(computeStreak({ '2025-01-10': 1 }, '2025-01-10')).toBe(1);
  });

  it('counts a consecutive run ending today', () => {
    expect(computeStreak({
      '2025-01-08': 1,
      '2025-01-09': 2,
      '2025-01-10': 1,
    }, '2025-01-10')).toBe(3);
  });

  it('only counts the run ending today when history has a middle gap', () => {
    expect(computeStreak({
      '2025-01-06': 1,
      '2025-01-08': 1,
      '2025-01-09': 1,
      '2025-01-10': 1,
    }, '2025-01-10')).toBe(3);
  });

  it('keeps the streak alive when today is missing but yesterday has activity', () => {
    expect(computeStreak({
      '2025-01-08': 1,
      '2025-01-09': 1,
    }, '2025-01-10')).toBe(2);
  });

  it('returns 0 when both today and yesterday are missing', () => {
    expect(computeStreak({
      '2025-01-07': 1,
      '2025-01-08': 1,
    }, '2025-01-10')).toBe(0);
  });
});

describe('computeLongest', () => {
  it('returns 0 for empty activity', () => {
    expect(computeLongest({})).toBe(0);
  });

  it('returns the longest run across gaps in the full history', () => {
    expect(computeLongest({
      '2025-01-01': 1,
      '2025-01-03': 1,
      '2025-01-04': 2,
      '2025-01-05': 1,
      '2025-01-08': 1,
      '2025-01-09': 1,
    })).toBe(3);
  });
});
