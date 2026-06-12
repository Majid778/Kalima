import { crossedMilestone, isLevelUnlocked } from '../progressService';

describe('isLevelUnlocked', () => {
  it('always unlocks level 1', () => {
    expect(isLevelUnlocked([], 1)).toBe(true);
  });

  it('keeps other levels locked when no progress row exists', () => {
    expect(isLevelUnlocked([{ levelId: 2, unlocked: 0 }], 3)).toBe(false);
  });

  it('keeps other levels locked when unlocked flag is false', () => {
    expect(isLevelUnlocked([{ levelId: 2, unlocked: 0 }], 2)).toBe(false);
  });

  it('unlocks other levels when unlocked flag is set', () => {
    expect(isLevelUnlocked([{ levelId: 2, unlocked: 1 }], 2)).toBe(true);
  });
});

describe('crossedMilestone', () => {
  it('returns 0.25 when crossing the first threshold', () => {
    expect(crossedMilestone(0.24, 0.25)).toBe(0.25);
  });

  it('returns 0.5 when crossing the second threshold', () => {
    expect(crossedMilestone(0.49, 0.5)).toBe(0.5);
  });

  it('returns 0.75 when crossing the third threshold', () => {
    expect(crossedMilestone(0.74, 0.75)).toBe(0.75);
  });

  it('returns 1.0 when crossing the final threshold', () => {
    expect(crossedMilestone(0.99, 1.0)).toBe(1.0);
  });

  it('returns null when no threshold is crossed', () => {
    expect(crossedMilestone(0.25, 0.49)).toBeNull();
  });

  it('returns the highest newly crossed threshold for a multi-threshold jump', () => {
    expect(crossedMilestone(0.2, 0.8)).toBe(0.75);
  });
});
