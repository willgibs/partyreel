// THE RENDERER'S HALF of motion video: the mood draw asks a video clip's ring for the frame at the
// clip's LOCAL time and blits it where the poster would go, and falls back to the poster the moment
// the ring answers null. Everything below runs over a recording 2d context, so it pins the draw
// WITHOUT a canvas — and therefore proves the thing the lab harness can only show.
//
// In video/ rather than beside styles/mood.ts because this lane owns this folder; the file it
// exercises is ../styles/mood.ts.

import { describe, expect, it, vi } from "vitest";

import type { ReelAssets, ClipAsset } from "../assets";
import { containRect, coverRect, type CanvasImage } from "../canvas2d";
import { FPS } from "../constants";
import type { DrawEnv } from "../contract";
import type { ReelProps, ReelVideoFrame } from "../reel-types";
import { THEME_CLASSIC } from "../reel-types";
import { moodStyle } from "../styles/mood";

const W = 1080;
const H = 1920;

type DrawCall = { image: unknown; x: number; y: number; w: number; h: number };

/** A 2d context that records drawImage and swallows everything else. */
function recordingCtx(calls: DrawCall[]): CanvasRenderingContext2D {
  const noop = () => {};
  const ctx = {
    clearRect: noop,
    fillRect: noop,
    beginPath: noop,
    rect: noop,
    clip: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    drawImage: (image: unknown, x: number, y: number, w: number, h: number) => {
      calls.push({ image, x, y, w, h });
    },
    fillStyle: "",
    filter: "",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

function env(ctx: CanvasRenderingContext2D): DrawEnv {
  return {
    width: W,
    height: H,
    // false so the draw never asks for a real CSS filter chain; the grade is not what is pinned here.
    filterOk: false,
    scratch: () => ctx,
    report: () => {},
  };
}

const poster = (w = 640, h = 360) =>
  ({ width: w, height: h }) as unknown as CanvasImage;

const videoFrame = (w = 854, h = 480, localSec = 0): ReelVideoFrame => ({
  image: { width: w, height: h } as unknown as HTMLCanvasElement,
  width: w,
  height: h,
  localSec,
});

function asset(image: CanvasImage): ClipAsset {
  const { width, height } = image as unknown as {
    width: number;
    height: number;
  };
  return { image, width, height, wash: null, halo: null, video: null };
}

/** One landscape video clip in a portrait composition: the FIT path, the interesting one. */
function propsWith(
  frameAt: (localSec: number) => ReelVideoFrame | null,
  over: { url?: string } = {},
): ReelProps {
  return {
    clips: [
      {
        url: over.url ?? "poster.webp",
        type: "video",
        width: 1920,
        height: 1080,
        trimDurationSec: 3,
        video: { kind: "window", frameAt },
      },
    ],
    // No overlays and no signature: this pins the CLIP paint, not the mood's dressing.
    theme: {
      ...THEME_CLASSIC,
      overlays: [],
      signature: {},
      kenBurns: { zoom: 0, pan: 0 },
    },
    seed: 4,
    orientation: "portrait",
    styleId: "classic",
  };
}

const MOOD = moodStyle("classic");

describe("the mood renderer and a clip's window", () => {
  it("draws the decoded frame instead of the poster when the ring has one", () => {
    const frame = videoFrame();
    const frameAt = vi.fn(() => frame);
    const props = propsWith(frameAt);
    const calls: DrawCall[] = [];
    const ctx = recordingCtx(calls);
    const assets: ReelAssets = {
      clips: [asset(poster())],
      failures: 0,
      grain: null,
    };

    MOOD.draw(ctx, 12, props, assets, env(ctx));

    expect(frameAt).toHaveBeenCalledWith(12 / FPS);
    expect(calls.length).toBe(1);
    expect(calls[0].image).toBe(frame.image);
  });

  it("sizes the draw from the FRAME's own pixels, not the poster's", () => {
    const frame = videoFrame(854, 480);
    const props = propsWith(() => frame);
    const calls: DrawCall[] = [];
    const ctx = recordingCtx(calls);
    const assets: ReelAssets = {
      clips: [asset(poster(640, 360))],
      failures: 0,
      grain: null,
    };

    MOOD.draw(ctx, 0, props, assets, env(ctx));

    // A landscape clip in a portrait composition is CONTAINED (never cropped).
    const expected = containRect(854, 480, W, H);
    expect(calls[0].w).toBeCloseTo(expected.w, 3);
    expect(calls[0].h).toBeCloseTo(expected.h, 3);
  });

  it("falls back to the poster the moment the ring answers null", () => {
    const props = propsWith(() => null);
    const calls: DrawCall[] = [];
    const ctx = recordingCtx(calls);
    const still = poster();
    const assets: ReelAssets = {
      clips: [asset(still)],
      failures: 0,
      grain: null,
    };

    MOOD.draw(ctx, 12, props, assets, env(ctx));

    expect(calls.length).toBe(1);
    expect(calls[0].image).toBe(still);
  });

  it("never asks a photo clip for a frame", () => {
    const frameAt = vi.fn(() => videoFrame());
    const props: ReelProps = {
      clips: [
        {
          url: "photo.webp",
          type: "photo",
          width: 1080,
          height: 1350,
          video: { kind: "window", frameAt },
        },
      ],
      theme: { ...THEME_CLASSIC, overlays: [], signature: {} },
      seed: 4,
      orientation: "portrait",
      styleId: "classic",
    };
    const calls: DrawCall[] = [];
    const ctx = recordingCtx(calls);
    const still = poster(1080, 1350);
    MOOD.draw(
      ctx,
      3,
      props,
      { clips: [asset(still)], failures: 0, grain: null },
      env(ctx),
    );

    expect(frameAt).not.toHaveBeenCalled();
    expect(calls[0].image).toBe(still);
  });

  it("draws a POSTERLESS video's motion rather than a theme hold", () => {
    const frame = videoFrame(480, 854);
    const props = propsWith(() => frame, { url: "" });
    props.clips[0].width = 480;
    props.clips[0].height = 854;
    const calls: DrawCall[] = [];
    const ctx = recordingCtx(calls);
    // An empty url means loadReelAssets built NO asset: the motion must still reach the canvas.
    const assets: ReelAssets = { clips: [null], failures: 0, grain: null };

    MOOD.draw(ctx, 6, props, assets, env(ctx));

    expect(calls.length).toBe(1);
    expect(calls[0].image).toBe(frame.image);
    // A portrait source in a portrait composition COVERS.
    const expected = coverRect(480, 854, W, H);
    expect(calls[0].w).toBeCloseTo(expected.w, 3);
  });

  it("holds the theme colour when there is neither a poster nor a frame", () => {
    const props = propsWith(() => null, { url: "" });
    const calls: DrawCall[] = [];
    const ctx = recordingCtx(calls);
    MOOD.draw(
      ctx,
      6,
      props,
      { clips: [null], failures: 0, grain: null },
      env(ctx),
    );
    expect(calls.length).toBe(0);
  });

  it("draws the poster for a clip carrying no window at all (every reel before this lane)", () => {
    const props: ReelProps = {
      clips: [{ url: "poster.webp", type: "video", width: 1920, height: 1080 }],
      theme: { ...THEME_CLASSIC, overlays: [], signature: {} },
      seed: 4,
      orientation: "portrait",
      styleId: "classic",
    };
    const calls: DrawCall[] = [];
    const ctx = recordingCtx(calls);
    const still = poster();
    MOOD.draw(
      ctx,
      5,
      props,
      { clips: [asset(still)], failures: 0, grain: null },
      env(ctx),
    );
    expect(calls[0].image).toBe(still);
  });
});
