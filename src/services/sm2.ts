// src/services/sm2.ts
// Custom SM-2 spaced repetition algorithm
// Per D-15, D-16, D-18, D-20 from Phase 03 context

export interface SM2State {
  easeFactor: number;
  interval: number; // in days
  repetitions: number;
  status: 'new' | 'learning' | 'review';
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SM2Result extends SM2State {
  dueDate: string; // YYYY-MM-DD
}

export const DEFAULT_STATE: SM2State = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  status: 'new',
};

/** Returns today's date as YYYY-MM-DD in local timezone (not UTC -- Pitfall 3) */
export function getLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Date arithmetic: adds days to a YYYY-MM-DD string */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Apply +/-10% random fuzz to intervals > 1 day (D-16) */
function applyFuzz(interval: number): number {
  if (interval <= 1) return interval;
  const fuzz = 1 + (Math.random() * 0.2 - 0.1); // +/- 10%
  return Math.max(1, Math.round(interval * fuzz));
}

/** Determine status from interval (D-20) */
function computeStatus(interval: number): 'new' | 'learning' | 'review' {
  if (interval === 0) return 'new';
  if (interval < 21) return 'learning';
  return 'review';
}

/**
 * Core SM-2 grading function.
 * Pure function: given current state and grade, returns new state with dueDate.
 */
export function gradeSM2(
  state: SM2State = DEFAULT_STATE,
  grade: Grade,
  today: string = getLocalToday(),
): SM2Result {
  let { easeFactor, interval, repetitions } = state;

  switch (grade) {
    case 'again':
      // D-18: reset to interval 1, ease -0.20
      easeFactor = Math.max(1.3, easeFactor - 0.20);
      interval = 1;
      repetitions = 0;
      break;
    case 'hard':
      // D-18: interval x 1.2, ease -0.15
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      interval = Math.max(1, Math.round(interval * 1.2));
      repetitions += 1;
      break;
    case 'good':
      // D-18: interval x ease factor
      if (repetitions === 0) {
        interval = 1; // D-15: initial interval
      } else if (repetitions === 1) {
        interval = 6; // D-15: second interval
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      break;
    case 'easy':
      // D-18: interval x ease factor x 1.3, ease +0.15
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      easeFactor += 0.15;
      repetitions += 1;
      break;
  }

  interval = applyFuzz(interval);
  const status = computeStatus(interval);
  const dueDate = addDays(today, interval);

  return { easeFactor, interval, repetitions, status, dueDate };
}

/** Format interval as human-readable string for button labels */
export function formatInterval(days: number): string {
  if (days === 0) return '<1m';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/** Preview what intervals each grade would produce (for button labels) */
export function previewGrades(
  state: SM2State = DEFAULT_STATE,
  today: string = getLocalToday(),
): Record<Grade, string> {
  const grades: Grade[] = ['again', 'hard', 'good', 'easy'];
  const result = {} as Record<Grade, string>;
  for (const g of grades) {
    const r = gradeSM2(state, g, today);
    result[g] = formatInterval(r.interval);
  }
  return result;
}
