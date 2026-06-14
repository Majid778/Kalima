import {
  getWordStrength,
  strengthFromSM2,
  STRENGTH_LABELS,
  type WordStrength,
} from '../wordStrengthService';

describe('getWordStrength', () => {
  it('returns "new" when status is new (regardless of interval)', () => {
    expect(getWordStrength({ status: 'new', interval: 0, repetitions: 0 })).toBe('new');
    expect(getWordStrength({ status: 'new', interval: 30, repetitions: 5 })).toBe('new');
  });

  it('returns "new" when interval is 0 even if status is learning', () => {
    expect(getWordStrength({ status: 'learning', interval: 0, repetitions: 0 })).toBe('new');
  });

  it('returns "shaky" for learning with interval < 6', () => {
    expect(getWordStrength({ status: 'learning', interval: 1, repetitions: 1 })).toBe('shaky');
    expect(getWordStrength({ status: 'learning', interval: 5, repetitions: 2 })).toBe('shaky');
  });

  it('returns "strong" for learning with interval >= 6', () => {
    expect(getWordStrength({ status: 'learning', interval: 6, repetitions: 2 })).toBe('strong');
    expect(getWordStrength({ status: 'learning', interval: 20, repetitions: 3 })).toBe('strong');
  });

  it('returns "mastered" for review status', () => {
    expect(getWordStrength({ status: 'review', interval: 21, repetitions: 4 })).toBe('mastered');
  });
});

describe('strengthFromSM2', () => {
  it('delegates to getWordStrength', () => {
    expect(strengthFromSM2({ status: 'review', interval: 30, repetitions: 5 })).toBe('mastered');
    expect(strengthFromSM2({ status: 'new', interval: 0, repetitions: 0 })).toBe('new');
  });
});

describe('STRENGTH_LABELS', () => {
  it('has a human label for every strength', () => {
    const keys: WordStrength[] = ['new', 'shaky', 'strong', 'mastered'];
    for (const k of keys) {
      expect(typeof STRENGTH_LABELS[k]).toBe('string');
      expect(STRENGTH_LABELS[k].length).toBeGreaterThan(0);
    }
  });
});
