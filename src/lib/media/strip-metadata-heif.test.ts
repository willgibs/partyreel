/**
 * HEIC / HEIF / AVIF: the strip's item-based path. Real files first (encoded by Apple's own
 * ImageIO, the iPhone's encoder family), then synthesized structures for the shapes no
 * encoder on hand writes (idat, iloc versions 1 and 2, split extents) and every way the
 * walk must fail open.
 *
 * The fixtures (strip-metadata-fixtures/, a few KB each, from a synthetic test-pattern
 * frame, so no third-party picture is committed):
 *  - imageio-iphone-shape.heic: ImageIO HEIC, 64x48, the iPhone's shape: orientation as
 *    irot (rotation 6), an Exif item with GPS, make, model, lens and body serial, an XMP
 *    item describing the picture (city, country, creator tool), and an Apple HDR gain map
 *    (an auxiliary hvc1 image) with its own XMP item (HDRGainMapVersion).
 *  - imageio.avif: ImageIO AVIF with the same Exif and picture XMP.
 * Proved outside the suite too (the lane's Handoff): ImageIO decodes each before and after
 * to identical pixels and orientation, finds the gain map identical, and reads no GPS,
 * make, model, serial or location after.
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

function indexOf(haystack: Uint8Array, needle: string | number[]): number {
  const n = typeof needle === "string" ? ascii(needle) : needle;
  outer: for (let i = 0; i <= haystack.length - n.length; i++) {
    for (let j = 0; j < n.length; j++)
      if (haystack[i + j] !== n[j]) continue outer;
    return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// A test-side oracle: the items and their extents, read independently of the module
// ---------------------------------------------------------------------------

type OracleItem = {
  type: string;
  contentType: string;
  extents: [number, number][];
};

function u16(b: Uint8Array, o: number) {
  return (b[o] << 8) | b[o + 1];
}
function u32(b: Uint8Array, o: number) {
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}
function children(b: Uint8Array, start: number, end: number) {
  const out: { type: string; at: number; body: number; end: number }[] = [];
  for (let p = start; p + 8 <= end; ) {
    const size = u32(b, p);
    out.push({
      type: String.fromCharCode(...b.subarray(p + 4, p + 8)),
      at: p,
      body: p + 8,
      end: p + size,
    });
    p += size;
  }
  return out;
}

/** iinf (v0) + iloc (v0, 4-byte offsets and lengths, no base): what ImageIO writes. */
function oracleItems(b: Uint8Array): Map<number, OracleItem> {
  const meta = children(b, 0, b.length).find((x) => x.type === "meta")!;
  const kids = children(b, meta.body + 4, meta.end);
  const items = new Map<number, OracleItem>();
  const iinf = kids.find((k) => k.type === "iinf")!;
  for (const e of children(b, iinf.body + 6, iinf.end)) {
    const id = u16(b, e.body + 4);
    const type = String.fromCharCode(...b.subarray(e.body + 8, e.body + 12));
    let p = e.body + 12;
    while (b[p] !== 0) p++; // item_name
    let contentType = "";
    for (p++; type === "mime" && b[p] !== 0; p++)
      contentType += String.fromCharCode(b[p]);
    items.set(id, { type, contentType, extents: [] });
  }
  const iloc = kids.find((k) => k.type === "iloc")!;
  expect(b[iloc.body]).toBe(0); // version 0
  expect(b[iloc.body + 4]).toBe(0x44); // offset_size 4, length_size 4
  let p = iloc.body + 8;
  for (let n = u16(b, iloc.body + 6); n > 0; n--) {
    const id = u16(b, p);
    const count = u16(b, p + 4);
    p += 6;
    for (let i = 0; i < count; i++, p += 8) {
      items.get(id)!.extents.push([u32(b, p), u32(b, p) + u32(b, p + 4)]);
    }
  }
  return items;
}

