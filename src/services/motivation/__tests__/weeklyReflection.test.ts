import { computeWeeklyReflection } from '../weeklyReflection';

describe('computeWeeklyReflection', () => {
  it('counts active days in the inclusive seven-day window ending today', () => {
    expect(computeWeeklyReflection({
      '2026-06-08': 1,
      '2026-06-10': 2,
      '2026-06-14': 1,
      '2026-06-07': 1,
    }, '2026-06-14')).toEqual({
      daysPracticedThisWeek: 3,
      activeDates: ['2026-06-08', '2026-06-10', '2026-06-14'],
    });
  });

  it('ignores zero-count dates', () => {
    expect(computeWeeklyReflection({
      '2026-06-13': 0,
      '2026-06-14': 1,
    }, '2026-06-14')).toEqual({
      daysPracticedThisWeek: 1,
      activeDates: ['2026-06-14'],
    });
  });
});