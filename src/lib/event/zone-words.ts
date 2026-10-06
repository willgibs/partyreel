/**
 * A TIME, SAID AND PICKED IN THE PARTY'S OWN ZONE (event-zone's far-from-home words): where Settings shows a time and the
 * party's zone is not the host's own (`farZone`), the time is the party's wall clock and names its place ("Sat, Oct 3,
 * 9:00 AM in Mexico City"), and the develop time's field takes the party's wall clock too, so the words and the field
 * never disagree and a host planning from away reads the morning her guests will live. Where the zones agree none of
 * this is said: her own clock, as it always was (a host who never travels never sees a zone).
 *
 * ★ ALWAYS THE DATE, NEVER "TOMORROW": a relative day read across two zones is hers or the party's, never plainly both
 * (late evening at home is already tomorrow there), so a far time names its day.
 *
 * Pure and isomorphic, in the product's pinned language (`en-US`), like `develop-words.ts`.
 */
import { zonePlace } from "@/lib/event/zone";
import { wallTimeIn } from "@/lib/event/wall-time";

const pad = (n: number) => String(n).padStart(2, "0");

/** An instant's wall clock in `zone`: its calendar day and its time, to the minute. */
function wallParts(at: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // h23 already answers 0 to 23; the modulo is for an engine that still prints midnight as 24.
    hour: get("hour") % 24,
    minute: get("minute"),
  };
}

const readable = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isFinite(at.getTime()) ? at : null;
};

/** "Sat, Oct 3, 9:00 AM in Mexico City": Settings' own format for a develop time (`developTimeWords`), on the party's clock. */
export function zoneTimeWords(
  iso: string | null | undefined,
  zone: string,
): string | null {
  const at = readable(iso);
  if (!at) return null;
  const words = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
  return `${words} in ${zonePlace(zone)}`;
}

/**
 * "Sun, Oct 4 at 9 am in Mexico City": when, as a phrase after a verb ("Before it develops …"), the camera's way of saying
 * a clock (`developsWhen`), on the party's clock, with its day always named.
 */
export function zoneWhen(iso: string, zone: string): string {
  const at = readable(iso);
  if (!at) return "";
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(at);
  const { hour, minute } = wallParts(at, zone);
  const half = hour < 12 ? "am" : "pm";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const clock = minute === 0 ? `${h} ${half}` : `${h}:${pad(minute)} ${half}`;
  return `${day} at ${clock} in ${zonePlace(zone)}`;
}

/** "4:12 PM": the party's wall clock now, as the city list says it beside each place. */
export function clockThere(nowMs: number, zone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(nowMs));
}

/**
 * `YYYY-MM-DDTHH:mm` of an instant on the party's wall clock: the value a `datetime-local` field holds there (the
 * browser-zone twin is `toLocalInput`), or "" for an instant that is no time.
 */
export function toZoneInput(iso: string, zone: string): string {
  const at = readable(iso);
  if (!at) return "";
  const p = wallParts(at, zone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * The instant a wall clock names on the party's clock (a `datetime-local` value, `YYYY-MM-DDTHH:mm`, its seconds kept
 * where it carries them), or null for a value that is no whole time (blank, half filled, an hour past 23). A wall time a
 * clock change skips lands within its hour, as the turn's own does (`wallTimeIn`). The one reading of a bare wall clock
 * in a zone: a zoneless Exif clock is read in the party's zone by this call (`wallInPartyZone`, a guest's complete).
 */
export function fromZoneInput(typed: string, zone: string): Date | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(
    typed,
  );
  if (!m) return null;
  const hour = Number(m[2]);
  const minute = Number(m[3]);
  const second = Number(m[4] ?? 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  const at = wallTimeIn(m[1]!, hour, zone) + minute * 60_000 + second * 1_000;
  return Number.isFinite(at) ? new Date(at) : null;
}

/**
 * "Sun, Oct 4 at 9 am in Bali, 6 pm yours": a time in BOTH clocks, for a guest whose zone is not the party's (crumbs-85):
 * the party's wall clock with its day and its place (`zoneWhen`), then her own clock, its weekday named where her day is
 * not the party's ("Sat 6 pm yours"). A phrase after a verb, as `developsWhen` is ("Develops …", "until they develop …").
 */
export function bothClocksWhen(
  iso: string,
  zone: string,
  mine: string,
): string {
  const at = readable(iso);
  if (!at) return "";
  const party = zoneWhen(iso, zone);
  const p = wallParts(at, zone);
  const m = wallParts(at, mine);
  const half = m.hour < 12 ? "am" : "pm";
  const h = m.hour % 12 === 0 ? 12 : m.hour % 12;
  const clock =
    m.minute === 0 ? `${h} ${half}` : `${h}:${pad(m.minute)} ${half}`;
  const sameDay = p.year === m.year && p.month === m.month && p.day === m.day;
  const day = sameDay
    ? ""
    : `${new Intl.DateTimeFormat("en-US", { timeZone: mine, weekday: "short" }).format(at)} `;
  return `${party}, ${day}${clock} yours`;
}
