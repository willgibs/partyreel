/**
 * Lossless, dependency-free metadata stripping for uploads (the EXIF/GPS privacy fix).
 *
 * Guests' phone photos/videos carry GPS + device EXIF, and ORIGINALS are stored + served
 * byte-for-byte (lightbox, per-item Save, zip export). This module removes identifying
 * metadata at the BYTE level, never re-encoding pixels (quality is sacred; the original is
 * the keepsake). It is pure + runtime-agnostic on purpose: the browser runs it at the
 * upload seam (uploader.ts step 0) and Node runs the same code in
 * scripts/backfill-strip-exif.mjs (never fork the logic). It stays ONE file on purpose too:
 * the backfill loads it through Node's own type stripping, which cannot resolve the
 * extensionless relative import a split module would need.
 *
 * ★ THE CAPTURE TIME SURVIVES, NEVER THE PLACE OR THE DEVICE (Will, 2026-10-05: "Yes, keep the capture time, never the
 * place or device"). Each walk reads when the file says it was taken from the ORIGINAL's bytes, before a byte is
 * rewritten, and nothing beside it (`CaptureStamp`, on every result as `captured`): a JPEG's or a HEIC's Exif
 * `DateTimeOriginal` with its `OffsetTimeOriginal`, an MP4's or a MOV's QuickTime creation date or movie-header
 * creation time, a WebM's `DateUTC`. What the instant is (a zone for a bare wall clock) and whether the server takes it
 * are `capture-time.ts`'s. The stored file keeps it too, so a download and a Save into Photos land on the right day: a
 * JPEG's and a HEIC's minimal Exif carry `DateTimeOriginal` beside the orientation (the wall clock: its zone is read and
 * never kept, `minimalTiff`), a movie's header says it, and a WebM's Info stays whole.
 *
 * Per-format policy (see each function for the WHY of every keep/drop):
 *   JPEG  - drop APP1 (Exif/XMP), APP13 (IPTC/Photoshop), COM, vendor APPn; keep APP0
 *           (JFIF), APP2 (ICC color profile / MPF), APP14 (Adobe color transform, load-
 *           bearing for decode). Orientation is LOAD-BEARING: a minimal Exif is rebuilt
 *           so sideways photos keep rendering upright everywhere, carrying the capture
 *           time beside it (`minimalTiff`) and nothing else. A kept MPF
 *           index (iPhone HDR gain maps) has its individual-image offsets/sizes REWRITTEN
 *           to match the shrunk output (they are relative to the MPF header, so dropping
 *           any segment between the MPF and SOS goes stale); an MPF we cannot fix fails
 *           open. Bytes after the EOI keep their exact length (motion-photo appendages,
 *           MPF secondary images): an embedded ISOBMFF trailer gets its metadata boxes
 *           blanked in place, and every JPEG embedded there (an MPF secondary, a gain map,
 *           an appended original) has each Exif APP1 overwritten IN PLACE with a minimal
 *           orientation-only Exif padded to the segment's length, so no offset the MPF
 *           index holds ever moves. Their XMP and APP2 stay: a gain map's parameters live
 *           there and are rendering data, not identity.
 *   PNG   - drop eXIf + tEXt/zTXt/iTXt (XMP lives in iTXt); keep IHDR/PLTE/IDAT/IEND and
 *           the color chunks (gAMA/iCCP/sRGB).
 *   WebP  - drop EXIF + "XMP " RIFF chunks, clear the matching VP8X flag bits, keep ICCP;
 *           the RIFF size is recomputed and the even-byte padding rule honored.
 *   MP4/MOV - NEVER restructures (moving a byte breaks every stco/co64 chunk-offset
 *           table): metadata boxes (udta incl. Apple ©xyz location, moov-level meta/keys/
 *           ilst, xml, the XMP uuid) are blanked IN PLACE by renaming the box type to
 *           'free' AND zeroing the payload, so no offset ever moves. Big files are
 *           handled via a random-access reader + lazy Blob composition (the whole video
 *           is never pulled into memory in the browser). The capture time is read from the
 *           moov before it is blanked (`moovCapture`); the movie header keeps its own.
 *   HEIC/HEIF/AVIF - item-based ISOBMFF: the metadata is an ITEM (iinf names it, iloc
 *           places its bytes, usually inside mdat), not a box, and blanking `meta` would
 *           destroy the image. Every Exif item is overwritten in place with the minimal
 *           Exif (its orientation and capture time) and every XMP item that describes the
 *           picture with an empty packet, each padded to the item's exact length: no box,
 *           no iloc offset and no image byte changes. Orientation is irot/imir there (ipco, untouched).
 *           An XMP item that describes only an auxiliary image (the HDR gain map's version,
 *           a depth map's calibration) is rendering data and is kept, unless it carries GPS.
 *   WebM  - EBML: every Tags element (where a muxer writes LOCATION, the device's make and
 *           model, the encoder) becomes a Void element of exactly its size, zero-filled,
 *           so no SeekHead or Cues position moves. Info (title, dates, muxer names) and
 *           every Cluster stay byte-identical; Info's `DateUTC` is the capture time read.
 *
 * FAIL-OPEN CONTRACT: unknown/unparseable/truncated input returns the ORIGINAL bytes with
 * stripped:false. A corrupted upload is worse than the leak, so the caller uploads the
 * original untouched rather than blocking the guest. Consequence (conscious trade-off):
 * a file the parsers cannot walk end to end, or whose metadata they cannot rewrite
 * without touching a byte something else points at, keeps its metadata: a truncated file
 * or a box/element whose size lies, an HEIF metadata item placed by item reference (iloc
 * construction method 2) or in another file or sharing bytes with an image item, a WebM
 * Tags element of unknown size, a JPEG whose MPF index cannot be kept valid. That window
 * is documented in docs/systems/uploads-and-r2.md.
 */

/**
 * WHEN THE ORIGINAL SAYS IT WAS TAKEN, exactly as it says it (the module's head note). Read only, never judged here:
 * `capture-time.ts` turns it into an instant and the server holds it to its bounds.
 */
export type CaptureStamp =
  /**
   * Exif's `DateTimeOriginal` ("YYYY:MM:DD HH:MM:SS", a wall clock) and its `OffsetTimeOriginal` ("+02:00", the
   * zone that wall clock was in) when the camera wrote one; null leaves the zone to whoever reads it.
   */
  | { kind: "wall"; wall: string; offset: string | null }
  /** A container's own instant (QuickTime's creation date, the movie header's, a WebM's `DateUTC`): epoch ms. */
  | { kind: "instant"; ms: number };

export type StripBytesResult = {
  /** The sanitized bytes (=== the input when nothing needed to change or on fail-open). */
  data: Uint8Array;
  /** true = the container parsed cleanly and `data` is the sanitized output. */
  stripped: boolean;
  /** true = `data` differs byte-for-byte from the input (callers PUT/replace only then). */
  changed: boolean;
  /** When the input says it was taken, read before any byte was rewritten; absent when it says nothing we read. */
  captured?: CaptureStamp;
};

export type StripFileResult = {
  /** The file to upload: a new Blob when bytes changed, else the ORIGINAL File object. */
  blob: Blob;
  stripped: boolean;
  /** As `StripBytesResult.captured`: the original's own word on when it was taken. */
  captured?: CaptureStamp;
};

// ---------------------------------------------------------------------------
// Small byte helpers (no DataView-per-call churn; explicit bounds are the point)
// ---------------------------------------------------------------------------

function u16be(b: Uint8Array, o: number): number {
  return (b[o] << 8) | b[o + 1];
}

function u32be(b: Uint8Array, o: number): number {
  // >>> 0 keeps the top bit unsigned (box sizes / chunk lengths are unsigned).
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}

function u32le(b: Uint8Array, o: number): number {
  return ((b[o + 3] << 24) | (b[o + 2] << 16) | (b[o + 1] << 8) | b[o]) >>> 0;
}

function u64be(b: Uint8Array, o: number): number | null {
  const hi = u32be(b, o);
  const lo = u32be(b, o + 4);
  const v = hi * 0x100000000 + lo;
  // A box size beyond 2^53 can't be represented; treat as unparseable (fail open).
  return Number.isSafeInteger(v) ? v : null;
}

function ascii4(b: Uint8Array, o: number): string {
  return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
}

function hasPrefix(b: Uint8Array, prefix: readonly number[]): boolean {
  return hasPrefixAt(b, 0, prefix);
}

