import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';

interface StreakState {
  activityDates: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  celebratedMilestones: number[];
  recordActivity: (today: string) => void;
  markMilestoneCelebrated: (m: number) => void;
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
      lastActivityDate: null,
      celebratedMilestones: [],
      recordActivity: (today) => set((state) => {
        const activityDates = {
          ...state.activityDates,
          [today]: (state.activityDates[today] ?? 0) + 1,
        };

        return {
          activityDates,
          currentStreak: computeStreak(activityDates, today),
          longestStreak: computeLongest(activityDates),
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
