// Seasons and reference dates. BC seasons by month (meteorological).
export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export const SEASON_OF_MONTH: Season[] = [
  'winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter',
];

export const SEASON_LABEL: Record<Season, string> = { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall' };

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function seasonOf(month: number): Season {
  if (month < 1 || month > 12) throw new Error(`month out of range: ${month}`);
  return SEASON_OF_MONTH[month - 1];
}

/** Monday of the week containing `date` (UTC), as YYYY-MM-DD. */
export function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The week the current Base is for: BASE_WEEK_OF, or the Monday of today. */
export function currentWeekOf(env = process.env, now = new Date()): string {
  const fromEnv = env.BASE_WEEK_OF?.trim();
  if (fromEnv) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromEnv)) throw new Error('BASE_WEEK_OF must be YYYY-MM-DD');
    return mondayOf(new Date(`${fromEnv}T00:00:00Z`));
  }
  return mondayOf(now);
}

/** Month the research engine plans for: BASE_REFERENCE_MONTH, or the month of the current week. */
export function referenceMonth(env = process.env, now = new Date()): number {
  const fromEnv = Number(env.BASE_REFERENCE_MONTH);
  if (fromEnv >= 1 && fromEnv <= 12) return fromEnv;
  return Number(currentWeekOf(env, now).slice(5, 7));
}