function hasPrefixAt(
  b: Uint8Array,
  at: number,
  prefix: readonly number[],
): boolean {
  if (at < 0 || at + prefix.length > b.length) return false;
  for (let i = 0; i < prefix.length; i++)
    if (b[at + i] !== prefix[i]) return false;
  return true;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function findBytes(haystack: Uint8Array, needle: readonly number[]): boolean {
  const last = haystack.length - needle.length;
  outer: for (let i = 0; i <= last; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

function asciiBytes(s: string): number[] {
  return Array.from(s, (c) => c.charCodeAt(0));
}

function concatParts(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Random-access walks: one parser, driven over memory or over a File read in slices
// ---------------------------------------------------------------------------

/**
 * Random-access byte source so the SAME planner serves an in-memory Uint8Array (tests,
 * the Node backfill) and a browser File (sliced lazily - a 10 GB video never fully loads).
 */
export type ByteReader = {
  size: number;
  read(start: number, end: number): Promise<Uint8Array>;
};

export function memoryReader(bytes: Uint8Array): ByteReader {
  return {
    size: bytes.length,
    read: (start, end) => Promise.resolve(bytes.subarray(start, end)),
  };
}

/** Bytes [start, end) of the input, asked for by a walk. */
type ByteRange = { start: number; end: number };

/**
 * A walk YIELDS each byte range it needs and is resumed with those bytes (shorter at EOF).
 * Written this way, one parser serves both drivers: `walkBytes`, synchronous over an
 * in-memory buffer (hasGpsMetadata, the backfill, the tests), and `walkReader`,
 * asynchronous over a File read in slices (the browser: a 10 GB video never loads
 * whole). A format is never parsed twice, once per world.
 */
type Walk<T> = Generator<ByteRange, T, Uint8Array>;

/** What a container walk returns: in-place patches (lengths never change) + what it saw. */
type WalkPlan = {
  ok: boolean;
  patches: IsobmffPatch[];
  gps: boolean;
  captured?: CaptureStamp;
};

function walkBytes<T>(walk: Walk<T>, bytes: Uint8Array): T {
  let step = walk.next();
  while (!step.done) {
    const { start, end } = step.value;
    step = walk.next(bytes.subarray(start, Math.min(end, bytes.length)));
  }
  return step.value;
}

async function walkReader<T>(walk: Walk<T>, reader: ByteReader): Promise<T> {
  let step = walk.next();
  while (!step.done) {
    const { start, end } = step.value;
    step = walk.next(await reader.read(start, Math.min(end, reader.size)));
  }
  return step.value;
}

/** Ask for exactly [start, end); null when the input ends first. */
function* readExactly(start: number, end: number): Walk<Uint8Array | null> {
  const got: Uint8Array = yield { start, end };
  return got.length === end - start ? got : null;
}

// A walk asks for a dozen header bytes at a time, and one Blob slice per ask would crawl
// across a long video's clusters, so a File is read through one read-ahead window.
const READ_AHEAD_BYTES = 64 * 1024;

function readAhead(reader: ByteReader): ByteReader {
  let bufStart = 0;
  let buf: Uint8Array = new Uint8Array(0);
  return {
    size: reader.size,
    async read(start, end) {
      if (start >= bufStart && end <= bufStart + buf.length) {
        return buf.subarray(start - bufStart, end - bufStart);
      }
      if (end - start >= READ_AHEAD_BYTES) return reader.read(start, end);
      bufStart = start;
      buf = await reader.read(
        start,
        Math.min(reader.size, start + READ_AHEAD_BYTES),
      );
      return buf.subarray(0, Math.max(0, Math.min(end, reader.size) - start));
    },
  };
}

function fileReader(file: Blob): ByteReader {
  return {
    size: file.size,
    read: async (start, end) =>
      new Uint8Array(await file.slice(start, end).arrayBuffer()),
  };
}

export type IsobmffPatch = { offset: number; bytes: Uint8Array };

/**
 * The patches in file order, or null when two of them cover one byte or one runs past the
 * end: the planners never emit such a set, and if one ever did, both paths fail open alike
 * rather than the bytes path applying it and the File path composing a longer file.
 */
function orderedPatches(
  patches: IsobmffPatch[],
  size: number,
): IsobmffPatch[] | null {
  const ordered = [...patches].sort((a, b) => a.offset - b.offset);
  let cursor = 0;
  for (const p of ordered) {
    if (p.offset < cursor || p.offset + p.bytes.length > size) return null;
    cursor = p.offset + p.bytes.length;
  }
  return ordered;
}

/**
 * A walk's result as strip output: the original when it did not parse (fail open) or
 * found nothing, else a patched copy. Every planner emits a patch only where bytes differ,
 * so patches => changed.
 */
function patchedOrOriginal(
  bytes: Uint8Array,
  plan: { ok: boolean; patches: IsobmffPatch[]; captured?: CaptureStamp },
): StripBytesResult {
  const ordered = plan.ok ? orderedPatches(plan.patches, bytes.length) : null;
  if (!ordered) {
    return withCapture(
      { data: bytes, stripped: false, changed: false },
      plan.captured,
    );
  }
  if (ordered.length === 0) {
    return withCapture(
      { data: bytes, stripped: true, changed: false },
      plan.captured,
    );
  }
  const data = bytes.slice();
  for (const p of ordered) data.set(p.bytes, p.offset);
  return withCapture({ data, stripped: true, changed: true }, plan.captured);
}

/** A result with the capture time its walk read, the key present only when there is one. */
function withCapture<T extends object>(
  result: T,
  captured: CaptureStamp | null | undefined,
): T & { captured?: CaptureStamp } {
  return captured ? { ...result, captured } : result;
}

/**
 * Compose a patched File lazily: untouched regions stay File slices (no copy), only the
 * patched regions are real buffers, so the total length is identical by construction.
 * Throws on a patch set orderedPatches refuses (the caller fails open).
 */
function composePatched(
  file: File,
  patches: IsobmffPatch[],
  mime: string,
): Blob {
  const ordered = orderedPatches(patches, file.size);
  if (!ordered) throw new Error("overlapping or out-of-range patch");
  const parts: BlobPart[] = [];
  let cursor = 0;
  for (const p of ordered) {
    if (p.offset > cursor) parts.push(file.slice(cursor, p.offset));
    parts.push(p.bytes as BlobPart);
    cursor = p.offset + p.bytes.length;
  }
  if (cursor < file.size) parts.push(file.slice(cursor));
  return new Blob(parts, { type: mime });
}

// ---------------------------------------------------------------------------
// TIFF (the structure inside Exif) - parsing for orientation + GPS, and the minimal rebuild
// ---------------------------------------------------------------------------

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
const TAG_ORIENTATION = 0x0112;
const TAG_GPS_IFD = 0x8825;

/**
 * Find a tag in IFD0 of a TIFF blob and return its inline SHORT value (or just `true`
 * for presence when the type isn't SHORT). Returns null when absent/unparseable.
 * Bounds-checked everywhere: Exif in the wild is frequently truncated or lying.
 */
function findIfd0Tag(
  tiff: Uint8Array,
  wantTag: number,
): { shortValue: number | null } | null {
  if (tiff.length < 8) return null;
  let le: boolean;
  if (tiff[0] === 0x49 && tiff[1] === 0x49) le = true;
  else if (tiff[0] === 0x4d && tiff[1] === 0x4d) le = false;
  else return null;
  const rd16 = (o: number) =>
    le ? (tiff[o + 1] << 8) | tiff[o] : u16be(tiff, o);
  const rd32 = (o: number) => (le ? u32le(tiff, o) : u32be(tiff, o));
  if (rd16(2) !== 42) return null;
  const ifd0 = rd32(4);
  if (ifd0 + 2 > tiff.length) return null;
  const count = rd16(ifd0);
  for (let i = 0; i < count; i++) {
    const e = ifd0 + 2 + i * 12;
    if (e + 12 > tiff.length) return null;
    if (rd16(e) !== wantTag) continue;
    const type = rd16(e + 2);
    const n = rd32(e + 4);
    if (type === 3 && n >= 1) return { shortValue: rd16(e + 8) };
    return { shortValue: null };
  }
  return null;
}

/** A TIFF header ("II*\0" or "MM\0*") at `o`. */
function isTiffHeader(b: Uint8Array, o: number): boolean {
  if (o < 0 || o + 4 > b.length) return false;
  return (
    (b[o] === 0x49 &&
      b[o + 1] === 0x49 &&
      b[o + 2] === 0x2a &&
      b[o + 3] === 0) ||
    (b[o] === 0x4d && b[o + 1] === 0x4d && b[o + 2] === 0 && b[o + 3] === 0x2a)
  );
}

/** The Orientation (1-8) a TIFF blob's IFD0 holds, or null. */
function tiffOrientation(tiff: Uint8Array): number | null {
  const v = findIfd0Tag(tiff, TAG_ORIENTATION)?.shortValue ?? null;
  return v !== null && v >= 1 && v <= 8 ? v : null;
}

/** Whether a TIFF blob's IFD0 points at a GPS IFD. */
function tiffHasGps(tiff: Uint8Array): boolean {
  return findIfd0Tag(tiff, TAG_GPS_IFD) !== null;
}

// The capture time's tags (Exif 2.32): IFD0 points at the Exif IFD, which holds the time the shutter fired as a wall
// clock and, since 2.31, the zone that clock was in.
const TAG_EXIF_IFD = 0x8769;
const TAG_EXIF_VERSION = 0x9000;
const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_OFFSET_TIME_ORIGINAL = 0x9011;

/** The capture time an Exif states, in the exact shapes the standard gives (`exifWall`, `exifOffset`). */
type ExifTime = { wall: string; offset: string | null };

const EXIF_WALL = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
const EXIF_OFFSET = /^[+-](\d{2}):(\d{2})$/;

/**
 * A `DateTimeOriginal` that is a real wall clock ("2026:10:03 21:14:05"), trailing padding trimmed; null for anything
 * else. ★ ONLY THIS SHAPE IS EVER COPIED into a stored file: the field is free ASCII to a writer, so anything that is
 * not a date (a caption, an address typed into the wrong box) never survives the strip as one.
 */
function exifWall(raw: string | null): string | null {
  if (raw === null) return null;
  const s = raw.replace(/[ \t]+$/, "");
  const m = EXIF_WALL.exec(s);
  if (!m) return null;
  const [y, mo, d, h, mi, sec] = m.slice(1).map(Number);
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (y < 1 || mo < 1 || mo > 12 || d < 1 || d > days[mo - 1]) return null;
  if (h > 23 || mi > 59 || sec > 59) return null;
  return s;
}

/** An `OffsetTimeOriginal` that is a real zone ("+02:00", "-05:30", within ±14:00); null for anything else. */
function exifOffset(raw: string | null): string | null {
  if (raw === null) return null;
  const s = raw.replace(/[ \t]+$/, "");
  const m = EXIF_OFFSET.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return mi <= 59 && h * 60 + mi <= 14 * 60 ? s : null;
}

/**
 * The capture time a TIFF blob states: IFD0's Exif IFD pointer, then that IFD's `DateTimeOriginal` and
 * `OffsetTimeOriginal` (an ASCII value inline when it fits four bytes, else at its offset). Null when there is no
 * real one. Bounds-checked at every step, like everything that reads Exif: one hop, never a walk a lying pointer
 * could loop.
 */
function tiffCaptureTime(tiff: Uint8Array): ExifTime | null {
  if (tiff.length < 8) return null;
  let le: boolean;
  if (tiff[0] === 0x49 && tiff[1] === 0x49) le = true;
  else if (tiff[0] === 0x4d && tiff[1] === 0x4d) le = false;
  else return null;
  const rd16 = (o: number) =>
    le ? (tiff[o + 1] << 8) | tiff[o] : u16be(tiff, o);
  const rd32 = (o: number) => (le ? u32le(tiff, o) : u32be(tiff, o));
  if (rd16(2) !== 42) return null;
  /** Where `tag`'s 12-byte entry sits in the IFD at `ifd`, or -1. */
  const entryOf = (ifd: number, tag: number): number => {
    if (ifd < 8 || ifd + 2 > tiff.length) return -1;
    const count = rd16(ifd);
    for (let i = 0; i < count; i++) {
      const e = ifd + 2 + i * 12;
      if (e + 12 > tiff.length) return -1;
      if (rd16(e) === tag) return e;
    }
    return -1;
  };
  /** An ASCII entry's text up to its NUL, or null (not ASCII, empty, too long to be a time, out of bounds). */
  const ascii = (e: number): string | null => {
    if (e < 0 || rd16(e + 2) !== 2) return null;
    const n = rd32(e + 4);
    if (n === 0 || n > 32) return null;
    const at = n <= 4 ? e + 8 : rd32(e + 8);
    if (at + n > tiff.length) return null;
    let s = "";
    for (let i = 0; i < n && tiff[at + i] !== 0; i++) {
      s += String.fromCharCode(tiff[at + i]);
    }
    return s;
  };
  const pointer = entryOf(rd32(4), TAG_EXIF_IFD);
  if (pointer < 0) return null;
  const type = rd16(pointer + 2); // LONG, or IFD (13) from a writer that says so
  if ((type !== 4 && type !== 13) || rd32(pointer + 4) !== 1) return null;
  const exifIfd = rd32(pointer + 8);
  const wall = exifWall(ascii(entryOf(exifIfd, TAG_DATETIME_ORIGINAL)));
  if (!wall) return null;
  return {
    wall,
    offset: exifOffset(ascii(entryOf(exifIfd, TAG_OFFSET_TIME_ORIGINAL))),
  };
}

/** A read Exif time as the stamp a result carries. */
function wallStamp(time: ExifTime | null): CaptureStamp | null {
  return time ? { kind: "wall", wall: time.wall, offset: time.offset } : null;
}

/**
 * ★ A CAPTURE READ NEVER COSTS THE STRIP: whatever it meets, the worst it can do is read no time. Every read is
 * bounds-checked and meant never to throw, but one that did would end its walk, and a walk that ends fails open with
 * every byte of the original's metadata, GPS included; so each read is asked through this.
 */
function quietly<T>(read: () => T): T | null {
  try {
    return read();
  } catch {
    return null;
  }
}

/**
 * The minimal TIFF every rebuilt Exif carries: a little-endian IFD0 with ONLY the
 * Orientation (26 bytes), or an empty IFD0 (14 bytes) when there is none. No sub-IFDs, no
 * GPS, no maker notes, no thumbnail. With a capture time (Will, 2026-10-05: keep it, never
 * the place or the device), IFD0 also points at an Exif IFD holding exactly `ExifVersion`
 * ("0232", so a reader takes the block as Exif) and `DateTimeOriginal`: 88 bytes at the
 * most, every value word-aligned.
 *
 * ★ THE ZONE IS READ, NEVER KEPT. `OffsetTimeOriginal` is how the claim knows the instant
 * (read from the original, `tiffCaptureTime`), but in the stored file it would say roughly
 * where: some offsets are one country's alone (Nepal's +05:45, Iran's +03:30). The bare
 * wall clock still shows the day and the hour it was taken, wherever the file is opened.
 */
function minimalTiff(
  orientation: number | null,
  wall: string | null = null,
): Uint8Array {
  if (wall) return minimalTiffWithTime(orientation, wall);
  if (orientation === null) {
    // prettier-ignore
    return new Uint8Array([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // "II", 42, IFD0 at offset 8
      0x00, 0x00, // 0 entries
      0x00, 0x00, 0x00, 0x00, // no next IFD
    ]);
  }
  // prettier-ignore
  return new Uint8Array([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // "II", 42, IFD0 at offset 8
    0x01, 0x00, // 1 entry
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, // tag 0x0112, SHORT, count 1
    orientation & 0xff, 0x00, 0x00, 0x00, // value (SHORT + 2 pad bytes)
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ]);
}

/**
 * `minimalTiff` with a capture time. Laid out, little-endian: the header; IFD0 (the Orientation when there is one,
 * then the Exif IFD pointer; tags ascending, as TIFF requires); the Exif IFD (`ExifVersion` inline, then
 * `DateTimeOriginal` by offset, its 20 bytes being past an entry's four); then the value. Same input, same bytes, so a
 * second strip is a no-op.
 */
function minimalTiffWithTime(
  orientation: number | null,
  wall: string,
): Uint8Array {
  const ifd0Count = orientation === null ? 1 : 2;
  const exifIfd = 8 + 2 + 12 * ifd0Count + 4;
  const exifCount = 2;
  const wallAt = exifIfd + 2 + 12 * exifCount + 4;
  const out = new Uint8Array(wallAt + 20);
  const w16 = (o: number, v: number) => {
    out[o] = v & 0xff;
    out[o + 1] = (v >>> 8) & 0xff;
  };
  const w32 = (o: number, v: number) => {
    w16(o, v & 0xffff);
    w16(o + 2, (v >>> 16) & 0xffff);
  };
  /** One 12-byte entry: tag, type, count, then the value (a SHORT or a LONG; an ASCII's offset). */
  const entry = (at: number, tag: number, type: number, count: number) => {
    w16(at, tag);
    w16(at + 2, type);
    w32(at + 4, count);
  };
  out.set([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00], 0); // "II", 42, IFD0 at 8
  let p = 8;
  w16(p, ifd0Count);
  p += 2;
  if (orientation !== null) {
    entry(p, TAG_ORIENTATION, 3, 1); // SHORT
    w16(p + 8, orientation);
    p += 12;
  }
  entry(p, TAG_EXIF_IFD, 4, 1); // LONG
  w32(p + 8, exifIfd);
  p += 12 + 4; // and no next IFD (zeros)
  w16(p, exifCount);
  p += 2;
  entry(p, TAG_EXIF_VERSION, 7, 4); // UNDEFINED, inline
  out.set(asciiBytes("0232"), p + 8);
  p += 12;
  entry(p, TAG_DATETIME_ORIGINAL, 2, 20); // ASCII, 19 characters and the NUL
  w32(p + 8, wallAt);
  out.set(asciiBytes(wall), wallAt);
  return out;
}

/**
 * Overwrite an Exif block IN PLACE: `prefix` (whatever must lead it, e.g. "Exif\0\0"),
 * then a minimal TIFF keeping only the original's orientation and capture time (its wall
 * clock), then zeros to the original length - the GPS, device, serial and maker-note bytes
 * are gone, the length (which something else points past) is not. A block too small for the
 * time keeps the orientation alone; one that cannot even hold that is zeroed.
 */
function blankExifBlock(
  length: number,
  prefix: readonly number[],
  orientation: number | null,
  wall: string | null = null,
): Uint8Array {
  const out = new Uint8Array(length);
  for (const tiff of [
    minimalTiff(orientation, wall),
    minimalTiff(orientation),
    minimalTiff(null),
  ]) {
    if (prefix.length + tiff.length <= length) {
      out.set(prefix, 0);
      out.set(tiff, prefix.length);
      return out;
    }
  }
  return out;
}

// XMP, wherever it rides: an empty packet to blank one with (the rest of a blanked XMP is
// XML whitespace, which may follow a document's root element, so it stays one valid, empty
// XMP document), and the property names that say it holds a position.
const EMPTY_XMP = asciiBytes('<x:xmpmeta xmlns:x="adobe:ns:meta/"/>');
const XMP_GPS_NEEDLES: readonly (readonly number[])[] = [
  asciiBytes("GPSLatitude"),
  asciiBytes("GPSLongitude"),
];
// The signature that opens a standard XMP APP1 payload in a JPEG.
const XMP_APP1_NS = [...asciiBytes("http://ns.adobe.com/xap/1.0/"), 0x00];

/** The Exif Orientation (1-8) of a JPEG, or null. Exported for tests + diagnostics. */
export function readJpegOrientation(bytes: Uint8Array): number | null {
  for (const seg of iterateJpegSegments(bytes)) {
    if (seg.marker !== 0xe1) continue;
    const payload = bytes.subarray(seg.start + 4, seg.end);
    if (!hasPrefix(payload, EXIF_HEADER)) continue;
    return tiffOrientation(payload.subarray(6));
  }
  return null;
}

// ---------------------------------------------------------------------------
// JPEG
// ---------------------------------------------------------------------------

type JpegSegment = { marker: number; start: number; end: number };

/**
 * Walk the pre-SOS marker segments. Yields nothing (empty iteration) on malformed input;
 * strippers detect malformedness themselves - this is only for read-only scans.
 */
function* iterateJpegSegments(bytes: Uint8Array): Generator<JpegSegment> {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return;
  let pos = 2;
  while (pos + 2 <= bytes.length) {
    if (bytes[pos] !== 0xff) return;
    const marker = bytes[pos + 1];
    if (marker === 0xda || marker === 0xd9) return; // SOS/EOI: scan is pre-entropy only
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) return;
    if (pos + 4 > bytes.length) return;
    const segLen = u16be(bytes, pos + 2);
    if (segLen < 2) return;
    const end = pos + 2 + segLen;
    if (end > bytes.length) return;
    yield { marker, start: pos, end };
    pos = end;
  }
}

/**
 * The APPn markers we KEEP. Everything else in E0-EF plus COM is dropped:
 *  - APP0 (JFIF/JFXX): density/aspect info, no identity.
 *  - APP2: ICC_PROFILE (color fidelity - stripping it shifts colors) and MPF (multi-
 *    picture offsets, e.g. iPhone gain maps whose payload trails the EOI; dropping the
 *    index while keeping the trailing bytes would just dangle them). NOTE: MPF offsets
 *    are relative to the MPF HEADER, so keeping the index is not enough - any byte
 *    dropped between the MPF segment and SOS (iPhone HDR JPEGs carry a droppable APP10
 *    right there) makes the kept offsets stale. fixupMpfIndexes rewrites them after
 *    assembly; when it can't, the whole strip fails open.
 *  - APP14 (Adobe): the color-transform hint - decoders NEED it to pick YCbCr vs YCCK;
 *    dropping it visibly corrupts Adobe-saved JPEGs. It carries no identity.
 * Dropped by NOT being here: APP1 (Exif incl. GPS + maker notes + thumbnail, and XMP),
 * APP13 (IPTC/Photoshop, can hold author/location), COM (free text, often software
 * fingerprints), and vendor APP3-APP12/APP15 blobs.
 */
const JPEG_KEEP_APP = new Set([0xe0, 0xe2, 0xee]);

// "MPF\0" - the APP2 payload prefix of a Multi-Picture Format index segment.
const MPF_FOURCC = [0x4d, 0x50, 0x46, 0x00];

/**
 * Build the minimal replacement APP1 Exif: FFE1, its length (covering the length bytes themselves), "Exif\0\0", then
 * the minimal TIFF (`minimalTiff`): the Orientation alone is 36 bytes in all, as it always was, and the capture time
 * beside it at most 98.
 */
function minimalExifSegment(
  orientation: number | null,
  wall: string | null,
): Uint8Array {
  const tiff = minimalTiff(orientation, wall);
  const length = 2 + EXIF_HEADER.length + tiff.length;
  return Uint8Array.from([
    0xff,
    0xe1,
    (length >>> 8) & 0xff,
    length & 0xff,
    ...EXIF_HEADER,
    ...tiff,
  ]);
}

function stripJpeg(bytes: Uint8Array): StripBytesResult {
  const failOpen: StripBytesResult = {
    data: bytes,
    stripped: false,
    changed: false,
  };
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
    return failOpen;

  const parts: Uint8Array[] = [bytes.subarray(0, 2)]; // SOI
  let pos = 2;
  let removedAny = false;
  let orientation: number | null = null;
  let time: ExifTime | null = null;
  let sawExif = false;
  let exifInsertIndex = -1;
  let sosPos = -1;
  const mpfOldStarts: number[] = []; // kept APP2 MPF segments (their offsets need fixing)

  for (;;) {
    if (pos + 2 > bytes.length) return failOpen; // ran out before SOS
    if (bytes[pos] !== 0xff) return failOpen;
    const marker = bytes[pos + 1];
    if (marker === 0xda || marker === 0xd9) {
      // SOS (or a stray EOI): everything from here - entropy-coded scan data through EOI,
      // plus any trailing bytes - is kept at its exact length. We never touch pixels.
      // Trailing bytes are motion-photo appendages / MPF secondary images; their metadata
      // is overwritten in place below (same length, offsets stable), anything else stays
      // untouched.
      sosPos = pos;
      parts.push(bytes.subarray(pos));
      break;
    }
    // Standalone markers (TEM/RSTn) or 0xFF fill bytes before SOS mean a file shape we
    // don't understand - fail open rather than guess (the fail-open contract).
    if (
      marker === 0x01 ||
      marker === 0xff ||
      (marker >= 0xd0 && marker <= 0xd8)
    ) {
      return failOpen;
    }
    if (pos + 4 > bytes.length) return failOpen;
    const segLen = u16be(bytes, pos + 2);
    if (segLen < 2) return failOpen;
    const end = pos + 2 + segLen;
    if (end > bytes.length) return failOpen;

    const isApp = marker >= 0xe0 && marker <= 0xef;
    const drop = (isApp && !JPEG_KEEP_APP.has(marker)) || marker === 0xfe;

    if (marker === 0xe1 && !sawExif) {
      const payload = bytes.subarray(pos + 4, end);
      if (hasPrefix(payload, EXIF_HEADER)) {
        sawExif = true;
        // Remember where the Exif sat so the rebuilt minimal segment lands in the same
        // position (Exif belongs before other APPn per spec convention). Its capture time is
        // read here, from the original, before the segment is dropped.
        exifInsertIndex = parts.length;
        orientation = tiffOrientation(payload.subarray(6));
        time = quietly(() => tiffCaptureTime(payload.subarray(6)));
      }
    }

    if (drop) removedAny = true;
    else {
      if (
        marker === 0xe2 &&
        hasPrefix(bytes.subarray(pos + 4, end), MPF_FOURCC)
      ) {
        mpfOldStarts.push(pos);
      }
      parts.push(bytes.subarray(pos, end));
    }
    pos = end;
  }

  // Metadata inside the trailing bytes (a motion-photo MP4, the Exif of an embedded JPEG):
  // planned on the ORIGINAL coordinates, applied after assembly at the shifted position.
  const trailerPatches = planJpegTrailerPatches(bytes, sosPos);

  // Rebuild the Exif ONLY when it carries something: the orientation when it does something
  // (a value of 1 = "upright" = the decoder default, so it is never written), and the capture
  // time. With neither, emitting no Exif at all is byte-cheaper and equally correct.
  const kept = orientation !== null && orientation !== 1 ? orientation : null;
  if ((kept !== null || time) && exifInsertIndex >= 0) {
    parts.splice(
      exifInsertIndex,
      0,
      minimalExifSegment(kept, time?.wall ?? null),
    );
  }
  // The capture time is the original's word whatever happens to the strip below.
  const captured = wallStamp(time);

  if (!removedAny && trailerPatches.length === 0) {
    return withCapture(
      { data: bytes, stripped: true, changed: false },
      captured,
    );
  }
  const data = removedAny ? concatParts(parts) : bytes.slice();
  // Everything from SOS to EOF was kept as ONE block of the same length, so the whole
  // tail shifted by exactly the size delta - which is what the MPF offsets must be
  // corrected by.
  const sosDelta = data.length - bytes.length;
  if (removedAny && mpfOldStarts.length > 0) {
    // An MPF index we cannot keep valid means fail open: a structurally corrupt
    // multi-picture file (broken HDR gain map) is worse than the metadata leak.
    if (!fixupMpfIndexes(bytes, data, mpfOldStarts, sosPos, sosDelta)) {
      return withCapture(failOpen, captured);
    }
  }
  for (const p of trailerPatches) data.set(p.bytes, p.offset + sosDelta);
  // memcmp (not just removedAny) so a re-run over an already-stripped file - which drops
  // our minimal Exif and re-inserts an identical one - correctly reports changed:false.
  return withCapture(
    { data, stripped: true, changed: !bytesEqual(bytes, data) },
    captured,
  );
}

/** First EOI marker in [from, to). Inside entropy-coded data 0xFF is always followed by
 *  0x00 or an RSTn, so the first FF D9 really is that image's end. */
function findEoi(bytes: Uint8Array, from: number, to = bytes.length): number {
  for (let i = from; i + 2 <= to; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) return i;
  }
  return -1;
}

/**
 * The in-place patches for a JPEG's trailing bytes (planned on the original coordinates).
 * We can never REMOVE trailing bytes (MPF offsets point into them and unknown trailers are
 * opaque), so each one is scrubbed where it lies:
 *  - Samsung/Pixel "motion photos" append a complete MP4 whose moov can carry its OWN
 *    udta GPS: blanked with the video's rename-to-'free' machinery;
 *  - every JPEG embedded before it (an MPF secondary image, an HDR gain map, an appended
 *    original) has each Exif APP1 overwritten with a minimal orientation-only Exif of the
 *    same length (blankExifBlock), so the MPF index's offsets and sizes stay true.
 * Nothing else in the trailer is touched (fail open on what we do not understand).
 */
function planJpegTrailerPatches(
  bytes: Uint8Array,
  sosPos: number,
): IsobmffPatch[] {
  if (sosPos < 0) return [];
  const eoi = findEoi(bytes, sosPos);
  if (eoi < 0) return [];
  const patches: IsobmffPatch[] = [];
  const mp4 = findTrailerIsobmff(bytes, eoi);
  if (mp4) patches.push(...mp4.patches);
  // An embedded JPEG is looked for only BEFORE the motion-photo MP4: a 'covr' JPEG inside
  // its udta is already zeroed by the box blanking, and the two never write one byte twice.
  for (const seg of embeddedJpegMetadata(
    bytes,
    eoi + 2,
    mp4?.start ?? bytes.length,
  )) {
    const payload = bytes.subarray(seg.start, seg.end);
    const blank = blankEmbeddedSegment(seg.kind, payload);
    if (blank && !bytesEqual(blank, payload)) {
      patches.push({ offset: seg.start, bytes: blank });
    }
  }
  return patches;
}

/**
 * An embedded JPEG's metadata payload overwritten in place, the primary's policy kept at
 * the segment's exact length: Exif becomes a minimal orientation-only Exif, IPTC and a
 * comment become zeros (no reader parses an APP13 without its signature), and XMP stays
 * (a gain map's parameters live there) unless it carries GPS, when it becomes an empty
 * packet. Null = keep.
 */
function blankEmbeddedSegment(
  kind: EmbeddedSegment["kind"],
  payload: Uint8Array,
): Uint8Array | null {
  if (kind === "exif") {
    return blankExifBlock(
      payload.length,
      EXIF_HEADER,
      tiffOrientation(payload.subarray(EXIF_HEADER.length)),
    );
  }
  if (kind === "zero") return new Uint8Array(payload.length);
  if (!XMP_GPS_NEEDLES.some((n) => findBytes(payload, n))) return null;
  const blank = new Uint8Array(payload.length).fill(0x20);
  blank.set(XMP_APP1_NS, 0);
  if (XMP_APP1_NS.length + EMPTY_XMP.length <= blank.length) {
    blank.set(EMPTY_XMP, XMP_APP1_NS.length);
  }
  return blank;
}

/**
 * A complete ISOBMFF appended after the primary's EOI (a motion photo's MP4), with the
 * patches that blank its metadata. The appendage rarely starts AT eoi+2 (vendors pad /
 * prepend index blobs), so scan for an 'ftyp' box start; the ISOBMFF walk demands a
 * perfect box chain to EOF plus a moov, so a false positive on random bytes cannot
 * survive; cap the attempts anyway.
 */
function findTrailerIsobmff(
  bytes: Uint8Array,
  eoi: number,
): { start: number; patches: IsobmffPatch[] } | null {
  let attempts = 0;
  for (let i = eoi + 6; i + 4 <= bytes.length && attempts < 4; i++) {
    if (
      bytes[i] !== 0x66 ||
      bytes[i + 1] !== 0x74 ||
      bytes[i + 2] !== 0x79 ||
      bytes[i + 3] !== 0x70
    ) {
      continue;
    }
    attempts++;
    const start = i - 4; // the size field precedes the 'ftyp' fourcc
    const sub = bytes.subarray(start);
    const plan = walkBytes(isobmffWalk(sub.length), sub);
    if (plan.ok) {
      return {
        start,
        patches: plan.patches.map((p) => ({
          offset: start + p.offset,
          bytes: p.bytes,
        })),
      };
    }
  }
  return null;
}

/** A metadata segment payload of an embedded JPEG (after the marker and length bytes). */
type EmbeddedSegment = ByteRange & { kind: "exif" | "xmp" | "zero" };

/**
 * The metadata segments of every JPEG embedded in [from, to): MPF secondary images (a
 * camera's large thumbnail, a stereo pair, an HDR gain map) and any appended full JPEG.
 * A candidate `FF D8 FF` counts only when its marker chain walks strictly to an SOS inside
 * the range, and an Exif payload only with a real TIFF header, so random bytes cannot
 * pass for one; each image found is skipped to its EOI.
 */
function embeddedJpegMetadata(
  b: Uint8Array,
  from: number,
  to: number,
): EmbeddedSegment[] {
  const out: EmbeddedSegment[] = [];
  let i = from;
  while (i + 4 <= to) {
    if (b[i] !== 0xff || b[i + 1] !== 0xd8 || b[i + 2] !== 0xff) {
      i++;
      continue;
    }
    const found = walkEmbeddedJpeg(b, i, to);
    if (!found) {
      i++;
      continue;
    }
    out.push(...found.segments);
    i = found.end;
  }
  return out;
}

function walkEmbeddedJpeg(
  b: Uint8Array,
  start: number,
  to: number,
): { segments: EmbeddedSegment[]; end: number } | null {
  const segments: EmbeddedSegment[] = [];
  let pos = start + 2;
  for (;;) {
    if (pos + 4 > to || b[pos] !== 0xff) return null;
    const marker = b[pos + 1];
    if (marker === 0xda) break;
    if (
      marker === 0xd9 ||
      marker === 0x01 ||
      marker === 0xff ||
      (marker >= 0xd0 && marker <= 0xd8)
    ) {
      return null;
    }
    const end = pos + 2 + u16be(b, pos + 2);
    if (end < pos + 4 || end > to) return null;
    const body = pos + 4;
    if (marker === 0xe1) {
      if (
        hasPrefixAt(b, body, EXIF_HEADER) &&
        isTiffHeader(b, body + EXIF_HEADER.length)
      ) {
        segments.push({ start: body, end, kind: "exif" });
      } else if (hasPrefixAt(b, body, XMP_APP1_NS)) {
        segments.push({ start: body, end, kind: "xmp" });
      }
    } else if ((marker === 0xed || marker === 0xfe) && end > body) {
      segments.push({ start: body, end, kind: "zero" }); // IPTC/Photoshop, a comment
    }
    pos = end;
  }
  const eoi = findEoi(b, pos, to);
  return { segments, end: eoi < 0 ? to : eoi + 2 };
}

/** The pre-SOS starts of APP2 MPF segments in an assembled (valid) JPEG. */
function collectMpfStarts(b: Uint8Array): number[] {
  const out: number[] = [];
  for (const seg of iterateJpegSegments(b)) {
    if (
      seg.marker === 0xe2 &&
      hasPrefix(b.subarray(seg.start + 4, seg.end), MPF_FOURCC)
    ) {
      out.push(seg.start);
    }
  }
  return out;
}

/**
 * Rewrite the MP Entry table(s) of kept MPF segments so the index stays valid after
 * segments were dropped/rebuilt (CIPA DC-007: individual-image offsets are relative to
 * the MPF header = the endianness bytes right after "MPF\0"):
 *  - a non-zero offset targets a trailing image in the tail -> shift it by
 *    (tail delta - MPF header delta);
 *  - the offset-0 entry is the FIRST individual image (this file from its SOI), whose
 *    SIZE spans the region we shrank -> grow/shrink it by the tail delta.
 * Returns false whenever the index is present but not provably fixable - the caller
 * fails the whole strip open (never ship a silently corrupt multi-picture index).
 */
function fixupMpfIndexes(
  original: Uint8Array,
  out: Uint8Array,
  oldStarts: number[],
  oldSos: number,
  sosDelta: number,
): boolean {
  if (oldSos < 0) return false;
  const newStarts = collectMpfStarts(out);
  if (newStarts.length !== oldStarts.length) return false;
  for (let s = 0; s < oldStarts.length; s++) {
    const oldHdr = oldStarts[s] + 8; // FF E2 + len(2) + "MPF\0"
    const newHdr = newStarts[s] + 8;
    const offsetAdjust = sosDelta - (newHdr - oldHdr);
    if (offsetAdjust === 0 && sosDelta === 0) continue; // nothing moved at all
    const segEnd = newStarts[s] + 2 + u16be(out, newStarts[s] + 2);
    if (
      !rewriteMpfEntries(
        out,
        newHdr,
        segEnd,
        offsetAdjust,
        sosDelta,
        oldHdr,
        oldSos,
        original.length,
      )
    ) {
      return false;
    }
  }
  return true;
}

function rewriteMpfEntries(
  out: Uint8Array,
  hdr: number,
  segEnd: number,
  offsetAdjust: number,
  sosDelta: number,
  oldHdr: number,
  oldSos: number,
  oldLen: number,
): boolean {
  if (hdr + 8 > segEnd || segEnd > out.length) return false;
  let le: boolean;
  if (out[hdr] === 0x49 && out[hdr + 1] === 0x49) le = true;
  else if (out[hdr] === 0x4d && out[hdr + 1] === 0x4d) le = false;
  else return false;
  const r16 = (o: number) => (le ? out[o] | (out[o + 1] << 8) : u16be(out, o));
  const r32 = (o: number) => (le ? u32le(out, o) : u32be(out, o));
  const w32 = (o: number, v: number) => {
    if (le) {
      out[o] = v & 0xff;
      out[o + 1] = (v >>> 8) & 0xff;
      out[o + 2] = (v >>> 16) & 0xff;
      out[o + 3] = (v >>> 24) & 0xff;
    } else {
      out[o] = (v >>> 24) & 0xff;
      out[o + 1] = (v >>> 16) & 0xff;
      out[o + 2] = (v >>> 8) & 0xff;
      out[o + 3] = v & 0xff;
    }
  };
  if (r16(hdr + 2) !== 42) return false;
  const ifd = hdr + r32(hdr + 4);
  if (ifd < hdr || ifd + 2 > segEnd) return false;
  const count = r16(ifd);
  for (let i = 0; i < count; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > segEnd) return false;
    if (r16(e) !== 0xb002) continue; // MP Entry tag
    const type = r16(e + 2);
    const byteCount = r32(e + 4);
    if (type !== 7 || byteCount < 16 || byteCount % 16 !== 0) return false;
    const base = hdr + r32(e + 8);
    if (base < hdr || base + byteCount > segEnd) return false;
    for (let j = 0; j < byteCount / 16; j++) {
      const entry = base + j * 16;
      const size = r32(entry + 4);
      const off = r32(entry + 8);
      if (off === 0) {
        // First individual image = this file from its SOI; its size must track the
        // shrunk pre-SOS region. Size 0 = writer left it blank - nothing to track.
        if (size === 0) continue;
        if (size <= oldSos || size > oldLen) return false; // span never reached the tail
        const newSize = size + sosDelta;
        if (newSize <= 0) return false;
        w32(entry + 4, newSize);
      } else {
        const target = oldHdr + off;
        // Only targets inside the tail moved uniformly; anything else (pre-SOS or past
        // EOF) is a geometry we cannot reason about.
        if (target < oldSos || target >= oldLen) return false;
        const newOff = off + offsetAdjust;
        if (newOff <= 0) return false;
        w32(entry + 8, newOff);
      }
    }
    return true; // one MP Entry tag per MP Index IFD
  }
  // No MP Entry tag (an attribute-only MPF, e.g. in a secondary image): no offsets to fix.
  return true;
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/**
 * eXIf is Exif verbatim; tEXt/zTXt/iTXt are freeform text (XMP ships inside iTXt).
 * KEPT on purpose: gAMA/iCCP/sRGB/cHRM (color), pHYs, tIME and everything structural -
 * they carry rendering info, not identity. CRCs of kept chunks copy verbatim (unchanged
 * bytes = unchanged CRC).
 */
const PNG_DROP_CHUNKS = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);

function stripPng(bytes: Uint8Array): StripBytesResult {
  const failOpen: StripBytesResult = {
    data: bytes,
    stripped: false,
    changed: false,
  };
  if (!hasPrefix(bytes, PNG_SIGNATURE)) return failOpen;

  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let pos = 8;
  let removedAny = false;
  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) return failOpen;
    const dataLen = u32be(bytes, pos);
    const type = ascii4(bytes, pos + 4);
    if (!/^[A-Za-z]{4}$/.test(type)) return failOpen;
    const end = pos + 8 + dataLen + 4; // len + type + data + CRC
    if (end > bytes.length || end < pos) return failOpen;
    if (PNG_DROP_CHUNKS.has(type)) removedAny = true;
    else parts.push(bytes.subarray(pos, end));
    pos = end;
    if (type === "IEND") {
      // Bytes after IEND are outside the PNG (some tools append blobs there). Unknown
      // format -> keep verbatim, per the fail-open spirit: never risk corrupting content
      // we can't identify.
      if (pos < bytes.length) parts.push(bytes.subarray(pos));
      break;
    }
  }

  if (!removedAny) return { data: bytes, stripped: true, changed: false };
  const data = concatParts(parts);
  return { data, stripped: true, changed: true };
}

