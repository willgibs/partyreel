/**
 * A WALL CLOCK IN A ZONE, AS AN INSTANT (event-zone): the one arithmetic the album's turn, the develop's default 9 am and
 * a bare wall clock typed or read in the party's zone share. A leaf (it imports nothing), so the develop's own module
 * (`reveal.ts`) and the album's order (`album-order.ts`, which reads the develop's hour) both reach it with no cycle.
 *
 * Pure and isomorphic.
 */

/**
 * THE INSTANT A WALL-CLOCK TIME NAMES IN A ZONE: `day` (`YYYY-MM-DD`) at `hour`:00 there, DST-safe. A first candidate
 * from the zone's offset at a same-day UTC guess, then the offset read again AT that candidate and corrected once if
 * the two disagree (a day whose morning sits on the far side of a clock change), the two-read rule of
 * `calendarDayInZone` (`viewer-day.ts`). (A wall time a clock change skips, 2:30 am on a spring-forward night, lands
 * within that hour; the turn's 9 am is never one.)
 */
export function wallTimeIn(day: string, hour: number, zone: string): number {
  const [y, m, d] = day.split("-").map(Number);
  const at = new Date(0);
  at.setUTCFullYear(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  at.setUTCHours(hour, 0, 0, 0);
  const guess = at.getTime();
  const first = guess - zoneOffsetMs(guess, zone);
  const offset = zoneOffsetMs(first, zone);
  return guess - offset === first ? first : guess - offset;
}

/** `zone`'s offset from UTC at instant `ms` (local = UTC + offset), in ms, to the second. */
function zoneOffsetMs(ms: number, zone: string): number {
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
  const asUtc = new Date(0);
  asUtc.setUTCFullYear(get("year"), get("month") - 1, get("day"));
  // h23 already answers 0 to 23; the modulo is for an engine that still prints midnight as 24.
  asUtc.setUTCHours(get("hour") % 24, get("minute"), get("second"), 0);
  return asUtc.getTime() - Math.floor(ms / 1000) * 1000;
}
