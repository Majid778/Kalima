import { gradeSM2, previewGrades, formatInterval, SM2State, DEFAULT_STATE, addDays, getLocalToday } from '../sm2';

const TODAY = '2025-01-01';
const originalRandom = Math.random;

beforeEach(() => {
  // Default: mock Math.random to return 0.5 (fuzz = 1.0, no effect)
  Math.random = jest.fn().mockReturnValue(0.5);
});

afterEach(() => {
  Math.random = originalRandom;
});

describe('gradeSM2', () => {
  describe('again grade', () => {
    it('resets interval to 1 and decreases EF by 0.20', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 10, repetitions: 3, status: 'learning' };
      const result = gradeSM2(state, 'again', TODAY);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBe(2.3);
      expect(result.repetitions).toBe(0);
    });

    it('never drops EF below 1.3 after multiple again grades', () => {
      let state: SM2State = { easeFactor: 1.5, interval: 5, repetitions: 2, status: 'learning' };
      const r1 = gradeSM2(state, 'again', TODAY);
      expect(r1.easeFactor).toBe(1.3);
      state = { easeFactor: 1.3, interval: r1.interval, repetitions: r1.repetitions, status: r1.status };
      const r2 = gradeSM2(state, 'again', TODAY);
      expect(r2.easeFactor).toBe(1.3); // floor
    });
  });

  describe('hard grade', () => {
    it('multiplies interval by 1.2 and decreases EF by 0.15', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 10, repetitions: 3, status: 'learning' };
      const result = gradeSM2(state, 'hard', TODAY);
      expect(result.interval).toBe(12); // 10 * 1.2 = 12
      expect(result.easeFactor).toBe(2.35);
      expect(result.repetitions).toBe(4);
    });

    it('hard on interval 0 gives interval 1 (max(1, round(0*1.2)))', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const result = gradeSM2(state, 'hard', TODAY);
      expect(result.interval).toBe(1);
    });
  });

  describe('good grade', () => {
    it('first review (rep=0): interval = 1 day', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const result = gradeSM2(state, 'good', TODAY);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('second review (rep=1): interval = 6 days', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 1, repetitions: 1, status: 'learning' };
      const result = gradeSM2(state, 'good', TODAY);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('third+ review: interval = current * EF', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 6, repetitions: 2, status: 'learning' };
      const result = gradeSM2(state, 'good', TODAY);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.repetitions).toBe(3);
    });
  });

  describe('easy grade', () => {
    it('interval = current * EF * 1.3, EF increases by 0.15', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 6, repetitions: 2, status: 'learning' };
      const result = gradeSM2(state, 'easy', TODAY);
      expect(result.interval).toBe(20); // round(6 * 2.5 * 1.3) = 19.5 -> 20
      expect(result.easeFactor).toBe(2.65);
      expect(result.repetitions).toBe(3);
    });

    it('first review with easy: interval = 1', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const result = gradeSM2(state, 'easy', TODAY);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBe(2.65);
    });
  });

  describe('interval fuzzing', () => {
    it('applies fuzz to intervals > 1', () => {
      Math.random = jest.fn().mockReturnValue(0.0); // fuzz = 1 + (0 * 0.2 - 0.1) = 0.9
      const state: SM2State = { easeFactor: 2.5, interval: 6, repetitions: 2, status: 'learning' };
      const result = gradeSM2(state, 'good', TODAY);
      // 6 * 2.5 = 15, 15 * 0.9 = 13.5 -> 14
      expect(result.interval).toBe(14);
    });

    it('does not fuzz interval of exactly 1', () => {
      Math.random = jest.fn().mockReturnValue(0.0); // would be 0.9x if applied
      const state: SM2State = { easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const result = gradeSM2(state, 'good', TODAY);
      expect(result.interval).toBe(1); // no fuzz
    });
  });

  describe('status transitions', () => {
    it('DEFAULT_STATE has status new with interval 0', () => {
      expect(DEFAULT_STATE.status).toBe('new');
      expect(DEFAULT_STATE.interval).toBe(0);
    });

    it('interval 1-20 = learning', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 0, repetitions: 0, status: 'new' };
      const result = gradeSM2(state, 'good', TODAY);
      expect(result.status).toBe('learning');
    });

    it('interval >= 21 = review', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 15, repetitions: 3, status: 'learning' };
      const result = gradeSM2(state, 'good', TODAY);
      // 15 * 2.5 = 37.5 -> 38
      expect(result.interval).toBe(38);
      expect(result.status).toBe('review');
    });
  });

  describe('dueDate computation', () => {
    it('computes dueDate as today + interval', () => {
      const state: SM2State = { easeFactor: 2.5, interval: 1, repetitions: 1, status: 'learning' };
      const result = gradeSM2(state, 'good', '2025-01-01');
      // interval = 6, due = 2025-01-07
      expect(result.dueDate).toBe('2025-01-07');
    });
  });
});

describe('previewGrades', () => {
  it('returns formatted interval strings for all 4 grades', () => {
    const state: SM2State = { easeFactor: 2.5, interval: 6, repetitions: 2, status: 'learning' };
    const preview = previewGrades(state, TODAY);
    expect(preview.again).toBe('1d');
    expect(preview.hard).toBeDefined();
    expect(preview.good).toBeDefined();
    expect(preview.easy).toBeDefined();
  });
});

describe('formatInterval', () => {
  it('0 days = "<1m"', () => expect(formatInterval(0)).toBe('<1m'));
  it('1 day = "1d"', () => expect(formatInterval(1)).toBe('1d'));
  it('15 days = "15d"', () => expect(formatInterval(15)).toBe('15d'));
  it('45 days = "2mo"', () => expect(formatInterval(45)).toBe('2mo'));
  it('400 days = "1.1y"', () => expect(formatInterval(400)).toBe('1.1y'));
});

describe('addDays', () => {
  it('adds days correctly', () => {
    expect(addDays('2025-01-01', 5)).toBe('2025-01-06');
    expect(addDays('2025-01-30', 3)).toBe('2025-02-02');
    expect(addDays('2025-12-30', 5)).toBe('2026-01-04');
  });
});

describe('getLocalToday', () => {
  it('returns YYYY-MM-DD format', () => {
    Math.random = originalRandom; // restore for this test
    const today = getLocalToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
