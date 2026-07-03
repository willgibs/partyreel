/**
 * Lossless, dependency-free metadata stripping for uploads (the EXIF/GPS privacy fix).
 *
 * Guests' phone photos/videos carry GPS + device EXIF, and ORIGINALS are stored + served
 * byte-for-byte (lightbox, per-item Save, zip export). This module excises identifying
 * metadata at the BYTE level, never re-encoding pixels (quality is sacred; the original is
 * the keepsake). It is pure + runtime-agnostic on purpose: the browser runs it at the
 * upload seam (uploader.ts step 0) and Node runs the same code in
 * scripts/backfill-strip-exif.mjs (never fork the logic).
 *
 * Per-format policy (see each function for the WHY of every keep/drop):
 *   JPEG  - drop APP1 (Exif/XMP), APP13 (IPTC/Photoshop), COM, vendor APPn; keep APP0
 *           (JFIF), APP2 (ICC color profile / MPF), APP14 (Adobe color transform, load-
 *           bearing for decode). Orientation is LOAD-BEARING: a minimal one-tag Exif is
 *           rebuilt so sideways photos keep rendering upright everywhere.
 *   PNG   - drop eXIf + tEXt/zTXt/iTXt (XMP lives in iTXt); keep IHDR/PLTE/IDAT/IEND and
 *           the color chunks (gAMA/iCCP/sRGB).
 *   WebP  - drop EXIF + "XMP " RIFF chunks, clear the matching VP8X flag bits, keep ICCP;
 *           the RIFF size is recomputed and the even-byte padding rule honored.
 *   MP4/MOV - NEVER restructures (moving a byte breaks every stco/co64 chunk-offset
 *           table): metadata boxes (udta incl. Apple ©xyz location, moov-level meta/keys/
 *           ilst, xml, the XMP uuid) are blanked IN PLACE by renaming the box type to
 *           'free' AND zeroing the payload, so no offset ever moves. Big files are
 *           handled via a random-access reader + lazy Blob composition (the whole video
 *           is never pulled into memory in the browser).
 *
 * FAIL-OPEN CONTRACT: unknown/unparseable/truncated input returns the ORIGINAL bytes with
 * stripped:false. A corrupted upload is worse than the leak, so the caller uploads the
 * original untouched rather than blocking the guest. Consequence (conscious trade-off):
 * exotic containers keep their metadata - notably HEIC/HEIF/AVIF (item-based ISOBMFF where
 * Exif is an iloc-referenced item; blanking meta there would DESTROY the image) and WebM
 * (EBML). That leak window is documented in docs/systems/uploads-and-r2.md.
 */

export type StripBytesResult = {
  /** The sanitized bytes (=== the input when nothing needed to change or on fail-open). */
  data: Uint8Array;
  /** true = the container parsed cleanly and `data` is the sanitized output. */
  stripped: boolean;
  /** true = `data` differs byte-for-byte from the input (callers PUT/replace only then). */
  changed: boolean;
};

