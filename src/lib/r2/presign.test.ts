import { performance } from "node:perf_hooks";

import {
  GetObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ★ THE PRESIGNS ARE BYTE-IDENTICAL TO THE SDK'S (compute-presign, 2026-10-04). `presign.ts` signs by hand
 * (`sigv4.ts`) what the AWS SDK's `getSignedUrl` used to sign, and every URL here is compared with the one the SDK
 * mints for the same inputs on the same frozen clock: the SDK calls below are presign.ts's own as they stood before
 * the change (the real client of `getR2()`, its checksum settings included), with presign.ts's defaults written in.
 * So a stable gallery link is the same link it was, and the browser's cache and the bucket's CORS see no change.
 * `@aws-sdk/s3-request-presigner` is a dev dependency for this file alone.
 *
 * A failure here names the case and the clock: a signer change that drifts from the SDK, or an SDK upgrade that
 * changed what it signs (then decide which is right, and say so in the commit).
 */

vi.mock("server-only", () => ({}));

// Fake credentials in R2's shapes (a 32-hex account, a 9-character bucket like the real one): nothing here signs
// with a real key or reaches R2.
const R2 = vi.hoisted(() => ({
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_ACCESS_KEY_ID: "3f1c0a9e8d7b6c5a4f3e2d1c0b9a8f7e",
  R2_SECRET_ACCESS_KEY:
    "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY0123456789abcdef0123456789",
  R2_BUCKET: "partyreel",
}));
vi.mock("@/lib/env", () => ({ assertR2Env: () => R2 }));

import { getR2 } from "./client";
import {
  mediaObjectKey,
  phoneKeyFor,
  preservedOriginalKey,
  stagingKeyFor,
} from "./keys";
import { presignDownload, presignUpload, presignUploadPart } from "./presign";
import {
  STABLE_DOWNLOAD_TTL_SECONDS,
  presignBucketStart,
} from "./presign-bucket";

/* ── the SDK, as presign.ts called it ─────────────────────────────────────── */

const SDK_UPLOAD_TTL = 2 * 60 * 60; // presign.ts's DEFAULT_UPLOAD_TTL_SECONDS
const SDK_DOWNLOAD_TTL = 60 * 60; // presign.ts's DEFAULT_DOWNLOAD_TTL_SECONDS

const sdk = {
  upload: async (p: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }) =>
    getSignedUrl(
      (await getR2()).client,
      new PutObjectCommand({
        Bucket: R2.R2_BUCKET,
        Key: p.key,
        ContentType: p.contentType,
        ContentLength: p.contentLength,
      }),
      {
        expiresIn: p.expiresInSeconds ?? SDK_UPLOAD_TTL,
        signableHeaders: new Set(["content-type", "content-length"]),
      },
    ),
  part: async (p: {
    key: string;
    uploadId: string;
    partNumber: number;
    contentLength: number;
    expiresInSeconds?: number;
  }) =>
    getSignedUrl(
      (await getR2()).client,
      new UploadPartCommand({
        Bucket: R2.R2_BUCKET,
        Key: p.key,
        UploadId: p.uploadId,
        PartNumber: p.partNumber,
        ContentLength: p.contentLength,
      }),
      {
        expiresIn: p.expiresInSeconds ?? SDK_UPLOAD_TTL,
        signableHeaders: new Set(["content-length"]),
      },
    ),
  download: async (p: {
    key: string;
    expiresInSeconds?: number;
    downloadFilename?: string;
    stable?: boolean;
  }) =>
    getSignedUrl(
      (await getR2()).client,
      new GetObjectCommand({
        Bucket: R2.R2_BUCKET,
        Key: p.key,
        ...(p.downloadFilename && {
          ResponseContentDisposition: `attachment; filename="${p.downloadFilename}"`,
        }),
      }),
      p.stable
        ? {
            expiresIn: STABLE_DOWNLOAD_TTL_SECONDS,
            signingDate: new Date(presignBucketStart(Date.now())),
          }
        : { expiresIn: p.expiresInSeconds ?? SDK_DOWNLOAD_TTL },
    ),
};

