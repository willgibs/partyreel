/**
 * TIME DECIDES WHAT MATTERS (host-dashboard r1, Will 2026-10-02: the party of the moment, this week's
 * parties, the live wall, grouped by when). An event's life has phases (before its day, its day, the
 * month its album fills and is shared, then the years after), and what deserves a host's attention
 * follows them: before, the door and the code; on the day, the people at the door and the photographs
 * landing; after, the queue. This file holds the clock's half of that, as pure functions of the
 * viewer's calendar day (`viewer-day.ts`), so every band reads one answer and the answer is tested.
 *
 * ★ AN EVENT'S DAY IS THE ONE ITS HOST SET, ELSE THE ONE ITS PHOTOGRAPHS SAY. Create asks no date
 * (the welcome is Settings' to finish), so most events start undated, and a dashboard that read only
 * `event_date` would leave a wedding nobody dated reading "No date yet" while two hundred photographs
 * land. So an undated event with an album takes the viewer's calendar day of its newest approved
 * upload (`dayOf`): it is live on a day photographs land, just past the week after, and folds into its
 * year like any other; an undated empty event has no day at all and waits with what is coming. The
 * words never claim the inferred day as a date (`whenOf` reads the host's own date only, "No date"
 * otherwise): it places an event in time, it does not date it.
 *
 * Pure and node-safe: the caller passes `today` (and whether the viewer's clock is in the evening),
 * because a clock read in render is impure and only a pure function can be pinned.
 */

/** An event's phase on the viewer's day. */
export type Phase = "before" | "live" | "after" | "past";

/** How long after its day an event keeps its after-party: the month its album is shared in. */
export const AFTER_DAYS = 30;

/** "This week", both ways: the window the week's band reads. */
export const WEEK_DAYS = 7;

/** From this hour of the viewer's clock, today is tonight. */
export const EVENING_HOUR = 17;

const DAY_MS = 86_400_000;

/** A `YYYY-MM-DD` day as a UTC instant, from its parts alone (never `new Date(str)`, which reads a zone). */
function utc(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from `today` to `day`: 1 is tomorrow, -1 yesterday. By the date parts alone, so DST never moves it. */
export function daysFrom(today: string, day: string): number {
  return Math.round((utc(day) - utc(today)) / DAY_MS);
}

/** What an event's day is made of: the host's date, and the day its newest approved upload landed. */
export type Dated = {
  /** `YYYY-MM-DD` the host set, or null. */
  date: string | null;
  /** The newest approved upload, its instant and the viewer's calendar day of it; null for an empty album. */
  lastArrival: { at: string; day: string } | null;
};

/** The event's day: the host's date, else the day its photographs last landed, else none. */
export function dayOf(e: Dated): string | null {
  return e.date ?? e.lastArrival?.day ?? null;
}

/** The phase of a day: no day reads as before (set up, never over). */
export function phaseOf(day: string | null, today: string): Phase {
  if (!day) return "before";
  const d = daysFrom(today, day);
  if (d > 0) return "before";
  if (d === 0) return "live";
  return -d <= AFTER_DAYS ? "after" : "past";
}

/** An event's phase on the viewer's day, by its day (`dayOf`). */
export const phaseOfEvent = (e: Dated, today: string): Phase =>
  phaseOf(dayOf(e), today);

// Every format is en-US in UTC: a `YYYY-MM-DD` built at UTC midnight and read back in UTC is that day in
// any zone the page renders in (`formatEventDate`'s rule, `lib/utils.ts`).
const fmt = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" });
const WEEKDAY = fmt({ weekday: "long" });
const SHORT = fmt({ weekday: "short", month: "short", day: "numeric" });
const MONTH_DAY = fmt({ month: "short", day: "numeric" });
const MONTH_DAY_YEAR = fmt({ month: "short", day: "numeric", year: "numeric" });
const MONTH_YEAR = fmt({ month: "short", year: "numeric" });
const LONG = fmt({ weekday: "long", month: "long", day: "numeric" });
const LONG_YEAR = fmt({
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const DAY_NUMBER = fmt({ day: "numeric" });
const MONTH_SHORT = fmt({ month: "short" });
const WEEKDAY_SHORT = fmt({ weekday: "short" });

/**
 * "Friday, October 2": the day as a heading says it, and with its year ("Friday, October 2, 2026") once
 * it is not this year's, since a weekday and a date alone name a day in every year.
 */
export const longDate = (day: string, today?: string) =>
  (today && day.slice(0, 4) !== today.slice(0, 4) ? LONG_YEAR : LONG).format(
    new Date(utc(day)),
  );

/** A date face's three parts, "Sat", "Oct", "3": what a tile wears before it has a photograph. */
export function dateFace(day: string): {
  weekday: string;
  month: string;
  day: string;
} {
  const at = new Date(utc(day));
  return {
    weekday: WEEKDAY_SHORT.format(at),
    month: MONTH_SHORT.format(at),
    day: DAY_NUMBER.format(at),
  };
}

/**
 * WHEN, IN THE FEWEST WORDS THAT ARE STILL EXACT, from the host's own date. Today (Tonight from the
 * evening), Tomorrow, Yesterday, the weekday inside a week ahead (a weekday behind would read as the
 * next one, so the past says its date), the date inside a month either way, then the month and day
 * this year, and once the year has turned the month and year for a party gone by (its day no longer
 * matters) or the full date for one to come (it does). An undated event says so.
 */
export function whenOf(
  date: string | null,
  today: string,
  evening = false,
): string {
  if (!date) return "No date";
  const d = daysFrom(today, date);
  const at = new Date(utc(date));
  if (d === 0) return evening ? "Tonight" : "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 1 && d < WEEK_DAYS) return WEEKDAY.format(at);
  if (Math.abs(d) <= AFTER_DAYS) return SHORT.format(at);
  if (date.slice(0, 4) === today.slice(0, 4)) return MONTH_DAY.format(at);
  return d > 0 ? MONTH_DAY_YEAR.format(at) : MONTH_YEAR.format(at);
}

/** Whether the viewer's clock is in the evening, by its hour (0 to 23). */
export const isEvening = (hour: number) => hour >= EVENING_HOUR;
