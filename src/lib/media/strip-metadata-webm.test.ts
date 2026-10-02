/**
 * WebM (EBML / Matroska): the strip's Tags-to-Void path. Real files first, then
 * synthesized element trees for the shapes and failures the real ones do not reach.
 *
 * The fixtures (strip-metadata-fixtures/, a few KB each):
 *  - ffmpeg-tags.webm: ffmpeg 7 (libvpx-vp9 + libopus, a test pattern) with the tags a MOV
 *    carries over when converted: LOCATION, com.apple.quicktime.location.ISO6709, make,
 *    model, and an Info Title; SeekHead and Cues point past the Tags element.
 *  - ffmpeg-live.webm: the same muxer writing to a pipe: an unknown-size Segment.
 *  - chrome-mediarecorder.webm: Chrome's MediaRecorder (VP8 + Opus from a canvas and an
 *    oscillator): an unknown-size Segment of unknown-size Clusters, and no Tags at all.
 * Proved outside the suite too (the lane's Handoff): ffmpeg decodes every frame of each
 * before and after to the same framemd5 digest, and reads none of the tags after.
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
// A test-side oracle: element headers and the Segment's children, read independently
// ---------------------------------------------------------------------------

const ID = {
  EBML: 0x1a45dfa3,
  DocType: 0x4282,
  Segment: 0x18538067,
  SeekHead: 0x114d9b74,
  Info: 0x1549a966,
  Tracks: 0x1654ae6b,
  Cluster: 0x1f43b675,
  Cues: 0x1c53bb6b,
  Tags: 0x1254c367,
  Tag: 0x7373,
  SimpleTag: 0x67c8,
  TagName: 0x45a3,
  TagString: 0x4487,
  Timestamp: 0xe7,
  SimpleBlock: 0xa3,
  Void: 0xec,
};

type Head = { id: number; headerLen: number; size: number | null };

function head(b: Uint8Array, p: number): Head {
  const first = b[p];
  const idLen = first >= 0x80 ? 1 : first >= 0x40 ? 2 : first >= 0x20 ? 3 : 4;
  let id = 0;
  for (let i = 0; i < idLen; i++) id = id * 256 + b[p + i];
  const s = p + idLen;
  let len = 1;
  while (!(b[s] & (0x80 >> (len - 1)))) len++;
  let v = b[s] & (0xff >> len);
  let unknown = v === 0xff >> len;
  for (let i = 1; i < len; i++) {
    v = v * 256 + b[s + i];
    if (b[s + i] !== 0xff) unknown = false;
  }
  return { id, headerLen: idLen + len, size: unknown ? null : v };
}

/** The Segment's top-level children with KNOWN sizes, as [id, start, end]. */
function segmentChildren(b: Uint8Array): [number, number, number][] {
  let p = 0;
  const ebml = head(b, p);
  p += ebml.headerLen + ebml.size!;
  const seg = head(b, p);
  expect(seg.id).toBe(ID.Segment);
  p += seg.headerLen;
  const out: [number, number, number][] = [];
  while (p < b.length) {
    const h = head(b, p);
    expect(h.size, `element at ${p}`).not.toBeNull();
    out.push([h.id, p, p + h.headerLen + h.size!]);
    p += h.headerLen + h.size!;
  }
  return out;
}

const LOCATION_NEEDLES = [
  "LOCATION",
  "ISO6709",
  "+37.8199-122.4783",
  "iPhone 15 Pro",
  "QUICKTIME",
];

// ---------------------------------------------------------------------------
// Real files
// ---------------------------------------------------------------------------

describe.each([
  [
    "ffmpeg-tags.webm",
    "a known-size Segment, SeekHead and Cues pointing past Tags",
  ],
  ["ffmpeg-live.webm", "an unknown-size Segment written to a pipe"],
])("WebM: %s (%s)", (name) => {
  const input = fixture(name);
  const [, tagsStart, tagsEnd] = segmentChildren(input).find(
    ([id]) => id === ID.Tags,
  )!;

  it("is what the fixture says it is", () => {
    expect(indexOf(input, "LOCATION")).toBeGreaterThan(tagsStart);
    expect(hasGpsMetadata(input, "video/webm")).toBe(true);
  });

  it("turns Tags into a Void of exactly its span, every other byte identical", async () => {
    const res = await stripMetadataBytes(input, "video/webm");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(true);
    const out = res.data;
    expect(out.length).toBe(input.length);
    for (const n of LOCATION_NEEDLES) expect(indexOf(out, n), n).toBe(-1);
    expect(hasGpsMetadata(out, "video/webm")).toBe(false);
    for (let i = 0; i < input.length; i++) {
      if (i < tagsStart || i >= tagsEnd)
        expect(out[i], `byte ${i}`).toBe(input[i]);
    }
    // In its place a Void element whose own header spans it exactly, payload zeroed, so
    // every element after it (Clusters, Cues) still starts where SeekHead and Cues say.
    const v = head(out, tagsStart);
    expect(v.id).toBe(ID.Void);
    expect(tagsStart + v.headerLen + v.size!).toBe(tagsEnd);
    expect(
      out.subarray(tagsStart + v.headerLen, tagsEnd).every((x) => x === 0),
    ).toBe(true);
    expect(segmentChildren(out).map(([id]) => id)).toEqual(
      segmentChildren(input).map(([id]) => (id === ID.Tags ? ID.Void : id)),
    );
  });

  it("is idempotent", async () => {
    const once = await stripMetadataBytes(input, "video/webm");
    const twice = await stripMetadataBytes(once.data, "video/webm");
    expect(twice.stripped).toBe(true);
    expect(twice.changed).toBe(false);
  });

  it("composes the same bytes from a File (the browser path) as from memory", async () => {
    const file = new File([input as BlobPart], "clip.webm", {
      type: "video/webm",
    });
    const res = await stripFileMetadata(file);
    expect(res.stripped).toBe(true);
    expect(res.blob.size).toBe(file.size);
    expect(res.blob.type).toBe("video/webm");
    const viaFile = new Uint8Array(await res.blob.arrayBuffer());
    const viaBytes = await stripMetadataBytes(input, "video/webm");
    expect(Array.from(viaFile)).toEqual(Array.from(viaBytes.data));
  });
});

