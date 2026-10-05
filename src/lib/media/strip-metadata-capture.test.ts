/**
 * THE CAPTURE TIME THROUGH THE STRIP (Will's X7, 2026-10-05: "keep the capture time, never the place or device"):
 * what each walk reads from the ORIGINAL (`captured`), and exactly what the stored file keeps. Every case here fails on
 * the code before the lane: it read no time, and its minimal Exif kept the orientation alone.
 *
 * The real fixtures (strip-metadata-fixtures/, a few KB each, from synthetic test patterns, no third-party picture):
 *  - imageio-capture.jpg / .heic: Apple's ImageIO, orientation 6, the time three ways (DateTimeOriginal 21:14:05 with
 *    OffsetTimeOriginal -04:00 and sub-seconds 123, DateTimeDigitized 21:14:06, the TIFF modify time 21:20:00), GPS,
 *    make, model, software, lens and body serial. ImageIO itself reads back, after the strip, the orientation,
 *    ExifVersion, DateTimeOriginal and OffsetTimeOriginal and nothing else, with identical pixels (the lane's Handoff).
 *  - avfoundation-capture.mov: Apple's AVFoundation, an iPhone's shape: moov-level QuickTime metadata (the creation date
 *    2026-10-03T21:14:05-0400, location, make, model, software) and a movie header AVFoundation stamped with the moment
 *    it WROTE the file (measured: the write time, not the capture).
 *  - ffmpeg-capture.mov: the same keys in udta's metadata box (ffmpeg's place), its movie header 30 s past the start.
 *  - ffmpeg-capture.mp4: an Android's shape: only the movie header's creation time, and a ©xyz location.
 *  - ffmpeg-capture.webm: Info's DateUTC, and Tags naming a location and a model.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  hasGpsMetadata,
  stripFileMetadata,
  stripMetadataBytes,
} from "./strip-metadata";

const fixture = (name: string) =>
  new Uint8Array(
    readFileSync(
      fileURLToPath(
        new URL(`./strip-metadata-fixtures/${name}`, import.meta.url),
      ),
    ),
  );

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
const at = (iso: string) => Date.parse(iso);

function indexOf(h: Uint8Array, needle: string | number[], from = 0): number {
  const n = typeof needle === "string" ? ascii(needle) : needle;
  outer: for (let i = from; i <= h.length - n.length; i++) {
    for (let j = 0; j < n.length; j++) if (h[i + j] !== n[j]) continue outer;
    return i;
  }
  return -1;
}

function count(h: Uint8Array, needle: string): number {
  let n = 0;
  for (let i = indexOf(h, needle); i >= 0; i = indexOf(h, needle, i + 1)) n++;
  return n;
}

/** A File the way a browser hands one over. */
const asFile = (bytes: Uint8Array, name: string, type: string) =>
  new File([bytes as BlobPart], name, { type });

// ---------------------------------------------------------------------------
// An independent Exif oracle: the primary's first Exif APP1, its IFD0 and its Exif IFD, tag by tag
// ---------------------------------------------------------------------------

type Tags = Map<
  number,
  { type: number; count: number; value: string | number }
>;

function u16(b: Uint8Array, o: number, le: boolean) {
  return le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1];
}
function u32(b: Uint8Array, o: number, le: boolean) {
  return le
    ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
    : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}

/** The TIFF of a JPEG's first Exif APP1 (null when it has none). */
function jpegTiff(b: Uint8Array): Uint8Array | null {
  let p = 2;
  while (p + 4 <= b.length && b[p] === 0xff && b[p + 1] !== 0xda) {
    const len = (b[p + 2] << 8) | b[p + 3];
    if (b[p + 1] === 0xe1 && indexOf(b.subarray(p + 4, p + 10), "Exif") === 0) {
      return b.subarray(p + 10, p + 2 + len);
    }
    p += 2 + len;
  }
  return null;
}

