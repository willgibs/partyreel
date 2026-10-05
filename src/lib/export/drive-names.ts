/**
 * THE NAMES A SEND GIVES HER DRIVE (Will, desk 2: `naming = when, then who`; drive-export.md, "The folder and the
 * names"), beside the zip's own `buildDownloadFilename`:
 *
 *   My Drive / Partyreel / Maya & Jay · 12 Sep 2026 / 2026-09-12 21.14.05 · Priya.jpg
 *
 * The album's folder says its name and its day (two albums of one name stay apart; an undated album is its name
 * alone); a file says the moment it reached the album, in her own zone (her browser's at the press), then who sent it
 * as the album credits them (a guest's name, or hers; no name, no credit), then the original's own extension. A
 * second file in the same second from the same person takes " (2)": that ordinal is assigned in SQL at the lease,
 * against the names already kept for the album's folder (`cloud_export_name_items`), under the connection's lock, so
 * two lanes never pick one name; `driveFileName` here is its mirror, pinned to the SQL by a test.
 *
 * ★ ONE FUNCTION TAKES A CAPTURE TIME WHEN ONE IS KNOWN. The app keeps none today (the browser strips everything but
 * orientation before upload and `media` holds only `created_at`), so a batch sent the morning after sorts by when it
 * arrived; the moment a capture time is kept (a separate decision, Will's), it is passed here and every name, every
 * description and Drive's own `modifiedTime` follow it at once.
 *
 * ★ NEVER AN ADDRESS, NEVER A MARK. A name is what the album shows beside the photograph (`resolveUploaderIdentity`),
 * cleaned for a file system (a name holding "/" or ":" would break when she downloads the folder), never an email
 * and never "verified".
 *
 * Pure, so Vitest pins every shape, and the lease route and any page can ask it.
 */
import { parseExtFromKey } from "@/lib/r2/keys";
import { MIME_TO_EXT } from "@/lib/media/limits";
import { dashRange } from "@/lib/utils";

/** The one folder every send lands under in her Drive. */
export const DRIVE_ROOT_FOLDER_NAME = "Partyreel";

/**
 * The Partyreel folder's colour, one of Drive's own palette (Drive snaps any other to its nearest): a little delight
 * that costs nothing, and makes our folder the one she spots in a column of grey ones.
 */
export const DRIVE_FOLDER_COLOR = "#cd74e6";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** "2026-09-12" as "12 Sep 2026", and its parts for a range. Null for anything that is no calendar day. */
function dayParts(
  day: string | null | undefined,
): { d: number; m: string; y: string } | null {
  const match =
    typeof day === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  const d = Number(match[3]);
  if (!month || d < 1 || d > 31) return null;
  return { d, m: month, y: match[1]! };
}

/** Control characters, and the ones a file system refuses in a name, read as a hyphen; runs of space as one. */
function cleanForFiles(text: string, max: number): string {
  const cleaned = text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const cut = Array.from(cleaned).slice(0, max).join("").trim();
  // A trailing dot or space is dropped by Windows on download; a name made of dots is no name.
  return cut.replace(/[. ]+$/g, "");
}

/**
 * The album's folder: "Maya & Jay · 12 Sep 2026", a range in the fewest words that stay exact ("Lake week · 14–20 Jul
 * 2026", "30 Jun – 2 Jul 2026", "30 Dec 2025 – 2 Jan 2026"), and an undated album its name alone.
 */
export function driveFolderName(album: {
  name: string;
  eventDate?: string | null;
  endDate?: string | null;
}): string {
  const name = cleanForFiles(album.name, 120) || "Album";
  const first = dayParts(album.eventDate);
  if (!first) return name;
  const last = dayParts(album.endDate);
  const one = (p: { d: number; m: string; y: string }) =>
    `${p.d} ${p.m} ${p.y}`;
  let when = one(first);
  if (last && album.endDate! > album.eventDate!) {
    if (last.y !== first.y) when = dashRange(one(first), one(last));
    else if (last.m !== first.m)
      when = `${dashRange(`${first.d} ${first.m}`, `${last.d} ${last.m}`)} ${first.y}`;
    else
      when = `${dashRange(String(first.d), String(last.d))} ${first.m} ${first.y}`;
  }
  return `${name} · ${when}`;
}

