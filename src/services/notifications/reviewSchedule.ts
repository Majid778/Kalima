// src/services/notifications/reviewSchedule.ts
// Pure scheduling logic for local, offline, SM-2-tied review reminders.
// Review-readiness framing — never guilt/loss-aversion. Opt-in; capped per week.

export type NotificationPrefs = {
  enabled: boolean;
  maxPerWeek: number;
  preferredHour: number;
};

export type ScheduledReview = {
  date: string;
  hour: number;
  dueCount: number;
  title: string;
  body: string;
};

/**
 * Gentle, gratitude/readiness-framed copy. Never "falling behind" / "lost streak".
 */
export function reviewReadinessCopy(dueCount: number): { title: string; body: string } {
  const noun = dueCount === 1 ? 'word' : 'words';
  return {
    title: `Time to strengthen ${dueCount} ${noun}`,
    body: `${dueCount} ${noun} ${dueCount === 1 ? 'is' : 'are'} ready for review — a few minutes keeps ${dueCount === 1 ? 'it' : 'them'} with you.`,
  };
}

/**
 * From upcoming per-day due counts, pick up to `maxPerWeek` days within the next
 * 7 (only days with count > 0, soonest first), each at `preferredHour`.
 * Returns [] when disabled or nothing is due.
 */
export function computeReviewSchedule(input: {
  dueCountsByDate: { date: string; count: number }[];
  prefs: NotificationPrefs;
  today: string;
}): ScheduledReview[] {
  const { dueCountsByDate, prefs, today } = input;
  if (!prefs.enabled) return [];

  const horizon = addDays(today, 7);
  const eligible = dueCountsByDate
    .filter((d) => d.count > 0 && d.date >= today && d.date < horizon)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, Math.max(0, prefs.maxPerWeek));

  return eligible.map((d) => {
    const copy = reviewReadinessCopy(d.count);
    return {
      date: d.date,
      hour: prefs.preferredHour,
      dueCount: d.count,
      title: copy.title,
      body: copy.body,
    };
  });
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
}
