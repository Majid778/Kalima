export type WeeklyReflection = {
  daysPracticedThisWeek: number;
  activeDates: string[];
};

export function computeWeeklyReflection(
  activityDates: Record<string, number>,
  today: string,
): WeeklyReflection {
  const activeDates: string[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    if ((activityDates[date] ?? 0) > 0) {
      activeDates.push(date);
    }
  }

  return {
    daysPracticedThisWeek: activeDates.length,
    activeDates,
  };
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return [
    parsed.getUTCFullYear(),
    pad2(parsed.getUTCMonth() + 1),
    pad2(parsed.getUTCDate()),
  ].join('-');
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}