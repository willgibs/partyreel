import { describe, expect, it } from "vitest";

import {
  ACCEPTED_MIME,
  extForMime,
  MIME_TO_EXT,
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_THRESHOLD_BYTES,
} from "@/lib/media/limits";

describe("MIME → extension", () => {
  it("maps every accepted MIME to an extension", () => {
    for (const mime of ACCEPTED_MIME) {
      expect(extForMime(mime)).toBeTruthy();
      expect(MIME_TO_EXT[mime]).toBeTruthy();
    }
  });

  it("returns null for an unaccepted MIME", () => {
    expect(extForMime("application/pdf")).toBeNull();
  });
});

describe("multipart thresholds", () => {
  it("threshold is 100 MB", () => {
    expect(MULTIPART_THRESHOLD_BYTES).toBe(100 * 1024 ** 2);
  });

  it("part size meets S3's 5 MB minimum", () => {
    expect(MULTIPART_PART_SIZE_BYTES).toBeGreaterThanOrEqual(5 * 1024 ** 2);
  });
});