/* ── the corpus ───────────────────────────────────────────────────────────── */

const EVENT = "6f1d2c3b-4a59-4e8f-9a0b-1c2d3e4f5a6b";
const MEDIA = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const original = mediaObjectKey({
  eventId: EVENT,
  mediaId: MEDIA,
  kind: "photo",
  variant: "original",
  ext: "jpg",
});

/** Every key shape the app mints, then the ones a signer gets wrong: escaping, slashes, length. */
const KEYS = [
  original,
  mediaObjectKey({
    eventId: EVENT,
    mediaId: MEDIA,
    kind: "photo",
    variant: "preview",
    ext: "webp",
  }),
  mediaObjectKey({
    eventId: EVENT,
    mediaId: MEDIA,
    kind: "video",
    variant: "original",
    ext: "mov",
  }),
  phoneKeyFor({ eventId: EVENT, mediaId: MEDIA }),
  stagingKeyFor(original)!,
  preservedOriginalKey({ eventId: EVENT, mediaId: MEDIA, ext: "heic" }),
  "avatars/u/3f1c0a9e.webp",
  // unicode: accents, CJK, an emoji (a surrogate pair), a combining mark
  "événements/ü/日本語/写真 😀.heic",
  "café/naïve.jpg",
  // spaces and plus signs
  "a b/ c /d .jpg",
  "a+b/c++d.jpg",
  "+",
  // slashes: S3 keys are opaque, so none of these is normalized
  "a//b",
  "trail/",
  "/lead",
  "./x",
  "a/../b",
  "..",
  // the characters encodeURIComponent leaves bare, and the ones it must not
  "~tilde!'()*",
  "%41%2F%",
  "a?b#c&d=e;f:g@h$i,j",
  '[x]{y}|z\\^`<>"',
  "tab\there\nnewline\u0000nul",
  // long: S3's 1,024 bytes in ASCII and in two-byte characters, then past it
  `long/${"k".repeat(1019)}`,
  "ü".repeat(512),
  `${"segment/".repeat(250)}end.jpg`,
];

const CONTENT_TYPES = [
  "image/jpeg",
  "image/webp",
  "image/heic",
  "video/quicktime",
  "video/mp4",
  " image/jpeg ", // trimmed in the canonical header
  "text/plain;  charset=UTF-8", // inner whitespace collapsed
  'multipart/form-data; boundary="a b"',
];

const LENGTHS = [
  0,
  1,
  1_234,
  4 * 1024 * 1024,
  5 * 1024 ** 3,
  10e9,
  Number.MAX_SAFE_INTEGER,
];

const EXPIRIES = [
  undefined,
  1,
  60,
  5 * 60,
  60 * 60,
  2 * 60 * 60,
  7 * 24 * 60 * 60,
];

/** R2's multipart ids are opaque; these carry what a query value must escape. */
const UPLOAD_IDS = [
  "AEaUhR1Cq9kTZ3Jm0QdTPrVhD1xuwK8M2c4bZ0sYp5q6",
  "abc+/=def==",
  "with space & ampersand",
  "ünïcødé",
];

const FILENAMES = [
  "party-2026-10-04-001.jpg",
  "a.jpg",
  'we"ird.jpg',
  "with space (1).jpg",
  "ünï.jpg",
  "semi;colon=equals.mov",
];

type Case = {
  name: string;
  mine: () => Promise<string>;
  theirs: () => Promise<string>;
};

