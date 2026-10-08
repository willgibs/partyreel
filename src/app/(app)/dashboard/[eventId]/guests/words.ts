/**
 * THE GUESTS ROOM'S SHORT WORDS FOR WHEN (guests-room r1, `rows=list`): a row says how long someone has waited
 * beside the name ("2 min"), and when a block landed or a guest came in, on the night's own clock ("9:12 PM") or,
 * for an earlier day, its date ("Oct 3"). Said on the server, in the host's zone, so the room's first paint and its
 * client agree (`room.server.ts`).
 *
 * Pure (the caller passes `now`, since a clock read in render is impure), so the words are tested.
 */
import { setNoun } from "@/lib/export/take-home";
import { formatCount } from "@/lib/format/count";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long someone has waited at the door, in the few characters a row has beside a name at 375: "now", "2 min",
 * "3 hr", "1 day", "4 days". The long form (`askedAgo`) is the toast's and the bell's.
 */
export function waitedShort(askedAt: string, now: number): string {
  const ms = now - new Date(askedAt).getTime();
  if (!Number.isFinite(ms) || ms < MINUTE) return "now";
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)} min`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)} hr`;
  const d = Math.floor(ms / DAY);
  return d === 1 ? "1 day" : `${formatCount(d)} days`;
}

/** The calendar day of an instant in a zone, as comparable parts. */
function dayIn(at: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * When something happened, as a row or a card says it: the time on the day it happened ("9:12 PM"), the date on an
 * earlier day this year ("Oct 3"), the year beside it before that ("Oct 3, 2025"). Empty for a value that is no time.
 */
export function whenShort(iso: string, zone: string, now: number): string {
  const at = new Date(iso);
  if (!Number.isFinite(at.getTime())) return "";
  const then = dayIn(at, zone);
  const today = dayIn(new Date(now), zone);
  if (
    then.year === today.year &&
    then.month === today.month &&
    then.day === today.day
  ) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
    }).format(at);
  }
  return then.year === today.year
    ? `${then.month} ${then.day}`
    : `${then.month} ${then.day}, ${then.year}`;
}

/** Whether a short when is a time of day ("9:12 PM"), which a sentence says "at", or a date ("Oct 3"), said bare. */
export function isClock(when: string): boolean {
  return /\d:\d\d\s?[AP]M$/i.test(when);
}

/** "since 9:12 PM" / "since Oct 3": a when inside a sentence. */
export function sinceWords(when: string): string {
  return `since ${when}`;
}

/** "at 9:12 PM" / "on Oct 3": the moment something happened, inside a sentence. */
export function atWords(when: string): string {
  return isClock(when) ? `at ${when}` : `on ${when}`;
}

/** What someone added, by kind: "24 photos", "1 video", "5 photos & videos" (the one home's words, `setNoun`). */
export function addedWords(added: { photos: number; videos: number }): string {
  return setNoun(added.photos, added.videos);
}

/** The strip's head, naming what it holds: "Photos", "Videos", or "Photos & videos". */
export function addedHead(added: { photos: number; videos: number }): string {
  if (added.photos > 0 && added.videos > 0) return "Photos & videos";
  return added.videos > 0 ? "Videos" : "Photos";
}