function readIfd(t: Uint8Array, at0: number, le: boolean): Tags {
  const tags: Tags = new Map();
  const n = u16(t, at0, le);
  for (let i = 0; i < n; i++) {
    const e = at0 + 2 + i * 12;
    const tag = u16(t, e, le);
    const type = u16(t, e + 2, le);
    const cnt = u32(t, e + 4, le);
    let value: string | number;
    if (type === 2 || type === 7) {
      const where = cnt <= 4 ? e + 8 : u32(t, e + 8, le);
      value = String.fromCharCode(...t.subarray(where, where + cnt)).replace(
        /\0+$/,
        "",
      );
    } else if (type === 3) value = u16(t, e + 8, le);
    else value = u32(t, e + 8, le);
    tags.set(tag, { type, count: cnt, value });
  }
  return tags;
}

/** IFD0's tags and, when IFD0 points at one, the Exif IFD's. */
function exifTags(tiff: Uint8Array): {
  ifd0: Tags;
  exif: Tags | null;
  le: boolean;
} {
  const le = tiff[0] === 0x49;
  const ifd0 = readIfd(tiff, u32(tiff, 4, le), le);
  const ptr = ifd0.get(0x8769);
  return { ifd0, exif: ptr ? readIfd(tiff, Number(ptr.value), le) : null, le };
}

// ---------------------------------------------------------------------------
// Builders: a TIFF of any tags (either byte order), a JPEG around it, ISO boxes, EBML elements
// ---------------------------------------------------------------------------

type Entry = { tag: number; type: number; value: number | string | number[] };

/** A TIFF with IFD0's entries and, when given, an Exif IFD's (IFD0 points at it with 0x8769). */
function tiff(ifd0: Entry[], exif: Entry[] | null, le = true): number[] {
  const out: number[] = [];
  const w16 = (v: number) =>
    le ? out.push(v & 0xff, v >> 8) : out.push(v >> 8, v & 0xff);
  const w32 = (v: number) =>
    le
      ? out.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, v >>> 24)
      : out.push(v >>> 24, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
  const all = [
    ...ifd0,
    ...(exif ? [{ tag: 0x8769, type: 4, value: 0 }] : []),
  ].sort((a, b) => a.tag - b.tag);
  const ifd0At = 8;
  const exifAt = ifd0At + 2 + all.length * 12 + 4;
  const exifLen = exif ? 2 + exif.length * 12 + 4 : 0;
  // The values past four bytes follow both IFDs, in the order their entries are written.
  const dataAt = exifAt + exifLen;
  const data: number[] = [];
  const valueOf = (e: Entry): number[] =>
    typeof e.value === "string"
      ? [...ascii(e.value), 0]
      : Array.isArray(e.value)
        ? e.value
        : [];
  const entries = (list: Entry[]) => {
    w16(list.length);
    for (const e of list) {
      w16(e.tag);
      w16(e.type);
      const bytes = valueOf(e);
      if (typeof e.value === "number") {
        w32(1);
        if (e.tag === 0x8769) w32(exifAt);
        else if (e.type === 3) {
          w16(e.value);
          w16(0);
        } else w32(e.value);
      } else {
        w32(bytes.length);
        if (bytes.length <= 4) {
          for (let i = 0; i < 4; i++) out.push(bytes[i] ?? 0);
        } else {
          w32(dataAt + data.length);
          data.push(...bytes);
          if (data.length % 2) data.push(0);
        }
      }
    }
    w32(0);
  };
  out.push(...(le ? [0x49, 0x49, 0x2a, 0] : [0x4d, 0x4d, 0, 0x2a]));
  w32(ifd0At);
  entries(all);
  if (exif) entries([...exif].sort((a, b) => a.tag - b.tag));
  out.push(...data);
  return out;
}

function seg(marker: number, payload: number[]): number[] {
  const len = payload.length + 2;
  return [0xff, marker, (len >> 8) & 0xff, len & 0xff, ...payload];
}

