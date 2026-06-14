export function computeKindStreak(
  activityDates: Record<string, number>,
  today: string,
  graceAllowance: number,
): number {
  if (Object.keys(activityDates).length === 0) return 0;

  const allowance = Math.max(0, Math.floor(graceAllowance));
  const todayHasActivity = hasActivity(activityDates, today);
  const yesterday = addDays(today, -1);
  const yesterdayHasActivity = hasActivity(activityDates, yesterday);

  if (!todayHasActivity && !yesterdayHasActivity) return 0;

  let cursor = todayHasActivity ? today : yesterday;
  let usedGrace = 0;
  let streak = 0;

  while (true) {
    if (hasActivity(activityDates, cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }

    const previous = addDays(cursor, -1);
    if (usedGrace < allowance && hasActivity(activityDates, previous)) {
      usedGrace += 1;
      cursor = previous;
      continue;
    }

    return streak;
  }
}

function hasActivity(activityDates: Record<string, number>, date: string): boolean {
  return (activityDates[date] ?? 0) > 0;
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