// ---------------------------------------------------------------------------
// WebP (RIFF)
// ---------------------------------------------------------------------------

// VP8X flag bits (byte 0 of the VP8X payload). Cleared when we drop the matching chunk;
// a VP8X whose flag promises an EXIF/XMP chunk that no longer exists confuses muxers.
const VP8X_FLAG_EXIF = 0x08;
const VP8X_FLAG_XMP = 0x04;

function stripWebp(bytes: Uint8Array): StripBytesResult {
  const failOpen: StripBytesResult = {
    data: bytes,
    stripped: false,
    changed: false,
  };
  if (bytes.length < 12) return failOpen;
  if (ascii4(bytes, 0) !== "RIFF" || ascii4(bytes, 8) !== "WEBP")
    return failOpen;

  const chunks: Uint8Array[] = [];
  let pos = 12;
  let removedAny = false;
  let vp8xIndex = -1;
  while (pos < bytes.length) {
    if (pos + 8 > bytes.length) return failOpen;
    const cc = ascii4(bytes, pos);
    const size = u32le(bytes, pos + 4);
    const end = pos + 8 + size;
    if (end > bytes.length || end < pos) return failOpen;
    // RIFF pads odd-sized chunks to even; the final chunk may legally omit the pad byte.
    const padded = end + (size & 1);
    const chunkEnd = Math.min(padded, bytes.length);
    if (padded > bytes.length && end !== bytes.length) return failOpen;
    if (cc === "EXIF" || cc === "XMP ") {
      removedAny = true;
    } else {
      if (cc === "VP8X") vp8xIndex = chunks.length;
      chunks.push(bytes.subarray(pos, chunkEnd));
    }
    pos = chunkEnd;
  }

  if (!removedAny) return { data: bytes, stripped: true, changed: false };

  if (vp8xIndex >= 0 && chunks[vp8xIndex].length >= 9) {
    const vp8x = chunks[vp8xIndex].slice(); // copy before mutating the flags byte
    vp8x[8] &= ~(VP8X_FLAG_EXIF | VP8X_FLAG_XMP);
    chunks[vp8xIndex] = vp8x;
  }

  let payloadLen = 4; // "WEBP"
  for (const c of chunks) payloadLen += c.length;
  // Odd-sized final kept chunk: the RIFF size counts real bytes; nothing to pad since we
  // preserved each chunk's original (already padded, except possibly the last) span.
  const header = new Uint8Array(12);
  header.set(asciiBytes("RIFF"), 0);
  header[4] = payloadLen & 0xff;
  header[5] = (payloadLen >>> 8) & 0xff;
  header[6] = (payloadLen >>> 16) & 0xff;
  header[7] = (payloadLen >>> 24) & 0xff;
  header.set(asciiBytes("WEBP"), 8);
  const data = concatParts([header, ...chunks]);
  return { data, stripped: true, changed: true };
}

