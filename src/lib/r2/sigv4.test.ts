import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE SIGNER ITSELF (compute-presign, 2026-10-04). `presign.test.ts` holds presign.ts's three operations to the SDK
 * over a corpus; this holds what sits under them: a few URLs pinned as literals (so the signing stays proved the day
 * the SDK is upgraded or gone), the configurations the env could hand it, the derived key's cache, and every
 * refusal, none of which may carry the secret.
 */

vi.mock("server-only", () => ({}));

// Counts the HMACs, so the derived key's cache is seen working rather than assumed.
const hmacCalls = vi.hoisted(() => ({ count: 0 }));
vi.mock("node:crypto", async (importOriginal) => {
  const real = await importOriginal<typeof import("node:crypto")>();
  return {
    ...real,
    createHmac: (...args: Parameters<typeof real.createHmac>) => {
      hmacCalls.count += 1;
      return real.createHmac(...args);
    },
  };
});

import {
  MAX_PRESIGN_TTL_SECONDS,
  type PresignRequest,
  createR2Presigner,
  escapeUri,
} from "./sigv4";

const CONFIG = {
  accountId: "0123456789abcdef0123456789abcdef",
  accessKeyId: "3f1c0a9e8d7b6c5a4f3e2d1c0b9a8f7e",
  secretAccessKey:
    "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY0123456789abcdef0123456789",
  bucket: "partyreel",
};
const KEY =
  "events/6f1d2c3b-4a59-4e8f-9a0b-1c2d3e4f5a6b/photo/0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d/original.jpg";
const AT = new Date("2026-10-04T19:00:00.000Z");
const BASE =
  "https://partyreel.0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/events/6f1d2c3b-4a59-4e8f-9a0b-1c2d3e4f5a6b/photo/0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d/original.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=3f1c0a9e8d7b6c5a4f3e2d1c0b9a8f7e%2F20261004%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20261004T190000Z";

const get = (over: Partial<PresignRequest> = {}): PresignRequest => ({
  method: "GET",
  key: KEY,
  query: { "x-id": "GetObject" },
  expiresInSeconds: 5400,
  signingDate: AT,
  ...over,
});

/** The SDK's own client for a configuration, set as `client.ts` sets R2's. */
const sdkFor = (config: typeof CONFIG) =>
  new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

beforeEach(() => {
  hmacCalls.count = 0;
});

describe("the URLs, pinned (minted by @aws-sdk/s3-request-presigner 3.1056.0 with these fake keys)", () => {
  const presign = createR2Presigner(CONFIG);

  it("a stable read", () => {
    expect(presign(get())).toBe(
      `${BASE}&X-Amz-Expires=5400&X-Amz-Signature=c2061f7db48141afb2893c6325a6f3a6027cc7b529475681bd30151684c3f250&X-Amz-SignedHeaders=host&x-id=GetObject`,
    );
  });

  it("a save (the disposition signed in)", () => {
    expect(
      presign(
        get({
          query: {
            "x-id": "GetObject",
            "response-content-disposition":
              'attachment; filename="party-001.jpg"',
          },
        }),
      ),
    ).toBe(
      `${BASE}&X-Amz-Expires=5400&X-Amz-Signature=12d5906294dac3e29581243585d8664380147ee376b3be3263dba4d6c80adbec&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22party-001.jpg%22&x-id=GetObject`,
    );
  });

  it("a single PUT (its type and length bound)", () => {
    expect(
      presign({
        method: "PUT",
        key: KEY,
        query: { "x-id": "PutObject" },
        headers: { "content-length": "1234", "content-type": "image/jpeg" },
        expiresInSeconds: 7200,
        signingDate: AT,
      }),
    ).toBe(
      `${BASE}&X-Amz-Expires=7200&X-Amz-Signature=3a79362a9d33ddc39cf33be793096fb48bfd6e37fe452d062b8d5a7b25ea32e2&X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost&x-id=PutObject`,
    );
  });

  it("a multipart part (its length bound)", () => {
    expect(
      presign({
        method: "PUT",
        key: KEY,
        query: {
          "x-id": "UploadPart",
          partNumber: "7",
          uploadId: "abc+/=def==",
        },
        headers: { "content-length": "16777216" },
        expiresInSeconds: 7200,
        signingDate: AT,
      }),
    ).toBe(
      `${BASE}&X-Amz-Expires=7200&X-Amz-Signature=5accc05f74b7a033895fb3d58fa6c0531b3ba911fa7034f5c9f89d46a1515bc8&X-Amz-SignedHeaders=content-length%3Bhost&partNumber=7&uploadId=abc%2B%2F%3Ddef%3D%3D&x-id=UploadPart`,
    );
  });

  it("escapes as SigV4 does: encodeURIComponent and the five it leaves bare", () => {
    expect(escapeUri("a b+c/ü~!'()*")).toBe(
      "a%20b%2Bc%2F%C3%BC~%21%27%28%29%2A",
    );
  });
});

