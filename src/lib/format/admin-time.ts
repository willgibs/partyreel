/**
 * ADMIN TIMESTAMPS SAY UTC (the 1,000-row round's follow-on, 2026-09-24).
 *
 * The admin is an operations console whose schedules are already UTC (the
 * jobs cards read "Daily, 04:00 UTC"), but every rendered timestamp used
 * `toLocaleString()` / `toLocaleDateString()` with no zone, so it rendered in
 * the SERVER's zone (UTC on Vercel) without ever saying so: the purge sweep's
 * last run read "9/23/2026, 4:48:23 AM", which an operator in New York read
 * as their own local time. This formats every admin timestamp in UTC and
 * labels it, so the run time and the schedule beside it finally agree.
 *
 * Both the locale ("en-US") and the zone ("UTC") are fixed explicitly, so the
 * server's render and the browser's on hydration produce the SAME string —
 * no more React #418 mismatch, no more `suppressHydrationWarning` on the
 * spans these draw. Isomorphic (no `server-only`): several admin surfaces
 * that render this are "use client" components on first paint (the support
 * and applicants inboxes, announcements, person reports).
 */

const DATETIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  hourCycle: "h23",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_ONLY = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** "Sep 23, 2026, 04:48 UTC". Every admin run, hold, export, report and message. */
export function formatAdminTimestamp(value: string | number | Date): string {
  return `${DATETIME.format(toDate(value))} UTC`;
}

/** "Sep 23, 2026 UTC". The date-only reading, where only the day matters (a pass's expiry, a "last seen" column). */
export function formatAdminDate(value: string | number | Date): string {
  return `${DATE_ONLY.format(toDate(value))} UTC`;
}