const JFIF = seg(0xe0, [...ascii("JFIF"), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
const DQT = seg(0xdb, [0, ...Array(64).fill(16)]);
const SOF0 = seg(0xc0, [8, 0, 1, 0, 1, 1, 1, 0x11, 0]);
const DHT = seg(0xc4, [0, ...Array(16).fill(0), 1, 5]);
const SCAN = [
  0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0, 0x12, 0x34, 0x56, 0xff, 0xd9,
];

function jpegWith(exifTiff: number[] | null): Uint8Array {
  return new Uint8Array([
    0xff,
    0xd8,
    ...JFIF,
    ...(exifTiff ? seg(0xe1, [...ascii("Exif"), 0, 0, ...exifTiff]) : []),
    ...DQT,
    ...SOF0,
    ...DHT,
    ...SCAN,
  ]);
}

const ORIENT = (v: number): Entry => ({ tag: 0x0112, type: 3, value: v });
const MAKE: Entry = { tag: 0x010f, type: 2, value: "Yolophone" };
const MODEL: Entry = { tag: 0x0110, type: 2, value: "Yolo 12 Pro Max" };
const DTO = (v: string): Entry => ({ tag: 0x9003, type: 2, value: v });
const OTO = (v: string): Entry => ({ tag: 0x9011, type: 2, value: v });
const SUBSEC: Entry = { tag: 0x9291, type: 2, value: "123" };
const SERIAL: Entry = { tag: 0xa431, type: 2, value: "SN-00042-PARTYREEL" };
const LENS: Entry = { tag: 0xa434, type: 2, value: "Yolo wide 4.2mm f/1.8" };

/** The minimal Exif the strip leaves in a JPEG, read by the oracle: [ifd0 tag ids, exif tag ids, values]. */
function kept(out: Uint8Array) {
  const t = jpegTiff(out);
  if (!t) return null;
  const { ifd0, exif, le } = exifTags(t);
  return {
    le,
    ifd0: [...ifd0.keys()],
    exif: exif ? [...exif.keys()] : null,
    orientation: ifd0.get(0x0112)?.value ?? null,
    wall: exif?.get(0x9003)?.value ?? null,
    offset: exif?.get(0x9011)?.value ?? null,
    version: exif?.get(0x9000)?.value ?? null,
  };
}

// ---------------------------------------------------------------------------
// JPEG, real
// ---------------------------------------------------------------------------

describe("JPEG: an ImageIO photograph's capture time", () => {
  const input = fixture("imageio-capture.jpg");

  it("is what the fixture says it is", () => {
    const t = exifTags(jpegTiff(input)!);
    expect(t.exif!.get(0x9003)!.value).toBe("2026:10:03 21:14:05");
    expect(t.exif!.get(0x9011)!.value).toBe("-04:00");
    expect(t.exif!.get(0x9291)!.value).toBe("123");
    expect(hasGpsMetadata(input, "image/jpeg")).toBe(true);
    for (const n of [
      "iPhone 15 Pro",
      "SERIAL-PARTYREEL-TEST",
      "17.5.1",
      "2026:10:03 21:14:06",
      "2026:10:03 21:20:00",
    ]) {
      expect(indexOf(input, n), n).toBeGreaterThan(-1);
    }
  });

  it("★ reads the time from the original, with its zone", async () => {
    const res = await stripMetadataBytes(input, "image/jpeg");
    expect(res.captured).toEqual({
      kind: "wall",
      wall: "2026:10:03 21:14:05",
      offset: "-04:00",
    });
  });

  it("★ keeps exactly the orientation, ExifVersion, DateTimeOriginal and OffsetTimeOriginal: never the place or the device", async () => {
    const res = await stripMetadataBytes(input, "image/jpeg");
    expect(kept(res.data)).toEqual({
      le: true,
      ifd0: [0x0112, 0x8769],
      exif: [0x9000, 0x9003, 0x9011],
      orientation: 6,
      wall: "2026:10:03 21:14:05",
      offset: "-04:00",
      version: "0232",
    });
    expect(hasGpsMetadata(res.data, "image/jpeg")).toBe(false);
    // Not the device, not the other two times, not the sub-second.
    for (const n of [
      "iPhone 15 Pro",
      "SERIAL-PARTYREEL-TEST",
      "Apple",
      "17.5.1",
      "2026:10:03 21:14:06",
      "2026:10:03 21:20:00",
    ]) {
      expect(indexOf(res.data, n), n).toBe(-1);
    }
    // One APP1, 118 bytes from its marker: the most the minimal Exif ever is.
    const app1 = indexOf(res.data, [0xff, 0xe1]);
    expect((res.data[app1 + 2] << 8) | res.data[app1 + 3]).toBe(116);
    expect(indexOf(res.data, [0xff, 0xe1], app1 + 2)).toBe(-1);
  });

  it("keeps the scan byte for byte, and a second strip changes nothing", async () => {
    const once = await stripMetadataBytes(input, "image/jpeg");
    const sosIn = indexOf(input, [0xff, 0xda]);
    const sosOut = indexOf(once.data, [0xff, 0xda]);
    expect(Array.from(once.data.subarray(sosOut))).toEqual(
      Array.from(input.subarray(sosIn)),
    );
    const twice = await stripMetadataBytes(once.data, "image/jpeg");
    expect(twice.changed).toBe(false);
    expect(twice.captured).toEqual(once.captured);
  });

  it("says the same from a File (the browser's path)", async () => {
    const res = await stripFileMetadata(
      asFile(input, "IMG_0001.JPG", "image/jpeg"),
    );
    expect(res.captured).toEqual({
      kind: "wall",
      wall: "2026:10:03 21:14:05",
      offset: "-04:00",
    });
    const viaBytes = await stripMetadataBytes(input, "image/jpeg");
    expect(Array.from(new Uint8Array(await res.blob.arrayBuffer()))).toEqual(
      Array.from(viaBytes.data),
    );
  });
});

describe("JPEG: the multi-picture files keep the primary's time, their secondaries the orientation alone", () => {
  it("a large thumbnail's own Exif loses its time with its GPS; the primary's is kept, once", async () => {
    const input = fixture("mpf-large-thumbnail.jpg");
    expect(count(input, "2026:09:30 18:04:05")).toBeGreaterThan(1);
    const res = await stripMetadataBytes(input, "image/jpeg");
    expect(res.stripped).toBe(true);
    expect(count(res.data, "2026:09:30 18:04:05")).toBe(1);
    expect(kept(res.data)!.wall).toBe("2026:09:30 18:04:05");
    expect(res.captured).toEqual({
      kind: "wall",
      wall: "2026:09:30 18:04:05",
      offset: null,
    });
  });

  it("an upright HDR photograph keeps its time and writes no orientation at all", async () => {
    const res = await stripMetadataBytes(
      fixture("imageio-hdr-gainmap.jpg"),
      "image/jpeg",
    );
    expect(kept(res.data)).toMatchObject({
      ifd0: [0x8769],
      exif: [0x9000, 0x9003],
      orientation: null,
      wall: "2026:09:30 18:04:05",
      offset: null,
    });
    expect(indexOf(res.data, "HDRGainMapVersion")).toBeGreaterThan(-1);
  });
});

// ---------------------------------------------------------------------------
// JPEG, every shape the field comes in
// ---------------------------------------------------------------------------

describe("JPEG: only a real time is ever copied", () => {
  const strip = async (t: number[] | null) =>
    stripMetadataBytes(jpegWith(t), "image/jpeg");

  it("★ copies a time and its zone, and drops the device beside them in the same IFD", async () => {
    const res = await strip(
      tiff(
        [ORIENT(8), MAKE, MODEL],
        [DTO("2026:10:03 21:14:05"), OTO("+02:00"), SUBSEC, SERIAL, LENS],
      ),
    );
    expect(kept(res.data)).toEqual({
      le: true,
      ifd0: [0x0112, 0x8769],
      exif: [0x9000, 0x9003, 0x9011],
      orientation: 8,
      wall: "2026:10:03 21:14:05",
      offset: "+02:00",
      version: "0232",
    });
    for (const n of ["Yolophone", "Yolo 12", "SN-00042", "Yolo wide"]) {
      expect(indexOf(res.data, n), n).toBe(-1);
    }
  });

  it("★ a field that is not a date never survives as one, and the strip says it read none", async () => {
    for (const bad of [
      "Taken at 1 Main St",
      "2026:02:30 10:00:00",
      "2026:13:01 10:00:00",
      "2026:10:03 24:00:00",
      "0000:00:00 00:00:00",
      "    :  :     :  :  ",
      "2026-10-03 21:14:05",
      "2026:10:03 21:14",
    ]) {
      const res = await strip(tiff([ORIENT(1)], [DTO(bad)]));
      expect(res.captured, bad).toBeUndefined();
      // Upright and no time: no Exif at all, as before the lane.
      expect(jpegTiff(res.data), bad).toBeNull();
      expect(indexOf(res.data, bad.slice(0, 8)), bad).toBe(-1);
      const sideways = await strip(tiff([ORIENT(6)], [DTO(bad)]));
      expect(kept(sideways.data), bad).toMatchObject({
        ifd0: [0x0112],
        exif: null,
        orientation: 6,
      });
    }
  });

  it("trims a writer's padding, and keeps the time with no zone when the zone is not one", async () => {
    const padded = await strip(tiff([], [DTO("2026:10:03 21:14:05  ")]));
    expect(kept(padded.data)!.wall).toBe("2026:10:03 21:14:05");
    for (const zone of ["+0400", "+15:00", "Z", "-04:60", "04:00"]) {
      const res = await strip(
        tiff([], [DTO("2026:10:03 21:14:05"), OTO(zone)]),
      );
      expect(res.captured, zone).toEqual({
        kind: "wall",
        wall: "2026:10:03 21:14:05",
        offset: null,
      });
      expect(kept(res.data)!.exif, zone).toEqual([0x9000, 0x9003]);
    }
  });

  it("reads a big-endian Exif and keeps the time in the little-endian minimal one", async () => {
    const res = await strip(
      tiff(
        [ORIENT(3), MAKE],
        [DTO("2026:10:03 21:14:05"), OTO("-07:00")],
        false,
      ),
    );
    expect(res.captured).toEqual({
      kind: "wall",
      wall: "2026:10:03 21:14:05",
      offset: "-07:00",
    });
    expect(kept(res.data)).toMatchObject({
      le: true,
      orientation: 3,
      offset: "-07:00",
    });
  });

  it("reads no time through a pointer that lies, and strips as it always did", async () => {
    const good = tiff([ORIENT(6)], [DTO("2026:10:03 21:14:05")]);
    // The Exif IFD pointer's value aimed past the block's end.
    const lying = [...good];
    const ptrEntry = 8 + 2 + 12; // IFD0's second entry (0x8769 after 0x0112)
    lying[ptrEntry + 8] = 0xf0;
    lying[ptrEntry + 9] = 0xff;
    const res = await strip(lying);
    expect(res.stripped).toBe(true);
    expect(res.captured).toBeUndefined();
    expect(kept(res.data)).toMatchObject({ orientation: 6, exif: null });
    // A pointer of the wrong type is no pointer.
    const wrongType = [...good];
    wrongType[ptrEntry + 2] = 3;
    expect((await strip(wrongType)).captured).toBeUndefined();
  });

  it("every one of these is idempotent", async () => {
    for (const t of [
      tiff([ORIENT(6)], [DTO("2026:10:03 21:14:05"), OTO("-04:00")]),
      tiff([ORIENT(1)], [DTO("2026:10:03 21:14:05")]),
      tiff([], [DTO("2026:10:03 21:14:05"), OTO("+05:45")]),
    ]) {
      const once = await strip(t);
      const twice = await stripMetadataBytes(once.data, "image/jpeg");
      expect(twice.changed).toBe(false);
      expect(twice.captured).toEqual(once.captured);
    }
  });
});

describe("PNG and WebP: never read (screenshots and web images; their Exif goes whole, as before)", () => {
  it("a PNG's eXIf time is dropped and never read", async () => {
    const t = tiff([], [DTO("2026:10:03 21:14:05")]);
    const chunk = (type: string, data: number[]) => {
      const len = data.length;
      return [
        (len >>> 24) & 0xff,
        (len >>> 16) & 0xff,
        (len >>> 8) & 0xff,
        len & 0xff,
        ...ascii(type),
        ...data,
        0,
        0,
        0,
        0,
      ];
    };
    const png = new Uint8Array([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      ...chunk("IHDR", [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]),
      ...chunk("eXIf", t),
      ...chunk("IDAT", [0x78, 0x9c, 1, 2, 3]),
      ...chunk("IEND", []),
    ]);
    const res = await stripMetadataBytes(png, "image/png");
    expect(res.changed).toBe(true);
    expect(res.captured).toBeUndefined();
    expect(indexOf(res.data, "2026:10:03")).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// HEIC, real
// ---------------------------------------------------------------------------

describe("HEIC: an ImageIO photograph's capture time", () => {
  const input = fixture("imageio-capture.heic");

  it("★ reads the time with its zone, keeps it in the Exif item, and moves nothing", async () => {
    const res = await stripMetadataBytes(input, "image/heic");
    expect(res.stripped).toBe(true);
    expect(res.data.length).toBe(input.length);
    expect(res.captured).toEqual({
      kind: "wall",
      wall: "2026:10:03 21:14:05",
      offset: "-04:00",
    });
    expect(count(res.data, "2026:10:03 21:14:05")).toBe(1);
    expect(indexOf(res.data, "-04:00")).toBeGreaterThan(-1);
    expect(indexOf(res.data, "0232")).toBeGreaterThan(-1);
    expect(hasGpsMetadata(res.data, "image/heic")).toBe(false);
    for (const n of [
      "iPhone 15 Pro",
      "SERIAL-PARTYREEL-TEST",
      "17.5.1",
      "2026:10:03 21:14:06",
      "2026:10:03 21:20:00",
    ]) {
      expect(indexOf(res.data, n), n).toBe(-1);
    }
  });

  it("is idempotent, and the File path says the same", async () => {
    const once = await stripMetadataBytes(input, "image/heic");
    const twice = await stripMetadataBytes(once.data, "image/heic");
    expect(twice.changed).toBe(false);
    expect(twice.captured).toEqual(once.captured);
    const viaFile = await stripFileMetadata(
      asFile(input, "IMG_0002.HEIC", "image/heic"),
    );
    expect(viaFile.captured).toEqual(once.captured);
    expect(
      Array.from(new Uint8Array(await viaFile.blob.arrayBuffer())),
    ).toEqual(Array.from(once.data));
  });

  it("reads an iPhone-shaped file's time with no zone as a bare wall clock", async () => {
    const res = await stripMetadataBytes(
      fixture("imageio-iphone-shape.heic"),
      "image/heic",
    );
    expect(res.captured).toEqual({
      kind: "wall",
      wall: "2026:09:30 18:04:05",
      offset: null,
    });
  });
});

// ---------------------------------------------------------------------------
// MP4 / MOV
// ---------------------------------------------------------------------------

/** The movie header's creation time in a file, as epoch ms (version 0 or 1), read the long way. */
function mvhdTime(b: Uint8Array): number {
  const i = indexOf(b, "mvhd") + 4;
  const secs =
    b[i] === 1
      ? u32(b, i + 4, false) * 0x100000000 + u32(b, i + 8, false)
      : u32(b, i + 4, false);
  return (secs - 2082844800) * 1000;
}

describe("MOV and MP4: a movie's capture time", () => {
  it("★ an iPhone's (AVFoundation's) QuickTime creation date, not the moment the file was written", async () => {
    const input = fixture("avfoundation-capture.mov");
    expect(mvhdTime(input)).not.toBe(at("2026-10-04T01:14:05Z"));
    const res = await stripMetadataBytes(input, "video/quicktime");
    expect(res.captured).toEqual({
      kind: "instant",
      ms: at("2026-10-04T01:14:05Z"),
    });
  });

  it("★ the stored movie header says the capture time, its metadata box (location, make, model) blanked as before", async () => {
    const input = fixture("avfoundation-capture.mov");
    const res = await stripMetadataBytes(input, "video/quicktime");
    expect(res.data.length).toBe(input.length);
    expect(mvhdTime(res.data)).toBe(at("2026-10-04T01:14:05Z"));
    for (const n of [
      "com.apple.quicktime",
      "iPhone 15 Pro",
      "+37.8199",
      "2026-10-03T21:14:05",
    ]) {
      expect(indexOf(res.data, n), n).toBe(-1);
    }
    // Nothing but the metadata box and the header's one field moved: mdat and every other box byte for byte.
    const mdat = indexOf(input, "mdat");
    expect(indexOf(res.data, "mdat")).toBe(mdat);
    const twice = await stripMetadataBytes(res.data, "video/quicktime");
    expect(twice.changed).toBe(false);
    expect(twice.captured).toEqual(res.captured);
  });

  it("reads ffmpeg's QuickTime keys in udta's metadata box, the header 30 s on rewritten to the start", async () => {
    const input = fixture("ffmpeg-capture.mov");
    expect(mvhdTime(input)).toBe(at("2026-10-04T01:14:35Z"));
    const res = await stripMetadataBytes(input, "video/quicktime");
    expect(res.captured).toEqual({
      kind: "instant",
      ms: at("2026-10-04T01:14:05Z"),
    });
    expect(mvhdTime(res.data)).toBe(at("2026-10-04T01:14:05Z"));
  });

  it("★ an Android's movie header alone, read and left exactly as it was", async () => {
    const input = fixture("ffmpeg-capture.mp4");
    const res = await stripMetadataBytes(input, "video/mp4");
    expect(res.captured).toEqual({
      kind: "instant",
      ms: at("2026-10-04T01:14:05Z"),
    });
    const i = indexOf(input, "mvhd");
    expect(Array.from(res.data.subarray(i - 4, i + 104))).toEqual(
      Array.from(input.subarray(i - 4, i + 104)),
    );
    expect(hasGpsMetadata(res.data, "video/mp4")).toBe(false);
  });

  it("says the same from a File, composed lazily", async () => {
    for (const [name, type] of [
      ["avfoundation-capture.mov", "video/quicktime"],
      ["ffmpeg-capture.mp4", "video/mp4"],
    ] as const) {
      const input = fixture(name);
      const viaFile = await stripFileMetadata(asFile(input, name, type));
      const viaBytes = await stripMetadataBytes(input, type);
      expect(viaFile.captured, name).toEqual(viaBytes.captured);
      expect(
        Array.from(new Uint8Array(await viaFile.blob.arrayBuffer())),
        name,
      ).toEqual(Array.from(viaBytes.data));
    }
  });
});

/** An ISO box. */
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
const be32 = (v: number) => [
  (v >>> 24) & 0xff,
  (v >>> 16) & 0xff,
  (v >>> 8) & 0xff,
  v & 0xff,
];
const FTYP = box("ftyp", [...ascii("isom"), 0, 0, 2, 0, ...ascii("isomiso2")]);
const MDAT = box("mdat", Array(12).fill(9));
const mvhd0 = (secs: number) =>
  box("mvhd", [0, 0, 0, 0, ...be32(secs), ...be32(secs), ...Array(88).fill(0)]);
const mvhd1 = (secs: number) =>
  box("mvhd", [
    1,
    0,
    0,
    0,
    ...be32(Math.floor(secs / 0x100000000)),
    ...be32(secs % 0x100000000),
    ...Array(8).fill(0),
    ...Array(96).fill(0),
  ]);
const MAC = (iso: string) => at(iso) / 1000 + 2082844800;
/** QuickTime metadata: hdlr mdta, keys, and an ilst whose items carry UTF-8 data. */
function qtMeta(
  pairs: [string, string][],
  opts: { iso?: boolean; badIndex?: boolean } = {},
): number[] {
  const hdlr = box("hdlr", [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    ...ascii("mdta"),
    ...Array(12).fill(0),
    0,
  ]);
  const keys = box("keys", [
    0,
    0,
    0,
    0,
    ...be32(pairs.length),
    ...pairs.flatMap(([k]) => [
      ...be32(8 + k.length),
      ...ascii("mdta"),
      ...ascii(k),
    ]),
  ]);
  const ilst = box(
    "ilst",
    pairs.flatMap(([, v], i) => {
      const data = box("data", [0, 0, 0, 1, 0, 0, 0, 0, ...ascii(v)]);
      const idx = opts.badIndex ? 99 : i + 1;
      return [...be32(8 + data.length), ...be32(idx), ...data];
    }),
  );
  return box("meta", [
    ...(opts.iso ? [0, 0, 0, 0] : []),
    ...hdlr,
    ...keys,
    ...ilst,
  ]);
}
const mp4 = (...moovKids: number[][]) =>
  new Uint8Array([...FTYP, ...box("moov", moovKids.flat()), ...MDAT]);

describe("MOV and MP4: every shape the time comes in", () => {
  const strip = (b: Uint8Array) => stripMetadataBytes(b, "video/mp4");

  it("reads a version 1 header, and none from a header never set (zero)", async () => {
    expect(
      (await strip(mp4(mvhd1(MAC("2026-10-04T01:14:05Z"))))).captured,
    ).toEqual({
      kind: "instant",
      ms: at("2026-10-04T01:14:05Z"),
    });
    expect((await strip(mp4(mvhd0(0)))).captured).toBeUndefined();
  });

  it("prefers the QuickTime date, in either meta shape, with or without seconds' fractions and a colon in its zone", async () => {
    const header = mvhd0(MAC("2026-10-04T05:00:00Z"));
    for (const [date, iso] of [
      ["2026-10-03T21:14:05-0400", false],
      ["2026-10-03T21:14:05-04:00", true],
      ["2026-10-04T01:14:05.250Z", false],
    ] as const) {
      const res = await strip(
        mp4(
          header,
          qtMeta(
            [
              ["com.apple.quicktime.make", "Apple"],
              ["com.apple.quicktime.creationdate", date],
            ],
            { iso },
          ),
        ),
      );
      expect(
        Math.floor(
          res.captured!.kind === "instant" ? res.captured!.ms / 1000 : 0,
        ),
        date,
      ).toBe(at("2026-10-04T01:14:05Z") / 1000);
    }
  });

  it("falls back to the header when the QuickTime date is absent, unreadable or misindexed, and never fails the strip", async () => {
    const header = mvhd0(MAC("2026-10-04T05:00:00Z"));
    for (const meta of [
      qtMeta([["com.apple.quicktime.make", "Apple"]]),
      qtMeta([["com.apple.quicktime.creationdate", "last tuesday"]]),
      qtMeta(
        [["com.apple.quicktime.creationdate", "2026-10-03T21:14:05-0400"]],
        { badIndex: true },
      ),
    ]) {
      const res = await strip(mp4(header, meta));
      expect(res.stripped).toBe(true);
      expect(res.captured).toEqual({
        kind: "instant",
        ms: at("2026-10-04T05:00:00Z"),
      });
    }
  });

  it("never writes a header it cannot hold (version 0 past 2040), and leaves a header alone with no QuickTime date", async () => {
    const res = await strip(
      mp4(
        mvhd0(MAC("2026-10-04T05:00:00Z")),
        qtMeta([["com.apple.quicktime.creationdate", "2041-01-01T00:00:00Z"]]),
      ),
    );
    expect(res.captured).toEqual({
      kind: "instant",
      ms: at("2041-01-01T00:00:00Z"),
    });
    expect(mvhdTime(res.data)).toBe(at("2026-10-04T05:00:00Z"));
    const plain = mp4(mvhd0(MAC("2026-10-04T05:00:00Z")));
    const untouched = await strip(plain);
    expect(untouched.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// WebM
// ---------------------------------------------------------------------------

describe("WebM: Info's DateUTC", () => {
  it("★ reads it, keeps Info byte for byte, and still voids the Tags", async () => {
    const input = fixture("ffmpeg-capture.webm");
    const res = await stripMetadataBytes(input, "video/webm");
    expect(res.captured).toEqual({
      kind: "instant",
      ms: at("2026-10-04T01:14:05Z"),
    });
    expect(res.data.length).toBe(input.length);
    const info = indexOf(input, [0x15, 0x49, 0xa9, 0x66]);
    expect(Array.from(res.data.subarray(info, info + 40))).toEqual(
      Array.from(input.subarray(info, info + 40)),
    );
    expect(indexOf(res.data, "+37.8199")).toBe(-1);
    expect(indexOf(res.data, "iPhone 15 Pro")).toBe(-1);
    const viaFile = await stripFileMetadata(
      asFile(input, "clip.webm", "video/webm"),
    );
    expect(viaFile.captured).toEqual(res.captured);
  });

  it("reads none from a browser's MediaRecorder, which writes no DateUTC", async () => {
    const res = await stripMetadataBytes(
      fixture("chrome-mediarecorder.webm"),
      "video/webm",
    );
    expect(res.stripped).toBe(true);
    expect(res.captured).toBeUndefined();
  });
});