/** A zone Intl accepts, or UTC: a name is never refused for a zone her browser sent badly. */
function zoneOrUtc(tz: string | null | undefined): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** An instant's wall clock in a zone: its parts, 24-hour. */
function wallClock(at: string | Date, tz: string | null | undefined) {
  const date = at instanceof Date ? at : new Date(at);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zoneOrUtc(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** The moment a name says: when it was taken, once that is known; when it reached the album until then. */
export function driveMoment(times: {
  arrivedAt: string;
  capturedAt?: string | null;
}): string {
  return times.capturedAt ?? times.arrivedAt;
}

/** Who a file says sent it: the album's credit, cleaned for a file name; null when the album names nobody. */
export function driveSender(who: string | null | undefined): string | null {
  if (!who) return null;
  const cleaned = cleanForFiles(who, 60);
  return cleaned || null;
}

/**
 * A file's name before its extension: "2026-09-12 21.14.05 · Priya" (dots between the time's parts, since a colon is
 * a path separator somewhere she may download the folder to), or the moment alone when the album names nobody.
 */
export function driveFileStem(input: {
  arrivedAt: string;
  capturedAt?: string | null;
  tz: string;
  who: string | null | undefined;
}): string {
  const c = wallClock(driveMoment(input), input.tz);
  const when = `${c.year}-${c.month}-${c.day} ${c.hour}.${c.minute}.${c.second}`;
  const who = driveSender(input.who);
  return who ? `${when} · ${who}` : when;
}

/** The original's own extension (the key's, which the upload derived from its validated type), or its kind's. */
export function driveFileExt(item: {
  originalKey: string;
  type: "photo" | "video";
}): string {
  return (
    parseExtFromKey(item.originalKey) ?? (item.type === "video" ? "mp4" : "jpg")
  );
}

const EXT_TO_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_TO_EXT).map(([mime, ext]) => [ext, mime]),
);

/** The type Drive is told (so its preview opens the file): the extension's own, or a safe default of its kind. */
export function driveContentType(ext: string, type: "photo" | "video"): string {
  return EXT_TO_MIME[ext] ?? (type === "video" ? "video/mp4" : "image/jpeg");
}

/**
 * The name the SQL keeps: the stem, " (n)" from the second of one name on, the extension. MIRRORS
 * `cloud_export_name_items` (drive-names.test.ts reads the migration and holds the two to one shape).
 */
export function driveFileName(
  stem: string,
  ext: string,
  ordinal: number,
): string {
  return `${stem}${ordinal > 1 ? ` (${ordinal})` : ""}.${ext}`;
}

/** Drive's `modifiedTime`: the same moment the name says, so Drive's own sort agrees with the names. */
export function driveModifiedTime(times: {
  arrivedAt: string;
  capturedAt?: string | null;
}): string {
  return new Date(driveMoment(times)).toISOString();
}

/**
 * The file's description in her Drive, one line: "From Sam at Garden party, 3 Oct 2026, 21:14. Sent from Partyreel."
 * (the moment in her zone; nobody named, "From Garden party, ...").
 */
export function driveFileDescription(input: {
  who: string | null | undefined;
  albumName: string;
  arrivedAt: string;
  capturedAt?: string | null;
  tz: string;
}): string {
  const c = wallClock(driveMoment(input), input.tz);
  const month = MONTHS[Number(c.month) - 1] ?? c.month;
  const when = `${Number(c.day)} ${month} ${c.year}, ${c.hour}:${c.minute}`;
  const album = cleanForFiles(input.albumName, 120) || "your album";
  const who = driveSender(input.who);
  return `${who ? `From ${who} at ${album}` : `From ${album}`}, ${when}. Sent from Partyreel.`;
}