describe("the configurations the env could hand it", () => {
  const keys = [KEY, "a b/ü+/x.jpg", "a//b/"];

  it("addresses every R2 bucket name and any account id as the SDK does", async () => {
    const configs = [
      CONFIG,
      { ...CONFIG, accountId: CONFIG.accountId.toUpperCase() },
      { ...CONFIG, bucket: "abc" },
      { ...CONFIG, bucket: "123" },
      { ...CONFIG, bucket: "a-b--c-1" },
      { ...CONFIG, bucket: "x".repeat(63) },
    ];
    for (const config of configs) {
      const presign = createR2Presigner(config);
      for (const key of keys) {
        const theirs = await getSignedUrl(
          sdkFor(config),
          new GetObjectCommand({ Bucket: config.bucket, Key: key }),
          { expiresIn: 5400, signingDate: AT },
        );
        expect(presign(get({ key }))).toBe(theirs);
      }
    }
  });

  it("refuses a bucket the SDK would address by path (no R2 bucket is named so), naming no secret", async () => {
    for (const bucket of [
      "ab",
      "x".repeat(64),
      "My-Bucket",
      "my.bucket",
      "-lead",
      "trail-",
      "under_score",
      "",
    ]) {
      if (bucket) {
        const theirs = await getSignedUrl(
          sdkFor({ ...CONFIG, bucket }),
          new GetObjectCommand({ Bucket: bucket, Key: KEY }),
          { expiresIn: 5400, signingDate: AT },
        );
        expect(new URL(theirs).host.startsWith(`${bucket}.`)).toBe(false);
      }
      expect(() => createR2Presigner({ ...CONFIG, bucket })).toThrow(
        /not an R2 bucket name/,
      );
    }
  });

  it("refuses an account id that would put something else in the host, and a missing key", () => {
    for (const accountId of ["", "acct/evil", "a.b", "user@host", "a b"]) {
      expect(() => createR2Presigner({ ...CONFIG, accountId })).toThrow(
        /account id/,
      );
    }
    expect(() => createR2Presigner({ ...CONFIG, accessKeyId: "" })).toThrow(
      /key pair/,
    );
    expect(() => createR2Presigner({ ...CONFIG, secretAccessKey: "" })).toThrow(
      /key pair/,
    );
  });
});

describe("the derived signing key", () => {
  it("is derived once a day (four HMACs), and each link costs one", () => {
    const presign = createR2Presigner(CONFIG);
    for (let i = 0; i < 10; i++) presign(get({ key: `${KEY}${i}` }));
    expect(hmacCalls.count).toBe(4 + 10);

    // A stable link and a fresh one on the same day share it.
    presign(get({ signingDate: new Date("2026-10-04T23:59:59.999Z") }));
    expect(hmacCalls.count).toBe(4 + 11);

    // The next day derives its own; the day before is still held.
    presign(get({ signingDate: new Date("2026-10-05T00:00:00.000Z") }));
    expect(hmacCalls.count).toBe(4 + 11 + 5);
    presign(get());
    expect(hmacCalls.count).toBe(4 + 11 + 5 + 1);
  });

  it("keeps a few days and drops the oldest", () => {
    const presign = createR2Presigner(CONFIG);
    const day = (d: number) =>
      get({ signingDate: new Date(Date.UTC(2026, 9, d, 12)) });
    for (const d of [4, 5, 6, 7]) presign(day(d));
    expect(hmacCalls.count).toBe(4 * 5);
    presign(day(4)); // still held
    expect(hmacCalls.count).toBe(4 * 5 + 1);
    presign(day(8)); // evicts the 4th
    presign(day(4));
    expect(hmacCalls.count).toBe(4 * 5 + 1 + 5 + 5);
  });

  it("belongs to its presigner: another key pair never signs with it", () => {
    const ours = createR2Presigner(CONFIG)(get());
    const theirs = createR2Presigner({
      ...CONFIG,
      secretAccessKey: `${CONFIG.secretAccessKey}x`,
    })(get());
    expect(theirs).not.toBe(ours);
  });
});

describe("refusals", () => {
  const presign = createR2Presigner(CONFIG);

  it("refuses an empty key, a life outside 1 s to 7 days, and an invalid date", () => {
    expect(() => presign(get({ key: "" }))).toThrow(/empty key/);
    for (const expiresInSeconds of [
      0,
      -1,
      1.5,
      Number.NaN,
      MAX_PRESIGN_TTL_SECONDS + 1,
    ]) {
      expect(() => presign(get({ expiresInSeconds }))).toThrow(/1 s to 7 days/);
    }
    expect(
      presign(get({ expiresInSeconds: MAX_PRESIGN_TTL_SECONDS })),
    ).toContain("X-Amz-Expires=604800");
    expect(() => presign(get({ signingDate: new Date(Number.NaN) }))).toThrow(
      RangeError,
    );
  });

  it("refuses a query or header name that is SigV4's own or not a plain token", () => {
    for (const name of [
      "X-Amz-Expires",
      "x-amz-signature",
      "X-AMZ-DATE",
      "has space",
      "semi;colon",
      "",
    ]) {
      expect(() => presign(get({ query: { [name]: "1" } }))).toThrow(
        /cannot be a query name/,
      );
    }
    for (const name of ["host", "Host", "x-amz-meta-a", "bad header"]) {
      expect(() => presign(get({ headers: { [name]: "1" } }))).toThrow(
        /cannot be a header name/,
      );
    }
  });

  it("names no secret in any refusal", () => {
    const messages: string[] = [];
    const attempt = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        messages.push(String(e));
      }
    };
    attempt(() => createR2Presigner({ ...CONFIG, bucket: "ab" }));
    attempt(() => createR2Presigner({ ...CONFIG, accountId: "a/b" }));
    attempt(() => createR2Presigner({ ...CONFIG, accessKeyId: "" }));
    attempt(() => presign(get({ key: "" })));
    attempt(() => presign(get({ expiresInSeconds: 0 })));
    attempt(() => presign(get({ query: { "X-Amz-Date": "1" } })));
    attempt(() => presign(get({ headers: { host: "evil" } })));
    expect(messages).toHaveLength(7);
    for (const message of messages) {
      expect(message).not.toContain(CONFIG.secretAccessKey);
      expect(message).not.toContain(CONFIG.secretAccessKey.slice(0, 12));
    }
  });
});
