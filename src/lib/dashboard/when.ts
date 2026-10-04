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
 * ★ AN EVENT IS ON ITS DAY ACROSS ITS WHOLE RANGE (lane `event-dates`, Will 2026-10-03). A host may date an event
 * over several days (a weekend wedding, a conference, a trip: `events.event_end_date`, its shape `lib/events/dates.ts`),
 * so the clock reads an event's DAYS (`spanOf`), never one day: live on its first, its middle and its last, its month
 * after counted from its last, and so many days away by its nearest day (`daysToEvent`: to its first ahead, from its
 * last behind). A range is a host's date, so it is never inferred: an undated album is one day by its photographs.
 *
 * Pure and node-safe: the caller passes `today` (and whether the viewer's clock is in the evening),
 * because a clock read in render is impure and only a pure function can be pinned.
 */

import { type EventDays, eventDays } from "@/lib/events/dates";
import { dashRange } from "@/lib/utils";

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

/** What an event's day is made of: the host's dates, and the day its newest approved upload landed. */
export type Dated = {
  /** `YYYY-MM-DD` the host set, or null: the first day of a range. */
  date: string | null;
  /**
   * The last day of a range the host set (`YYYY-MM-DD`), or null for one day. Absent reads as one day, so a fixture
   * or a stand-in built before ranges need not say it.
   */
  endDate?: string | null;
  /** The newest approved upload, its instant and the viewer's calendar day of it; null for an empty album. */
  lastArrival: { at: string; day: string } | null;
};

/** The event's day: the host's date (a range's first day), else the day its photographs last landed, else none. */
export function dayOf(e: Dated): string | null {
  return e.date ?? e.lastArrival?.day ?? null;
}

/**
 * THE EVENT'S DAYS, the clock's one reading of them: the host's, a range where she set one, else the one day its
 * photographs last landed, else none.
 */
export function spanOf(e: Dated): EventDays | null {
  const host = eventDays(e.date, e.endDate);
  if (host) return host;
  const day = e.date ?? e.lastArrival?.day ?? null;
  return day ? { first: day, last: day } : null;
}

/**
 * Whole days from `today` to a span by its nearest day: ahead, to its first (1 is tomorrow); on any day of it, 0;
 * behind, from its last (-1 ended yesterday).
 */
export function daysToSpan(today: string, span: EventDays): number {
  const ahead = daysFrom(today, span.first);
  if (ahead > 0) return ahead;
  const behind = daysFrom(today, span.last);
  return behind < 0 ? behind : 0;
}

/** Whole days from `today` to an event's days (`spanOf`, `daysToSpan`), or null for an event with no day at all. */
export function daysToEvent(e: Dated, today: string): number | null {
  const span = spanOf(e);
  return span ? daysToSpan(today, span) : null;
}

/** The phase so many days from the event (`daysToEvent`): no day at all reads as before (set up, never over). */
function phaseAt(days: number | null): Phase {
  if (days === null || days > 0) return "before";
  if (days === 0) return "live";
  return -days <= AFTER_DAYS ? "after" : "past";
}

/** The phase of one day: no day reads as before (set up, never over). */
export const phaseOf = (day: string | null, today: string): Phase =>
  phaseAt(day ? daysFrom(today, day) : null);

/** An event's phase on the viewer's day, by its days (`spanOf`): live on any day of a range. */
export const phaseOfEvent = (e: Dated, today: string): Phase =>
  phaseAt(daysToEvent(e, today));

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

/**
 * A range as a heading says it: "Friday, October 2 – Sunday, October 4", the year said once at its end when it is
 * not this year's, and on each day when the range turns a year. One day is `longDate`'s. Its dash is `dashRange`'s
 * (`lib/utils.ts`), as every range's is.
 */
export function longDays(first: string, last: string, today?: string): string {
  if (last <= first) return longDate(first, today);
  const a = new Date(utc(first));
  const b = new Date(utc(last));
  if (first.slice(0, 4) !== last.slice(0, 4))
    return dashRange(LONG_YEAR.format(a), LONG_YEAR.format(b));
  if (today && first.slice(0, 4) !== today.slice(0, 4))
    return dashRange(LONG.format(a), LONG_YEAR.format(b));
  return dashRange(LONG.format(a), LONG.format(b));
}

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
 * matters) or the full date for one to come (it does). An undated event says so. A range of days says
 * itself (`rangeWhen`): where it stands on its days, else its two days.
 */
export function whenOf(
  date: string | null,
  today: string,
  evening = false,
  endDate?: string | null,
): string {
  if (!date) return "No date";
  const days = eventDays(date, endDate);
  if (days && days.last !== days.first) return rangeWhen(days, today);
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

/**
 * A RANGE'S WHEN, the single day's ladder widened to two days: on its days, where it stands ("Day 2 of 3", beside its
 * Live mark); inside the week ahead, its weekdays ("Fri–Sun", the whole range inside it, since a weekday a week on
 * would read as this one); else its dates ("Oct 3–5", "Oct 30 – Nov 2"), with the year once a range to come is in
 * another year beyond the month, and once a past year has turned and the month after is gone, the month and year it
 * began (its days no longer matter). Its dash is `dashRange`'s (`lib/utils.ts`): closed up between single terms,
 * spaced where a side holds a space.
 */
function rangeWhen({ first, last }: EventDays, today: string): string {
  const ahead = daysFrom(today, first);
  const behind = daysFrom(today, last);
  if (ahead <= 0 && behind >= 0)
    return `Day ${1 - ahead} of ${behind - ahead + 1}`;
  const a = new Date(utc(first));
  const b = new Date(utc(last));
  if (ahead > 0 && behind < WEEK_DAYS)
    return dashRange(WEEKDAY_SHORT.format(a), WEEKDAY_SHORT.format(b));
  // A same-month range says its month once and dashes its two day numbers ("Oct 3–5"); across months, its two dates.
  const span =
    first.slice(0, 7) === last.slice(0, 7)
      ? `${MONTH_SHORT.format(a)} ${dashRange(DAY_NUMBER.format(a), DAY_NUMBER.format(b))}`
      : dashRange(MONTH_DAY.format(a), MONTH_DAY.format(b));
  const year = today.slice(0, 4);
  if (ahead > 0) {
    if (first.slice(0, 4) === year || ahead <= AFTER_DAYS) return span;
    return first.slice(0, 4) === last.slice(0, 4)
      ? `${span}, ${last.slice(0, 4)}`
      : dashRange(MONTH_DAY_YEAR.format(a), MONTH_DAY_YEAR.format(b));
  }
  if (last.slice(0, 4) === year || -behind <= AFTER_DAYS) return span;
  return MONTH_YEAR.format(a);
}

/** Whether the viewer's clock is in the evening, by its hour (0 to 23). */
export const isEvening = (hour: number) => hour >= EVENING_HOUR;
