/**
 * THE WAIT, IN A GUEST'S WORDS (the-wait r1, Will's `model=time`: "For the guest screens, I like one question of time
 * where there's only a small distinction between disposable and reviewed"). Every album that holds photos back waits
 * ONE way, Developing, and only its clock says which album it is: as the host lets them in (Reviewed), or all at once
 * at the develop time (a Disposable, or free uploads with a develop time). One home for every place a guest reads it:
 * the album's contact sheet, the Add slot's rule, her tracker (its rows, its badge and its head), the keep's Sent line,
 * the failure sheet and the cover's word over the event's name.
 *
 * ★ A REFUSAL KEEPS ITS OWN PLAIN WORD ("Not approved", her tracker's): approval reads as developing, so a photo the
 * host turns down must never read as one still developing (the board's own cost for this model).
 *
 * ★ THE DEVELOP TIME IS SAID FROM NOW, IN HER OWN CLOCK (the camera's own phrasing, `developsWhen`: "at 9 am" today,
 * "tomorrow at 9 am", "Saturday at 9 am" inside a week, then the date; the calendar's days, never 24 hours), so every
 * caller says it only after hydration; before it, each line reads whole without the time (`nowMs: null`).
 *
 * Pure and isomorphic.
 */
import { PRESET_NAME } from "@/lib/disposable/album-style";
import type { Capture } from "@/lib/disposable/facts";
import {
  calendarDaysBetween,
  clockWords,
  developsWhen,
} from "@/lib/guest/camera/words";
import { TRACKER_WORDS } from "@/lib/guest/upload-tracker";

/**
 * The one word for every wait: everyone's on the sheet, and her own in her tracker, whose rows are its home (one state,
 * one name). ★ Imported one way only (this module reads the tracker's words and the camera's clock; neither reads this),
 * so no module cycle can leave a word undefined while the camera's own words load.
 */
export const WAIT_TITLE = TRACKER_WORDS.waiting;

/** What a wait waits for: the host letting each in (a Reviewed album), or a develop time ahead. */
export type WaitClock =
  | { kind: "held"; hostName: string | null }
  | { kind: "develop"; developsAt: string };

/** The page's live reading (`uploadsWait`) as a clock: the develop while it is ahead, else approval, else none. */
export function waitWords(
  wait: { waits: boolean; developsAt: string | null },
  hostName: string | null,
): WaitClock | null {
  if (wait.developsAt) return { kind: "develop", developsAt: wait.developsAt };
  if (wait.waits) return { kind: "held", hostName };
  return null;
}

const hostOf = (name: string | null) => name?.trim() || "the host";

/** The develop time from now, or nothing before hydration (`nowMs: null`) or for a time it cannot read. */
const when = (developsAt: string, nowMs: number | null) =>
  nowMs === null || !Number.isFinite(Date.parse(developsAt))
    ? null
    : developsWhen(developsAt, nowMs);

/** The sheet's clock: "As Maya lets them in", or "All at once at 9 am". */
export function waitClockLine(clock: WaitClock, nowMs: number | null): string {
  if (clock.kind === "held") return `As ${hostOf(clock.hostName)} lets them in`;
  const at = when(clock.developsAt, nowMs);
  return at ? `All at once ${at}` : "All at once";
}

/**
 * How long until a develop, said the way a clock on a wall is read: "in 10 h 20 min" inside a day, "in 3 days" after
 * it, and nothing once it is reached (the album has developed).
 */
export function countdownWords(
  developsAt: string,
  nowMs: number,
): string | null {
  const ms = Date.parse(developsAt) - nowMs;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "in under a minute";
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest === 0 ? `in ${hours} h` : `in ${hours} h ${rest} min`;
  }
  const days = Math.floor(hours / 24);
  return `in ${days} ${days === 1 ? "day" : "days"}`;
}

/** The rule, said before her first add and over her uploads: how uploads develop on this album. */
export function waitRule(clock: WaitClock, nowMs: number | null): string {
  if (clock.kind === "held")
    return `Uploads develop as ${hostOf(clock.hostName)} lets each one in.`;
  const at = when(clock.developsAt, nowMs);
  return at
    ? `Uploads develop all at once ${at}.`
    : "Uploads develop all at once.";
}

/**
 * Where what she sent went, on an album where it waits (the keep's Sent line): it develops as the host lets it in, or
 * with everyone's at the develop time. `subject` is what she sent, named by the keep ("Your 5 shots").
 */
export function keepWaitLine(input: {
  subject: string;
  /** One of them, said in the singular. */
  one: boolean;
  clock: WaitClock;
  nowMs: number | null;
}): string {
  const verb = input.one ? "develops" : "develop";
  if (input.clock.kind === "held") {
    return `${input.subject} ${verb} as ${hostOf(input.clock.hostName)} lets ${input.one ? "it" : "them"} in.`;
  }
  const at = when(input.clock.developsAt, input.nowMs);
  return `${input.subject} ${verb} with everyone's${at ? ` ${at}` : ""}.`;
}

/** The failure sheet's line for the rest of a run that half failed, where it waits. */
export function restWaitLine(clock: WaitClock, nowMs: number | null): string {
  return keepWaitLine({
    subject: "Everything else",
    one: true,
    clock,
    nowMs,
  });
}

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * When an album developed, from now, by the calendar's days as `developsWhen` says them ahead: "at 9 am" on its own
 * day, "yesterday" the day after, its weekday inside a week, then its date. ★ "At 9 pm" at 12:10 am read as tonight's
 * 9 pm, three hours on (the same NIT as a develop ahead, red-team 46), so a clock is said only for today.
 */
export function developedWhen(developsAt: string, nowMs: number): string {
  const at = new Date(developsAt);
  const ago = calendarDaysBetween(at, new Date(nowMs));
  if (ago <= 0) return `at ${clockWords(at)}`;
  if (ago === 1) return "yesterday";
  if (ago < 7) return WEEKDAY.format(at);
  return DATE.format(at);
}

/**
 * THE WORD OVER THE EVENT'S NAME ON THE COVER (the-wait r1's name ask, its cover frame: "Disposable · develops 9 am"):
 * the preset named where a guest meets it, with when it develops, and the morning after, when it developed. Free
 * uploads with a develop time say only when, until they have. Nothing for an album that never develops, nor before
 * hydration's clock beyond the preset's own name.
 */
export function coverEyebrow(
  album: { capture: Capture; developsAt: string | null },
  nowMs: number | null,
): string | null {
  if (!album.developsAt || !Number.isFinite(Date.parse(album.developsAt)))
    return null;
  const disposable = album.capture === "camera";
  if (nowMs === null) return disposable ? PRESET_NAME : null;
  const ahead = Date.parse(album.developsAt) > nowMs;
  if (ahead) {
    const at = developsWhen(album.developsAt, nowMs);
    return disposable ? `${PRESET_NAME} · develops ${at}` : `Develops ${at}`;
  }
  return disposable
    ? `${PRESET_NAME} · developed ${developedWhen(album.developsAt, nowMs)}`
    : null;
}
