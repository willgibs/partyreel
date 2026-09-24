/**
 * A DATE, IN A GIVEN ZONE (the viewer's-own-day round, 2026-09-24).
 *
 * The host dashboard's Event Pass expiry and over-cap grace deadline used to
 * render via `toLocaleDateString(undefined, …)`: the SERVER's zone (UTC on
 * Vercel) with no explicit locale either, so a date near midnight could read
 * as the wrong day for anyone not in that zone, and the exact string depended
 * on the runtime's default locale. This renders a timestamp as a calendar
 * date in an EXPLICIT zone (the viewer's own, resolved per request by
 * `lib/dashboard/viewer-day.ts`) and an explicit locale, so the day a host
 * reads is the day it is where they are.
 */
export function formatDateInZone(
  value: string | number | Date,
  zone: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
