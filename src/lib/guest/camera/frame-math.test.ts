/**
 * THE CAMERA'S ARITHMETIC: a shot keeps what she framed, a video is drawn at 1080, a still is taken the best way the
 * phone offers, and a video is written in a type the album accepts.
 */
import { describe, expect, it } from "vitest";

import { ACCEPTED_VIDEO_MIME } from "@/lib/media/limits";

import {
  baseType,
  cropRect,
  RECORDER_TYPES,
  recorderType,
  sameOrientation,
  shotName,
  stillPath,
  thumbSize,
  videoSize,
} from "./frame-math";

describe("cropRect", () => {
  it("keeps the whole frame where the box is the frame's own shape (his iPhone: 3024x4032 in a 3:4 box)", () => {
    expect(cropRect(3024, 4032, 3 / 4)).toEqual({
      sx: 0,
      sy: 0,
      sw: 3024,
      sh: 4032,
    });
  });
  it("cuts the sides a 16:9 picture shows past an upright 3:4 box, from the middle", () => {
    expect(cropRect(1080, 1920, 3 / 4)).toEqual({
      sx: 0,
      sy: 240,
      sw: 1080,
      sh: 1440,
    });
    expect(cropRect(1920, 1080, 3 / 4)).toEqual({
      sx: 555,
      sy: 0,
      sw: 810,
      sh: 1080,
    });
  });
  it("keeps a laptop's 16:9 to the 4:3 of a box on its side", () => {
    expect(cropRect(1280, 720, 4 / 3)).toEqual({
      sx: 160,
      sy: 0,
      sw: 960,
      sh: 720,
    });
  });
  it("answers an unusable frame with the frame itself", () => {
    expect(cropRect(0, 0, 3 / 4)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 });
  });
});

describe("videoSize and thumbSize", () => {
  it("draws a video at 1080 on its short side, never larger than the crop, in even pixels", () => {
    expect(videoSize(3024, 4032)).toEqual({ width: 1080, height: 1440 });
    expect(videoSize(960, 720)).toEqual({ width: 960, height: 720 });
    expect(videoSize(4032, 3024)).toEqual({ width: 1440, height: 1080 });
    const odd = videoSize(1081, 1441);
    expect(odd.width % 2).toBe(0);
    expect(odd.height % 2).toBe(0);
  });
  it("keeps a picture's shape at the reel's size", () => {
    expect(thumbSize(3024, 4032)).toEqual({ width: 180, height: 240 });
    expect(thumbSize(4032, 3024)).toEqual({ width: 240, height: 180 });
  });
});

describe("stillPath", () => {
  it("draws the frame where the still pipeline is the same size (his iPhone: 12.2 MP either way)", () => {
    expect(
      stillPath({
        frame: { width: 3024, height: 4032 },
        photoMax: { width: 4032, height: 3024 },
      }),
    ).toBe("frame");
  });
  it("takes the still where the camera's pipeline is clearly larger than its 1080p preview", () => {
    expect(
      stillPath({
        frame: { width: 1080, height: 1920 },
        photoMax: { width: 4000, height: 3000 },
      }),
    ).toBe("takePhoto");
  });
  it("draws the frame where there is no still pipeline at all", () => {
    expect(
      stillPath({ frame: { width: 1080, height: 1440 }, photoMax: null }),
    ).toBe("frame");
  });
  it("tells an upright picture from one on its side", () => {
    expect(
      sameOrientation({ width: 3, height: 4 }, { width: 30, height: 40 }),
    ).toBe(true);
    expect(
      sameOrientation({ width: 4, height: 3 }, { width: 30, height: 40 }),
    ).toBe(false);
  });
});

describe("the video's container", () => {
  it("is MP4 where the browser records it, else WebM, both types the album accepts", () => {
    expect(recorderType((t) => t === "video/mp4")).toBe("video/mp4");
    expect(recorderType((t) => t === "video/webm")).toBe("video/webm");
    expect(recorderType(() => false)).toBeNull();
    expect(
      recorderType(() => {
        throw new Error("no");
      }),
    ).toBeNull();
    for (const type of RECORDER_TYPES) {
      expect(ACCEPTED_VIDEO_MIME as readonly string[]).toContain(type);
    }
  });
  it("names the base type the server accepts, whatever codecs the recorder says", () => {
    expect(
      baseType("video/mp4;codecs=avc1.42E01F,mp4a.40.2", "video/webm"),
    ).toBe("video/mp4");
    expect(baseType("video/x-matroska;codecs=avc1", "video/webm")).toBe(
      "video/webm",
    );
  });
  it("names a shot by when it was taken, its extension by its kind", () => {
    const at = new Date(2026, 9, 2, 22, 41, 7).getTime();
    expect(shotName(at, "photo", "image/jpeg")).toBe(
      "shot-20261002-224107.jpg",
    );
    expect(shotName(at, "video", "video/mp4")).toBe("shot-20261002-224107.mp4");
    expect(shotName(at, "video", "video/webm")).toBe(
      "shot-20261002-224107.webm",
    );
  });
});
