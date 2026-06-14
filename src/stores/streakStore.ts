import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';

interface StreakState {
  activityDates: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  graceTokens: number;
  lastActivityDate: string | null;
  celebratedMilestones: number[];
  recordActivity: (today: string) => void;
  markMilestoneCelebrated: (m: number) => void;
}

const GRACE_TOKEN_CAP = 1;

export interface ActivityCell {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3;
}

export function buildActivityGrid(
  activityDates: Record<string, number>,
  today: string,
  weeks = 13,
): ActivityCell[][] {
  const totalDays = weeks * 7;
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - totalDays + 1);

  const cells: ActivityCell[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const cursor = new Date(start);
    cursor.setUTCDate(start.getUTCDate() + i);
    const date = [
      cursor.getUTCFullYear(),
      pad2(cursor.getUTCMonth() + 1),
      pad2(cursor.getUTCDate()),
    ].join('-');
    const count = activityDates[date] ?? 0;
    const intensity: ActivityCell['intensity'] = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;

    cells.push({ date, count, intensity });
  }

  const grid: ActivityCell[][] = [];
  for (let week = 0; week < weeks; week += 1) {
    grid.push(cells.slice(week * 7, week * 7 + 7));
  }

  return grid;
}

export function computeStreak(activityDates: Record<string, number>, today: string): number {
  if (Object.keys(activityDates).length === 0) return 0;

  const todayHasActivity = hasActivity(activityDates, today);
  const yesterday = addDays(today, -1);
  const yesterdayHasActivity = hasActivity(activityDates, yesterday);

  if (!todayHasActivity && !yesterdayHasActivity) return 0;

  let cursor = todayHasActivity ? today : yesterday;
  let streak = 0;

  while (hasActivity(activityDates, cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function computeLongest(activityDates: Record<string, number>): number {
  const activeDates = Object.keys(activityDates)
    .filter(date => hasActivity(activityDates, date))
    .sort();

  if (activeDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < activeDates.length; i += 1) {
    if (activeDates[i] === addDays(activeDates[i - 1], 1)) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set) => ({
      activityDates: {},
      currentStreak: 0,
      longestStreak: 0,
      graceTokens: GRACE_TOKEN_CAP,
      lastActivityDate: null,
      celebratedMilestones: [],
      recordActivity: (today) => set((state) => {
        const activityDates = {
          ...state.activityDates,
          [today]: (state.activityDates[today] ?? 0) + 1,
        };
        const currentStreak = computeStreak(activityDates, today);

        return {
          activityDates,
          currentStreak,
          longestStreak: computeLongest(activityDates),
          graceTokens: currentStreak >= 7
            ? GRACE_TOKEN_CAP
            : Math.min(state.graceTokens ?? GRACE_TOKEN_CAP, GRACE_TOKEN_CAP),
          lastActivityDate: today,
        };
      }),
      markMilestoneCelebrated: (m) => set((state) => {
        if (state.celebratedMilestones.includes(m)) {
          return {};
        }

        return {
          celebratedMilestones: [...state.celebratedMilestones, m],
        };
      }),
    }),
    {
      name: 'kalima-streak',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

function hasActivity(activityDates: Record<string, number>, date: string): boolean {
  return (activityDates[date] ?? 0) > 0;
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return [
    parsed.getFullYear(),
    pad2(parsed.getMonth() + 1),
    pad2(parsed.getDate()),
  ].join('-');
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}
