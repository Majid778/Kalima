import { buildActivityGrid, computeLongest, computeStreak } from '../streakStore';

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

describe('buildActivityGrid', () => {
  it('returns week columns with 7 cells each', () => {
    const grid = buildActivityGrid({}, '2025-01-14', 2);

    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(7);
    expect(grid[1]).toHaveLength(7);
    expect(grid.flat()).toHaveLength(14);
  });

  it('ends on today', () => {
    const grid = buildActivityGrid({}, '2025-01-14', 2);

    expect(grid[1][6].date).toBe('2025-01-14');
  });

  it('returns chronological dates that advance by one day', () => {
    const cells = buildActivityGrid({}, '2025-01-14', 2).flat();

    for (let i = 1; i < cells.length; i += 1) {
      const previous = new Date(`${cells[i - 1].date}T00:00:00Z`);
      const current = new Date(`${cells[i].date}T00:00:00Z`);

      expect(current.getTime() - previous.getTime()).toBe(86400000);
    }
  });

  it('buckets intensity by activity count', () => {
    const grid = buildActivityGrid({
      '2025-01-11': 1,
      '2025-01-12': 2,
      '2025-01-13': 3,
      '2025-01-14': 4,
    }, '2025-01-14', 1);

    expect(grid[0].map(cell => cell.intensity)).toEqual([0, 0, 0, 1, 2, 3, 3]);
  });
});
