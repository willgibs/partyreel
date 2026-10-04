import { describe, expect, it } from "vitest";

import {
  ACCEPTED_MIME,
  CAMERA_VIDEO_GRACE_SECONDS,
  CAMERA_VIDEO_MAX_BYTES,
  CAMERA_VIDEO_SECONDS,
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

// The camera's clip (its SQL mirror is create_media's three `c_camera_video_*` constants: roll.test.ts reads each beside
// these). What is pinned here is what the mirror and the words depend on, never the numbers themselves.
describe("the camera's clip bounds", () => {
  it("says its byte bound in whole megabytes, because create_media divides by a megabyte to name it", () => {
    expect(CAMERA_VIDEO_MAX_BYTES % 1024 ** 2).toBe(0);
  });

  it("keeps the grace under a second and the byte bound under the universal ceiling", () => {
    expect(CAMERA_VIDEO_GRACE_SECONDS).toBeGreaterThan(0);
    expect(CAMERA_VIDEO_GRACE_SECONDS).toBeLessThan(1);
    expect(CAMERA_VIDEO_MAX_BYTES).toBeLessThan(MAX_UPLOAD_BYTES);
  });

  it("states its length in whole seconds, because create_media names it with %s and the mark reads it as m:ss", () => {
    expect(Number.isInteger(CAMERA_VIDEO_SECONDS)).toBe(true);
    expect(CAMERA_VIDEO_SECONDS).toBeGreaterThan(0);
  });
});
