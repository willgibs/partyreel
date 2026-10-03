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
 *
 * ★ A DAY AN EVENT MAY NAME IS A REAL ONE IN A WINDOW OF YEARS (`isSaneDay`, crumbs-59). A date field passes through
 * days it was never meant to save: Chrome's fires a complete date on every keystroke, so 2027 typed a digit at a time
 * is 0002, 0020, 0202, then 2027. Settings' field no longer saves a keystroke (`event-page.tsx`), and a day outside the
 * window is refused wherever one is taken: under the field, in the schema's own words (`validation/event.ts`), and
 * (finite only) by the database's CHECK (`20261003200000`).
 */

/** An event's days as the host set them: the first and the last, the same day for a one-day event. */
export type EventDays = { first: string; last: string };

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Whether a value is a calendar day as the date columns print it (`YYYY-MM-DD`). */
export const isCalendarDay = (value: unknown): value is string =>
  typeof value === "string" && CALENDAR_DAY.test(value);

/**
 * THE YEARS AN EVENT'S DAYS MAY NAME, BOTH ENDS IN. Wide on purpose: a day's job here is only to say when, so the window
 * refuses garbage (a year typed half way, a stray fifth digit, a date nobody holds a party on), never a date that is
 * merely far off. It is a century either side of the product, and not a rule about the present: no clock reads it.
 */
export const FIRST_EVENT_YEAR = 1900;
export const LAST_EVENT_YEAR = 2100;
export const EARLIEST_EVENT_DAY = `${FIRST_EVENT_YEAR}-01-01`;
export const LATEST_EVENT_DAY = `${LAST_EVENT_YEAR}-12-31`;

/**
 * Whether a value is a day an event may name: a real calendar day (never "2026-02-30", never Postgres's own
 * `'infinity'`, never a time) inside the window of years. The year is four digits, so a fifth typed by a slip is not a day.
 */
export function isSaneDay(value: unknown): value is string {
  return (
    isCalendarDay(value) &&
    value >= EARLIEST_EVENT_DAY &&
    value <= LATEST_EVENT_DAY &&
    shiftDay(value, 0) === value
  );
}

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

/**
 * A `YYYY-MM-DD` day as a UTC instant, from its parts alone: never `new Date(str)`, which reads a zone, and never
 * `Date.UTC(y, ...)`, which reads a year from 0 to 99 as 1900 to 1999 (so "0002-10-02", the first stop of a year typed a
 * digit at a time, was counted from 1902 and a range measured from it came out a century and a half wrong).
 */
function utc(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const at = new Date(0);
  at.setUTCFullYear(y ?? 0, (m ?? 1) - 1, d ?? 1);
  return at.getTime();
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
 * WHERE A NEW FIRST DAY LEAVES A RANGE'S END (Settings' range control; days as its fields hold them, "" for none): an
 * end still after the new day stays (a host moving her first day earlier keeps her Sunday); one the new day reaches or
 * passes moves with it, keeping the range's length (a weekend rescheduled is still a weekend); a cleared date takes its
 * end with it, since an end never stands alone.
 *
 * ★ `wasDate` AND `wasEnd` ARE WHAT WAS LAST SAVED, AND `next` A DATE SHE FINISHED: the length it keeps is the range's as
 * the host last had it, never a stop a keystroke passed on the way (the field hands it nothing else, `event-page.tsx`).
 */
export function endForNewStart(
  next: string,
  wasDate: string,
  wasEnd: string,
): string {
  if (!next || !wasEnd) return "";
  if (wasEnd > next) return wasEnd;
  const moved = shiftDay(wasEnd, wasDate ? daysBetween(wasDate, next) : 0);
  return moved > next ? moved : "";
}
