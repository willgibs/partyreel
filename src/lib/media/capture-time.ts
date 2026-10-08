/**
 * A PHOTOGRAPH'S CAPTURE TIME, ONE HOME (Will, 2026-10-05: "Yes, keep the capture time, never the place or device";
 * uploads-and-r2.md holds it, "The capture time stays, never the place or the device").
 *
 * The strip reads when a file says it was taken, from the original's own bytes before it rewrites one
 * (`CaptureStamp`, `media/strip-metadata.ts`, which reads and never judges). This module is the rest:
 *  - THE CLAIM, in the browser (`captureClaim`): an Exif wall clock with its zone is that instant; one with no zone is
 *    read in the uploader's own zone, since she is nearly always where she shot it (the lane's Q1); a container's
 *    instant is itself. It rides the complete (`captured_at`), never the presign, so the upload's hot path gains no call.
 *  - ★ AND A ZONELESS WALL CLOCK AS IT IS (`captureWall`, crumbs-85): beside that reading the complete carries the bare
 *    clock (`captured_wall`), and a guest's complete reads it in the PARTY's zone (`events.time_zone`, one read a burst
 *    and only when one is carried: `wallInPartyZone`), so a guest whose phone is still on home time, or a camera that
 *    wrote no zone, lands where the party lived it. The browser's reading stays the fallback (a party with no zone, the
 *    host's route, which reads none).
 *  - THE WORD, on the server (`acceptCaptureTime`): the client's word is a claim. One after the server's now plus a
 *    day, or before 1990, is dropped and the arrival stands (Q2), as is one that is no instant at all; a capture time
 *    is a nicety, so it never refuses an upload. Inside the bounds it is the uploader's word: a lie there reads like a
 *    truth, so the bounds stop the absurd (1970, 2099), never a near one, and a claim from 1990 on can still lead the
 *    night in order. Keeping a time outside the album's own days at its edge is that view's to decide, never these
 *    bounds': a vacation album made afterwards and a throwback both carry true times outside them.
 *
 * Pure and isomorphic: the uploader, the complete routes and the tests import it.
 */
import { readableZone } from "@/lib/event/zone";
import { fromZoneInput } from "@/lib/event/zone-words";
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

/**
 * THE CLAIM FOR A SHOT THE CALLER TIMED ITSELF (`BurstFile.takenAt`, the album's camera: a canvas JPEG carries no Exif),
 * as the ISO string the server reads, or undefined for no time. Never judged here.
 */
export function takenAtClaim(ms: number | undefined): string | undefined {
  return ms !== undefined && Number.isFinite(ms) && Math.abs(ms) <= MAX_DATE_MS
    ? new Date(ms).toISOString()
    : undefined;
}

/** A bare wall clock as a complete carries it: `YYYY-MM-DDTHH:mm:ss`, no zone. */
const BARE_WALL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

/**
 * THE BARE WALL CLOCK a complete carries beside its claim (`captured_wall`): an Exif wall clock that names no zone, as
 * `YYYY-MM-DDTHH:mm:ss`, for the server to read in the party's own zone; undefined for a stamp that names its zone, a
 * container's instant, or no time at all (the claim alone is the word then). Never judged here.
 */
export function captureWall(
  stamp: CaptureStamp | null | undefined,
): string | undefined {
  if (!stamp || stamp.kind !== "wall" || stamp.offset !== null)
    return undefined;
  const m = WALL.exec(stamp.wall);
  if (!m || Number(m[1]) < 100) return undefined;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
}

/** The bare wall clock a complete carried, in its one shape, or null (anything else reads as none, never a refusal). */
export function readCaptureWall(value: unknown): string | null {
  return typeof value === "string" && BARE_WALL.test(value) ? value : null;
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

/**
 * THE CAPTURE TIME A GUEST'S COMPLETE KEEPS, its bare wall clock read in the PARTY's zone (crumbs-85): `wall` (the
 * complete's `captured_wall`, `readCaptureWall`'s) on the party's own clock (`zone`, `events.time_zone`; DST-safe,
 * `fromZoneInput`), held to the same bounds as every claim. Where there is no wall clock, no zone this runtime can read
 * (a party from before the column), or the party's reading falls outside the bounds, the browser's claim stands
 * (`claim`, already judged by `acceptCaptureTime`).
 */
export function wallInPartyZone(
  wall: string | null,
  zone: string | null | undefined,
  claim: string | null,
  nowMs: number,
): string | null {
  if (!wall) return claim;
  const party = readableZone(zone);
  if (!party) return claim;
  const at = fromZoneInput(wall, party);
  return (at && acceptCaptureTime(at.toISOString(), nowMs)) ?? claim;
}
