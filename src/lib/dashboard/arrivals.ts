/**
 * "JUST ARRIVED", AND THE WINDOW THAT WIDENS UNTIL IT HOLDS TWELVE.
 *
 * The pulse's second band shows the photographs of the last hour. A band that
 * renders an empty strip whenever nobody uploaded in the last hour is the same
 * failure as an empty review queue, and Will's `home=pulse` note is explicitly
 * about not building that: the home must read as a place with something in it
 * for a host between parties, not only for a host mid-party.
 *
 * So the window WIDENS until the strip is full: the last hour, then today,
 * then simply the newest across every event. And it SAYS WHICH, because a strip
 * of three-day-old photographs presented as "the last hour" is a lie the host
 * will catch the first time they look.
 *
 * ★ THE WINDOW IS CHOSEN FROM TWO COUNTS, NEVER FROM ROWS (the 1,000-row round,
 * 2026-09-23). It used to count the timestamps of the newest 240 rows the pulse
 * read, so "N in the last hour" and "N today" could never say more than 240: a
 * wedding's first busy hour read as 240. The pulse now asks the database for
 * both numbers as head counts (`db/queries/pulse.ts`), and this picks from them.
 *
 * Pure + node-safe: the picking is here and testable, the reading and the
 * presigning are in `db/queries/pulse.ts`. `now` is passed in, never read here
 * (no clock in a pure function, and none in RSC render).
 */

/** The strip holds twelve at a desk, eight in a hand; twelve is what we seek. */
export const ARRIVALS_TARGET = 12;

export type ArrivalWindow = "hour" | "today" | "recent";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Where each counted window starts, as the timestamps the counts filter on (`created_at >= start`):
 * the last hour is the sixty minutes before `now`, and today starts at the host's own midnight,
 * which the page computes once for the whole render.
 */
export function arrivalWindowStarts(
  now: number,
  startOfToday: number,
): { hour: string; today: string } {
  return {
    hour: new Date(now - HOUR_MS).toISOString(),
    today: new Date(startOfToday).toISOString(),
  };
}

/** The two exact counts the window is chosen from: approved uploads, across the host's live events. */
export type ArrivalCounts = {
  /** In the last hour. */
  inHour: number;
  /** Since the start of the host's day. */
  inToday: number;
};

/**
 * The narrowest window that holds `ARRIVALS_TARGET`, else the widest available.
 * The count is the window's own, exact however many arrived; for the widest
 * window it is today's, which the caption never shows (it dates the newest
 * instead, below).
 */
export function pickArrivalWindow(counts: ArrivalCounts): {
  window: ArrivalWindow;
  count: number;
} {
  if (counts.inHour >= ARRIVALS_TARGET)
    return { window: "hour", count: counts.inHour };
  if (counts.inToday >= ARRIVALS_TARGET)
    return { window: "today", count: counts.inToday };

  // ★ NEITHER WINDOW FILLS THE STRIP, SO TAKE THE WIDEST, AND SAY THE AGE.
  // The first version of this kept the narrow label whenever the narrow window
  // had anything in it ("3 in the last hour"), and its own test caught why
  // that is wrong: a host with three uploads this hour and forty earlier today
  // would get a three-tile strip while thirty-seven photographs sat one window
  // away. The rule is "widen until it holds twelve", and a half-empty band
  // under a fresher-sounding label is not a better band. Freshness still
  // reaches the host, through the caption: "Newest, 10 min ago" says the same
  // thing "3 in the last hour" was trying to.
  return { window: "recent", count: counts.inToday };
}

/**
 * The line beside the heading. His own phrasing for the fallback ("newest, 3
 * days ago"), so the strip always declares what it is showing.
 */
export function describeArrivals(
  window: ArrivalWindow,
  count: number,
  newestIso: string | null,
  now: number,
): string {
  if (window === "hour") {
    return `${count} in the last hour, across your events`;
  }
  if (window === "today") {
    return `${count} today, across your events`;
  }
  if (!newestIso) return "Nothing yet";
  return `Newest, ${relativeAge(Date.parse(newestIso), now)}`;
}

/**
 * A coarse "how old" for the fallback label only. Coarse on purpose: the band
 * is telling the host "this is not fresh", and "3 days ago" says that where
 * "2 days, 7 hours ago" makes them do arithmetic to learn the same thing.
 */
export function relativeAge(then: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.round(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