describe("WebM: Chrome's MediaRecorder (unknown-size Segment and Clusters, no Tags)", () => {
  const input = fixture("chrome-mediarecorder.webm");

  it("walks every unknown-size Cluster to the end and leaves the file as it is", async () => {
    expect(
      indexOf(input, [0x1f, 0x43, 0xb6, 0x75, 0x01, 0xff]),
    ).toBeGreaterThan(-1);
    const res = await stripMetadataBytes(input, "video/webm");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(false);
    expect(res.data).toBe(input);
    expect(hasGpsMetadata(input, "video/webm")).toBe(false);
  });

  it("hands the browser path its original File back", async () => {
    const file = new File([input as BlobPart], "clip.webm", {
      type: "video/webm",
    });
    const res = await stripFileMetadata(file);
    expect(res.stripped).toBe(true);
    expect(res.blob).toBe(file);
  });
});

// ---------------------------------------------------------------------------
// Synthesized element trees
// ---------------------------------------------------------------------------

function idBytes(id: number): number[] {
  const out: number[] = [];
  for (let v = id; v > 0; v = Math.floor(v / 256)) out.unshift(v % 256);
  return out;
}
function sizeVint(n: number): number[] {
  for (let len = 1; len <= 8; len++) {
    if (n <= 2 ** (7 * len) - 2) {
      const out: number[] = [];
      let v = n;
      for (let i = 0; i < len; i++) {
        out.unshift(v % 256);
        v = Math.floor(v / 256);
      }
      out[0] |= 0x80 >> (len - 1);
      return out;
    }
  }
  throw new Error("too big");
}
const el = (id: number, ...payload: number[][]) => {
  const body = payload.flat();
  return [...idBytes(id), ...sizeVint(body.length), ...body];
};
const UNKNOWN = [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
const unknownEl = (id: number, ...payload: number[][]) => [
  ...idBytes(id),
  ...UNKNOWN,
  ...payload.flat(),
];

const header = (docType = "webm") =>
  el(ID.EBML, el(ID.DocType, ascii(docType)));
const INFO = el(
  ID.Info,
  el(0x2ad7b1, [0x0f, 0x42, 0x40]),
  el(0x4d80, ascii("muxer")),
);
const TRACKS = el(ID.Tracks, el(0xae, el(0xd7, [1]), el(0x86, ascii("V_VP8"))));
const block = (n: number) =>
  el(ID.SimpleBlock, [0x81, 0, n, 0x80, ...Array(20).fill(n)]);
const CLUSTER = el(ID.Cluster, el(ID.Timestamp, [0]), block(1), block(2));
const LIVE_CLUSTER = (t: number) =>
  unknownEl(ID.Cluster, el(ID.Timestamp, [t]), block(t), block(t + 1));
const TAGS = el(
  ID.Tags,
  el(
    ID.Tag,
    el(
      ID.SimpleTag,
      el(ID.TagName, ascii("location")),
      el(ID.TagString, ascii("+37.8199-122.4783/")),
    ),
  ),
);
const NESTED_TAGS = el(
  ID.Tags,
  el(
    ID.Tag,
    el(
      ID.SimpleTag,
      el(ID.TagName, ascii("COMMENT")),
      el(
        ID.SimpleTag,
        el(ID.TagName, ascii("GPS")),
        el(ID.TagString, ascii("37,-122")),
      ),
    ),
  ),
);
const webm = (...parts: number[][]) => new Uint8Array(parts.flat());

async function expectFailOpen(input: Uint8Array) {
  const res = await stripMetadataBytes(input, "video/webm");
  expect(res.stripped).toBe(false);
  expect(res.data).toBe(input);
}

describe("WebM element trees the fixtures do not reach", () => {
  it("voids a Tags element that follows unknown-size Clusters", async () => {
    const input = webm(
      header(),
      unknownEl(
        ID.Segment,
        INFO,
        TRACKS,
        LIVE_CLUSTER(1),
        LIVE_CLUSTER(5),
        TAGS,
      ),
    );
    expect(hasGpsMetadata(input, "video/webm")).toBe(true);
    const res = await stripMetadataBytes(input, "video/webm");
    expect(res.changed).toBe(true);
    expect(indexOf(res.data, "+37.8199")).toBe(-1);
    const at = indexOf(input, idBytes(ID.Tags));
    expect(Array.from(res.data.subarray(0, at))).toEqual(
      Array.from(input.subarray(0, at)),
    );
    expect(head(res.data, at).id).toBe(ID.Void);
  });

  it("finds a location in a nested SimpleTag, and voids it", async () => {
    const input = webm(
      header(),
      el(ID.Segment, INFO, TRACKS, CLUSTER, NESTED_TAGS),
    );
    expect(hasGpsMetadata(input, "video/webm")).toBe(true);
    const res = await stripMetadataBytes(input, "video/webm");
    expect(hasGpsMetadata(res.data, "video/webm")).toBe(false);
    expect(indexOf(res.data, "37,-122")).toBe(-1);
  });

  it("sizes the Void exactly whatever the span (an empty Tags, a 20 KB Tags)", async () => {
    for (const tags of [
      el(ID.Tags),
      el(
        ID.Tags,
        el(
          ID.Tag,
          el(
            ID.SimpleTag,
            el(ID.TagName, ascii("ENCODER")),
            el(ID.TagString, Array(20000).fill(0x41)),
          ),
        ),
      ),
    ]) {
      const input = webm(header(), el(ID.Segment, INFO, tags, CLUSTER));
      const res = await stripMetadataBytes(input, "video/webm");
      expect(res.changed).toBe(true);
      expect(res.data.length).toBe(input.length);
      const at = indexOf(input, idBytes(ID.Tags));
      const v = head(res.data, at);
      expect(v.id).toBe(ID.Void);
      expect(at + v.headerLen + v.size!).toBe(at + tags.length);
      expect(head(res.data, at + tags.length).id).toBe(ID.Cluster);
    }
  });

  it("voids the Tags of every chained document, and accepts DocType matroska", async () => {
    const input = webm(
      header(),
      el(ID.Segment, INFO, TAGS, CLUSTER),
      header("matroska"),
      unknownEl(ID.Segment, INFO, LIVE_CLUSTER(1), TAGS),
    );
    const res = await stripMetadataBytes(input, "video/webm");
    expect(res.stripped).toBe(true);
    expect(indexOf(res.data, "location")).toBe(-1);
    expect(res.data.length).toBe(input.length);
  });

  it("leaves a WebM without Tags byte-identical", async () => {
    const input = webm(header(), el(ID.Segment, INFO, TRACKS, CLUSTER));
    const res = await stripMetadataBytes(input, "video/webm");
    expect(res.stripped).toBe(true);
    expect(res.changed).toBe(false);
  });

  describe("fails open (the original back, stripped:false)", () => {
    it("a Tags element of unknown size", async () => {
      // TAGS' own header is 5 bytes (a 4-byte ID, a 1-byte size): re-wrapped unknown-sized.
      await expectFailOpen(
        webm(header(), el(ID.Segment, INFO, unknownEl(ID.Tags, TAGS.slice(5)))),
      );
    });

    it("a known-size Segment or element running past the end (truncated)", async () => {
      const whole = webm(header(), el(ID.Segment, INFO, TAGS, CLUSTER));
      await expectFailOpen(whole.subarray(0, whole.length - 5));
    });

    it("a block running past the end inside an unknown-size Cluster", async () => {
      const whole = webm(
        header(),
        unknownEl(ID.Segment, INFO, TAGS, LIVE_CLUSTER(1)),
      );
      await expectFailOpen(whole.subarray(0, whole.length - 3));
    });

    it("an element that can neither sit in a Cluster nor end one", async () => {
      await expectFailOpen(
        webm(
          header(),
          unknownEl(
            ID.Segment,
            INFO,
            LIVE_CLUSTER(1),
            el(0x4d80, [1, 2]),
            TAGS,
          ),
        ),
      );
    });

    it("a DocType that is neither webm nor matroska, no Segment, garbage, an MP4", async () => {
      await expectFailOpen(webm(header("avi"), el(ID.Segment, INFO, TAGS)));
      await expectFailOpen(webm(header()));
      await expectFailOpen(
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      );
      await expectFailOpen(
        new Uint8Array([
          0,
          0,
          0,
          16,
          ...ascii("ftyp"),
          ...ascii("isom"),
          0,
          0,
          0,
          0,
        ]),
      );
    });
  });
});