const cases: Case[] = [];
for (const [i, key] of KEYS.entries()) {
  const k = `#${i} ${JSON.stringify(key.length > 40 ? `${key.slice(0, 40)}…` : key)}`;
  cases.push(
    {
      name: `GET stable ${k}`,
      mine: () => presignDownload({ key, stable: true }),
      theirs: () => sdk.download({ key, stable: true }),
    },
    {
      name: `GET fresh ${k}`,
      mine: () => presignDownload({ key }),
      theirs: () => sdk.download({ key }),
    },
    {
      name: `GET stable save ${k}`,
      mine: () =>
        presignDownload({ key, stable: true, downloadFilename: "photo.jpg" }),
      theirs: () =>
        sdk.download({ key, stable: true, downloadFilename: "photo.jpg" }),
    },
    {
      name: `PUT ${k}`,
      mine: async () =>
        (
          await presignUpload({
            key,
            contentType: "image/jpeg",
            contentLength: 1_234,
          })
        ).url,
      theirs: () =>
        sdk.upload({ key, contentType: "image/jpeg", contentLength: 1_234 }),
    },
    {
      name: `PART ${k}`,
      mine: async () =>
        (
          await presignUploadPart({
            key,
            uploadId: UPLOAD_IDS[0],
            partNumber: 7,
            contentLength: 16 * 1024 * 1024,
          })
        ).url,
      theirs: () =>
        sdk.part({
          key,
          uploadId: UPLOAD_IDS[0],
          partNumber: 7,
          contentLength: 16 * 1024 * 1024,
        }),
    },
  );
}
for (const downloadFilename of FILENAMES) {
  for (const stable of [true, false]) {
    cases.push({
      name: `GET save ${JSON.stringify(downloadFilename)} stable=${stable}`,
      mine: () => presignDownload({ key: original, downloadFilename, stable }),
      theirs: () => sdk.download({ key: original, downloadFilename, stable }),
    });
  }
}
for (const expiresInSeconds of EXPIRIES) {
  cases.push(
    {
      name: `GET fresh expires=${expiresInSeconds}`,
      mine: () => presignDownload({ key: original, expiresInSeconds }),
      theirs: () => sdk.download({ key: original, expiresInSeconds }),
    },
    {
      // A stable link's life is the bucket's, whatever it is asked.
      name: `GET stable expires=${expiresInSeconds}`,
      mine: () =>
        presignDownload({ key: original, expiresInSeconds, stable: true }),
      theirs: () =>
        sdk.download({ key: original, expiresInSeconds, stable: true }),
    },
    {
      name: `PUT expires=${expiresInSeconds}`,
      mine: async () =>
        (
          await presignUpload({
            key: original,
            contentType: "image/jpeg",
            contentLength: 1,
            expiresInSeconds,
          })
        ).url,
      theirs: () =>
        sdk.upload({
          key: original,
          contentType: "image/jpeg",
          contentLength: 1,
          expiresInSeconds,
        }),
    },
    {
      name: `PART expires=${expiresInSeconds}`,
      mine: async () =>
        (
          await presignUploadPart({
            key: original,
            uploadId: UPLOAD_IDS[0],
            partNumber: 1,
            contentLength: 1,
            expiresInSeconds,
          })
        ).url,
      theirs: () =>
        sdk.part({
          key: original,
          uploadId: UPLOAD_IDS[0],
          partNumber: 1,
          contentLength: 1,
          expiresInSeconds,
        }),
    },
  );
}
for (const contentType of CONTENT_TYPES) {
  for (const contentLength of LENGTHS) {
    cases.push({
      name: `PUT ${JSON.stringify(contentType)} ${contentLength} B`,
      mine: async () =>
        (await presignUpload({ key: original, contentType, contentLength }))
          .url,
      theirs: () => sdk.upload({ key: original, contentType, contentLength }),
    });
  }
}
for (const uploadId of UPLOAD_IDS) {
  for (const partNumber of [1, 2, 640, 10_000]) {
    for (const contentLength of [1, 16 * 1024 * 1024, 5 * 1024 ** 3]) {
      cases.push({
        name: `PART ${JSON.stringify(uploadId)} #${partNumber} ${contentLength} B`,
        mine: async () =>
          (
            await presignUploadPart({
              key: original,
              uploadId,
              partNumber,
              contentLength,
            })
          ).url,
        theirs: () =>
          sdk.part({ key: original, uploadId, partNumber, contentLength }),
      });
    }
  }
}

