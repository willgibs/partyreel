/**
 * Tests for the lossless metadata stripper. Fixtures are synthesized IN CODE (no binary
 * files committed): minimal-but-structurally-valid JPEG/PNG/WebP/MP4 byte builds. We
 * never decode pixels, so entropy/IDAT/mdat payloads can be junk as long as the container
 * structure is real. A final describe block runs the stripper over the REAL out-of-repo
 * test media when present (skipped cleanly on machines without it).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  hasGpsMetadata,
  memoryReader,
  planIsobmffPatches,
  readJpegOrientation,
  stripFileMetadata,
  stripMetadataBytes,
} from "./strip-metadata";

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

function bytes(...parts: (number[] | Uint8Array | number)[]): Uint8Array {
  const flat: number[] = [];
  for (const p of parts) {
    if (typeof p === "number") flat.push(p);
    else flat.push(...p);
  }
  return new Uint8Array(flat);
}

function indexOfBytes(haystack: Uint8Array, needle: number[] | string): number {
  const n = typeof needle === "string" ? ascii(needle) : needle;
  outer: for (let i = 0; i <= haystack.length - n.length; i++) {
    for (let j = 0; j < n.length; j++) {
      if (haystack[i + j] !== n[j]) continue outer;
    }
    return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// JPEG fixture builders
// ---------------------------------------------------------------------------

/** FF <marker> <len> <payload> with len covering the 2 length bytes. */
function jpegSeg(marker: number, payload: number[]): number[] {
  const len = payload.length + 2;
  return [0xff, marker, (len >> 8) & 0xff, len & 0xff, ...payload];
}

/** A little-endian Exif APP1 payload: IFD0 with Orientation + a GPS sub-IFD pointer. */
function exifPayloadWithGps(orientation: number): number[] {
  // Layout: TIFF header (8) + IFD0 count (2) + 2 entries (24) + next-IFD (4) = GPS IFD at 38.
  const gpsIfdOffset = 38;
  return [
    ...ascii("Exif"),
    0x00,
    0x00,
    // TIFF: "II", 42, IFD0 at 8
    0x49,
    0x49,
    0x2a,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00,
    0x02,
    0x00, // 2 entries
    // Orientation: tag 0x0112, SHORT, count 1, value
    0x12,
    0x01,
    0x03,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    orientation,
    0x00,
    0x00,
    0x00,
    // GPS IFD pointer: tag 0x8825, LONG, count 1, offset 38
    0x25,
    0x88,
    0x04,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    gpsIfdOffset,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00, // next IFD
    // GPS IFD: 1 entry - GPSLatitudeRef (tag 1, ASCII, count 2, "N\0" inline)
    0x01,
    0x00,
    0x01,
    0x00,
    0x02,
    0x00,
    0x02,
    0x00,
    0x00,
    0x00,
    0x4e,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ];
}

const JFIF_APP0 = jpegSeg(0xe0, [
  ...ascii("JFIF"),
  0,
  1,
  2,
  0,
  0,
  1,
  0,
  1,
  0,
  0,
]);
const ICC_APP2 = jpegSeg(0xe2, [...ascii("ICC_PROFILE"), 0, 1, 1, 9, 9, 9, 9]);
const XMP_APP1 = jpegSeg(0xe1, [
  ...ascii("http://ns.adobe.com/xap/1.0/"),
  0,
  ...ascii("<x:xmpmeta>secret-location</x:xmpmeta>"),
]);
const PHOTOSHOP_APP13 = jpegSeg(0xed, [
  ...ascii("Photoshop 3.0"),
  0,
  8,
  8,
  8,
  8,
]);
const COM_SEG = jpegSeg(0xfe, ascii("shot on Yolophone 12"));
const ADOBE_APP14 = jpegSeg(0xee, [...ascii("Adobe"), 0, 100, 0, 0, 0, 0, 1]);
const DQT = jpegSeg(0xdb, [0, ...Array(64).fill(16)]);
const SOF0 = jpegSeg(
  0xc0,
  [8, 0, 16, 0, 16, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1],
);
const DHT = jpegSeg(0xc4, [0, ...Array(16).fill(0), 1, 5]);
const SOS_AND_SCAN = [
  ...jpegSeg(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0]),
  0x12,
  0x34,
  0x56,
  0x78,
  0x9a, // junk entropy bytes (no 0xFF)
  0xff,
  0xd9, // EOI
];

function buildJpeg(segments: number[][]): Uint8Array {
  return bytes([0xff, 0xd8], ...segments, SOS_AND_SCAN);
}

const FULL_JPEG = buildJpeg([
  JFIF_APP0,
  jpegSeg(0xe1, exifPayloadWithGps(6)),
  XMP_APP1,
  ICC_APP2,
  PHOTOSHOP_APP13,
  COM_SEG,
  ADOBE_APP14,
  DQT,
  SOF0,
  DHT,
]);

// ---------------------------------------------------------------------------
// MPF (Multi-Picture Format) fixture builders - the iPhone-HDR-gain-map shape:
// APP2 MPF index whose individual-image offsets are relative to the MPF HEADER
// and point at a full JPEG appended after the primary's EOI.
// ---------------------------------------------------------------------------

