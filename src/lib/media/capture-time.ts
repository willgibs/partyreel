/**
 * A PHOTOGRAPH'S CAPTURE TIME, ONE HOME (Will, 2026-10-05, the calls lab's X7: "Yes, keep the capture time, never the
 * place or device").
 *
 * The strip reads when a file says it was taken, from the original's own bytes before it rewrites one
 * (`CaptureStamp`, `media/strip-metadata.ts`, which reads and never judges). This module is the rest:
 *  - THE CLAIM, in the browser (`captureClaim`): an Exif wall clock with its zone is that instant; one with no zone is
 *    read in the uploader's own zone, since she is nearly always where she shot it (the lane's Q1); a container's
 *    instant is itself. It rides the complete (`captured_at`), never the presign, so the upload's hot path gains no call.
 *  - THE WORD, on the server (`acceptCaptureTime`): the client's word is a claim. One after the server's now plus a
 *    day, or before 1990, is dropped and the arrival stands (Q2), as is one that is no instant at all; a capture time
 *    is a nicety, so it never refuses an upload. Inside the bounds it is the uploader's word: a lie there reads like a
 *    truth, so the bounds stop the absurd (an album's head or foot held for ever by 1970 or 2099), never a near one.
 *
 * Pure and isomorphic: the uploader, the complete routes and the tests import it.
 */
import type { CaptureStamp } from "@/lib/media/strip-metadata";

/**
 * THE FLOOR: nothing before 1 January 1990 is a camera's word on a party. No consumer camera stamped a file before it,
 * and the clocks that reset land under it (a movie header's 1904, the epoch's 1970, a FAT disk's 1980), so a time
 * this old is a reset or an edit, never when the shutter fired.
 */
export const CAPTURE_TIME_FLOOR_MS = Date.UTC(1990, 0, 1);

/**
 * THE CEILING'S SLACK: a capture time may run up to a day past the server's clock (a camera set a zone ahead, a
 * phone's clock a little fast, a zoneless wall clock read in a zone behind it). Past it, no shutter fired yet.
 */
export const CAPTURE_TIME_AHEAD_MS = 24 * 60 * 60 * 1000;

/** The furthest instant a `Date` can hold, either side of the epoch. */
const MAX_DATE_MS = 8.64e15;

const WALL = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
const ZONE = /^([+-])(\d{2}):(\d{2})$/;

/**
 * The instant a stamp names, as epoch ms; null when it names none. A wall clock with its zone is exact; one without is
 * read in this runtime's own zone (the uploader's browser, Q1). A year under 100 is no year a `Date` reads as written
 * (it maps it to 19xx), and is far under the floor anyway, so it names none.
 */
export function captureInstant(
  stamp: CaptureStamp | null | undefined,
): number | null {
  if (!stamp) return null;
  let ms: number;
  if (stamp.kind === "instant") {
    ms = stamp.ms;
  } else {
    const m = WALL.exec(stamp.wall);
    if (!m) return null;
    const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
    if (y < 100) return null;
    const zone = stamp.offset === null ? null : ZONE.exec(stamp.offset);
    if (zone) {
      const minutes =
        (zone[1] === "-" ? -1 : 1) * (Number(zone[2]) * 60 + Number(zone[3]));
      ms = Date.UTC(y, mo - 1, d, h, mi, s) - minutes * 60_000;
    } else {
      ms = new Date(y, mo - 1, d, h, mi, s).getTime();
    }
  }
  return Number.isFinite(ms) && Math.abs(ms) <= MAX_DATE_MS ? ms : null;
}

/**
 * THE CLAIM a complete carries: the stamp's instant as the ISO string `acceptCaptureTime` reads, or undefined when the
 * file states none. Never judged here: the server's bounds, on the server's clock, are the only ones.
 */
export function captureClaim(
  stamp: CaptureStamp | null | undefined,
): string | undefined {
  const ms = captureInstant(stamp);
  return ms === null ? undefined : new Date(ms).toISOString();
}

/** A claim's one shape: `Date.prototype.toISOString`'s, the browser's own. */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/**
 * THE SERVER'S WORD ON A CLAIM, the one home for the bounds: the claim as the instant `media.captured_at` stores (ISO,
 * UTC, milliseconds), or null, and the arrival stands. Null for anything that is not a real instant in the claim's own
 * shape (a day a calendar has not got is never rolled into the next), and for one outside
 * [`CAPTURE_TIME_FLOOR_MS`, now + `CAPTURE_TIME_AHEAD_MS`]. Never throws and never refuses: the file lands either way.
 */
export function acceptCaptureTime(
  claim: unknown,
  nowMs: number,
): string | null {
  if (typeof claim !== "string" || !ISO_INSTANT.test(claim)) return null;
  const ms = Date.parse(claim);
  if (!Number.isFinite(ms)) return null;
  const instant = new Date(ms).toISOString();
  // `Date.parse` rolls 30 February into March and 24:00 into the next day; a claim must be the day it names.
  if (instant.slice(0, 19) !== claim.slice(0, 19)) return null;
  if (ms < CAPTURE_TIME_FLOOR_MS || ms > nowMs + CAPTURE_TIME_AHEAD_MS) {
    return null;
  }
  return instant;
}