// ---------------------------------------------------------------------------
// MP4 / MOV (ISOBMFF)
// ---------------------------------------------------------------------------

// The full 16-byte XMP uuid box usertype (Adobe's XMP-in-MP4 convention).
// prettier-ignore
const XMP_UUID = [0xbe, 0x7a, 0xcf, 0xcb, 0x97, 0xa9, 0x42, 0xe8, 0x9c, 0x71, 0x99, 0x94, 0x91, 0xe3, 0xaf, 0xac];

// Box types blanked WHOLESALE wherever found (top level, moov level, trak level):
//  - udta: Apple (c)xyz GPS, (c)mak/(c)mod device, 3gpp loci, nested meta/keys/ilst
//    (com.apple.quicktime.location.ISO6709/.make/.model/.software, creationdate).
//  - meta: the keys/ilst metadata tree outside udta (Android/QuickTime variants).
//  - "xml ": raw XMP box.
// Blanking the WHOLE box (vs surgically editing children) is deliberate: udta internals
// vary wildly across muxers and a parse slip inside would risk the file; a zeroed 'free'
// box is always valid. mvhd/tkhd/mdhd creation and modification TIMES are rewritten in place
// to the capture time alone (`stampMovieClocks`), never removed: they live inside
// offset-critical FullBoxes, and a fixed-width field rewritten moves nothing.
const ISOBMFF_BLANK_TYPES = new Set(["udta", "meta", "xml "]);

// moov is "small" (index tables); anything bigger than this is not a file we understand.
const MOOV_READ_CAP = 256 * 1024 * 1024;
// Top-level metadata boxes we blank are tiny in practice; cap the read defensively.
const TOP_METADATA_READ_CAP = 64 * 1024 * 1024;

// HEIC/HEIF/AVIF are ISOBMFF too, but item-based: meta holds iinf/iloc/pitm and blanking
// it DESTROYS the image. Under a video MIME the MP4 path must not touch one (a mislabeled
// file fails open, it is never re-routed by guesswork), so check the ftyp major brand.
const ITEM_BASED_BRANDS = new Set([
  "heic",
  "heix",
  "heim",
  "heis",
  "hevc",
  "hevx",
  "mif1",
  "msf1",
  "avif",
  "avis",
]);

function isPlausibleBoxType(b: Uint8Array, o: number): boolean {
  for (let i = 0; i < 4; i++) {
    const c = b[o + i];
    // Printable ASCII, or 0xA9 ((c) - QuickTime's udta child convention).
    if (!((c >= 0x20 && c <= 0x7e) || c === 0xa9)) return false;
  }
  return true;
}

type BoxHeader = { type: string; boxSize: number; headerLen: number };

/** Parse one box header at `pos` of `buf` (bounds relative to [pos, limit)). Null = malformed. */
function parseBoxHeader(
  buf: Uint8Array,
  pos: number,
  limit: number,
): BoxHeader | null {
  if (pos + 8 > limit) return null;
  if (!isPlausibleBoxType(buf, pos + 4)) return null;
  const size32 = u32be(buf, pos);
  const type = ascii4(buf, pos + 4);
  let boxSize: number;
  let headerLen = 8;
  if (size32 === 0) {
    boxSize = limit - pos; // "to end of enclosing scope"
  } else if (size32 === 1) {
    if (pos + 16 > limit) return null;
    const large = u64be(buf, pos + 8);
    if (large === null) return null;
    boxSize = large;
    headerLen = 16;
  } else {
    boxSize = size32;
  }
  if (boxSize < headerLen || pos + boxSize > limit) return null;
  return { type, boxSize, headerLen };
}

