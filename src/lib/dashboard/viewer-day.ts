/**
 * THE VIEWER'S OWN CALENDAR DAY (the 1,000-row round's follow-on, 2026-09-24).
 *
 * The dashboard took "today" from the SERVER's clock (`new Date()`), which is
 * UTC on Vercel: from evening on in any zone west of UTC, the server's
 * "today" is already tomorrow. Two effects, both real: the pulse's "N today"
 * undercounts a busy evening, and `next-step.ts`'s "Print the code" (an event
 * dated tomorrow) disappears the one evening before the event that it matters
 * — because `tomorrowOf(serverToday)` no longer lands on the event's date.
 *
 * This resolves the VIEWER's own zone from the request Vercel already
 * carries (`x-vercel-ip-timezone`) and computes THAT zone's calendar day,
 * DST-safe. ★ RENDERING ONLY: the zone is derived per request, used to pick a
 * day boundary and format a date, and never stored or logged (host-app.md
 * says so beside the dashboard's day) — no privacy text changes for it.
 */

/** Vercel's per-request geo header carrying the visitor's IANA zone (vercel.com/docs/headers/request-headers). */
export const VIEWER_ZONE_HEADER = "x-vercel-ip-timezone";

function isValidTimeZone(zone: string): boolean {
  try {
    // Intl throws a RangeError for anything that isn't a real IANA zone; this
    // is the only way to validate one without a lookup table.
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The viewer's IANA zone from the header value, validated by actually
 * constructing an `Intl` formatter with it (a header can carry anything). A
 * missing or malformed value falls back to the given zone — the SERVER's own
 * (UTC on Vercel, the machine's zone locally) — never to a guess.
 */
export function resolveViewerZone(
  headerValue: string | null | undefined,
  fallbackZone: string,
): string {
  const zone = headerValue?.trim();
  if (zone && isValidTimeZone(zone)) return zone;
  return fallbackZone;
}

/** The server's own zone, for the fallback above: UTC on Vercel, the machine's zone locally. */
export function serverZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(ms: number, zone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // h23 already returns 0-23; the modulo is belt-and-braces against an
    // engine that still prints midnight as "24".
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** `zone`'s offset from UTC AT instant `ms` (local = UTC + offset), in ms. */
function zoneOffsetMs(ms: number, zone: string): number {
  const p = zonedParts(ms, zone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - ms;
}

export type ViewerDay = {
  /** `YYYY-MM-DD` in the viewer's zone. */
  today: string;
  /** The UTC instant of that day's own midnight, in the viewer's zone. */
  startOfTodayMs: number;
};

/**
 * The zone's calendar day at `now`, and the UTC instant of THAT day's own
 * midnight — DST-safe. The offset AT midnight can differ from the offset at
 * `now` (a day whose evening sits on the far side of a spring-forward), so
 * this never assumes `now`'s offset holds for the whole day: it takes a
 * first candidate from the offset at a same-day UTC guess, then re-reads the
 * offset AT that candidate and corrects once if the two disagree. Two reads
 * converge for every real IANA zone, since a transition never moves the
 * clock by more than a couple of hours.
 */
export function calendarDayInZone(now: number, zone: string): ViewerDay {
  const at = zonedParts(now, zone);
  const guessMs = Date.UTC(at.year, at.month - 1, at.day, 0, 0, 0);
  const offset1 = zoneOffsetMs(guessMs, zone);
  const candidate1 = guessMs - offset1;
  const offset2 = zoneOffsetMs(candidate1, zone);
  const startOfTodayMs = offset2 === offset1 ? candidate1 : guessMs - offset2;
  const today = `${at.year}-${String(at.month).padStart(2, "0")}-${String(at.day).padStart(2, "0")}`;
  return { today, startOfTodayMs };
}