/** The Orientation in an Exif item's TIFF (after its 4-byte offset field). */
function exifItemOrientation(
  b: Uint8Array,
  [start]: [number, number],
): number | null {
  const tiff = start + 4 + u32(b, start);
  const le = b[tiff] === 0x49;
  const r16 = (o: number) => (le ? b[o] | (b[o + 1] << 8) : u16(b, o));
  const r32 = (o: number) =>
    le
      ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
      : u32(b, o);
  const ifd = tiff + r32(tiff + 4);
  for (let i = 0; i < r16(ifd); i++) {
    const e = ifd + 2 + i * 12;
    if (r16(e) === 0x0112) return r16(e + 8);
  }
  return null;
}

// What the fixtures carry as text (their GPS is binary, in the Exif's GPS IFD, which
// hasGpsMetadata reads).
const IDENTITY_NEEDLES = [
  "iPhone 15 Pro",
  "SERIAL-PARTYREEL-TEST",
  "Apple",
  "San Francisco",
  "photoshop:City",
  "CreatorTool",
];

// ---------------------------------------------------------------------------
// Real files
// ---------------------------------------------------------------------------

describe("HEIC: an ImageIO file of the iPhone's shape", () => {
  const input = fixture("imageio-iphone-shape.heic");
  const items = oracleItems(input);
  const byType = (t: string, ct = "") =>
    [...items.entries()].filter(
      ([, v]) => v.type === t && v.contentType === ct,
    );
  const [[, exif]] = byType("Exif");
  const xmps = byType("mime", "application/rdf+xml");
  // The gain map is the item an auxl reference points FROM; its XMP describes it.
  const gainMapXmp = xmps.find(([id]) => id === 5)![1];
  const pictureXmp = xmps.find(([id]) => id === 3)![1];

  it("is what the fixture says it is", () => {
    expect(byType("hvc1").length).toBe(2); // the picture and its gain map
    expect(
      indexOf(input, "urn:com:apple:photo:2020:aux:hdrgainmap"),
    ).toBeGreaterThan(-1);
    expect(exifItemOrientation(input, exif.extents[0])).toBe(6);
    for (const n of IDENTITY_NEEDLES)
      expect(indexOf(input, n), n).toBeGreaterThan(-1);
    expect(hasGpsMetadata(input, "image/heic")).toBe(true);
  });

  it("removes GPS, device and picture metadata in place, every other byte identical", async () => {
    const res = await stripMetadataBytes(input, "image/heic");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    expect(out.length).toBe(input.length);
    for (const n of IDENTITY_NEEDLES) expect(indexOf(out, n), n).toBe(-1);
    expect(hasGpsMetadata(out, "image/heic")).toBe(false);
    // Only the Exif item and the picture's XMP item changed: not one byte of any box, of
    // iloc, of the image items or of the gain map moved or changed (so the decoded pixels
    // cannot differ; ImageIO confirms it outside the suite).
    const rewritten = [...exif.extents, ...pictureXmp.extents];
    for (let i = 0; i < input.length; i++) {
      if (input[i] === out[i]) continue;
      expect(
        rewritten.some(([s, e]) => i >= s && i < e),
        `byte ${i}`,
      ).toBe(true);
    }
    for (const [, item] of byType("hvc1")) {
      for (const [s, e] of item.extents) {
        expect(Array.from(out.subarray(s, e))).toEqual(
          Array.from(input.subarray(s, e)),
        );
      }
    }
    // The gain map's XMP is rendering data, kept byte for byte.
    const [gs, ge] = gainMapXmp.extents[0];
    expect(Array.from(out.subarray(gs, ge))).toEqual(
      Array.from(input.subarray(gs, ge)),
    );
    expect(indexOf(out, "HDRGainMapVersion")).toBeGreaterThan(-1);
  });

  it("rebuilds the Exif item as a minimal one that keeps the orientation", async () => {
    const out = (await stripMetadataBytes(input, "image/heic")).data;
    const [s, e] = exif.extents[0];
    expect(Array.from(out.subarray(s, s + 10))).toEqual([
      0,
      0,
      0,
      6,
      ...ascii("Exif"),
      0,
      0,
    ]);
    expect(exifItemOrientation(out, exif.extents[0])).toBe(6);
    // Past the 36-byte minimal block, the item is zeros to its original length.
    expect(out.subarray(s + 36, e).every((x) => x === 0)).toBe(true);
    // The picture's XMP is a valid, empty packet padded with whitespace.
    const [xs, xe] = pictureXmp.extents[0];
    const text = String.fromCharCode(...out.subarray(xs, xe));
    expect(text.trimEnd()).toBe('<x:xmpmeta xmlns:x="adobe:ns:meta/"/>');
  });

  it("is idempotent (a second pass changes nothing)", async () => {
    const once = await stripMetadataBytes(input, "image/heic");
    const twice = await stripMetadataBytes(once.data, "image/heic");
    expect(twice.stripped).toBe(true);
    expect(twice.changed).toBe(false);
    expect(twice.data).toBe(once.data);
  });

  it("strips the same under image/heif", async () => {
    const heic = await stripMetadataBytes(input, "image/heic");
    const heif = await stripMetadataBytes(input, "image/heif");
    expect(Array.from(heif.data)).toEqual(Array.from(heic.data));
  });

  it("composes the same bytes from a File (the browser path) as from memory", async () => {
    const file = new File([input as BlobPart], "IMG_0001.HEIC", {
      type: "image/heic",
    });
    const res = await stripFileMetadata(file);
    expect(res.stripped).toBe(true);
    expect(res.blob).not.toBe(file);
    expect(res.blob.type).toBe("image/heic");
    expect(res.blob.size).toBe(file.size);
    const viaFile = new Uint8Array(await res.blob.arrayBuffer());
    const viaBytes = await stripMetadataBytes(input, "image/heic");
    expect(Array.from(viaFile)).toEqual(Array.from(viaBytes.data));
  });

  it("hands back the original File when there is nothing left to strip", async () => {
    const data = (await stripMetadataBytes(input, "image/heic")).data;
    const file = new File([data as BlobPart], "clean.heic", {
      type: "image/heic",
    });
    const res = await stripFileMetadata(file);
    expect(res.stripped).toBe(true);
    expect(res.blob).toBe(file);
  });
});