/** A top-level box header, read through the walk: [pos, pos+16) at most, within `size`. */
function* readTopBoxHeader(pos: number, size: number): Walk<BoxHeader | null> {
  const head: Uint8Array = yield { start: pos, end: Math.min(pos + 16, size) };
  // parseBoxHeader wants absolute coords; parse the local window with a `limit` that lets
  // the box span the rest of the file, then validate the span against `size`.
  if (head.length < 8 || !isPlausibleBoxType(head, 4)) return null;
  const size32 = u32be(head, 0);
  const type = ascii4(head, 4);
  let boxSize: number;
  let headerLen = 8;
  if (size32 === 0) {
    boxSize = size - pos;
  } else if (size32 === 1) {
    if (head.length < 16) return null;
    const large = u64be(head, 8);
    if (large === null) return null;
    boxSize = large;
    headerLen = 16;
  } else {
    boxSize = size32;
  }
  if (boxSize < headerLen || pos + boxSize > size) return null;
  return { type, boxSize, headerLen };
}

/** Rename the box at `pos` to 'free' and zero its payload. Renaming alone would leave the
 *  GPS strings recoverable in the "skipped" bytes - zeroing scrubs them; keeping the size
 *  field(s) means not one offset in the file moves (the whole point). */
function blankBoxInPlace(
  buf: Uint8Array,
  pos: number,
  header: BoxHeader,
): void {
  buf.set(asciiBytes("free"), pos + 4);
  buf.fill(0, pos + header.headerLen, pos + header.boxSize);
}

/**
 * Walk children of [start, end) in `buf`, blanking metadata boxes in place. Recurses into
 * trak (for trak-level udta/meta) but NOT into mdia/stbl - so stco/co64 and the sample
 * tables are untouched by construction. Returns whether anything changed; null = malformed
 * (the caller must fail open and discard the buffer).
 */
function blankMetadataChildren(
  buf: Uint8Array,
  start: number,
  end: number,
  depth: number,
): boolean | null {
  let pos = start;
  let changed = false;
  while (pos < end) {
    const h = parseBoxHeader(buf, pos, end);
    if (!h) return null;
    if (ISOBMFF_BLANK_TYPES.has(h.type)) {
      blankBoxInPlace(buf, pos, h);
      changed = true;
    } else if (h.type === "trak" && depth === 0) {
      const sub = blankMetadataChildren(
        buf,
        pos + h.headerLen,
        pos + h.boxSize,
        depth + 1,
      );
      if (sub === null) return null;
      changed = changed || sub;
    }
    pos += h.boxSize;
  }
  return changed;
}

/** A copy of the moov at `pos` with its metadata children blanked; null = no change,
 *  "malformed" = the walk must fail open. */
function* blankMoov(
  pos: number,
  h: BoxHeader,
): Walk<
  { patch: IsobmffPatch | null; captured: CaptureStamp | null } | "malformed"
> {
  if (h.boxSize > MOOV_READ_CAP) return "malformed";
  const read = yield* readExactly(pos, pos + h.boxSize);
  if (!read) return "malformed";
  // The capture time, from the ORIGINAL moov: its metadata box goes below.
  const found = quietly(() => moovCapture(read, h.headerLen, h.boxSize)) ?? {
    captured: null,
    header: null,
    quicktime: null,
  };
  const moov = read.slice(); // own copy to patch
  let changed = blankMetadataChildren(moov, h.headerLen, h.boxSize, 0);
  if (changed === null) return "malformed";
  // ★ THE QUICKTIME DATE GOES WITH ITS METADATA BOX (the location, make and model share it), SO THE HEADERS KEEP IT
  // (Q4): an iPhone's own export writes them at the moment it exported (AVFoundation does: measured), so a downloaded
  // clip would read as made the day it was uploaded. Every header clock says the capture time, and only it
  // (`stampMovieClocks`).
  const ms = found.captured?.kind === "instant" ? found.captured.ms : null;
  if (
    quietly(() => stampMovieClocks(moov, h.headerLen, h.boxSize, ms)) === true
  ) {
    changed = true;
  }
  return {
    patch: changed ? { offset: pos, bytes: moov } : null,
    captured: found.captured,
  };
}

/** The movie header's creation-time field: where it sits in its moov, its width (version 0 or 1), its value. */
type HeaderTime = { at: number; width: 4 | 8; ms: number | null };

/**
 * EVERY CLOCK A MOVIE'S HEADERS KEEP SAYS WHEN IT WAS TAKEN, AND NOTHING ELSE (capture-time's rule, red-team 56's NIT):
 * the movie header (`mvhd`), each track's (`tkhd`) and each track's media header (`mdhd`) each carry a creation and a
 * modification time, and an export writes them all at the moment it exported (AVFoundation does: measured on the
 * stored MOV, whose track header kept the export's write time after the movie header was rewritten). Each of the six
 * is set to the capture instant, or to zero (never set) where the movie names none, in place, its width unchanged:
 * nothing points at a header's value, so no offset moves, and a second strip finds them already saying it. A header
 * this cannot read (a version past 1) is left alone, as is a 32-bit one that cannot hold the instant.
 */
function stampMovieClocks(
  moov: Uint8Array,
  start: number,
  end: number,
  ms: number | null,
): boolean {
  const seconds = ms === null ? 0 : Math.floor(ms / 1000) + MAC_EPOCH_OFFSET_S;
  if (seconds < 0) return false;
  let changed = false;
  const stamp = (body: number, boxEnd: number) => {
    const version = moov[body];
    const width = version === 0 ? 4 : version === 1 ? 8 : 0;
    if (!width || body + 4 + 2 * width > boxEnd) return;
    if (width === 4 && seconds > 0xffffffff) return;
    for (const at of [body + 4, body + 4 + width]) {
      const now = width === 8 ? u64be(moov, at) : u32be(moov, at);
      if (now === seconds) continue;
      if (width === 8) {
        put32(moov, at, Math.floor(seconds / 0x100000000));
        put32(moov, at + 4, seconds % 0x100000000);
      } else put32(moov, at, seconds);
      changed = true;
    }
  };
  // The moov's children (mvhd, each trak), a trak's (tkhd, mdia), an mdia's (mdhd): the three places a clock sits.
  const walk = (from: number, to: number, depth: number) => {
    for (let p = from; p < to; ) {
      const h = parseBoxHeader(moov, p, to);
      if (!h) return;
      const body = p + h.headerLen;
      const boxEnd = p + h.boxSize;
      if (
        (depth === 0 && h.type === "mvhd") ||
        (depth === 1 && h.type === "tkhd") ||
        (depth === 2 && h.type === "mdhd")
      ) {
        stamp(body, boxEnd);
      } else if (
        (depth === 0 && h.type === "trak") ||
        (depth === 1 && h.type === "mdia")
      ) {
        walk(body, boxEnd, depth + 1);
      }
      p = boxEnd;
    }
  };
  walk(start, end, 0);
  return changed;
}

/** A big-endian 32-bit value written at `at`. */
function put32(b: Uint8Array, at: number, v: number): void {
  b[at] = (v >>> 24) & 0xff;
  b[at + 1] = (v >>> 16) & 0xff;
  b[at + 2] = (v >>> 8) & 0xff;
  b[at + 3] = v & 0xff;
}

// The movie header counts seconds from 1904-01-01 UTC; the epoch is 2,082,844,800 seconds later.
const MAC_EPOCH_OFFSET_S = 2_082_844_800;
// QuickTime's metadata key for when the capture began (an iPhone writes it, with its zone).
const QUICKTIME_CREATION_KEY = "com.apple.quicktime.creationdate";
const QUICKTIME_DATE =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * WHEN A MOVIE SAYS IT WAS TAKEN (Q4): QuickTime's `com.apple.quicktime.creationdate` where the moov's metadata holds
 * one (an iPhone's: the capture's start, in its own zone; the movie header holds when the file was written, the end of
 * the take or an export), else the movie header's creation time (UTC, a muxer's own clock; zero means never set). The
 * metadata box sits in the moov (an iPhone's) or in its udta (ffmpeg's), so both are asked. Read only: a box this
 * cannot place ends the read, never the strip, whose own walk decides what is malformed.
 */
function moovCapture(
  moov: Uint8Array,
  start: number,
  end: number,
): {
  captured: CaptureStamp | null;
  header: HeaderTime | null;
  quicktime: number | null;
} {
  let header: HeaderTime | null = null;
  let quicktime: number | null = null;
  // The moov's children, then a udta's, one level down: the two places a metadata box sits.
  const spans: ByteRange[] = [{ start, end }];
  for (let s = 0; s < spans.length; s++) {
    const { start: from, end: to } = spans[s];
    for (let p = from; p < to; ) {
      const h = parseBoxHeader(moov, p, to);
      if (!h) break;
      const body = p + h.headerLen;
      const boxEnd = p + h.boxSize;
      if (h.type === "mvhd" && s === 0) {
        header = mvhdCreation(moov, body, boxEnd);
      } else if (h.type === "meta") {
        quicktime ??= quicktimeCreationDate(moov, body, boxEnd);
      } else if (h.type === "udta" && s === 0) {
        spans.push({ start: body, end: boxEnd });
      }
      p = boxEnd;
    }
  }
  const ms = quicktime ?? header?.ms ?? null;
  return {
    captured: ms === null ? null : { kind: "instant", ms },
    header,
    quicktime,
  };
}

/**
 * The movie header's creation-time field (version 0: 32-bit seconds, version 1: 64-bit) and its value as epoch ms,
 * null when unset; null for a header this cannot read.
 */
function mvhdCreation(
  b: Uint8Array,
  body: number,
  end: number,
): HeaderTime | null {
  if (body + 4 > end) return null;
  const version = b[body];
  let seconds: number | null;
  let width: 4 | 8;
  if (version === 0 && body + 8 <= end) {
    seconds = u32be(b, body + 4);
    width = 4;
  } else if (version === 1 && body + 12 <= end) {
    seconds = u64be(b, body + 4);
    width = 8;
  } else return null;
  const ms = seconds ? (seconds - MAC_EPOCH_OFFSET_S) * 1000 : null;
  return {
    at: body + 4,
    width,
    ms: ms !== null && Number.isSafeInteger(ms) ? ms : null,
  };
}

/** A box header at `p` whose box lies wholly inside [p, end), without the type check (an ilst item's type is a number). */
function rawBoxAt(
  b: Uint8Array,
  p: number,
  end: number,
): { size: number; type: number } | null {
  if (p + 8 > end) return null;
  const size = u32be(b, p);
  if (size < 8 || p + size > end) return null;
  return { size, type: u32be(b, p + 4) };
}

/**
 * QuickTime's creation date in a moov-level `meta` (handler `mdta`: a `keys` box names each key, and each `ilst` item
 * is typed by its key's 1-based index and holds `data` atoms), as epoch ms; null when it holds none. QuickTime's
 * `meta` opens straight onto its boxes and an ISO one onto a version and flags first: the first child says which.
 */
function quicktimeCreationDate(
  b: Uint8Array,
  start: number,
  end: number,
): number | null {
  let p = start;
  if (!parseBoxHeader(b, p, end) && parseBoxHeader(b, p + 4, end)) p += 4;
  let handler = "";
  let keys: string[] | null = null;
  let items: ByteRange | null = null;
  while (p < end) {
    const h = parseBoxHeader(b, p, end);
    if (!h) return null;
    const body = p + h.headerLen;
    const boxEnd = p + h.boxSize;
    if (h.type === "hdlr" && body + 12 <= boxEnd) handler = ascii4(b, body + 8);
    else if (h.type === "keys") keys = quicktimeKeys(b, body, boxEnd);
    else if (h.type === "ilst") items = { start: body, end: boxEnd };
    p = boxEnd;
  }
  if (handler !== "mdta" || !keys || !items) return null;
  const index = keys.indexOf(QUICKTIME_CREATION_KEY) + 1;
  if (index === 0) return null;
  for (let q = items.start; q < items.end; ) {
    const item = rawBoxAt(b, q, items.end);
    if (!item) return null;
    if (item.type === index) return quicktimeDataDate(b, q + 8, q + item.size);
    q += item.size;
  }
  return null;
}

/** A `keys` box's key names (a full box: version and flags, a count, then each key's size, namespace and name). */
function quicktimeKeys(
  b: Uint8Array,
  body: number,
  end: number,
): string[] | null {
  if (body + 8 > end) return null;
  const count = u32be(b, body + 4);
  if (count > 4096) return null;
  const keys: string[] = [];
  let p = body + 8;
  for (let i = 0; i < count; i++) {
    const key = rawBoxAt(b, p, end);
    if (!key) return null;
    let name = "";
    for (let j = p + 8; j < p + key.size && name.length < 128; j++) {
      name += String.fromCharCode(b[j]);
    }
    keys.push(name);
    p += key.size;
  }
  return keys;
}

/** The first text `data` atom of an `ilst` item read as an ISO 8601 instant with its zone, as epoch ms; else null. */
function quicktimeDataDate(
  b: Uint8Array,
  start: number,
  end: number,
): number | null {
  for (let p = start; p < end; ) {
    const atom = rawBoxAt(b, p, end);
    if (!atom) return null;
    // 'data', then a type (its first byte reserved; 1 is UTF-8) and a locale, then the value.
    if (atom.type === 0x64617461 && atom.size >= 16 && u32be(b, p + 8) === 1) {
      let text = "";
      for (let j = p + 16; j < p + atom.size && text.length < 64; j++) {
        text += String.fromCharCode(b[j]);
      }
      const m = QUICKTIME_DATE.exec(text.trim());
      if (!m) return null;
      const zone =
        m[3] === "Z" || m[3].includes(":")
          ? m[3]
          : `${m[3].slice(0, 3)}:${m[3].slice(3)}`;
      const ms = Date.parse(`${m[1]}${m[2] ?? ""}${zone}`);
      return Number.isFinite(ms) ? ms : null;
    }
    p += atom.size;
  }
  return null;
}

