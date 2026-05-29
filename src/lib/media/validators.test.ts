import { describe, expect, it } from "vitest";

import {
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/media/limits";
import { classifyMime, validateUpload } from "@/lib/media/validators";

describe("classifyMime", () => {
  it("classifies photos", () => {
    expect(classifyMime("image/jpeg")).toBe("photo");
    expect(classifyMime("image/heic")).toBe("photo");
    expect(classifyMime("image/avif")).toBe("photo");
  });

  it("classifies videos", () => {
    expect(classifyMime("video/mp4")).toBe("video");
    expect(classifyMime("video/quicktime")).toBe("video");
  });

  it("rejects unsupported and empty types", () => {
    expect(classifyMime("application/pdf")).toBeNull();
    expect(classifyMime("")).toBeNull();
  });
});

describe("validateUpload", () => {
  it("accepts a photo exactly at the size ceiling", () => {
    expect(
      validateUpload({ mime: "image/jpeg", sizeBytes: MAX_PHOTO_BYTES }).ok,
    ).toBe(true);
  });

  it("rejects an over-size photo", () => {
    expect(
      validateUpload({ mime: "image/jpeg", sizeBytes: MAX_PHOTO_BYTES + 1 }).ok,
    ).toBe(false);
  });

  it("rejects an over-size video", () => {
    expect(
      validateUpload({ mime: "video/mp4", sizeBytes: MAX_VIDEO_BYTES + 1 }).ok,
    ).toBe(false);
  });

  it("rejects a too-long video", () => {
    expect(
      validateUpload({
        mime: "video/mp4",
        sizeBytes: 1000,
        durationSeconds: MAX_VIDEO_DURATION_SECONDS + 1,
      }).ok,
    ).toBe(false);
  });

  it("accepts a video exactly at the duration ceiling", () => {
    expect(
      validateUpload({
        mime: "video/mp4",
        sizeBytes: 1000,
        durationSeconds: MAX_VIDEO_DURATION_SECONDS,
      }).ok,
    ).toBe(true);
  });

  it("accepts a video with unknown duration (size still enforced)", () => {
    expect(
      validateUpload({
        mime: "video/mp4",
        sizeBytes: 1000,
        durationSeconds: null,
      }).ok,
    ).toBe(true);
  });

  it("rejects an unsupported type", () => {
    expect(validateUpload({ mime: "application/zip", sizeBytes: 10 }).ok).toBe(
      false,
    );
  });
});