/** Frozen clocks: inside a bucket, on its edge, the last millisecond of a leap day, far ahead. */
const CLOCKS = [
  "2026-10-04T19:27:14.555Z",
  "2026-10-04T19:30:00.000Z",
  "2026-10-05T00:00:00.000Z",
  "2028-02-29T23:59:59.999Z",
  "2099-12-31T23:45:01.001Z",
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("presign.ts signs exactly what the SDK signed", () => {
  it("the corpus is broad (every operation, key shape, type, length, expiry and clock)", () => {
    expect(cases.length).toBeGreaterThan(250);
    expect(new Set(cases.map((c) => c.name)).size).toBe(cases.length);
  });

  for (const clock of CLOCKS) {
    it(`every URL is the SDK's, byte for byte, at ${clock}`, async () => {
      vi.setSystemTime(new Date(clock));
      const drift: string[] = [];
      for (const c of cases) {
        const [mine, theirs] = await Promise.all([c.mine(), c.theirs()]);
        if (mine !== theirs)
          drift.push(`${c.name}\n  mine   ${mine}\n  theirs ${theirs}`);
      }
      expect(drift).toEqual([]);
    });
  }

  it("a stable link is one URL across its bucket and a new one after it", async () => {
    vi.setSystemTime(new Date("2026-10-04T19:30:00.000Z"));
    const first = await presignDownload({ key: original, stable: true });
    vi.setSystemTime(new Date("2026-10-04T19:59:59.999Z"));
    expect(await presignDownload({ key: original, stable: true })).toBe(first);
    vi.setSystemTime(new Date("2026-10-04T20:00:00.000Z"));
    expect(await presignDownload({ key: original, stable: true })).not.toBe(
      first,
    );
  });

  it("keeps every security property: the expiries, the bound headers, the host", async () => {
    vi.setSystemTime(new Date("2026-10-04T19:27:14.555Z"));
    const put = new URL(
      (
        await presignUpload({
          key: original,
          contentType: "image/jpeg",
          contentLength: 1_234,
        })
      ).url,
    );
    expect(put.searchParams.get("X-Amz-Expires")).toBe("7200");
    expect(put.searchParams.get("X-Amz-SignedHeaders")).toBe(
      "content-length;content-type;host",
    );
    const part = new URL(
      (
        await presignUploadPart({
          key: original,
          uploadId: UPLOAD_IDS[0],
          partNumber: 1,
          contentLength: 1,
        })
      ).url,
    );
    expect(part.searchParams.get("X-Amz-Expires")).toBe("7200");
    expect(part.searchParams.get("X-Amz-SignedHeaders")).toBe(
      "content-length;host",
    );
    const fresh = new URL(await presignDownload({ key: original }));
    expect(fresh.searchParams.get("X-Amz-Expires")).toBe("3600");
    expect(fresh.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
    const stable = new URL(
      await presignDownload({ key: original, stable: true }),
    );
    expect(stable.searchParams.get("X-Amz-Expires")).toBe("5400");
    expect(stable.searchParams.get("X-Amz-Date")).toBe("20261004T190000Z");
    expect(stable.host).toBe(
      `${R2.R2_BUCKET}.${R2.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    );
    // The secret signs; it never travels.
    for (const url of [put, part, fresh, stable]) {
      expect(url.href).not.toContain(R2.R2_SECRET_ACCESS_KEY);
      expect(url.href).not.toContain(
        encodeURIComponent(R2.R2_SECRET_ACCESS_KEY),
      );
    }
  });

  it("refuses what the SDK refused", async () => {
    vi.setSystemTime(new Date("2026-10-04T19:27:14.555Z"));
    // A life past SigV4's 7 days, a key that is not UTF-16 text.
    await expect(
      sdk.download({ key: original, expiresInSeconds: 604_801 }),
    ).rejects.toBeDefined();
    await expect(
      presignDownload({ key: original, expiresInSeconds: 604_801 }),
    ).rejects.toThrow(/7 days/);
    await expect(sdk.download({ key: "lone\uD800" })).rejects.toThrow(URIError);
    await expect(presignDownload({ key: "lone\uD800" })).rejects.toThrow(
      URIError,
    );
  });

  it("refuses, where the SDK signed, what no caller sends (fails closed)", async () => {
    vi.setSystemTime(new Date("2026-10-04T19:27:14.555Z"));
    // ★ An empty key: the SDK signs the bucket's ROOT, a GET of which is a listing of every key in it. No caller
    // passes one (keys come from rows), and here it is refused rather than signed.
    expect(await sdk.download({ key: "" })).toMatch(
      /^https:\/\/[^/]+\/\?X-Amz-/,
    );
    await expect(presignDownload({ key: "" })).rejects.toThrow(/empty key/);
    // The SDK signed each of these too: an empty type (binding an empty Content-Type), a length that is no byte
    // count, a part S3 has no number for, an empty upload id, a life of no whole seconds.
    const put = { key: original, contentType: "image/jpeg", contentLength: 1 };
    expect(await sdk.upload({ ...put, contentType: "" })).toContain(
      "X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost",
    );
    await expect(presignUpload({ ...put, contentType: "" })).rejects.toThrow(
      /empty content type/,
    );
    for (const contentLength of [-1, 1.5, Number.NaN, 2 ** 53]) {
      await expect(presignUpload({ ...put, contentLength })).rejects.toThrow(
        /not a byte count/,
      );
    }
    const part = {
      key: original,
      uploadId: UPLOAD_IDS[0],
      partNumber: 1,
      contentLength: 1,
    };
    for (const partNumber of [0, 10_001, 1.5]) {
      await expect(presignUploadPart({ ...part, partNumber })).rejects.toThrow(
        /no part/,
      );
    }
    await expect(presignUploadPart({ ...part, uploadId: "" })).rejects.toThrow(
      /empty upload id/,
    );
    for (const expiresInSeconds of [0, 1.5, -60]) {
      await expect(
        presignDownload({ key: original, expiresInSeconds }),
      ).rejects.toThrow(/1 s to 7 days/);
    }
  });
});

describe("the lever", () => {
  it("mints a full album's 257 links many times faster than the SDK did", async () => {
    vi.useRealTimers();
    // The guest page's dearest first load: up to 257 links, almost all stable reads, a save link among them.
    const keys = Array.from({ length: 257 }, (_, i) =>
      mediaObjectKey({
        eventId: EVENT,
        mediaId: `${MEDIA.slice(0, -4)}${String(i).padStart(4, "0")}`,
        kind: "photo",
        variant: i % 3 === 0 ? "original" : "preview",
        ext: i % 3 === 0 ? "jpg" : "webp",
      }),
    );
    const album = (mint: typeof presignDownload) =>
      Promise.all(
        keys.map((key, i) =>
          mint(
            i % 7 === 0
              ? { key, stable: true, downloadFilename: "photo.jpg" }
              : { key, stable: true },
          ),
        ),
      );
    // Warm both (the SDK builds its client and endpoint cache once), then take the best of several interleaved
    // rounds, so a busy machine slows both alike rather than one.
    await album(sdk.download);
    await album(presignDownload);
    let theirs = Infinity;
    let mine = Infinity;
    for (let round = 0; round < 5; round++) {
      let t = performance.now();
      await album(sdk.download);
      theirs = Math.min(theirs, performance.now() - t);
      t = performance.now();
      await album(presignDownload);
      mine = Math.min(mine, performance.now() - t);
    }
    // `PRESIGN_BENCH=1 pnpm vitest run src/lib/r2/presign.test.ts -t lever` prints the race.
    if (process.env.PRESIGN_BENCH) {
      process.stderr.write(
        `257 presigns: SDK ${theirs.toFixed(2)} ms, by hand ${mine.toFixed(2)} ms (${(theirs / mine).toFixed(1)}x)\n`,
      );
    }
    expect(
      mine * 4,
      `by hand ${mine.toFixed(2)} ms against the SDK's ${theirs.toFixed(2)} ms`,
    ).toBeLessThan(theirs);
  });
});