/**
 * A top-level box blanked WHOLE when it is metadata: udta and "xml " (and meta, in a
 * video; an image's top-level meta is its item structure and never qualifies), or a uuid
 * box carrying XMP. null = not metadata, "malformed" = the walk must fail open.
 */
function* blankTopLevelMetadata(
  pos: number,
  h: BoxHeader,
  metaIsMetadata: boolean,
): Walk<IsobmffPatch | null | "malformed"> {
  let isMetadata =
    h.type === "udta" ||
    h.type === "xml " ||
    (metaIsMetadata && h.type === "meta");
  if (h.type === "uuid" && h.boxSize >= h.headerLen + 16) {
    const usertype = yield* readExactly(
      pos + h.headerLen,
      pos + h.headerLen + 16,
    );
    if (!usertype) return "malformed";
    isMetadata = hasPrefix(usertype, XMP_UUID);
  }
  if (!isMetadata) return null;
  if (h.boxSize > TOP_METADATA_READ_CAP) return "malformed";
  const read = yield* readExactly(pos, pos + h.boxSize);
  if (!read) return "malformed";
  const box = read.slice();
  blankBoxInPlace(box, 0, h);
  return { offset: pos, bytes: box };
}

/**
 * Plan the in-place patches that scrub an MP4/MOV. The file's length NEVER changes
 * (rename+zero only), so `patches` splice back at their offsets. ok:false = we did not
 * fully understand the file -> the caller MUST fail open.
 */
function* isobmffWalk(
  size: number,
): Walk<{ ok: boolean; patches: IsobmffPatch[]; captured?: CaptureStamp }> {
  const notOk = { ok: false, patches: [] as IsobmffPatch[] };
  const patches: IsobmffPatch[] = [];
  let captured: CaptureStamp | null = null;
  let pos = 0;
  let sawMoov = false;
  while (pos < size) {
    const h = yield* readTopBoxHeader(pos, size);
    if (!h) return notOk;
    if (h.type === "ftyp") {
      // Item-based brands (HEIC/AVIF) masquerading under a video MIME: fail open, see above.
      if (h.boxSize >= h.headerLen + 4) {
        const brand = yield* readExactly(
          pos + h.headerLen,
          pos + h.headerLen + 4,
        );
        if (!brand) return notOk;
        if (ITEM_BASED_BRANDS.has(ascii4(brand, 0))) return notOk;
      }
    } else if (h.type === "moov") {
      sawMoov = true;
      const moov = yield* blankMoov(pos, h);
      if (moov === "malformed") return notOk;
      if (moov.patch) patches.push(moov.patch);
      captured ??= moov.captured;
    } else {
      // Top-level udta/meta/xml (some muxers hoist metadata out of moov), the XMP uuid.
      const patch = yield* blankTopLevelMetadata(pos, h, true);
      if (patch === "malformed") return notOk;
      if (patch) patches.push(patch);
    }
    pos += h.boxSize;
  }
  // A "video" with no moov is not something we understood - fail open.
  if (!sawMoov) return notOk;
  return withCapture({ ok: true, patches }, captured);
}

/** The MP4/MOV plan over any ByteReader (exported for tests + the trailer scan's shape). */
export async function planIsobmffPatches(
  reader: ByteReader,
): Promise<{ ok: boolean; patches: IsobmffPatch[] }> {
  return walkReader(isobmffWalk(reader.size), reader);
}

// ---------------------------------------------------------------------------
// HEIC / HEIF / AVIF (item-based ISOBMFF)
// ---------------------------------------------------------------------------

// The item structure (iinf, iloc, iref, ipco...) is small, a big grid's included; the
// metadata items themselves are kilobytes. Anything past these is not a file we understand.
const HEIF_META_READ_CAP = 16 * 1024 * 1024;
const HEIF_ITEM_READ_CAP = 64 * 1024 * 1024;

// "00 00 00 06" (exif_tiff_header_offset: the TIFF header sits 6 bytes in) + "Exif\0\0":
// the Exif item layout Apple and libheif write, used for every rebuilt item.
const EXIF_ITEM_PREFIX = [0x00, 0x00, 0x00, 0x06, ...EXIF_HEADER];

type HeifItemInfo = {
  /** item_type ('hvc1', 'av01', 'grid', 'Exif', 'mime'...; "" for a version 0/1 entry). */
  type: string;
  contentType: string;
  contentEncoding: string;
  protectedItem: boolean;
};

type HeifLocation = {
  method: number; // iloc construction_method: 0 file offset, 1 idat offset, 2 item offset
  dataRef: number; // 0 = this file; else a 1-based dref entry
  extents: { offset: number; length: number }[]; // base_offset already added
};

type HeifMeta = {
  handler: string;
  items: Map<number, HeifItemInfo>;
  locations: Map<number, HeifLocation>;
  refs: { type: string; from: number; to: number[] }[];
  idat: ByteRange | null; // the idat payload, in file coordinates
  localRefs: Set<number>; // dref entries that point back at this file (self-contained)
};

/** A NUL-terminated string from [pos, end); the last may run to the box's end. */
function readCString(
  b: Uint8Array,
  pos: number,
  end: number,
): { value: string; next: number } {
  let i = pos;
  while (i < end && b[i] !== 0) i++;
  let value = "";
  for (let j = pos; j < i; j++) value += String.fromCharCode(b[j]);
  return { value, next: i < end ? i + 1 : end };
}

function parseInfe(
  b: Uint8Array,
  body: number,
  end: number,
): { id: number; info: HeifItemInfo } | null {
  if (body + 4 > end) return null;
  const version = b[body];
  let pos = body + 4;
  let id: number;
  let protection: number;
  let type = "";
  let contentType = "";
  let contentEncoding = "";
  if (version <= 1) {
    // The pre-HEIF entry: no item_type, a content_type for every item.
    if (pos + 4 > end) return null;
    id = u16be(b, pos);
    protection = u16be(b, pos + 2);
    pos = readCString(b, pos + 4, end).next; // item_name
    const ct = readCString(b, pos, end);
    contentType = ct.value;
    contentEncoding = readCString(b, ct.next, end).value;
  } else if (version <= 3) {
    const idLen = version === 2 ? 2 : 4;
    if (pos + idLen + 6 > end) return null;
    id = version === 2 ? u16be(b, pos) : u32be(b, pos);
    pos += idLen;
    protection = u16be(b, pos);
    type = ascii4(b, pos + 2);
    pos = readCString(b, pos + 6, end).next; // item_name
    if (type === "mime") {
      const ct = readCString(b, pos, end);
      contentType = ct.value;
      contentEncoding = readCString(b, ct.next, end).value;
    }
  } else {
    return null;
  }
  return {
    id,
    info: {
      type,
      contentType,
      contentEncoding,
      protectedItem: protection !== 0,
    },
  };
}

function parseIinf(
  b: Uint8Array,
  body: number,
  end: number,
  items: Map<number, HeifItemInfo>,
): boolean {
  if (body + 4 > end) return false;
  const countLen = b[body] === 0 ? 2 : 4; // entry_count; every infe present is read anyway
  let pos = body + 4 + countLen;
  if (pos > end) return false;
  while (pos < end) {
    const h = parseBoxHeader(b, pos, end);
    if (!h) return false;
    if (h.type === "infe") {
      const entry = parseInfe(b, pos + h.headerLen, pos + h.boxSize);
      if (!entry || items.has(entry.id)) return false;
      items.set(entry.id, entry.info);
    }
    pos += h.boxSize;
  }
  return true;
}

function parseIloc(
  b: Uint8Array,
  body: number,
  end: number,
  out: Map<number, HeifLocation>,
): boolean {
  if (body + 6 > end) return false;
  const version = b[body];
  if (version > 2) return false;
  let pos = body + 4;
  const offsetSize = b[pos] >> 4;
  const lengthSize = b[pos] & 0x0f;
  const baseSize = b[pos + 1] >> 4;
  const indexSize = version === 0 ? 0 : b[pos + 1] & 0x0f;
  pos += 2;
  for (const n of [offsetSize, lengthSize, baseSize, indexSize]) {
    if (n !== 0 && n !== 4 && n !== 8) return false;
  }
  // The next n-byte unsigned big-endian field (n of 0, 2, 4 or 8; 0 reads as 0); null
  // past the box's end or past 2^53.
  const field = (n: number): number | null => {
    if (pos + n > end) return null;
    const v =
      n === 0
        ? 0
        : n === 2
          ? u16be(b, pos)
          : n === 4
            ? u32be(b, pos)
            : u64be(b, pos);
    pos += n;
    return v;
  };
  const idSize = version < 2 ? 2 : 4;
  const count = field(idSize);
  if (count === null) return false;
  for (let i = 0; i < count; i++) {
    // Read in field order: item_ID, [construction_method], data_reference_index,
    // base_offset, extent_count.
    const id = field(idSize);
    const methodField = version === 0 ? 0 : field(2);
    const dataRef = field(2);
    const base = field(baseSize);
    const extentCount = field(2);
    if (
      id === null ||
      methodField === null ||
      dataRef === null ||
      base === null ||
      extentCount === null
    ) {
      return false;
    }
    const method = methodField & 0x0f;
    const extents: HeifLocation["extents"] = [];
    for (let j = 0; j < extentCount; j++) {
      if (indexSize > 0 && field(indexSize) === null) return false;
      const offset = field(offsetSize);
      const length = field(lengthSize);
      if (offset === null || length === null) return false;
      if (!Number.isSafeInteger(base + offset)) return false;
      extents.push({ offset: base + offset, length });
    }
    if (out.has(id)) return false; // one location per item
    out.set(id, { method, dataRef, extents });
  }
  return true;
}

function parseIref(
  b: Uint8Array,
  body: number,
  end: number,
  out: HeifMeta["refs"],
): boolean {
  if (body + 4 > end) return false;
  const idLen = b[body] === 0 ? 2 : 4;
  const readId = (o: number) => (idLen === 2 ? u16be(b, o) : u32be(b, o));
  let pos = body + 4;
  while (pos < end) {
    const h = parseBoxHeader(b, pos, end);
    if (!h) return false;
    const boxEnd = pos + h.boxSize;
    let p = pos + h.headerLen;
    if (p + idLen + 2 > boxEnd) return false;
    const from = readId(p);
    const n = u16be(b, p + idLen);
    p += idLen + 2;
    if (p + n * idLen > boxEnd) return false;
    const to: number[] = [];
    for (let i = 0; i < n; i++) to.push(readId(p + i * idLen));
    out.push({ type: h.type, from, to });
    pos = boxEnd;
  }
  return true;
}

/** The dref entries (1-based) flagged self-contained: data in this very file. */
function parseDinf(
  b: Uint8Array,
  body: number,
  end: number,
  out: Set<number>,
): boolean {
  let pos = body;
  while (pos < end) {
    const h = parseBoxHeader(b, pos, end);
    if (!h) return false;
    if (h.type === "dref") {
      const boxEnd = pos + h.boxSize;
      let p = pos + h.headerLen + 8; // FullBox + entry_count
      if (p > boxEnd) return false;
      let index = 0;
      while (p < boxEnd) {
        const e = parseBoxHeader(b, p, boxEnd);
        if (!e) return false;
        index++;
        const flags = p + e.headerLen + 3;
        if (
          (e.type === "url " || e.type === "urn ") &&
          e.boxSize >= e.headerLen + 4 &&
          (b[flags] & 1) === 1
        ) {
          out.add(index);
        }
        p += e.boxSize;
      }
    }
    pos += h.boxSize;
  }
  return true;
}

/** The item structure of a file-level `meta` (a FullBox) read whole into memory. */
function parseHeifMeta(
  meta: Uint8Array,
  metaPos: number,
  headerLen: number,
): HeifMeta | null {
  const out: HeifMeta = {
    handler: "",
    items: new Map(),
    locations: new Map(),
    refs: [],
    idat: null,
    localRefs: new Set(),
  };
  const once = new Set([
    "hdlr",
    "pitm",
    "iinf",
    "iloc",
    "iref",
    "idat",
    "dinf",
  ]);
  const seen = new Set<string>();
  let pos = headerLen + 4; // version + flags precede the children
  while (pos < meta.length) {
    const h = parseBoxHeader(meta, pos, meta.length);
    if (!h) return null;
    if (once.has(h.type)) {
      if (seen.has(h.type)) return null; // two of a box the format allows once
      seen.add(h.type);
    }
    const body = pos + h.headerLen;
    const end = pos + h.boxSize;
    let ok = true;
    if (h.type === "hdlr") {
      if (body + 12 > end) return null;
      out.handler = ascii4(meta, body + 8); // after version/flags + pre_defined
    } else if (h.type === "iinf") ok = parseIinf(meta, body, end, out.items);
    else if (h.type === "iloc") ok = parseIloc(meta, body, end, out.locations);
    else if (h.type === "iref") ok = parseIref(meta, body, end, out.refs);
    else if (h.type === "dinf") ok = parseDinf(meta, body, end, out.localRefs);
    else if (h.type === "idat") {
      out.idat = { start: metaPos + body, end: metaPos + end };
    }
    if (!ok) return null;
    pos = end;
  }
  if (!seen.has("iinf") || !seen.has("iloc")) return null;
  return out;
}

function isXmpItem(info: HeifItemInfo): boolean {
  return (
    (info.type === "mime" || info.type === "") &&
    info.contentType.trim().toLowerCase() === "application/rdf+xml"
  );
}

/** The TIFF inside an Exif item: after the 4-byte exif_tiff_header_offset, by that offset
 *  (writers disagree on it, so the usual "Exif\0\0" layout is also tried). */
function exifItemTiff(data: Uint8Array): Uint8Array | null {
  if (data.length < 4) return null;
  for (const at of [4 + u32be(data, 0), 4 + EXIF_HEADER.length, 4]) {
    if (isTiffHeader(data, at)) return data.subarray(at);
  }
  return null;
}