describe("AVIF: an ImageIO file", () => {
  const input = fixture("imageio.avif");

  it("removes GPS, device and picture metadata in place", async () => {
    expect(hasGpsMetadata(input, "image/avif")).toBe(true);
    const res = await stripMetadataBytes(input, "image/avif");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    expect(res.data.length).toBe(input.length);
    for (const n of IDENTITY_NEEDLES) expect(indexOf(res.data, n), n).toBe(-1);
    expect(hasGpsMetadata(res.data, "image/avif")).toBe(false);
    const items = oracleItems(input);
    const [, av01] = [...items.entries()].find(([, v]) => v.type === "av01")!;
    const [s, e] = av01.extents[0];
    expect(Array.from(res.data.subarray(s, e))).toEqual(
      Array.from(input.subarray(s, e)),
    );
    const again = await stripMetadataBytes(res.data, "image/avif");
    expect(again.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Synthesized structures
// ---------------------------------------------------------------------------

const be16 = (v: number) => [(v >>> 8) & 0xff, v & 0xff];
const be32 = (v: number) => [
  (v >>> 24) & 0xff,
  (v >>> 16) & 0xff,
  (v >>> 8) & 0xff,
  v & 0xff,
];
const be64 = (v: number) => [
  ...be32(Math.floor(v / 2 ** 32)),
  ...be32(v >>> 0),
];
const beN = (n: number, v: number) =>
  n === 0 ? [] : n === 2 ? be16(v) : n === 4 ? be32(v) : be64(v);

function box(type: string, ...payload: (number[] | Uint8Array)[]): number[] {
  const body = payload.flatMap((p) => Array.from(p));
  return [...be32(8 + body.length), ...ascii(type), ...body];
}
const fullBox = (
  type: string,
  version: number,
  flags: number,
  ...payload: number[][]
) =>
  box(
    type,
    [version, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff],
    ...payload,
  );

/** A little-endian TIFF: IFD0 = Orientation + Make ("Apple") + a GPS IFD pointer; GPS IFD
 *  = GPSLatitudeRef "N". */
function exifTiff(orientation: number): number[] {
  // header 8 | IFD0: count 2 + 3 entries x 12 + next 4 = 42 -> 50 | "Apple\0" 6 -> 56 | GPS IFD
  // prettier-ignore
  return [
    ...ascii("II"), 42, 0, 8, 0, 0, 0,
    3, 0,
    0x12, 0x01, 3, 0, 1, 0, 0, 0, orientation, 0, 0, 0, // Orientation, SHORT
    0x0f, 0x01, 2, 0, 6, 0, 0, 0, 50, 0, 0, 0, // Make, ASCII x6 at 50
    0x25, 0x88, 4, 0, 1, 0, 0, 0, 56, 0, 0, 0, // the GPS IFD pointer, at 56
    0, 0, 0, 0, // no next IFD
    ...ascii("Apple"), 0,
    1, 0, 0x01, 0x00, 0x02, 0, 0x02, 0, 0, 0, 0x4e, 0, 0, 0, 0, 0, 0, 0, // GPSLatitudeRef "N"
  ];
}
const exifItem = (orientation = 6) => [
  ...be32(6),
  ...ascii("Exif"),
  0,
  0,
  ...exifTiff(orientation),
];
const XMP_WITH_GPS = ascii(
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF><rdf:Description exif:GPSLatitude="37,49.194N"/></rdf:RDF></x:xmpmeta>',
);
const XMP_PLAIN = ascii(
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF><rdf:Description HDRGainMap:HDRGainMapVersion="65536"/></rdf:RDF></x:xmpmeta>',
);
const IMAGE_BYTES = Array.from({ length: 40 }, (_, i) => (i * 37 + 11) & 0xff);

type SynthItem = {
  id: number;
  type: string;
  data: number[];
  contentType?: string;
  contentEncoding?: string;
  protection?: number;
  method?: number; // iloc construction_method
  dataRef?: number;
  split?: number; // extents to cut the data into
  place?: "mdat" | "idat";
};

type SynthOptions = {
  items: SynthItem[];
  refs?: { type: string; from: number; to: number[] }[];
  ilocVersion?: 0 | 1 | 2;
  sizes?: { offset: number; length: number; base: number; index: number };
  infeVersion?: 2 | 3;
  iinfVersion?: 0 | 1;
  handler?: string;
  drefFlags?: number; // a dref with one 'url ' entry carrying these flags
  extentOverride?: (
    id: number,
    extents: [number, number][],
  ) => [number, number][];
};

/** Build a whole HEIF: ftyp, meta (hdlr, dinf, pitm, iinf, iref, iprp, iloc, idat), mdat. */
function buildHeif(o: SynthOptions): Uint8Array {
  const v = o.ilocVersion ?? 0;
  const sz = o.sizes ?? { offset: 4, length: 4, base: 0, index: 0 };
  const infeV = o.infeVersion ?? 2;
  const idLen = v === 2 ? 4 : 2;
  const idat: number[] = [];
  const mdat: number[] = [];
  const placed = new Map<number, [number, number][]>(); // id -> [offset in its source, length]
  for (const it of o.items) {
    const target = it.place === "idat" ? idat : mdat;
    const parts = it.split ?? 1;
    const step = Math.ceil(it.data.length / parts);
    const extents: [number, number][] = [];
    for (let i = 0; i < it.data.length; i += step) {
      extents.push([target.length, Math.min(step, it.data.length - i)]);
      target.push(...it.data.slice(i, i + step));
    }
    placed.set(it.id, extents);
  }
  const ftyp = box("ftyp", ascii("heic"), be32(0), ascii("mif1heic"));
  const metaFor = (mdatStart: number) => {
    const infes = o.items.map((it) =>
      fullBox(
        "infe",
        infeV,
        0,
        infeV === 2 ? be16(it.id) : be32(it.id),
        be16(it.protection ?? 0),
        ascii(it.type),
        [0],
        it.type === "mime"
          ? [
              ...ascii(it.contentType ?? ""),
              0,
              ...ascii(it.contentEncoding ?? ""),
              0,
            ]
          : [],
      ),
    );
    const iinfV = o.iinfVersion ?? 0;
    const iinf = fullBox(
      "iinf",
      iinfV,
      0,
      iinfV === 0 ? be16(o.items.length) : be32(o.items.length),
      ...infes,
    );
    const ilocItems = o.items.flatMap((it) => {
      const base = it.place === "idat" ? 0 : sz.base > 0 ? mdatStart : 0;
      let extents = placed
        .get(it.id)!
        .map(([off, len]): [number, number] => [
          (it.place === "idat" ? 0 : mdatStart) + off - base,
          len,
        ]);
      if (o.extentOverride) extents = o.extentOverride(it.id, extents);
      return [
        ...(v === 2 ? be32(it.id) : be16(it.id)),
        ...(v === 0 ? [] : be16(it.method ?? (it.place === "idat" ? 1 : 0))),
        ...be16(it.dataRef ?? 0),
        ...beN(sz.base, base),
        ...be16(extents.length),
        ...extents.flatMap(([off, len]) => [
          ...beN(sz.index, 0),
          ...beN(sz.offset, off),
          ...beN(sz.length, len),
        ]),
      ];
    });
    const iloc = fullBox(
      "iloc",
      v,
      0,
      [(sz.offset << 4) | sz.length, (sz.base << 4) | (v === 0 ? 0 : sz.index)],
      v === 2 ? be32(o.items.length) : be16(o.items.length),
      ilocItems,
    );
    const refs = o.refs ?? [];
    const iref = fullBox(
      "iref",
      v === 2 ? 1 : 0,
      0,
      ...refs.map((r) =>
        box(
          r.type,
          idLen === 4 ? be32(r.from) : be16(r.from),
          be16(r.to.length),
          r.to.flatMap((t) => (idLen === 4 ? be32(t) : be16(t))),
        ),
      ),
    );
    const dref = fullBox(
      "dref",
      0,
      0,
      be32(1),
      fullBox("url ", 0, o.drefFlags ?? 1),
    );
    return box(
      "meta",
      [0, 0, 0, 0],
      fullBox(
        "hdlr",
        0,
        0,
        be32(0),
        ascii(o.handler ?? "pict"),
        be32(0),
        be32(0),
        be32(0),
        [0],
      ),
      box("dinf", dref),
      fullBox("pitm", 0, 0, be16(1)),
      iinf,
      iref,
      box(
        "iprp",
        box("ipco", fullBox("ispe", 0, 0, be32(8), be32(5))),
        fullBox("ipma", 0, 0, be32(1), be16(1), [1, 0x81]),
      ),
      iloc,
      ...(idat.length > 0 ? [box("idat", idat)] : []),
    );
  };
  const metaLen = metaFor(0).length;
  const mdatStart = ftyp.length + metaLen + 8;
  return new Uint8Array([...ftyp, ...metaFor(mdatStart), ...box("mdat", mdat)]);
}

const IMAGE: SynthItem = { id: 1, type: "hvc1", data: IMAGE_BYTES };
const EXIF: SynthItem = { id: 2, type: "Exif", data: exifItem() };
const XMP: SynthItem = {
  id: 3,
  type: "mime",
  contentType: "application/rdf+xml",
  data: XMP_WITH_GPS,
};
const DESCRIBES = [
  { type: "cdsc", from: 2, to: [1] },
  { type: "cdsc", from: 3, to: [1] },
];

async function expectScrubbed(input: Uint8Array) {
  expect(hasGpsMetadata(input, "image/heic")).toBe(true);
  const res = await stripMetadataBytes(input, "image/heic");
  expect(res.stripped).toBe(true);
  expect(res.changed).toBe(true);
  expect(res.data.length).toBe(input.length);
  expect(indexOf(res.data, "Apple")).toBe(-1);
  expect(indexOf(res.data, "GPSLatitude")).toBe(-1);
  expect(hasGpsMetadata(res.data, "image/heic")).toBe(false);
  // The image item's bytes are untouched wherever they sit.
  expect(indexOf(res.data, IMAGE_BYTES)).toBe(indexOf(input, IMAGE_BYTES));
  const again = await stripMetadataBytes(res.data, "image/heic");
  expect(again.changed).toBe(false);
  return res.data;
}

async function expectFailOpen(input: Uint8Array) {
  const res = await stripMetadataBytes(input, "image/heic");
  expect(res.stripped).toBe(false);
  expect(res.changed).toBe(false);
  expect(res.data).toBe(input);
}

describe("HEIF structures the encoders on hand do not write", () => {
  it("scrubs the baseline shape (iloc v0, iinf v0, infe v2)", async () => {
    await expectScrubbed(
      buildHeif({ items: [IMAGE, EXIF, XMP], refs: DESCRIBES }),
    );
  });

  it("scrubs an Exif item stored in idat (construction method 1)", async () => {
    const input = buildHeif({
      items: [IMAGE, { ...EXIF, place: "idat" }, XMP],
      refs: DESCRIBES,
      ilocVersion: 1,
    });
    const out = await expectScrubbed(input);
    // The rewritten Exif sits inside the meta box's idat, where it was.
    const idat = indexOf(out, "idat");
    expect(indexOf(out, [0, 0, 0, 6, ...ascii("Exif")])).toBe(idat + 4);
  });

  it("reads iloc v2 / iinf v1 / infe v3 (32-bit IDs) with 8-byte fields, a base offset and an index", async () => {
    await expectScrubbed(
      buildHeif({
        items: [IMAGE, EXIF, XMP],
        refs: DESCRIBES,
        ilocVersion: 2,
        iinfVersion: 1,
        infeVersion: 3,
        sizes: { offset: 8, length: 8, base: 8, index: 4 },
      }),
    );
  });

  it("rewrites an Exif item split across extents as one item", async () => {
    const out = await expectScrubbed(
      buildHeif({
        items: [IMAGE, { ...EXIF, split: 3 }, XMP],
        refs: DESCRIBES,
      }),
    );
    expect(
      indexOf(out, [0, 0, 0, 6, ...ascii("Exif"), 0, 0, ...ascii("II")]),
    ).toBeGreaterThan(-1);
  });

  it("accepts data_reference_index 1 when the dref entry is self-contained", async () => {
    await expectScrubbed(
      buildHeif({
        items: [IMAGE, { ...EXIF, dataRef: 1 }, XMP],
        refs: DESCRIBES,
        drefFlags: 1,
      }),
    );
  });

  it("keeps an auxiliary image's XMP without GPS, and blanks one carrying GPS", async () => {
    const aux: SynthItem = {
      id: 4,
      type: "hvc1",
      data: IMAGE_BYTES.map((x) => x ^ 0x5a),
    };
    const refs = [
      ...DESCRIBES,
      { type: "auxl", from: 4, to: [1] },
      { type: "cdsc", from: 5, to: [4] },
    ];
    const plainAuxXmp: SynthItem = {
      id: 5,
      type: "mime",
      contentType: "application/rdf+xml",
      data: XMP_PLAIN,
    };
    const kept = await stripMetadataBytes(
      buildHeif({ items: [IMAGE, EXIF, XMP, aux, plainAuxXmp], refs }),
      "image/heic",
    );
    expect(indexOf(kept.data, "HDRGainMapVersion")).toBeGreaterThan(-1);
    const gpsAuxXmp = { ...plainAuxXmp, data: XMP_WITH_GPS };
    const gpsXmpOnly = buildHeif({
      items: [IMAGE, EXIF, { ...XMP, data: XMP_PLAIN }, aux, gpsAuxXmp],
      refs,
    });
    const res = await stripMetadataBytes(gpsXmpOnly, "image/heic");
    expect(res.changed).toBe(true);
    expect(indexOf(res.data, "GPSLatitude")).toBe(-1);
    expect(hasGpsMetadata(res.data, "image/heic")).toBe(false);
  });

  it("zero-fills an XMP item whose content is encoded (it cannot hold plain text)", async () => {
    const input = buildHeif({
      items: [IMAGE, EXIF, { ...XMP, contentEncoding: "deflate" }],
      refs: DESCRIBES,
    });
    const res = await stripMetadataBytes(input, "image/heic");
    const at = indexOf(input, XMP_WITH_GPS);
    expect(
      res.data.subarray(at, at + XMP_WITH_GPS.length).every((x) => x === 0),
    ).toBe(true);
  });

  it("leaves a file with no metadata items untouched (stripped, unchanged)", async () => {
    const input = buildHeif({ items: [IMAGE] });
    const res = await stripMetadataBytes(input, "image/heic");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(false);
    expect(res.data).toBe(input);
  });

  describe("fails open (the original back, stripped:false) when the rewrite is not provably safe", () => {
    it("an Exif item placed by item reference (construction method 2)", async () => {
      await expectFailOpen(
        buildHeif({
          items: [IMAGE, { ...EXIF, method: 2 }, XMP],
          refs: DESCRIBES,
          ilocVersion: 1,
        }),
      );
    });

    it("an Exif item in another file (a dref entry that is not self-contained)", async () => {
      await expectFailOpen(
        buildHeif({
          items: [IMAGE, { ...EXIF, dataRef: 1 }, XMP],
          refs: DESCRIBES,
          drefFlags: 0,
        }),
      );
    });

    it("an Exif extent sharing bytes with the image item", async () => {
      await expectFailOpen(
        buildHeif({
          items: [IMAGE, EXIF, XMP],
          refs: DESCRIBES,
          extentOverride: (id, ex) =>
            id === 2 ? [[ex[0][0] - 8, ex[0][1]]] : ex,
        }),
      );
    });

    it("an Exif extent outside mdat (pointing into the item structure)", async () => {
      await expectFailOpen(
        buildHeif({
          items: [IMAGE, EXIF, XMP],
          refs: DESCRIBES,
          extentOverride: (id, ex) => (id === 2 ? [[40, ex[0][1]]] : ex),
        }),
      );
    });

    it("an Exif extent of unbounded length (0)", async () => {
      await expectFailOpen(
        buildHeif({
          items: [IMAGE, EXIF, XMP],
          refs: DESCRIBES,
          extentOverride: (id, ex) => (id === 2 ? [[ex[0][0], 0]] : ex),
        }),
      );
    });

    it("a protected (encrypted) Exif item", async () => {
      await expectFailOpen(
        buildHeif({
          items: [IMAGE, { ...EXIF, protection: 1 }, XMP],
          refs: DESCRIBES,
        }),
      );
    });

    it("a handler that is not 'pict', a truncated file, a missing ftyp, garbage", async () => {
      await expectFailOpen(
        buildHeif({ items: [IMAGE, EXIF], refs: DESCRIBES, handler: "vide" }),
      );
      const whole = buildHeif({ items: [IMAGE, EXIF, XMP], refs: DESCRIBES });
      await expectFailOpen(whole.subarray(0, whole.length - 10));
      await expectFailOpen(whole.subarray(indexOf(whole, "meta") - 4));
      await expectFailOpen(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it("a JPEG or an MP4 labeled HEIC (never re-routed by guesswork)", async () => {
      await expectFailOpen(
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xd9]),
      );
      const mp4 = new Uint8Array([
        ...box("ftyp", ascii("isom"), be32(0), ascii("isom")),
        ...box("moov", box("mvhd", Array(20).fill(1))),
        ...box("mdat", [1, 2, 3]),
      ]);
      await expectFailOpen(mp4);
    });
  });
});
