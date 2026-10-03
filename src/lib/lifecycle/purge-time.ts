/**
 * WHEN THE NIGHTLY PURGE HAS RUN (lp/account-exit): the one home of the purge's time, for every
 * word that promises it.
 *
 * Deleting an account takes what anyone can see at once and leaves the rest to the purge
 * (`sweepDeletedAccounts`, run by `/api/cron/purge`), which deletes the sign-in last. Until it has
 * run, the address can neither sign in nor start a new account (the deletion's ban), so a person
 * told she can start fresh has to be told WHEN. That time is vercel.json's cron, mirrored here as
 * `PURGE_SCHEDULE`; `purge-time.test.ts` reads vercel.json and fails the moment the two differ.
 *
 * ★ THE WORDS NAME THE WINDOW'S END, NEVER A MINUTE. Vercel's Hobby plan fires a daily cron
 * anywhere inside its hour (seen at 04:48 UTC), so the purge runs inside [04:00, 05:00) UTC and
 * the one time we can promise is the hour's end: "by" it for the cleanup, "after" it for a fresh
 * start. A run lasts at most the route's `maxDuration` (60 s) past the minute it fired, and its
 * account sweep runs early in that, so the promise holds to within that minute.
 *
 * ★ A WINDOW ALREADY UNDER WAY IS NOT THIS REQUEST'S: the cron may have fired before the request
 * did (at 04:10, for a request at 04:30), so the window that counts is the first to START after the
 * moment asked about. Its end is therefore at most 25 hours away, today or tomorrow in any zone.
 *
 * What the words cannot know, they never say: a forensic hold keeps an account past every window
 * and is never told (trust-safety-forensics.md), a very large account can take more than one night,
 * and a paused or failed run moves it a day. Each reader asks from its own "now" (the dialog as it
 * opens, a sign-in that meets the ban), so a promise that slipped is replaced by the next window,
 * never repeated stale.
 *
 * Pure (`Intl` only): the dialog, the door and a server render read it alike.
 */
import { dayInZone } from "@/lib/dashboard/viewer-day";

/** The route the purge cron calls (vercel.json's `crons[].path`). */
export const PURGE_CRON_PATH = "/api/cron/purge";

/** vercel.json's schedule for it, in UTC (Vercel's crons always are). Held to the file by its test. */
export const PURGE_SCHEDULE = "0 4 * * *";

/** How late inside its hour Hobby may fire a daily cron: the whole hour. */
export const PURGE_WINDOW_MS = 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A daily schedule's minute and hour (`"M H * * *"`). Anything else THROWS: a schedule that runs
 * twice a day, or weekly, is a different promise, and these words would be wrong for it.
 */
export function parseDailySchedule(schedule: string): {
  minute: number;
  hour: number;
} {
  const match = /^(\d{1,2}) (\d{1,2}) \* \* \*$/.exec(schedule.trim());
  const minute = Number(match?.[1]);
  const hour = Number(match?.[2]);
  if (!match || minute > 59 || hour > 23) {
    throw new Error(
      `purge-time: "${schedule}" is not a once-a-day schedule ("M H * * *")`,
    );
  }
  return { minute, hour };
}

const { minute: MINUTE, hour: HOUR } = parseDailySchedule(PURGE_SCHEDULE);

export type PurgeWindow = {
  /** The scheduled minute: the earliest the cron can fire. */
  start: Date;
  /** The hour's end: the purge has run by now. The time the words name. */
  end: Date;
};

/** The first purge window that starts strictly after `from` (the header's second ★ says why). */
export function nextPurgeWindow(from: Date | number): PurgeWindow {
  const at = typeof from === "number" ? from : from.getTime();
  const day = new Date(at);
  let start = Date.UTC(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
    HOUR,
    MINUTE,
  );
  // At the very minute it is due, the run may already have fired: that window is not this one.
  if (start <= at) start += DAY_MS;
  return { start: new Date(start), end: new Date(start + PURGE_WINDOW_MS) };
}

/** `YYYY-MM-DD`'s next calendar day (date arithmetic in UTC, where no day is 23 or 25 hours). */
function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** The wall clock in `zone`, 24-hour. */
function clockInZone(
  ms: number,
  zone: string,
): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { hour: get("hour") % 24, minute: get("minute") };
}

/**
 * "1:00 AM tomorrow", "10:00 PM tonight", "midnight tonight", "3:00 PM today": a moment (the
 * window's end) as `zone`'s wall clock, with the day it falls on as seen from `now` there. The
 * sentence around it says "by" or "after".
 *
 * The space before AM and PM is a no-break space, whatever the runtime's ICU prints there (a
 * newer one prints U+202F, an older one a plain space): the time never wraps from its half of the
 * day, and a server render and the browser's hydration print the same characters.
 */
export function purgeTimeLabel(
  moment: Date | number,
  now: Date | number,
  zone: string,
): string {
  const at = typeof moment === "number" ? moment : moment.getTime();
  const from = typeof now === "number" ? now : now.getTime();
  const today = dayInZone(from, zone);
  const day = dayInZone(at, zone);
  const { hour, minute } = clockInZone(at, zone);

  // Midnight is the start of the next day, and "12:00 AM tomorrow" reads as a day too late.
  if (hour === 0 && minute === 0 && day === nextDay(today)) {
    return "midnight tonight";
  }
  const when =
    day === today
      ? hour >= 17
        ? "tonight"
        : "today"
      : day === nextDay(today)
        ? "tomorrow"
        : // Unreachable for a window's end (at most 25 hours away), but never a wrong word.
          `on ${new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "long" }).format(at)}`;
  if (hour === 12 && minute === 0) return `noon ${when}`;
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  })
    .format(at)
    .replace(/\s+/g, "\u00a0");
  return `${time} ${when}`;
}

/** The viewer's own zone, as the browser knows it (a server answers its own, UTC on Vercel). */
export function browserZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
