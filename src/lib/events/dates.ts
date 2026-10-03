/**
 * AN EVENT'S DAYS: its date, and the last day of a range when it runs over more than one (lane `event-dates`, Will
 * 2026-10-03: "a multi-day event/trip with slow trickle", and his yes to an optional end date the same night). A
 * range of days, never times: `events.event_date` is the first day and `events.event_end_date` the last, NULL for a
 * one-day or undated event (the CHECK `events_end_date_on_or_after` holds it on or after the first, and NULL with no
 * first). Every surface reads the two through this file, so a range is one shape everywhere: the words
 * (`formatEventDate`), the dashboard's clock (`lib/dashboard/when.ts`), readiness and the develop default.
 *
 * ★ AN END DATE ONLY SAYS WHEN THE EVENT HAPPENS. Nothing here, nor anything that reads it, ends, locks, archives or
 * purges an event: events have no end of life but deletion (CLAUDE.md, the PRD's anti-abuse core), and
 * `event-dates.test.ts` holds the lifecycle's homes to it.
 *
 * Pure and node-safe, and every day is a `YYYY-MM-DD` string compared as one: the format sorts as the calendar does,
 * so no `Date` (and no zone) is ever read to order two days.
 */

/** An event's days as the host set them: the first and the last, the same day for a one-day event. */
export type EventDays = { first: string; last: string };

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Whether a value is a calendar day as the date columns print it (`YYYY-MM-DD`). */
export const isCalendarDay = (value: unknown): value is string =>
  typeof value === "string" && CALENDAR_DAY.test(value);

/**
 * The host's days, or null for an undated event. An end that is missing, unreadable, or no later than the first day
 * reads as one day (the database refuses an earlier one; a reader never guesses past it), and an end with no first
 * day is no range at all.
 */
export function eventDays(
  date: string | null | undefined,
  endDate?: string | null,
): EventDays | null {
  if (!isCalendarDay(date)) return null;
  const last = isCalendarDay(endDate) && endDate > date ? endDate : date;
  return { first: date, last };
}

/** The last day the host set: the end of a range, else the date; null for an undated event. */
export const lastDayOf = (
  date: string | null | undefined,
  endDate?: string | null,
): string | null => eventDays(date, endDate)?.last ?? null;

/** Whether the dates run over more than one day. */
export function isRange(
  date: string | null | undefined,
  endDate?: string | null,
): boolean {
  const days = eventDays(date, endDate);
  return days !== null && days.last !== days.first;
}

const DAY_MS = 86_400_000;

/** A `YYYY-MM-DD` day as a UTC instant, from its parts alone (never `new Date(str)`, which reads a zone). */
function utc(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/** The day `by` days from `day` (negative goes back), by the date parts alone, so a clock change never moves it. */
export function shiftDay(day: string, by: number): string {
  return new Date(utc(day) + by * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`: 1 is the next day. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / DAY_MS);
}

/**
 * THE ONE SPELLING AN END TAKES BEFORE IT IS WRITTEN: none for a one-day event, so a range said twice ("October 3 to
 * 3") is never stored. An end before its first day is kept, for the database's CHECK to refuse in its own name,
 * rather than dropped in silence.
 */
export function endToStore(
  date: string | null | undefined,
  endDate: string | null | undefined,
): string | null {
  if (!endDate) return null;
  return endDate === date ? null : endDate;
}

/**
 * The row's end date, or null. ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: the events row and the album's read
 * carry `event_end_date` from 20261003120000, and `Tables<"events">` learns it at the regeneration; until then the
 * pages read it through here, at run time, as a calendar day or nothing (before the migration is applied the column
 * is absent and every event reads as one day). Drop the callers onto the typed column once it is there.
 */
export function endDateOf(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const value = (row as { event_end_date?: unknown }).event_end_date;
  return isCalendarDay(value) ? value : null;
}