export type StripFileResult = {
  /** The file to upload: a new Blob when bytes changed, else the ORIGINAL File object. */
  blob: Blob;
  stripped: boolean;
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
  if (b.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) if (b[i] !== prefix[i]) return false;
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
// TIFF (the structure inside Exif) - read-only parsing for orientation + GPS
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

/** The Exif Orientation (1-8) of a JPEG, or null. Exported for tests + diagnostics. */
export function readJpegOrientation(bytes: Uint8Array): number | null {
  for (const seg of iterateJpegSegments(bytes)) {
    if (seg.marker !== 0xe1) continue;
    const payload = bytes.subarray(seg.start + 4, seg.end);
    if (!hasPrefix(payload, EXIF_HEADER)) continue;
    const found = findIfd0Tag(payload.subarray(6), TAG_ORIENTATION);
    const v = found?.shortValue ?? null;
    return v !== null && v >= 1 && v <= 8 ? v : null;
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
 *    index while keeping the trailing bytes would just dangle them).
 *  - APP14 (Adobe): the color-transform hint - decoders NEED it to pick YCbCr vs YCCK;
 *    dropping it visibly corrupts Adobe-saved JPEGs. It carries no identity.
 * Dropped by NOT being here: APP1 (Exif incl. GPS + maker notes + thumbnail, and XMP),
 * APP13 (IPTC/Photoshop, can hold author/location), COM (free text, often software
 * fingerprints), and vendor APP3-APP12/APP15 blobs.
 */
const JPEG_KEEP_APP = new Set([0xe0, 0xe2, 0xee]);

/**
 * Build the minimal replacement APP1 Exif: one IFD0 with ONLY the Orientation tag.
 * Deterministic little-endian TIFF, no sub-IFDs, no GPS, no maker notes, no thumbnail.
 * 36 bytes total: FFE1 + len(0x0022) + "Exif\0\0" + II TIFF header + 1 entry + terminator.
 */
function minimalOrientationExif(orientation: number): Uint8Array {
  // prettier-ignore
  return new Uint8Array([
    0xff, 0xe1, 0x00, 0x22, // APP1, length 34 (covers the length bytes themselves)
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // "II", 42, IFD0 at offset 8
    0x01, 0x00, // 1 entry
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, // tag 0x0112, SHORT, count 1
    orientation & 0xff, 0x00, 0x00, 0x00, // value (SHORT + 2 pad bytes)
    0x00, 0x00, 0x00, 0x00, // no next IFD
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
  let sawExif = false;
  let exifInsertIndex = -1;

  for (;;) {
    if (pos + 2 > bytes.length) return failOpen; // ran out before SOS
    if (bytes[pos] !== 0xff) return failOpen;
    const marker = bytes[pos + 1];
    if (marker === 0xda || marker === 0xd9) {
      // SOS (or a stray EOI): everything from here - entropy-coded scan data through EOI,
      // plus any trailing bytes - is kept VERBATIM. We never touch pixels.
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
        // Remember where the Exif sat so the rebuilt orientation-only segment lands in
        // the same position (Exif belongs before other APPn per spec convention).
        exifInsertIndex = parts.length;
        const found = findIfd0Tag(payload.subarray(6), TAG_ORIENTATION);
        const v = found?.shortValue ?? null;
        orientation = v !== null && v >= 1 && v <= 8 ? v : null;
      }
    }

    if (drop) removedAny = true;
    else parts.push(bytes.subarray(pos, end));
    pos = end;
  }

  // Rebuild orientation ONLY when it does something (a value of 1 = "upright" = the
  // decoder default, so emitting no Exif at all is byte-cheaper and equally correct).
  if (orientation !== null && orientation !== 1 && exifInsertIndex >= 0) {
    parts.splice(exifInsertIndex, 0, minimalOrientationExif(orientation));
  }

  if (!removedAny) return { data: bytes, stripped: true, changed: false };
  const data = concatParts(parts);
  // memcmp (not just removedAny) so a re-run over an already-stripped file - which drops
  // our minimal Exif and re-inserts an identical one - correctly reports changed:false.
  return { data, stripped: true, changed: !bytesEqual(bytes, data) };
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

export type IsobmffPatch = { offset: number; bytes: Uint8Array };

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
// box is always valid. mvhd/tkhd/mdhd creation TIMES are left alone (design call - they
// are low-sensitivity and live inside offset-critical FullBoxes).
const ISOBMFF_BLANK_TYPES = new Set(["udta", "meta", "xml "]);

// moov is "small" (index tables); anything bigger than this is not a file we understand.
const MOOV_READ_CAP = 256 * 1024 * 1024;
// Top-level metadata boxes we blank are tiny in practice; cap the read defensively.
const TOP_METADATA_READ_CAP = 64 * 1024 * 1024;

// HEIC/HEIF/AVIF are ISOBMFF too, but item-based: meta holds iinf/iloc/pitm and blanking
// it DESTROYS the image. The MIME dispatch already excludes them, but a mislabeled file
// (image bytes sent as video/mp4) must also fail open - so check the ftyp major brand.
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

/**
 * Plan the in-place patches that scrub an MP4/MOV. Works over any ByteReader; the file's
 * length NEVER changes (rename+zero only), so `patches` splice back at their offsets.
 * ok:false = we did not fully understand the file -> the caller MUST fail open.
 */
export async function planIsobmffPatches(
  reader: ByteReader,
): Promise<{ ok: boolean; patches: IsobmffPatch[] }> {
  const notOk = { ok: false, patches: [] as IsobmffPatch[] };
  const { size } = reader;
  const patches: IsobmffPatch[] = [];
  let pos = 0;
  let sawMoov = false;
  while (pos < size) {
    const headerBytes = await reader.read(pos, Math.min(pos + 16, size));
    // parseBoxHeader wants absolute coords; emulate by parsing the local 16-byte window
    // with `limit` = whatever the box may span (validated against `size` below).
    if (headerBytes.length < 8 || !isPlausibleBoxType(headerBytes, 4))
      return notOk;
    const size32 = u32be(headerBytes, 0);
    const type = ascii4(headerBytes, 4);
    let boxSize: number;
    let headerLen = 8;
    if (size32 === 0) {
      boxSize = size - pos;
    } else if (size32 === 1) {
      if (headerBytes.length < 16) return notOk;
      const large = u64be(headerBytes, 8);
      if (large === null) return notOk;
      boxSize = large;
      headerLen = 16;
    } else {
      boxSize = size32;
    }
    if (boxSize < headerLen || pos + boxSize > size) return notOk;

    if (type === "ftyp") {
      // Item-based brands (HEIC/AVIF) masquerading under a video MIME: fail open, see above.
      if (boxSize >= headerLen + 4) {
        const brandBytes = await reader.read(
          pos + headerLen,
          pos + headerLen + 4,
        );
        if (ITEM_BASED_BRANDS.has(ascii4(brandBytes, 0))) return notOk;
      }
    } else if (type === "moov") {
      if (boxSize > MOOV_READ_CAP) return notOk;
      sawMoov = true;
      const moov = (await reader.read(pos, pos + boxSize)).slice(); // own copy to patch
      const changed = blankMetadataChildren(moov, headerLen, boxSize, 0);
      if (changed === null) return notOk;
      if (changed) patches.push({ offset: pos, bytes: moov });
    } else if (ISOBMFF_BLANK_TYPES.has(type)) {
      // Top-level udta/meta/xml (some muxers hoist metadata out of moov).
      if (boxSize > TOP_METADATA_READ_CAP) return notOk;
      const box = (await reader.read(pos, pos + boxSize)).slice();
      blankBoxInPlace(box, 0, { type, boxSize, headerLen });
      patches.push({ offset: pos, bytes: box });
    } else if (type === "uuid" && boxSize >= headerLen + 16) {
      const usertype = await reader.read(pos + headerLen, pos + headerLen + 16);
      if (hasPrefix(usertype, XMP_UUID)) {
        if (boxSize > TOP_METADATA_READ_CAP) return notOk;
        const box = (await reader.read(pos, pos + boxSize)).slice();
        blankBoxInPlace(box, 0, { type, boxSize, headerLen });
        patches.push({ offset: pos, bytes: box });
      }
    }
    pos += boxSize;
  }
  // A "video" with no moov is not something we understood - fail open.
  if (!sawMoov) return notOk;
  return { ok: true, patches };
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
  const failOpen: StripBytesResult = {
    data: bytes,
    stripped: false,
    changed: false,
  };
  try {
    switch (mime) {
      case "image/jpeg":
        return stripJpeg(bytes);
      case "image/png":
        return stripPng(bytes);
      case "image/webp":
        return stripWebp(bytes);
      case "video/mp4":
      case "video/quicktime": {
        const plan = await planIsobmffPatches(memoryReader(bytes));
        if (!plan.ok) return failOpen;
        if (plan.patches.length === 0) {
          return { data: bytes, stripped: true, changed: false };
        }
        const out = bytes.slice();
        for (const p of plan.patches) out.set(p.bytes, p.offset);
        // A patch always renames a non-'free' box to 'free', so patches => changed.
        return { data: out, stripped: true, changed: true };
      }
      default:
        // HEIC/HEIF/AVIF (item-based; blanking meta destroys the image) and WebM (EBML)
        // are the conscious fail-open gap - see the module docblock.
        return failOpen;
    }
  } catch {
    return failOpen;
  }
}

/**
 * The one-call browser entry point (uploader.ts step 0): strip a picked File before ANY
 * size is read. Photos load fully (they're small); videos are patched via lazy slices and
 * the output Blob composes original File slices + the patched regions, so a multi-GB
 * video never sits in memory. NEVER throws; on any failure the ORIGINAL File comes back
 * with stripped:false and the upload proceeds untouched (fail open - a corrupted upload
 * is worse than the leak).
 */
export async function stripFileMetadata(file: File): Promise<StripFileResult> {
  try {
    const mime = file.type;
    if (
      mime === "image/jpeg" ||
      mime === "image/png" ||
      mime === "image/webp"
    ) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const res = await stripMetadataBytes(bytes, mime);
      if (!res.stripped) return { blob: file, stripped: false };
      if (!res.changed) return { blob: file, stripped: true };
      return {
        blob: new Blob([res.data as BlobPart], { type: mime }),
        stripped: true,
      };
    }
    if (mime === "video/mp4" || mime === "video/quicktime") {
      const plan = await planIsobmffPatches({
        size: file.size,
        read: async (start, end) =>
          new Uint8Array(await file.slice(start, end).arrayBuffer()),
      });
      if (!plan.ok) return { blob: file, stripped: false };
      if (plan.patches.length === 0) return { blob: file, stripped: true };
      // Compose lazily: untouched regions stay File slices (no copy), only the patched
      // moov/metadata regions are real buffers. Total length is identical by construction.
      const ordered = [...plan.patches].sort((a, b) => a.offset - b.offset);
      const parts: BlobPart[] = [];
      let cursor = 0;
      for (const p of ordered) {
        if (p.offset > cursor) parts.push(file.slice(cursor, p.offset));
        parts.push(p.bytes as BlobPart);
        cursor = p.offset + p.bytes.length;
      }
      if (cursor < file.size) parts.push(file.slice(cursor));
      return { blob: new Blob(parts, { type: mime }), stripped: true };
    }
    return { blob: file, stripped: false };
  } catch {
    return { blob: file, stripped: false };
  }
}

// ---------------------------------------------------------------------------
// GPS detection (reporting only - the backfill's dry-run summary). Heuristic on
// purpose; the strip itself never depends on this.
// ---------------------------------------------------------------------------

const MP4_GPS_NEEDLES: readonly (readonly number[])[] = [
  [0xa9, 0x78, 0x79, 0x7a], // (c)xyz - Apple/3gpp GPS string in udta
  asciiBytes("loci"), // 3gpp location box
  asciiBytes("com.apple.quicktime.location"), // mdta key form
];

/** Does this file carry GPS metadata? (Best-effort; false on anything unparseable.) */
export function hasGpsMetadata(bytes: Uint8Array, mime: string): boolean {
  try {
    if (mime === "image/jpeg") {
      for (const seg of iterateJpegSegments(bytes)) {
        if (seg.marker !== 0xe1) continue;
        const payload = bytes.subarray(seg.start + 4, seg.end);
        if (!hasPrefix(payload, EXIF_HEADER)) continue;
        return findIfd0Tag(payload.subarray(6), TAG_GPS_IFD) !== null;
      }
      return false;
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
          return (
            findIfd0Tag(
              bytes.subarray(pos + 8, pos + 8 + dataLen),
              TAG_GPS_IFD,
            ) !== null
          );
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
          return findIfd0Tag(tiff, TAG_GPS_IFD) !== null;
        }
        pos = end + (chunkSize & 1);
      }
      return false;
    }
    if (mime === "video/mp4" || mime === "video/quicktime") {
      return MP4_GPS_NEEDLES.some((n) => findBytes(bytes, n));
    }
    return false;
  } catch {
    return false;
  }
}
