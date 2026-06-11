import { describe, expect, it } from "vitest";

import {
  PRESIGN_BUCKET_MS,
  STABLE_DOWNLOAD_TTL_SECONDS,
  presignBucketId,
  presignBucketStart,
} from "./presign-bucket";

describe("presign buckets", () => {
  it("floors to the bucket start", () => {
    const start = 1_900_000_000_000 - (1_900_000_000_000 % PRESIGN_BUCKET_MS);
    expect(presignBucketStart(start)).toBe(start);
    expect(presignBucketStart(start + 1)).toBe(start);
    expect(presignBucketStart(start + PRESIGN_BUCKET_MS - 1)).toBe(start);
    expect(presignBucketStart(start + PRESIGN_BUCKET_MS)).toBe(
      start + PRESIGN_BUCKET_MS,
    );
  });

  it("bucket id is stable within a window and changes across windows", () => {
    const t = 1_900_000_123_456;
    const start = presignBucketStart(t);
    expect(presignBucketId(start)).toBe(presignBucketId(start + 1));
    expect(presignBucketId(start)).toBe(
      presignBucketId(start + PRESIGN_BUCKET_MS - 1),
    );
    expect(presignBucketId(start)).not.toBe(
      presignBucketId(start + PRESIGN_BUCKET_MS),
    );
  });

  it("TTL covers a full bucket beyond the window's end, with slack", () => {
    // A URL minted at the LAST instant of a bucket must outlive the next full
    // bucket (the ETag rolls then, handing out fresh URLs) plus real slack.
    const ttlMs = STABLE_DOWNLOAD_TTL_SECONDS * 1000;
    expect(ttlMs).toBeGreaterThanOrEqual(2 * PRESIGN_BUCKET_MS + 10 * 60_000);
  });
});