function intersects(a: ByteRange, b: ByteRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Where an item's bytes lie in the file, or null when they do not lie in it plainly:
 * placed by item reference (construction method 2, or a reserved method) or in another
 * file.
 */
function itemRanges(
  loc: HeifLocation,
  meta: HeifMeta,
  size: number,
): ByteRange[] | null {
  if (loc.method !== 0 && loc.method !== 1) return null;
  if (loc.dataRef !== 0 && !meta.localRefs.has(loc.dataRef)) return null;
  const source =
    loc.method === 0
      ? { start: 0, end: size }
      : (meta.idat ?? { start: 0, end: 0 });
  const out: ByteRange[] = [];
  for (const e of loc.extents) {
    const start = source.start + e.offset;
    // A zero length means "to the end of the source"; as a range that is the honest worst case.
    const end = e.length === 0 ? source.end : start + e.length;
    out.push({ start, end });
  }
  return out;
}

/**
 * Plan the in-place rewrite of every metadata item: each Exif item, and each XMP item
 * unless it describes only auxiliary images (and carries no GPS). Null = not provably
 * safe, so the whole file fails open: a metadata item placed by reference, in another
 * file, protected, of unbounded length, outside the mdat/idat payloads, or sharing a byte
 * with any item we keep (blanking it would corrupt the picture).
 */
function* planHeifItems(
  meta: HeifMeta,
  mdats: ByteRange[],
  size: number,
): Walk<{
  patches: IsobmffPatch[];
  gps: boolean;
  captured: CaptureStamp | null;
} | null> {
  const auxiliary = new Set(
    meta.refs.filter((r) => r.type === "auxl").map((r) => r.from),
  );
  const describes = (id: number) =>
    meta.refs
      .filter((r) => r.type === "cdsc" && r.from === id)
      .flatMap((r) => r.to);

  let gps = false;
  // The first Exif item's time (iinf's order: the primary's, in every file an encoder wrote); each item keeps its own.
  let captured: CaptureStamp | null = null;
  const rewrites: {
    ranges: ByteRange[];
    data: Uint8Array;
    blank: Uint8Array;
  }[] = [];
  const rewritten = new Set<number>();
  for (const [id, info] of meta.items) {
    const isExif = info.type === "Exif";
    if (!isExif && !isXmpItem(info)) continue;
    const loc = meta.locations.get(id);
    if (!loc || loc.extents.length === 0) continue; // no bytes, nothing to leak
    if (info.protectedItem) return null;
    const ranges = itemRanges(loc, meta, size);
    if (!ranges) return null;
    let total = 0;
    for (const [i, r] of ranges.entries()) {
      if (loc.extents[i].length === 0) return null;
      const within =
        loc.method === 0
          ? mdats.some((m) => r.start >= m.start && r.end <= m.end)
          : meta.idat !== null &&
            r.start >= meta.idat.start &&
            r.end <= meta.idat.end;
      if (!within) return null;
      total += r.end - r.start;
    }
    if (total > HEIF_ITEM_READ_CAP) return null;
    const pieces: Uint8Array[] = [];
    for (const r of ranges) {
      const piece = yield* readExactly(r.start, r.end);
      if (!piece) return null;
      pieces.push(piece);
    }
    const data = concatParts(pieces);
    let blank: Uint8Array;
    if (isExif) {
      const tiff = exifItemTiff(data);
      if (tiff && tiffHasGps(tiff)) gps = true;
      const time = tiff ? quietly(() => tiffCaptureTime(tiff)) : null;
      captured ??= wallStamp(time);
      blank = blankExifBlock(
        data.length,
        EXIF_ITEM_PREFIX,
        tiff ? tiffOrientation(tiff) : null,
        time?.wall ?? null,
      );
    } else {
      const xmpGps = XMP_GPS_NEEDLES.some((n) => findBytes(data, n));
      if (xmpGps) gps = true;
      const targets = describes(id);
      // A gain map's or a depth map's XMP is how it renders, not who took it: keep it.
      if (
        targets.length > 0 &&
        targets.every((t) => auxiliary.has(t)) &&
        !xmpGps
      ) {
        continue;
      }
      blank = new Uint8Array(data.length);
      // An encoded (compressed) item cannot hold plain text: zeroed, its reader fails,
      // the picture does not.
      if (info.contentEncoding.trim() === "") {
        blank.fill(0x20);
        if (EMPTY_XMP.length <= blank.length) blank.set(EMPTY_XMP, 0);
      }
    }
    rewrites.push({ ranges, data, blank });
    rewritten.add(id);
  }

  // Not one rewritten byte may belong to anything else: an image, a thumbnail, a grid's
  // tiles, a kept XMP, or another rewrite.
  const kept: ByteRange[] = [];
  for (const [id, loc] of meta.locations) {
    if (rewritten.has(id)) continue;
    kept.push(...(itemRanges(loc, meta, size) ?? []));
  }
  const all = rewrites.flatMap((w) => w.ranges);
  for (const [i, r] of all.entries()) {
    if (kept.some((k) => intersects(r, k))) return null;
    if (all.some((o, j) => j !== i && intersects(r, o))) return null;
  }

  const patches: IsobmffPatch[] = [];
  for (const w of rewrites) {
    let at = 0;
    for (const r of w.ranges) {
      const len = r.end - r.start;
      const blank = w.blank.subarray(at, at + len);
      if (!bytesEqual(blank, w.data.subarray(at, at + len))) {
        patches.push({ offset: r.start, bytes: blank.slice() });
      }
      at += len;
    }
  }
  return { patches, gps, captured };
}

/**
 * Plan the in-place patches that scrub an HEIC/HEIF/AVIF. The file must open with ftyp and
 * carry one file-level `meta` whose handler is 'pict' (an image's item structure); an
 * image SEQUENCE's moov is scrubbed as a video's, and a top-level udta/xml/XMP uuid is
 * blanked whole. ok:false = the caller MUST fail open.
 */
function* heifWalk(size: number): Walk<WalkPlan> {
  const notOk: WalkPlan = { ok: false, patches: [], gps: false };
  const patches: IsobmffPatch[] = [];
  const mdats: ByteRange[] = [];
  let meta: { bytes: Uint8Array; pos: number; headerLen: number } | null = null;
  let pos = 0;
  while (pos < size) {
    const h = yield* readTopBoxHeader(pos, size);
    if (!h || (pos === 0 && h.type !== "ftyp")) return notOk;
    if (h.type === "meta") {
      if (meta || h.boxSize > HEIF_META_READ_CAP) return notOk;
      const bytes = yield* readExactly(pos, pos + h.boxSize);
      if (!bytes) return notOk;
      meta = { bytes, pos, headerLen: h.headerLen };
    } else if (h.type === "mdat") {
      mdats.push({ start: pos + h.headerLen, end: pos + h.boxSize });
    } else if (h.type === "moov") {
      // An image sequence's movie: scrubbed as a video's. Its time is not the picture's (the Exif item is).
      const moov = yield* blankMoov(pos, h);
      if (moov === "malformed") return notOk;
      if (moov.patch) patches.push(moov.patch);
    } else {
      const patch = yield* blankTopLevelMetadata(pos, h, false);
      if (patch === "malformed") return notOk;
      if (patch) patches.push(patch);
    }
    pos += h.boxSize;
  }
  if (!meta) return notOk;
  const parsed = parseHeifMeta(meta.bytes, meta.pos, meta.headerLen);
  if (!parsed || parsed.handler !== "pict") return notOk;
  const items = yield* planHeifItems(parsed, mdats, size);
  if (!items) return notOk;
  return withCapture(
    { ok: true, patches: [...patches, ...items.patches], gps: items.gps },
    items.captured,
  );
}

function isItemBasedImage(mime: string): boolean {
  return (
    mime === "image/heic" || mime === "image/heif" || mime === "image/avif"
  );
}

// ---------------------------------------------------------------------------
// WebM / Matroska (EBML)
// ---------------------------------------------------------------------------

const EBML_ID_HEADER = 0x1a45dfa3;
const EBML_ID_DOCTYPE = 0x4282;
const EBML_ID_VOID = 0xec;
const EBML_ID_CRC32 = 0xbf;
const MKV_ID_SEGMENT = 0x18538067;
const MKV_ID_CLUSTER = 0x1f43b675;
const MKV_ID_TAGS = 0x1254c367;
const MKV_ID_TAG = 0x7373;
const MKV_ID_SIMPLETAG = 0x67c8;
const MKV_ID_TAGNAME = 0x45a3;
const MKV_ID_INFO = 0x1549a966;
const MKV_ID_DATEUTC = 0x4461;
// DateUTC counts nanoseconds from 2001-01-01T00:00:00Z, 978,307,200 seconds after the epoch.
const MKV_EPOCH_MS = 978_307_200_000;
// Info is a title, the muxer's names and a few numbers; anything past this is not one we read.
const MKV_INFO_READ_CAP = 64 * 1024;

/**
 * An Info payload's `DateUTC` (a signed 8-byte count of nanoseconds since 2001) as epoch ms; null when there is none,
 * it is zero (a muxer's unset clock), or it cannot be read. ffmpeg writes it from a creation time; a browser's
 * MediaRecorder writes none.
 */
function infoDateUtc(info: Uint8Array): number | null {
  let p = 0;
  while (p < info.length) {
    const el = parseEbmlHeader(info, p);
    if (!el || el.dataSize === null) return null;
    const body = p + el.headerLen;
    const end = body + el.dataSize;
    if (end > info.length) return null;
    if (el.id === MKV_ID_DATEUTC) {
      if (el.dataSize !== 8) return null;
      // Two halves, the high one signed: a double holds the count to about a hundred nanoseconds, past what a
      // millisecond needs (no BigInt below ES2020).
      const high = u32be(info, body) | 0;
      const nanoseconds = high * 0x100000000 + u32be(info, body + 4);
      if (nanoseconds === 0) return null;
      const ms = MKV_EPOCH_MS + Math.round(nanoseconds / 1e6);
      return Number.isSafeInteger(ms) ? ms : null;
    }
    p = end;
  }
  return null;
}

// What may sit inside a Cluster: Timestamp, SilentTracks, Position, PrevSize, SimpleBlock,
// BlockGroup, EncryptedBlock, and the two global elements.
const MKV_CLUSTER_CHILDREN = new Set([
  0xe7,
  0x5854,
  0xa7,
  0xab,
  0xa3,
  0xa0,
  0xaf,
  EBML_ID_VOID,
  EBML_ID_CRC32,
]);
// What may end an unknown-sized Cluster: a sibling at the Segment's level (SeekHead, Info,
// Tracks, Cues, Cluster, Tags, Chapters, Attachments) or a new document.
const MKV_SEGMENT_LEVEL = new Set([
  0x114d9b74,
  0x1549a966,
  0x1654ae6b,
  0x1c53bb6b,
  MKV_ID_CLUSTER,
  MKV_ID_TAGS,
  0x1043a770,
  0x1941a469,
  EBML_ID_HEADER,
  MKV_ID_SEGMENT,
]);

// A tag name that says where (ffmpeg writes LOCATION, and carries Apple's
// com.apple.quicktime.location.ISO6709 over from a MOV under its own name).
const LOCATION_TAG_NAME = /LOCATION|ISO6709|GPS|COORDINATES/;

/** An element header: an ID of 1-4 bytes (its marker kept, as the spec writes IDs) and a
 *  size of 1-8 bytes; dataSize null = "unknown" (every value bit set). Null = malformed. */
type EbmlHeader = { id: number; headerLen: number; dataSize: number | null };

function parseEbmlHeader(b: Uint8Array, o: number): EbmlHeader | null {
  if (o >= b.length) return null;
  const first = b[o];
  const idLen =
    first >= 0x80
      ? 1
      : first >= 0x40
        ? 2
        : first >= 0x20
          ? 3
          : first >= 0x10
            ? 4
            : 0;
  if (idLen === 0 || o + idLen >= b.length) return null;
  let id = 0;
  for (let i = 0; i < idLen; i++) id = id * 256 + b[o + i];
  const s = o + idLen;
  const lead = b[s];
  if (lead === 0) return null; // a size longer than 8 bytes
  let sizeLen = 1;
  while (!(lead & (0x80 >> (sizeLen - 1)))) sizeLen++;
  if (s + sizeLen > b.length) return null;
  let value = lead & (0xff >> sizeLen);
  let unknown = value === 0xff >> sizeLen;
  for (let i = 1; i < sizeLen; i++) {
    value = value * 256 + b[s + i];
    if (b[s + i] !== 0xff) unknown = false;
  }
  if (unknown) return { id, headerLen: idLen + sizeLen, dataSize: null };
  if (!Number.isSafeInteger(value)) return null;
  return { id, headerLen: idLen + sizeLen, dataSize: value };
}

/** An element header read through the walk (12 bytes at most: a 4-byte ID + an 8-byte size). */
function* readEbmlAt(pos: number, limit: number): Walk<EbmlHeader | null> {
  const head: Uint8Array = yield { start: pos, end: Math.min(pos + 12, limit) };
  return parseEbmlHeader(head, 0);
}

/**
 * A Void element of EXACTLY `total` bytes, zero-filled: the Void ID (0xEC), then a size
 * whose own length makes the element fill the span, so nothing after it moves. Null when
 * `total` cannot hold one (under 2 bytes; a Tags element's ID alone is 4).
 */
function voidElement(total: number): Uint8Array | null {
  for (let sizeLen = 1; sizeLen <= 8; sizeLen++) {
    const dataSize = total - 1 - sizeLen;
    if (dataSize < 0) return null;
    if (dataSize > 2 ** (7 * sizeLen) - 2) continue; // all ones would read "unknown"
    const out = new Uint8Array(total);
    out[0] = EBML_ID_VOID;
    let v = dataSize;
    for (let i = sizeLen; i >= 1; i--) {
      out[i] = v % 256;
      v = Math.floor(v / 256);
    }
    out[1] |= 0x80 >> (sizeLen - 1); // the length marker
    return out;
  }
  return null;
}

/** The DocType inside an EBML header's payload ("" when absent or unreadable). */
function ebmlDocType(header: Uint8Array): string {
  let p = 0;
  while (p < header.length) {
    const el = parseEbmlHeader(header, p);
    if (!el || el.dataSize === null) return "";
    const body = p + el.headerLen;
    const end = body + el.dataSize;
    if (end > header.length) return "";
    if (el.id === EBML_ID_DOCTYPE) {
      let s = "";
      for (let i = body; i < end && header[i] !== 0; i++) {
        s += String.fromCharCode(header[i]);
      }
      return s;
    }
    p = end;
  }
  return "";
}

/** Whether a Tags payload names a location (Tag > SimpleTag, nested, > TagName). */
function tagsHaveLocation(tags: Uint8Array): boolean {
  const scan = (start: number, end: number, depth: number): boolean => {
    let p = start;
    while (p < end) {
      const el = parseEbmlHeader(tags, p);
      if (!el || el.dataSize === null) return false;
      const body = p + el.headerLen;
      const elEnd = body + el.dataSize;
      if (elEnd > end) return false;
      if (el.id === MKV_ID_TAGNAME) {
        let name = "";
        for (let i = body; i < elEnd; i++) name += String.fromCharCode(tags[i]);
        if (LOCATION_TAG_NAME.test(name.toUpperCase())) return true;
      } else if (
        (el.id === MKV_ID_TAG || el.id === MKV_ID_SIMPLETAG) &&
        depth < 16 &&
        scan(body, elEnd, depth + 1)
      ) {
        return true;
      }
      p = elEnd;
    }
    return false;
  };
  return scan(0, tags.length, 0);
}

/**
 * Skip an unknown-sized Cluster (MediaRecorder and other live writers emit them): walk its
 * children until an element that cannot be its child begins (RFC 8794 §6.2), which must be
 * a sibling at the Segment's level or a new document. Returns where it ends; null = an
 * element we cannot place, or a block running past the end (a truncated file).
 */
function* skipUnknownCluster(
  start: number,
  limit: number,
): Walk<number | null> {
  let p = start;
  while (p < limit) {
    const el = yield* readEbmlAt(p, limit);
    if (!el) return null;
    if (!MKV_CLUSTER_CHILDREN.has(el.id)) {
      return MKV_SEGMENT_LEVEL.has(el.id) ? p : null;
    }
    if (el.dataSize === null) return null;
    p += el.headerLen + el.dataSize;
    if (p > limit) return null;
  }
  return p;
}

/**
 * Walk a Segment's children in [start, limit), turning each Tags element into a Void of
 * its exact size. An unknown-sized Segment runs to EOF or to the next document's header.
 * Returns where the Segment ended, whether a Tags element named a location, and Info's
 * `DateUTC` (epoch ms), the one thing Info is read for.
 */
function* walkSegment(
  start: number,
  limit: number,
  unknownSize: boolean,
  patches: IsobmffPatch[],
): Walk<{ end: number; gps: boolean; dateUtc: number | null } | null> {
  let gps = false;
  let dateUtc: number | null = null;
  let p = start;
  while (p < limit) {
    const el = yield* readEbmlAt(p, limit);
    if (!el) return null;
    if (unknownSize && (el.id === EBML_ID_HEADER || el.id === MKV_ID_SEGMENT)) {
      return { end: p, gps, dateUtc }; // the next document begins
    }
    const body = p + el.headerLen;
    if (el.dataSize === null) {
      // Only a Cluster may be live-written with an unknown size.
      if (el.id !== MKV_ID_CLUSTER) return null;
      const end = yield* skipUnknownCluster(body, limit);
      if (end === null) return null;
      p = end;
      continue;
    }
    const end = body + el.dataSize;
    if (end > limit) return null;
    if (el.id === MKV_ID_TAGS) {
      if (end - p > TOP_METADATA_READ_CAP) return null;
      const tags = yield* readExactly(body, end);
      if (!tags) return null;
      if (tagsHaveLocation(tags)) gps = true;
      const blank = voidElement(end - p);
      if (!blank) return null;
      patches.push({ offset: p, bytes: blank });
    } else if (
      el.id === MKV_ID_INFO &&
      dateUtc === null &&
      el.dataSize <= MKV_INFO_READ_CAP
    ) {
      // Read, never rewritten: Info stays byte-identical, its DateUTC with it.
      const info = yield* readExactly(body, end);
      if (!info) return null;
      dateUtc = quietly(() => infoDateUtc(info));
    }
    p = end;
  }
  return { end: limit, gps, dateUtc };
}

/**
 * Plan the in-place patches that scrub a WebM (or any Matroska): an EBML header whose
 * DocType is webm or matroska, then Segments (Void padding and chained documents allowed),
 * each walked to its end. ok:false = the caller MUST fail open.
 */
function* webmWalk(size: number): Walk<WalkPlan> {
  const notOk: WalkPlan = { ok: false, patches: [], gps: false };
  const head = yield* readEbmlAt(0, size);
  if (!head || head.id !== EBML_ID_HEADER || head.dataSize === null)
    return notOk;
  const headerEnd = head.headerLen + head.dataSize;
  if (head.dataSize > 4096 || headerEnd > size) return notOk;
  const header = yield* readExactly(head.headerLen, headerEnd);
  if (!header) return notOk;
  const docType = ebmlDocType(header);
  if (docType !== "webm" && docType !== "matroska") return notOk;

  const patches: IsobmffPatch[] = [];
  let gps = false;
  let dateUtc: number | null = null;
  let sawSegment = false;
  let pos = headerEnd;
  while (pos < size) {
    const el = yield* readEbmlAt(pos, size);
    if (!el) return notOk;
    const body = pos + el.headerLen;
    if (el.id === MKV_ID_SEGMENT) {
      sawSegment = true;
      const limit = el.dataSize === null ? size : body + el.dataSize;
      if (limit > size) return notOk; // truncated
      const seg = yield* walkSegment(
        body,
        limit,
        el.dataSize === null,
        patches,
      );
      if (!seg) return notOk;
      gps = gps || seg.gps;
      dateUtc ??= seg.dateUtc;
      pos = seg.end;
    } else if (el.id === EBML_ID_HEADER || el.id === EBML_ID_VOID) {
      // A chained document's header, or padding between documents.
      if (el.dataSize === null) return notOk;
      pos = body + el.dataSize;
      if (pos > size) return notOk;
    } else {
      return notOk;
    }
  }
  if (!sawSegment) return notOk;
  return withCapture(
    { ok: true, patches, gps },
    dateUtc === null ? null : { kind: "instant", ms: dateUtc },
  );
}

// ---------------------------------------------------------------------------
// Dispatchers
// ---------------------------------------------------------------------------

/**
 * Strip metadata from a full in-memory byte buffer (the Node/backfill entry point; also
 * what unit tests hit). `changed` gates writes: callers replace the object only when true.
 */
export async function stripMetadataBytes(
  bytes: Uint8Array,
  mime: string,
): Promise<StripBytesResult> {
  try {
    switch (mime) {
      case "image/jpeg":
        return stripJpeg(bytes);
      case "image/png":
        return stripPng(bytes);
      case "image/webp":
        return stripWebp(bytes);
      case "image/heic":
      case "image/heif":
      case "image/avif":
        return patchedOrOriginal(
          bytes,
          walkBytes(heifWalk(bytes.length), bytes),
        );
      case "video/mp4":
      case "video/quicktime":
        return patchedOrOriginal(
          bytes,
          walkBytes(isobmffWalk(bytes.length), bytes),
        );
      case "video/webm":
        return patchedOrOriginal(
          bytes,
          walkBytes(webmWalk(bytes.length), bytes),
        );
      default:
        return { data: bytes, stripped: false, changed: false };
    }
  } catch {
    return { data: bytes, stripped: false, changed: false };
  }
}

/**
 * The one-call browser entry point (uploader.ts step 0): strip a picked File before ANY
 * size is read. JPEG/PNG/WebP load fully (they're rebuilt); every other format is patched
 * in place via lazy slices and the output Blob composes original File slices + the patched
 * regions, so a multi-GB video never sits in memory. NEVER throws; on any failure the
 * ORIGINAL File comes back with stripped:false and the upload proceeds untouched (fail
 * open - a corrupted upload is worse than the leak).
 */
export async function stripFileMetadata(file: File): Promise<StripFileResult> {
  // The capture time, once read, is the original's word whatever the strip does after it.
  let captured: CaptureStamp | undefined;
  try {
    const mime = file.type;
    if (
      mime === "image/jpeg" ||
      mime === "image/png" ||
      mime === "image/webp"
    ) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const res = await stripMetadataBytes(bytes, mime);
      captured = res.captured;
      if (!res.stripped)
        return withCapture({ blob: file, stripped: false }, captured);
      if (!res.changed)
        return withCapture({ blob: file, stripped: true }, captured);
      return withCapture(
        {
          blob: new Blob([res.data as BlobPart], { type: mime }),
          stripped: true,
        },
        captured,
      );
    }
    let walk: Walk<{
      ok: boolean;
      patches: IsobmffPatch[];
      captured?: CaptureStamp;
    }>;
    if (isItemBasedImage(mime)) walk = heifWalk(file.size);
    else if (mime === "video/mp4" || mime === "video/quicktime") {
      walk = isobmffWalk(file.size);
    } else if (mime === "video/webm") walk = webmWalk(file.size);
    else return { blob: file, stripped: false };
    const plan = await walkReader(walk, readAhead(fileReader(file)));
    captured = plan.captured;
    if (!plan.ok) return withCapture({ blob: file, stripped: false }, captured);
    if (plan.patches.length === 0) {
      return withCapture({ blob: file, stripped: true }, captured);
    }
    return withCapture(
      { blob: composePatched(file, plan.patches, mime), stripped: true },
      captured,
    );
  } catch {
    return withCapture({ blob: file, stripped: false }, captured);
  }
}

