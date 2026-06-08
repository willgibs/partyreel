import { describe, expect, it } from "vitest";

import {
  ACCEPTED_MIME,
  extForMime,
  MAX_UPLOAD_BYTES,
  MIME_TO_EXT,
  MIN_UPLOAD_CAP_BYTES,
  MULTIPART_PART_SIZE_BYTES,
  MULTIPART_THRESHOLD_BYTES,
  UPLOAD_CAP_PRESETS,
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

describe("upload ceiling", () => {
  // MIRRORS the SQL `c_max_upload_bytes` (10::bigint * 1024 * 1024 * 1024) in
  // create_media / create_media_as_host / get_upload_context — change both together.
  it("is 10 GiB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 ** 3);
  });

  // Guards the multipart math: a future ceiling/part-size change must not blow past
  // S3/R2's 10,000-part cap (at 10 GiB / 16 MB that's 640 parts).
  it("stays within the 10,000-part multipart cap at the ceiling", () => {
    expect(MAX_UPLOAD_BYTES / MULTIPART_PART_SIZE_BYTES).toBeLessThanOrEqual(
      10_000,
    );
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

describe("host upload-cap presets", () => {
  it("floor is 25 MiB", () => {
    expect(MIN_UPLOAD_CAP_BYTES).toBe(25 * 1024 ** 2);
  });

  // Every non-null preset must satisfy the events_max_upload_bytes_range DB CHECK
  // (and the mirrored zod bounds), or a host could pick a value the server rejects.
  it("keeps every preset within [MIN_UPLOAD_CAP_BYTES, MAX_UPLOAD_BYTES] or null", () => {
    for (const preset of UPLOAD_CAP_PRESETS) {
      if (preset.bytes == null) continue;
      expect(preset.bytes).toBeGreaterThanOrEqual(MIN_UPLOAD_CAP_BYTES);
      expect(preset.bytes).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
    }
  });

  it("offers a 'No limit' (null) option", () => {
    expect(UPLOAD_CAP_PRESETS.some((p) => p.bytes == null)).toBe(true);
  });
});
