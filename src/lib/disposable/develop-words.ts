/**
 * THE DEVELOP'S WORDS: the time in the host's format, and what a guest's album says as its roll develops.
 *
 * - THE HOST'S FORMAT: her Settings says the time in this one function ("Develops Sat, Oct 3, 9:00 AM."), where she
 *   picks the exact time.
 * - THE ARRIVAL (the-wait r2, Will's `arrival=in-place`): the sheet's word turning from "Developing" to "Developed", the
 *   clock under it as the night said it ("All at once at 9 am"), and what a screen reader hears of it. Every time a
 *   guest reads is said by the wait's own words (`wait-words.ts`: from now, in her clock, as the album's camera always
 *   said it), so this side builds no formatter of its own (`develop-words.test.ts` holds both sides to their homes).
 *
 * ★ THE VIEWER'S OWN ZONE, IN THE PRODUCT'S PINNED LANGUAGE: a caller draws a time after hydration (a server render has
 * no idea what "9 am" means to her), and `en-US` is fixed, so a phone's locale never rewords the sentence.
 *
 * Pure and isomorphic, like its neighbours.
 */
import { developedWhen, WAIT_TITLE } from "@/lib/disposable/wait-words";
import { formatCount } from "@/lib/format/count";

const DEVELOP_TIME = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** "Sat, Oct 3, 9:00 AM", or null for no time or one it cannot read. */
export function developTimeWords(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isFinite(at.getTime()) ? DEVELOP_TIME.format(at) : null;
}

/** The sheet's word while its roll waits, and the word it turns to as the roll develops. */
export const DEVELOP_TITLES = {
  before: WAIT_TITLE,
  after: "Developed",
} as const;

/**
 * When it developed, as a phrase that follows a verb: "at 9 am" on its own day, "yesterday", then "on Saturday" and
 * "on Oct 1" (`developedWhen` says the day bare, as the cover's word wants it), or nothing before her clock is known.
 */
function developedPhrase(developsAt: string, nowMs: number | null): string {
  if (nowMs === null || !Number.isFinite(Date.parse(developsAt))) return "";
  const when = developedWhen(developsAt, nowMs);
  return when.startsWith("at ") || when === "yesterday" ? when : `on ${when}`;
}

/** The develop's clock: the night's line, said of a time that has come ("All at once at 9 am"). */
export function developClockLine(
  developsAt: string,
  nowMs: number | null,
): string {
  const when = developedPhrase(developsAt, nowMs);
  return when ? `All at once ${when}` : "All at once";
}

/**
 * What a screen reader hears of the develop: the roll, hers in it, and when ("24 photos developed at 9 am, 3 of them
 * yours."). Its noun is only as exact as the roll it is told: a video among them says both.
 */
export function developSentence(input: {
  count: number;
  hers: number;
  videos: boolean;
  developsAt: string;
  nowMs: number | null;
}): string {
  const { count, hers, videos, developsAt, nowMs } = input;
  const one = count === 1;
  const noun = videos
    ? one
      ? "photo or video"
      : "photos and videos"
    : one
      ? "photo"
      : "photos";
  const at = developedPhrase(developsAt, nowMs);
  const when = at ? ` ${at}` : "";
  const yours = hers > 0 ? `, ${formatCount(hers)} of them yours` : "";
  return `${formatCount(count)} ${noun} developed${when}${yours}.`;
}