// ---------------------------------------------------------------------------
// GPS detection (reporting only - the backfill's dry-run summary). It reads each format
// the way its strip does; the strip itself never depends on this.
// ---------------------------------------------------------------------------

const MP4_GPS_NEEDLES: readonly (readonly number[])[] = [
  [0xa9, 0x78, 0x79, 0x7a], // (c)xyz - Apple/3gpp GPS string in udta
  asciiBytes("loci"), // 3gpp location box
  asciiBytes("com.apple.quicktime.location"), // mdta key form
];

/** GPS presence in the first Exif APP1 of a JPEG's pre-SOS segments. */
function jpegExifHasGps(b: Uint8Array): boolean {
  for (const seg of iterateJpegSegments(b)) {
    if (seg.marker !== 0xe1) continue;
    const payload = b.subarray(seg.start + 4, seg.end);
    if (!hasPrefix(payload, EXIF_HEADER)) continue;
    return tiffHasGps(payload.subarray(6));
  }
  return false;
}

/** Position of the SOS marker (= where the kept tail begins), or -1. */
function jpegSosPos(b: Uint8Array): number {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return -1;
  let end = 2;
  for (const seg of iterateJpegSegments(b)) end = seg.end;
  if (end + 2 <= b.length && b[end] === 0xff && b[end + 1] === 0xda) return end;
  return -1;
}

/**
 * GPS in a JPEG's trailing bytes, read where the strip scrubs them: a motion-photo MP4's
 * location boxes, and the Exif (or XMP) of every embedded JPEG before it.
 */
function jpegTrailerHasGps(b: Uint8Array): boolean {
  const sos = jpegSosPos(b);
  if (sos < 0) return false;
  const eoi = findEoi(b, sos);
  if (eoi < 0) return false;
  const trailer = b.subarray(eoi + 2);
  if (trailer.length < 4) return false;
  if (MP4_GPS_NEEDLES.some((n) => findBytes(trailer, n))) return true;
  const mp4 = findTrailerIsobmff(b, eoi);
  return embeddedJpegMetadata(b, eoi + 2, mp4?.start ?? b.length).some(
    (seg) => {
      const payload = b.subarray(seg.start, seg.end);
      if (seg.kind === "exif")
        return tiffHasGps(payload.subarray(EXIF_HEADER.length));
      return (
        seg.kind === "xmp" && XMP_GPS_NEEDLES.some((n) => findBytes(payload, n))
      );
    },
  );
}

/** Does this file carry GPS metadata? (Best-effort; false on anything unparseable.) */
export function hasGpsMetadata(bytes: Uint8Array, mime: string): boolean {
  try {
    if (mime === "image/jpeg") {
      return jpegExifHasGps(bytes) || jpegTrailerHasGps(bytes);
    }
    if (mime === "image/png") {
      // eXIf chunk data is a raw TIFF (no "Exif\0\0" prefix).
      let pos = 8;
      if (!hasPrefix(bytes, PNG_SIGNATURE)) return false;
      while (pos + 8 <= bytes.length) {
        const dataLen = u32be(bytes, pos);
        const type = ascii4(bytes, pos + 4);
        const end = pos + 8 + dataLen + 4;
        if (end > bytes.length) return false;
        if (type === "eXIf") {
          return tiffHasGps(bytes.subarray(pos + 8, pos + 8 + dataLen));
        }
        if (type === "IEND") return false;
        pos = end;
      }
      return false;
    }
    if (mime === "image/webp") {
      if (bytes.length < 12 || ascii4(bytes, 0) !== "RIFF") return false;
      let pos = 12;
      while (pos + 8 <= bytes.length) {
        const cc = ascii4(bytes, pos);
        const chunkSize = u32le(bytes, pos + 4);
        const end = pos + 8 + chunkSize;
        if (end > bytes.length) return false;
        if (cc === "EXIF") {
          let tiff = bytes.subarray(pos + 8, end);
          // Some writers include the JPEG-style "Exif\0\0" prefix inside the chunk.
          if (hasPrefix(tiff, EXIF_HEADER)) tiff = tiff.subarray(6);
          return tiffHasGps(tiff);
        }
        pos = end + (chunkSize & 1);
      }
      return false;
    }
    if (isItemBasedImage(mime)) {
      return walkBytes(heifWalk(bytes.length), bytes).gps;
    }
    if (mime === "video/webm") {
      return walkBytes(webmWalk(bytes.length), bytes).gps;
    }
    if (mime === "video/mp4" || mime === "video/quicktime") {
      return MP4_GPS_NEEDLES.some((n) => findBytes(bytes, n));
    }
    return false;
  } catch {
    return false;
  }
}