const le32 = (v: number) => [
  v & 0xff,
  (v >>> 8) & 0xff,
  (v >>> 16) & 0xff,
  (v >>> 24) & 0xff,
];

/** A little-endian APP2 MPF segment: version + count + a 2-entry MP Entry table. */
function mpfApp2(
  primarySize: number,
  secondaryOffset: number,
  secondarySize: number,
): number[] {
  return jpegSeg(0xe2, [
    ...ascii("MPF"),
    0,
    // MP header: "II", 42, first IFD at 8 (all offsets relative to the "II")
    0x49,
    0x49,
    0x2a,
    0x00,
    ...le32(8),
    3,
    0, // 3 IFD entries
    // 0xB000 MPFVersion: UNDEFINED x4 = "0100" inline
    ...[0x00, 0xb0, 7, 0, ...le32(4), ...ascii("0100")],
    // 0xB001 NumberOfImages: LONG x1 = 2
    ...[0x01, 0xb0, 4, 0, ...le32(1), ...le32(2)],
    // 0xB002 MPEntry: UNDEFINED x32 at offset 50 (= 8 + 2 + 3*12 + 4)
    ...[0x02, 0xb0, 7, 0, ...le32(32), ...le32(50)],
    ...le32(0), // next IFD
    // entry 1: the primary (this file) - offset MUST be 0 per CIPA DC-007
    ...le32(0x00030000),
    ...le32(primarySize),
    ...le32(0),
    ...le32(0),
    // entry 2: the trailing secondary image
    ...le32(0x00020002),
    ...le32(secondarySize),
    ...le32(secondaryOffset),
    ...le32(0),
  ]);
}

const MPF_APP10 = jpegSeg(0xea, Array(100).fill(0xaa)); // droppable vendor APPn after MPF

/** Primary JPEG (Exif GPS + MPF + optional post-MPF APP10) + a trailing secondary JPEG. */
function buildMpfJpeg(withApp10: boolean): {
  jpeg: Uint8Array;
  secondary: Uint8Array;
} {
  const secondary = buildJpeg([JFIF_APP0, DQT, SOF0, DHT]);
  const pre = [JFIF_APP0, jpegSeg(0xe1, exifPayloadWithGps(6))];
  const post = [...(withApp10 ? [MPF_APP10] : []), DQT, SOF0, DHT];
  const sum = (segs: number[][]) => segs.reduce((n, s) => n + s.length, 0);
  const mpfLen = mpfApp2(0, 0, 0).length; // placeholder: same length regardless of values
  const primaryLen = 2 + sum(pre) + mpfLen + sum(post) + SOS_AND_SCAN.length;
  const mpfHeaderAbs = 2 + sum(pre) + 4 + 4; // seg start + FFE2+len + "MPF\0"
  const mpf = mpfApp2(primaryLen, primaryLen - mpfHeaderAbs, secondary.length);
  return {
    jpeg: bytes([0xff, 0xd8], ...pre, mpf, ...post, SOS_AND_SCAN, secondary),
    secondary,
  };
}

