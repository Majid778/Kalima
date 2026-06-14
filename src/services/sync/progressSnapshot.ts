import { levelProgress, wordProgress } from '../../data/schema';

export type WordProgressRow = typeof wordProgress.$inferSelect;
export type LevelProgressRow = typeof levelProgress.$inferSelect;

export type ProgressSnapshot = {
  schemaVersion: 1;
  exportedAt: string;
  wordProgress: WordProgressRow[];
  levelProgress: LevelProgressRow[];
  streak: {
    activityDates: Record<string, number>;
    celebratedMilestones: number[];
  };
  settings: {
    theme: string;
    reciterId: string;
    showTransliteration: boolean;
    autoPlayAudio: boolean;
  };
};

export function mergeWordProgress(
  local: WordProgressRow[],
  incoming: WordProgressRow[],
): WordProgressRow[] {
  const rowsByWordId = new Map<number, WordProgressRow>();

  for (const row of local) {
    rowsByWordId.set(row.wordId, row);
  }

  for (const row of incoming) {
    const current = rowsByWordId.get(row.wordId);
    if (!current || isFurtherAlong(row, current)) {
      rowsByWordId.set(row.wordId, row);
    }
  }

  return Array.from(rowsByWordId.values())
    .sort((a, b) => a.wordId - b.wordId);
}

export function isValidSnapshot(x: unknown): x is ProgressSnapshot {
  if (!isRecord(x)) return false;

  return x.schemaVersion === 1
    && typeof x.exportedAt === 'string'
    && Array.isArray(x.wordProgress)
    && x.wordProgress.every(isWordProgressRow)
    && Array.isArray(x.levelProgress)
    && x.levelProgress.every(isLevelProgressRow)
    && isStreakSnapshot(x.streak)
    && isSettingsSnapshot(x.settings);
}

function isFurtherAlong(candidate: WordProgressRow, current: WordProgressRow): boolean {
  if (candidate.repetitions !== current.repetitions) {
    return candidate.repetitions > current.repetitions;
  }

  if (candidate.interval !== current.interval) {
    return candidate.interval > current.interval;
  }

  return compareNullableDate(candidate.lastReviewed, current.lastReviewed) > 0;
}

function compareNullableDate(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a.localeCompare(b);
}

function isWordProgressRow(x: unknown): x is WordProgressRow {
  return isRecord(x)
    && typeof x.wordId === 'number'
    && typeof x.easeFactor === 'number'
    && typeof x.interval === 'number'
    && typeof x.repetitions === 'number'
    && typeof x.dueDate === 'string'
    && isNullableString(x.lastReviewed)
    && typeof x.status === 'string';
}

function isLevelProgressRow(x: unknown): x is LevelProgressRow {
  return isRecord(x)
    && typeof x.levelId === 'number'
    && typeof x.unlocked === 'number'
    && isNullableNumber(x.bestQuizScore)
    && isNullableString(x.completedAt);
}

function isStreakSnapshot(x: unknown): x is ProgressSnapshot['streak'] {
  if (!isRecord(x) || !isNumberRecord(x.activityDates) || !Array.isArray(x.celebratedMilestones)) {
    return false;
  }

  return x.celebratedMilestones.every((milestone) => typeof milestone === 'number');
}

function isSettingsSnapshot(x: unknown): x is ProgressSnapshot['settings'] {
  return isRecord(x)
    && typeof x.theme === 'string'
    && typeof x.reciterId === 'string'
    && typeof x.showTransliteration === 'boolean'
    && typeof x.autoPlayAudio === 'boolean';
}

function isNumberRecord(x: unknown): x is Record<string, number> {
  return isRecord(x)
    && Object.values(x).every((value) => typeof value === 'number');
}

function isNullableString(x: unknown): x is string | null {
  return x === null || typeof x === 'string';
}

function isNullableNumber(x: unknown): x is number | null {
  return x === null || typeof x === 'number';
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}
