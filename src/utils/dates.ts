/**
 * Calendar-date helpers in the device's local time zone.
 * (toISOString() is UTC, which puts "today" on the wrong day near midnight,
 * e.g. before 05:30 in India or after 19:00 in New York.)
 */

/** YYYY-MM-DD for the given moment in local time. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** True when an ISO timestamp falls on today's local calendar date. */
export function isLocalToday(iso: string | undefined | null): boolean {
  if (!iso) return false;
  const t = new Date(iso);
  return !Number.isNaN(t.getTime()) && localDateKey(t) === localDateKey();
}
