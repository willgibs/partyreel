import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_BYTES, MIN_UPLOAD_CAP_BYTES } from "@/lib/media/limits";
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
  it("accepts a photo at the 10 GB ceiling", () => {
    expect(
      validateUpload({ mime: "image/jpeg", sizeBytes: MAX_UPLOAD_BYTES }).ok,
    ).toBe(true);
  });

  it("accepts a video at the 10 GB ceiling (size is the only gate; no duration cap)", () => {
    expect(
      validateUpload({ mime: "video/mp4", sizeBytes: MAX_UPLOAD_BYTES }).ok,
    ).toBe(true);
  });

  it("rejects anything over the 10 GB ceiling, photo or video alike", () => {
    expect(
      validateUpload({ mime: "image/jpeg", sizeBytes: MAX_UPLOAD_BYTES + 1 })
        .ok,
    ).toBe(false);
    expect(
      validateUpload({ mime: "video/mp4", sizeBytes: MAX_UPLOAD_BYTES + 1 }).ok,
    ).toBe(false);
  });

  it("honors a stricter per-event maxBytes (the host cap)", () => {
    // At/below the cap passes; one byte over is rejected.
    expect(
      validateUpload({
        mime: "image/jpeg",
        sizeBytes: MIN_UPLOAD_CAP_BYTES,
        maxBytes: MIN_UPLOAD_CAP_BYTES,
      }).ok,
    ).toBe(true);
    expect(
      validateUpload({
        mime: "image/jpeg",
        sizeBytes: MIN_UPLOAD_CAP_BYTES + 1,
        maxBytes: MIN_UPLOAD_CAP_BYTES,
      }).ok,
    ).toBe(false);
  });

  it("rejects an unsupported type regardless of size", () => {
    expect(validateUpload({ mime: "application/zip", sizeBytes: 10 }).ok).toBe(
      false,
    );
  });
});
