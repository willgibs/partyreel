/**
 * WHEN EVERYONE SEES WHAT'S ADDED: one three-way answer over two columns (the program's synthesis, 2026-10-02):
 *  - right away: `moderation_mode = 'live'`, `develops_at` NULL;
 *  - once the host approves each: `moderation_mode = 'hold_for_approval'`, `develops_at` NULL;
 *  - at a develop time: `develops_at` set. A time ahead waits; a time reached has developed (new rows show at once).
 * Approve plus develop is legal in the schema (a row shows once approved AND past its time); Settings offers the three
 * answers, and reads that fourth state as the develop (whether it is ever offered is a design board's).
 *
 * The develop time is the host's (Will, r1: "a host config so they can either choose immediate uploads/visibility or
 * set a 'develop' time guests can see"). Develop now writes now: the database stores anything within a minute of its
 * own clock as its own now, so a caller's clock never decides.
 *
 * Pure and isomorphic. `defaultDevelopAt` reads the party's own zone where it is handed one (the event keeps its zone,
 * `events.time_zone`), and the browser's own only where no zone can be named.
 */

import { dayInZone } from "@/lib/dashboard/viewer-day";
import { wallTimeIn } from "@/lib/event/wall-time";
import { partyZoneOf } from "@/lib/event/zone";
import { lastDayOf, shiftDay } from "@/lib/events/dates";

/** The furthest ahead a develop time may be set: a year and a day (the zod bound; the column holds a finite time). */
export const DEVELOP_MAX_AHEAD_DAYS = 366;

/** The default develop time's hour, on the party's clock (r1's pick, `reveal=morning`: 9 am the next day). */
export const DEFAULT_DEVELOP_HOUR = 9;

/**
 * 9 AM THE MORNING AFTER THE PARTY, in the party's own time zone: the day after the event's LAST day (a range's end,
 * else its date: lane `event-dates`) when it is still ahead (or today there), else the day after today there. A party
 * on Saturday develops on Sunday morning, and a weekend from Friday to Sunday on Monday morning, whenever and wherever
 * she sets it up: ★ `zone` IS THE PARTY'S (`events.time_zone`, or the zone Create will carry: `hostPartyZone`), so a
 * destination wedding set up from home develops in the party's morning, one moment for every guest wherever she reads
 * it (and its develop turns the album into the night's order there, album-order's `albumOwnSort`). An unreadable zone
 * is UTC (`partyZoneOf`). Without one (null or absent: no zone can be named) it is the browser's own 9 am, as before
 * the party kept a zone.
 */
export function defaultDevelopAt(input: {
  /** `events.event_date` (`YYYY-MM-DD`), or null: a range's first day. */
  eventDate: string | null;
  /** `events.event_end_date` (`YYYY-MM-DD`), or null for one day; absent reads as one day. */
  eventEndDate?: string | null;
  now?: Date;
  /** The party's zone, or null where none can be named (the browser's clock is read). */
  zone?: string | null;
}): Date {
  const now = input.now ?? new Date();
  if (input.zone != null) {
    const party = partyZoneOf(input.zone);
    const today = dayInZone(now.getTime(), party);
    const last = lastDayOf(input.eventDate, input.eventEndDate);
    const base = last !== null && last >= today ? last : today;
    return new Date(wallTimeIn(shiftDay(base, 1), DEFAULT_DEVELOP_HOUR, party));
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let base = today;
  const last = lastDayOf(input.eventDate, input.eventEndDate);
  if (last) {
    const [y, m, d] = last.split("-").map(Number);
    const party = new Date(y, m - 1, d);
    if (party.getTime() >= today.getTime()) base = party;
  }
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + 1,
    DEFAULT_DEVELOP_HOUR,
    0,
    0,
    0,
  );
}

/** The three answers to "when everyone sees what's added". */
export const REVEALS = ["right-away", "approve", "develop"] as const;
export type Reveal = (typeof REVEALS)[number];

/** Which of the three an event's two columns say. A develop time wins: it is the stronger promise to the guests. */
export function revealOf(event: {
  review: boolean;
  developsAt: string | null;
}): Reveal {
  if (event.developsAt) return "develop";
  return event.review ? "approve" : "right-away";
}

/** Where a develop stands: none set, waiting for a time ahead, or developed at a time reached. */
export type DevelopState =
  | { kind: "none" }
  | { kind: "waiting"; developsAt: string }
  | { kind: "developed"; developsAt: string };

export function developState(
  developsAt: string | null,
  nowMs: number = Date.now(),
): DevelopState {
  if (!developsAt) return { kind: "none" };
  const at = Date.parse(developsAt);
  if (!Number.isFinite(at)) return { kind: "none" };
  return at > nowMs
    ? { kind: "waiting", developsAt }
    : { kind: "developed", developsAt };
}

/** Whether a develop time a host picked is one the write accepts: a real time, at most a year and a day ahead. */
export function developTimeWithinReach(
  iso: string,
  nowMs: number = Date.now(),
): boolean {
  const at = Date.parse(iso);
  return (
    Number.isFinite(at) && at <= nowMs + DEVELOP_MAX_AHEAD_DAYS * 86_400_000
  );
}