/** Parse the (little-endian, fixture-shaped) MP Entry table out of a stripped JPEG. */
function readMpfEntries(b: Uint8Array): {
  headerAbs: number;
  primarySize: number;
  secondaryOffset: number;
} {
  const idx = indexOfBytes(b, [0x4d, 0x50, 0x46, 0x00]); // "MPF\0"
  expect(idx).toBeGreaterThan(-1);
  const headerAbs = idx + 4;
  const entries = headerAbs + 50;
  const r32 = (o: number) =>
    (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  return {
    headerAbs,
    primarySize: r32(entries + 4),
    secondaryOffset: r32(entries + 16 + 8),
  };
}

// ---------------------------------------------------------------------------
// PNG fixture builders
// ---------------------------------------------------------------------------

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngChunk(type: string, data: number[]): number[] {
  const len = data.length;
  return [
    (len >>> 24) & 0xff,
    (len >>> 16) & 0xff,
    (len >>> 8) & 0xff,
    len & 0xff,
    ...ascii(type),
    ...data,
    0xde,
    0xad,
    0xbe,
    0xef, // CRC - never verified structurally, copied verbatim when kept
  ];
}

const PNG_IHDR = pngChunk("IHDR", [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
const PNG_GAMA = pngChunk("gAMA", [0, 0, 0xb1, 0x8f]);
const PNG_EXIF = pngChunk("eXIf", exifPayloadWithGps(3).slice(6)); // raw TIFF, no prefix
const PNG_TEXT = pngChunk("tEXt", [...ascii("Author"), 0, ...ascii("someone")]);
const PNG_ITXT = pngChunk("iTXt", [
  ...ascii("XML:com.adobe.xmp"),
  0,
  0,
  0,
  0,
  0,
  ...ascii("<xmp/>"),
]);
const PNG_ZTXT = pngChunk("zTXt", [...ascii("Comment"), 0, 0, 1, 2, 3]);
const PNG_IDAT = pngChunk("IDAT", [0x78, 0x9c, 1, 2, 3, 4, 5]);
const PNG_IEND = pngChunk("IEND", []);

const FULL_PNG = bytes(
  PNG_SIG,
  PNG_IHDR,
  PNG_GAMA,
  PNG_EXIF,
  PNG_TEXT,
  PNG_ITXT,
  PNG_ZTXT,
  PNG_IDAT,
  PNG_IEND,
);

// ---------------------------------------------------------------------------
// WebP fixture builders
// ---------------------------------------------------------------------------

function riffChunk(cc: string, data: number[]): number[] {
  const out = [
    ...ascii(cc),
    data.length & 0xff,
    (data.length >>> 8) & 0xff,
    (data.length >>> 16) & 0xff,
    (data.length >>> 24) & 0xff,
    ...data,
  ];
  if (data.length % 2 === 1) out.push(0); // RIFF even-byte padding
  return out;
}

function buildWebp(chunks: number[][]): Uint8Array {
  const payload = chunks.flat();
  const riffSize = 4 + payload.length;
  return bytes(
    ascii("RIFF"),
    [
      riffSize & 0xff,
      (riffSize >>> 8) & 0xff,
      (riffSize >>> 16) & 0xff,
      (riffSize >>> 24) & 0xff,
    ],
    ascii("WEBP"),
    payload,
  );
}

// VP8X flags 0x2C = ICC (0x20) | EXIF (0x08) | XMP (0x04)
const WEBP_VP8X = riffChunk("VP8X", [0x2c, 0, 0, 0, 9, 0, 0, 9, 0, 0]);
const WEBP_ICCP = riffChunk("ICCP", [1, 2, 3, 4]);
const WEBP_VP8 = riffChunk("VP8 ", [0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a]);
const WEBP_EXIF = riffChunk(
  "EXIF",
  exifPayloadWithGps(1).slice(6).concat([0x77]),
); // odd size -> pad
const WEBP_XMP = riffChunk("XMP ", ascii("<xmp>loc</xmp>"));

const FULL_WEBP = buildWebp([
  WEBP_VP8X,
  WEBP_ICCP,
  WEBP_VP8,
  WEBP_EXIF,
  WEBP_XMP,
]);

// ---------------------------------------------------------------------------
// MP4/MOV fixture builders
// ---------------------------------------------------------------------------

function box(type: string, payload: number[]): number[] {
  const size = 8 + payload.length;
  return [
    (size >>> 24) & 0xff,
    (size >>> 16) & 0xff,
    (size >>> 8) & 0xff,
    size & 0xff,
    ...ascii(type),
    ...payload,
  ];
}

function largeBox(type: string, payload: number[]): number[] {
  const size = 16 + payload.length;
  return [
    0,
    0,
    0,
    1,
    ...ascii(type),
    0,
    0,
    0,
    0,
    (size >>> 24) & 0xff,
    (size >>> 16) & 0xff,
    (size >>> 8) & 0xff,
    size & 0xff,
    ...payload,
  ];
}

const GPS_STRING = "+37.7749-122.4194/";
const FTYP = box("ftyp", [...ascii("isom"), 0, 0, 2, 0, ...ascii("isomiso2")]);
const MVHD = box("mvhd", Array(100).fill(7));
const FAKE_STCO = box(
  "stco",
  [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 40, 0, 0, 1, 0],
);
const STBL = box("stbl", FAKE_STCO);
// mdia payload is NOT box-parsed by the stripper (no recursion below trak's direct
// children except into nothing) - but keep it box-shaped for realism.
const MDIA = box("mdia", [...box("mdhd", Array(20).fill(3)), ...STBL]);
const TRAK_UDTA = box(
  "udta",
  box("©xyz", [0, GPS_STRING.length, 0x15, 0xc7, ...ascii(GPS_STRING)]),
);
const TRAK = box("trak", [
  ...box("tkhd", Array(80).fill(2)),
  ...MDIA,
  ...TRAK_UDTA,
]);
const MOOV_UDTA = box(
  "udta",
  box("©xyz", [0, GPS_STRING.length, 0x15, 0xc7, ...ascii(GPS_STRING)]),
);
const MOOV_META = box("meta", [
  0,
  0,
  0,
  0,
  ...box("keys", ascii("com.apple.quicktime.location.ISO6709")),
]);
const MOOV = box("moov", [...MVHD, ...TRAK, ...MOOV_UDTA, ...MOOV_META]);
const MDAT = box("mdat", [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]);

const MP4_MOOV_FIRST = bytes(FTYP, MOOV, MDAT);
const MP4_MOOV_LAST = bytes(FTYP, MDAT, MOOV);
const MP4_LARGESIZE = bytes(FTYP, largeBox("mdat", Array(24).fill(9)), MOOV);

// ---------------------------------------------------------------------------
// JPEG
// ---------------------------------------------------------------------------

describe("stripJpeg (via stripMetadataBytes)", () => {
  it("removes Exif GPS, XMP, IPTC and COM; keeps JFIF, ICC and Adobe APP14", async () => {
    const res = await stripMetadataBytes(FULL_JPEG, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    expect(indexOfBytes(out, [0x25, 0x88])).toBe(-1); // GPS IFD tag bytes gone
    expect(indexOfBytes(out, "http://ns.adobe.com/xap")).toBe(-1);
    expect(indexOfBytes(out, "Photoshop 3.0")).toBe(-1);
    expect(indexOfBytes(out, "Yolophone")).toBe(-1);
    expect(indexOfBytes(out, "JFIF")).toBeGreaterThan(-1);
    expect(indexOfBytes(out, "ICC_PROFILE")).toBeGreaterThan(-1);
    expect(indexOfBytes(out, "Adobe")).toBeGreaterThan(-1);
    expect(hasGpsMetadata(FULL_JPEG, "image/jpeg")).toBe(true);
    expect(hasGpsMetadata(out, "image/jpeg")).toBe(false);
  });

  it("rebuilds a minimal Exif carrying ONLY the orientation", async () => {
    const res = await stripMetadataBytes(FULL_JPEG, "image/jpeg");
    expect(readJpegOrientation(res.data)).toBe(6);
    // Exactly one APP1, and it is our 36-byte minimal segment (single IFD0 entry).
    let app1Count = 0;
    let app1Len = 0;
    for (let i = 2; i < res.data.length - 4; i++) {
      if (res.data[i] === 0xff && res.data[i + 1] === 0xe1) {
        app1Count++;
        app1Len = (res.data[i + 2] << 8) | res.data[i + 3];
      }
    }
    expect(app1Count).toBe(1);
    expect(app1Len).toBe(34);
  });

  it("emits NO Exif when the source orientation is 1", async () => {
    const jpeg = buildJpeg([
      JFIF_APP0,
      jpegSeg(0xe1, exifPayloadWithGps(1)),
      DQT,
      SOF0,
      DHT,
    ]);
    const res = await stripMetadataBytes(jpeg, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(indexOfBytes(res.data, [0xff, 0xe1])).toBe(-1);
  });

  it("emits NO Exif when the source has none", async () => {
    const jpeg = buildJpeg([JFIF_APP0, XMP_APP1, DQT, SOF0, DHT]);
    const res = await stripMetadataBytes(jpeg, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    expect(indexOfBytes(res.data, [0xff, 0xe1])).toBe(-1);
  });

  it("keeps the entropy-coded scan byte-identical", async () => {
    const res = await stripMetadataBytes(FULL_JPEG, "image/jpeg");
    const sosIn = indexOfBytes(FULL_JPEG, [0xff, 0xda]);
    const sosOut = indexOfBytes(res.data, [0xff, 0xda]);
    expect(sosIn).toBeGreaterThan(-1);
    expect(Array.from(res.data.subarray(sosOut))).toEqual(
      Array.from(FULL_JPEG.subarray(sosIn)),
    );
  });

  it("reports changed:false for a JPEG with nothing to strip", async () => {
    const clean = buildJpeg([JFIF_APP0, DQT, SOF0, DHT]);
    const res = await stripMetadataBytes(clean, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(false);
    expect(res.data).toBe(clean);
  });

  it("is idempotent (stripping twice == once, second pass changed:false)", async () => {
    const once = await stripMetadataBytes(FULL_JPEG, "image/jpeg");
    const twice = await stripMetadataBytes(once.data, "image/jpeg");
    expect(twice.stripped).toBe(true);
    expect(twice.changed).toBe(false);
    expect(Array.from(twice.data)).toEqual(Array.from(once.data));
  });

  it("fails open on a truncated segment", async () => {
    const truncated = FULL_JPEG.subarray(0, 20); // cut inside the Exif APP1
    const res = await stripMetadataBytes(truncated, "image/jpeg");
    expect(res.stripped).toBe(false);
    expect(res.data).toBe(truncated);
  });

  it("fails open on a segment length pointing past EOF", async () => {
    const jpeg = bytes([0xff, 0xd8], jpegSeg(0xe1, exifPayloadWithGps(6)));
    jpeg[3] = 0xff; // inflate the declared APP1 length beyond the buffer
    const res = await stripMetadataBytes(jpeg, "image/jpeg");
    expect(res.stripped).toBe(false);
  });

  it("fails open on garbage", async () => {
    const junk = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const res = await stripMetadataBytes(junk, "image/jpeg");
    expect(res.stripped).toBe(false);
    expect(res.data).toBe(junk);
  });
});

// ---------------------------------------------------------------------------
// JPEG trailing appendages: MPF (iPhone HDR gain maps) + motion-photo MP4s
// ---------------------------------------------------------------------------

describe("JPEG MPF index fix-up", () => {
  it("rewrites offsets AND the primary size when post-MPF segments are dropped", async () => {
    const { jpeg, secondary } = buildMpfJpeg(true);
    // Sanity: the fixture's index resolves before the strip.
    const before = readMpfEntries(jpeg);
    expect(jpeg[before.headerAbs + before.secondaryOffset]).toBe(0xff);
    expect(jpeg[before.headerAbs + before.secondaryOffset + 1]).toBe(0xd8);
    expect(before.primarySize).toBe(jpeg.length - secondary.length);

    const res = await stripMetadataBytes(jpeg, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    expect(out.length).toBeLessThan(jpeg.length);
    expect(indexOfBytes(out, [0x25, 0x88])).toBe(-1); // GPS IFD tag gone
    // The trailing secondary image is byte-identical at the tail.
    expect(Array.from(out.subarray(out.length - secondary.length))).toEqual(
      Array.from(secondary),
    );
    // The rewritten index resolves to the secondary's SOI at its NEW position.
    const after = readMpfEntries(out);
    expect(after.headerAbs + after.secondaryOffset).toBe(
      out.length - secondary.length,
    );
    expect(out[after.headerAbs + after.secondaryOffset]).toBe(0xff);
    expect(out[after.headerAbs + after.secondaryOffset + 1]).toBe(0xd8);
    // The primary entry's size spans the shrunk pre-SOS region.
    expect(after.primarySize).toBe(out.length - secondary.length);
  });

  it("keeps the index valid when only pre-MPF segments change (offsets unmoved, size fixed)", async () => {
    const { jpeg, secondary } = buildMpfJpeg(false); // only the Exif before the MPF drops
    const res = await stripMetadataBytes(jpeg, "image/jpeg");
    expect(res.stripped).toBe(true);
    const after = readMpfEntries(res.data);
    expect(after.headerAbs + after.secondaryOffset).toBe(
      res.data.length - secondary.length,
    );
    expect(after.primarySize).toBe(res.data.length - secondary.length);
  });

  it("is idempotent on MPF files", async () => {
    const { jpeg } = buildMpfJpeg(true);
    const once = await stripMetadataBytes(jpeg, "image/jpeg");
    const twice = await stripMetadataBytes(once.data, "image/jpeg");
    expect(twice.stripped).toBe(true);
    expect(twice.changed).toBe(false);
    expect(Array.from(twice.data)).toEqual(Array.from(once.data));
  });

  it("fails open (original back) when an MPF index is present but unparseable", async () => {
    // Same shape but the MP header is garbage: offsets exist somewhere we can't fix,
    // and bytes WOULD shift (Exif + APP10 dropped) -> never ship a stale index.
    const corruptMpf = jpegSeg(0xe2, [
      ...ascii("MPF"),
      0,
      ...Array(90).fill(9),
    ]);
    const jpeg = bytes(
      [0xff, 0xd8],
      JFIF_APP0,
      jpegSeg(0xe1, exifPayloadWithGps(6)),
      corruptMpf,
      MPF_APP10,
      DQT,
      SOF0,
      DHT,
      SOS_AND_SCAN,
    );
    const res = await stripMetadataBytes(jpeg, "image/jpeg");
    expect(res.stripped).toBe(false);
    expect(res.data).toBe(jpeg);
  });

  it("fails open when an MPF offset points outside the verbatim tail", async () => {
    const { jpeg } = buildMpfJpeg(true);
    // Point the secondary entry at the pre-SOS region (a geometry we can't reason about).
    const { headerAbs } = readMpfEntries(jpeg);
    const broken = jpeg.slice();
    broken.set(le32(4), headerAbs + 50 + 16 + 8);
    const res = await stripMetadataBytes(broken, "image/jpeg");
    expect(res.stripped).toBe(false);
  });
});

describe("JPEG motion-photo trailer (embedded ISOBMFF)", () => {
  const CLEAN_PRIMARY = buildJpeg([JFIF_APP0, DQT, SOF0, DHT]);

  it("blanks the trailer MP4's metadata in place (nothing moves)", async () => {
    const input = bytes(CLEAN_PRIMARY, MP4_MOOV_FIRST);
    expect(hasGpsMetadata(input, "image/jpeg")).toBe(true); // trailer udta GPS seen
    const res = await stripMetadataBytes(input, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    expect(out.length).toBe(input.length); // in-place blanking only
    expect(indexOfBytes(out, GPS_STRING)).toBe(-1);
    expect(indexOfBytes(out, "udta")).toBe(-1); // renamed to 'free'
    // The primary image and the trailer's mdat are byte-identical at the same offsets.
    expect(Array.from(out.subarray(0, CLEAN_PRIMARY.length))).toEqual(
      Array.from(CLEAN_PRIMARY),
    );
    expect(indexOfBytes(out, "mdat")).toBe(indexOfBytes(input, "mdat"));
    expect(hasGpsMetadata(out, "image/jpeg")).toBe(false);
  });

  it("applies trailer patches at the SHIFTED offset when pre-SOS segments also drop", async () => {
    const input = bytes(FULL_JPEG, MP4_MOOV_FIRST);
    const res = await stripMetadataBytes(input, "image/jpeg");
    expect(res.stripped).toBe(true);
    const out = res.data;
    expect(indexOfBytes(out, GPS_STRING)).toBe(-1);
    expect(indexOfBytes(out, "http://ns.adobe.com/xap")).toBe(-1);
    // The whole tail (scan + trailer) shifted uniformly and stayed the same length.
    const sosIn = indexOfBytes(input, [0xff, 0xda]);
    const sosOut = indexOfBytes(out, [0xff, 0xda]);
    expect(out.length - sosOut).toBe(input.length - sosIn);
    expect(hasGpsMetadata(out, "image/jpeg")).toBe(false);
  });

  it("is idempotent (second pass changed:false)", async () => {
    const input = bytes(FULL_JPEG, MP4_MOOV_FIRST);
    const once = await stripMetadataBytes(input, "image/jpeg");
    const twice = await stripMetadataBytes(once.data, "image/jpeg");
    expect(twice.stripped).toBe(true);
    expect(twice.changed).toBe(false);
  });

  it("keeps a trailer we do not understand verbatim (fail-open on the appendage only)", async () => {
    const junkTrailer = [...ascii("SEFT"), 1, 2, 3, 4, 5];
    const input = bytes(FULL_JPEG, junkTrailer);
    const res = await stripMetadataBytes(input, "image/jpeg");
    expect(res.stripped).toBe(true); // primary still stripped
    expect(
      Array.from(res.data.subarray(res.data.length - junkTrailer.length)),
    ).toEqual(junkTrailer);
  });

  it("hasGpsMetadata sees GPS inside a trailing MPF-style embedded JPEG (the residual gap)", async () => {
    // Clean primary + a trailing full JPEG that carries its own Exif GPS: the strip
    // deliberately leaves it (excising would shift the trailer) but the report must see it.
    const input = bytes(CLEAN_PRIMARY, FULL_JPEG);
    expect(hasGpsMetadata(input, "image/jpeg")).toBe(true);
    const res = await stripMetadataBytes(input, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(false); // nothing we CAN strip
    expect(hasGpsMetadata(res.data, "image/jpeg")).toBe(true); // honest: GPS remains
  });
});

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

describe("stripPng (via stripMetadataBytes)", () => {
  it("drops eXIf/tEXt/zTXt/iTXt and keeps IHDR/gAMA/IDAT/IEND verbatim", async () => {
    const res = await stripMetadataBytes(FULL_PNG, "image/png");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    for (const dropped of ["eXIf", "tEXt", "zTXt", "iTXt"]) {
      expect(indexOfBytes(out, dropped)).toBe(-1);
    }
    const expected = bytes(PNG_SIG, PNG_IHDR, PNG_GAMA, PNG_IDAT, PNG_IEND);
    expect(Array.from(out)).toEqual(Array.from(expected));
    expect(hasGpsMetadata(FULL_PNG, "image/png")).toBe(true);
    expect(hasGpsMetadata(out, "image/png")).toBe(false);
  });

  it("is idempotent", async () => {
    const once = await stripMetadataBytes(FULL_PNG, "image/png");
    const twice = await stripMetadataBytes(once.data, "image/png");
    expect(twice.changed).toBe(false);
    expect(twice.data).toBe(once.data);
  });

  it("fails open on a bad signature and on truncated chunks", async () => {
    const badSig = bytes([1, 2, 3, 4, 5, 6, 7, 8], PNG_IHDR);
    expect((await stripMetadataBytes(badSig, "image/png")).stripped).toBe(
      false,
    );
    const truncated = FULL_PNG.subarray(0, PNG_SIG.length + 10);
    expect((await stripMetadataBytes(truncated, "image/png")).stripped).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// WebP
// ---------------------------------------------------------------------------

describe("stripWebp (via stripMetadataBytes)", () => {
  it("drops EXIF + XMP chunks, keeps ICCP/VP8, clears the VP8X flag bits", async () => {
    const res = await stripMetadataBytes(FULL_WEBP, "image/webp");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    expect(indexOfBytes(out, "EXIF")).toBe(-1);
    expect(indexOfBytes(out, "XMP ")).toBe(-1);
    expect(indexOfBytes(out, "ICCP")).toBeGreaterThan(-1);
    expect(indexOfBytes(out, "VP8 ")).toBeGreaterThan(-1);
    const vp8x = indexOfBytes(out, "VP8X");
    expect(out[vp8x + 8]).toBe(0x20); // ICC still flagged, EXIF/XMP bits cleared
    expect(hasGpsMetadata(FULL_WEBP, "image/webp")).toBe(true);
    expect(hasGpsMetadata(out, "image/webp")).toBe(false);
  });

  it("recomputes the RIFF size to match the output", async () => {
    const res = await stripMetadataBytes(FULL_WEBP, "image/webp");
    const declared =
      res.data[4] |
      (res.data[5] << 8) |
      (res.data[6] << 16) |
      (res.data[7] << 24);
    expect(declared).toBe(res.data.length - 8);
  });

  it("is idempotent", async () => {
    const once = await stripMetadataBytes(FULL_WEBP, "image/webp");
    const twice = await stripMetadataBytes(once.data, "image/webp");
    expect(twice.changed).toBe(false);
  });

  it("fails open on a non-RIFF buffer and on a truncated chunk", async () => {
    expect(
      (
        await stripMetadataBytes(
          bytes(ascii("NOPE"), [0, 0, 0, 0]),
          "image/webp",
        )
      ).stripped,
    ).toBe(false);
    const truncated = FULL_WEBP.subarray(0, 20);
    expect((await stripMetadataBytes(truncated, "image/webp")).stripped).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// MP4 / MOV
// ---------------------------------------------------------------------------

describe("stripIsobmff (via stripMetadataBytes)", () => {
  async function assertScrubbed(input: Uint8Array) {
    const res = await stripMetadataBytes(input, "video/mp4");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    // No restructuring EVER: same length, mdat at the same offset with identical bytes.
    expect(out.length).toBe(input.length);
    const mdatIn = indexOfBytes(input, "mdat");
    expect(indexOfBytes(out, "mdat")).toBe(mdatIn);
    // GPS + Apple metadata scrubbed (zeroed, not merely skipped).
    expect(indexOfBytes(out, GPS_STRING)).toBe(-1);
    expect(indexOfBytes(out, [0xa9, 0x78, 0x79, 0x7a])).toBe(-1); // (c)xyz
    expect(indexOfBytes(out, "com.apple.quicktime.location")).toBe(-1);
    expect(indexOfBytes(out, "udta")).toBe(-1); // renamed to 'free'
    // stco values byte-identical (we never recurse into stbl).
    const stcoIn = indexOfBytes(input, "stco");
    const stcoOut = indexOfBytes(out, "stco");
    expect(stcoOut).toBe(stcoIn);
    expect(
      Array.from(out.subarray(stcoOut, stcoOut + FAKE_STCO.length - 4)),
    ).toEqual(
      Array.from(input.subarray(stcoIn, stcoIn + FAKE_STCO.length - 4)),
    );
    expect(hasGpsMetadata(input, "video/mp4")).toBe(true);
    expect(hasGpsMetadata(out, "video/mp4")).toBe(false);
    return out;
  }

  it("scrubs udta/meta with moov BEFORE mdat", async () => {
    await assertScrubbed(MP4_MOOV_FIRST);
  });

  it("scrubs udta/meta with moov AFTER mdat", async () => {
    await assertScrubbed(MP4_MOOV_LAST);
  });

  it("handles a 64-bit largesize box header", async () => {
    const out = await assertScrubbed(MP4_LARGESIZE);
    // The largesize mdat header (including its 8-byte extended size) is untouched.
    const mdatIn = indexOfBytes(MP4_LARGESIZE, "mdat");
    expect(Array.from(out.subarray(mdatIn - 4, mdatIn + 12))).toEqual(
      Array.from(MP4_LARGESIZE.subarray(mdatIn - 4, mdatIn + 12)),
    );
  });

  it("blanks a top-level XMP uuid box but keeps other uuid boxes", async () => {
    const xmpUuid = [
      0xbe, 0x7a, 0xcf, 0xcb, 0x97, 0xa9, 0x42, 0xe8, 0x9c, 0x71, 0x99, 0x94,
      0x91, 0xe3, 0xaf, 0xac,
    ];
    const otherUuid = Array(16).fill(0x11);
    const input = bytes(
      FTYP,
      box("uuid", [...xmpUuid, ...ascii("<xmp>gps here</xmp>")]),
      box("uuid", [...otherUuid, ...ascii("keep-me")]),
      MOOV,
      MDAT,
    );
    const res = await stripMetadataBytes(input, "video/quicktime");
    expect(res.stripped).toBe(true);
    expect(indexOfBytes(res.data, "gps here")).toBe(-1);
    expect(indexOfBytes(res.data, "keep-me")).toBeGreaterThan(-1);
  });

  it("is idempotent (second pass finds nothing, changed:false)", async () => {
    const once = await stripMetadataBytes(MP4_MOOV_LAST, "video/mp4");
    const twice = await stripMetadataBytes(once.data, "video/mp4");
    expect(twice.stripped).toBe(true);
    expect(twice.changed).toBe(false);
    expect(Array.from(twice.data)).toEqual(Array.from(once.data));
  });

  it("reports changed:false when there is no metadata", async () => {
    const clean = bytes(FTYP, box("moov", MVHD), MDAT);
    const res = await stripMetadataBytes(clean, "video/mp4");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(false);
  });

  it("fails open on truncated input, a missing moov, and garbage", async () => {
    expect(
      (await stripMetadataBytes(MP4_MOOV_FIRST.subarray(0, 30), "video/mp4"))
        .stripped,
    ).toBe(false);
    expect(
      (await stripMetadataBytes(bytes(FTYP, MDAT), "video/mp4")).stripped,
    ).toBe(false);
    expect(
      (
        await stripMetadataBytes(
          new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
          "video/mp4",
        )
      ).stripped,
    ).toBe(false);
  });

  it("fails open on an item-based (HEIC-brand) file mislabeled as video", async () => {
    const heic = bytes(box("ftyp", [...ascii("heic"), 0, 0, 0, 0]), MOOV, MDAT);
    const res = await stripMetadataBytes(heic, "video/mp4");
    expect(res.stripped).toBe(false);
    expect(res.data).toBe(heic);
  });

  it("planIsobmffPatches emits offset-stable patches", async () => {
    const plan = await planIsobmffPatches(memoryReader(MP4_MOOV_LAST));
    expect(plan.ok).toBe(true);
    expect(plan.patches.length).toBe(1); // the whole patched moov
    const moovOffset = FTYP.length + MDAT.length;
    expect(plan.patches[0].offset).toBe(moovOffset);
    expect(plan.patches[0].bytes.length).toBe(MOOV.length);
  });
});

// ---------------------------------------------------------------------------
// Unsupported types + the File adapter
// ---------------------------------------------------------------------------

describe("stripMetadataBytes dispatch", () => {
  it("fails open for consciously unsupported types (HEIC, WebM)", async () => {
    const b = new Uint8Array([1, 2, 3]);
    expect((await stripMetadataBytes(b, "image/heic")).stripped).toBe(false);
    expect((await stripMetadataBytes(b, "video/webm")).stripped).toBe(false);
    expect((await stripMetadataBytes(b, "image/heif")).stripped).toBe(false);
    expect((await stripMetadataBytes(b, "image/avif")).stripped).toBe(false);
  });
});

describe("stripFileMetadata (File adapter)", () => {
  it("returns a smaller metadata-free blob for a JPEG, preserving the MIME type", async () => {
    const file = new File([FULL_JPEG as BlobPart], "photo.jpg", {
      type: "image/jpeg",
    });
    const res = await stripFileMetadata(file);
    expect(res.stripped).toBe(true);
    expect(res.blob).not.toBe(file);
    expect(res.blob.type).toBe("image/jpeg");
    expect(res.blob.size).toBeLessThan(file.size);
    const out = new Uint8Array(await res.blob.arrayBuffer());
    expect(hasGpsMetadata(out, "image/jpeg")).toBe(false);
    expect(readJpegOrientation(out)).toBe(6);
  });

  it("returns the ORIGINAL File object when nothing changes", async () => {
    const clean = buildJpeg([JFIF_APP0, DQT, SOF0, DHT]);
    const file = new File([clean as BlobPart], "clean.jpg", {
      type: "image/jpeg",
    });
    const res = await stripFileMetadata(file);
    expect(res.stripped).toBe(true);
    expect(res.blob).toBe(file);
  });

  it("composes an identical-length MP4 blob matching the bytes-mode output", async () => {
    const file = new File([MP4_MOOV_LAST as BlobPart], "clip.mp4", {
      type: "video/mp4",
    });
    const res = await stripFileMetadata(file);
    expect(res.stripped).toBe(true);
    expect(res.blob.size).toBe(file.size);
    const viaFile = new Uint8Array(await res.blob.arrayBuffer());
    const viaBytes = await stripMetadataBytes(MP4_MOOV_LAST, "video/mp4");
    expect(Array.from(viaFile)).toEqual(Array.from(viaBytes.data));
  });

  it("fails open (original file back) for unsupported and corrupt input", async () => {
    const heic = new File([new Uint8Array([1, 2, 3]) as BlobPart], "img.heic", {
      type: "image/heic",
    });
    expect((await stripFileMetadata(heic)).blob).toBe(heic);
    const corrupt = new File([new Uint8Array([9, 9, 9]) as BlobPart], "x.jpg", {
      type: "image/jpeg",
    });
    const res = await stripFileMetadata(corrupt);
    expect(res.stripped).toBe(false);
    expect(res.blob).toBe(corrupt);
  });
});

// ---------------------------------------------------------------------------
// Real out-of-repo test media (skipped when the fixtures directory is absent)
// ---------------------------------------------------------------------------

const TEST_MEDIA_DIR = "/Users/gibby/local/ai/partyreel-test-media";

describe.skipIf(!existsSync(TEST_MEDIA_DIR))(
  "real test media (out-of-repo)",
  () => {
    it("strips the real JPEGs losslessly and idempotently", async () => {
      const dir = join(TEST_MEDIA_DIR, "images");
      const jpegs = readdirSync(dir)
        .filter((f) => f.endsWith(".jpg"))
        .slice(0, 3);
      expect(jpegs.length).toBeGreaterThan(0);
      for (const name of jpegs) {
        const input = new Uint8Array(readFileSync(join(dir, name)));
        const res = await stripMetadataBytes(input, "image/jpeg");
        expect(res.stripped, name).toBe(true);
        // Output still structurally parses: a second pass succeeds and is a no-op.
        const again = await stripMetadataBytes(res.data, "image/jpeg");
        expect(again.stripped, name).toBe(true);
        expect(again.changed, name).toBe(false);
        // SOI + trailing EOI intact.
        expect(res.data[0]).toBe(0xff);
        expect(res.data[1]).toBe(0xd8);
      }
    });

    it("strips the real MP4s in place (length preserved, offsets stable)", async () => {
      const dir = join(TEST_MEDIA_DIR, "videos");
      const mp4s = readdirSync(dir)
        .filter((f) => f.endsWith(".mp4"))
        .slice(0, 2);
      expect(mp4s.length).toBeGreaterThan(0);
      for (const name of mp4s) {
        const input = new Uint8Array(readFileSync(join(dir, name)));
        const res = await stripMetadataBytes(input, "video/mp4");
        expect(res.stripped, name).toBe(true);
        expect(res.data.length, name).toBe(input.length);
        expect(indexOfBytes(res.data, "mdat"), name).toBe(
          indexOfBytes(input, "mdat"),
        );
        const again = await stripMetadataBytes(res.data, "video/mp4");
        expect(again.stripped, name).toBe(true);
        expect(again.changed, name).toBe(false);
      }
    });
  },
);
