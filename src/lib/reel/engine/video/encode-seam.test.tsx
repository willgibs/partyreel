// THE ENCODER SEAM: encodeReel awaits `prepareFrame(f)` exactly once, immediately before the frame
// it prepares, and the draw itself never awaits — the ★ pooled-scratch invariant in registry.ts
// depends on drawReelFrame running to completion synchronously, so a cut pulling video frames must
// pull them BETWEEN draws, never inside one.
//
// A .tsx, and inside video/, on purpose: the jsdom project runs *.test.tsx (encode.ts needs a
// canvas and a muxer, both mocked here), and this lane owns src/lib/reel/engine/video/.

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReelAssets } from "../assets";
import type { ReelProps } from "../reel-types";
import { THEME_CLASSIC } from "../reel-types";

const events = vi.hoisted(() => [] as string[]);

// The muxer: encode.ts's whole mediabunny surface, reduced to what the loop touches.
vi.mock("mediabunny", () => {
  class BufferTarget {
    buffer: ArrayBuffer | null = new ArrayBuffer(8);
  }
  class CanvasSource {
    constructor(
      public canvas: unknown,
      public opts: unknown,
    ) {}
    add = vi.fn(async () => {});
  }
  class Mp4OutputFormat {}
  class Output {
    target: BufferTarget;
    constructor(opts: { target: BufferTarget }) {
      this.target = opts.target;
    }
    addVideoTrack = vi.fn();
    start = vi.fn(async () => {});
    finalize = vi.fn(async () => {});
    cancel = vi.fn(async () => {});
  }
  return { BufferTarget, CanvasSource, Mp4OutputFormat, Output };
});

// The draw: real duration/env/style resolution, a recording stub for the frame itself.
vi.mock("../registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../registry")>();
  return {
    ...actual,
    drawReelFrame: vi.fn((_ctx: unknown, frame: number) => {
      events.push(`draw:${frame}`);
    }),
  };
});

const { encodeReel } = await import("../encode");

const PROPS: ReelProps = {
  clips: [
    { url: "poster-a.webp", type: "video", width: 1920, height: 1080 },
    { url: "photo-b.webp", type: "photo", width: 1080, height: 1350 },
  ],
  theme: { ...THEME_CLASSIC, photoHoldSec: 0.5 },
  seed: 5,
  orientation: "portrait",
  styleId: "classic",
};

const ASSETS: ReelAssets = { clips: [null, null], failures: 0, grain: null };

beforeEach(() => {
  events.length = 0;
  // jsdom has no canvas backend, so getContext() returns null; the encode needs an object, not a
  // renderer (every draw is stubbed above).
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    {} as unknown as CanvasRenderingContext2D,
  );
});

describe("encodeReel's prepareFrame seam", () => {
  it("awaits prepareFrame once before each frame, in order", async () => {
    const result = await encodeReel(PROPS, {
      assets: ASSETS,
      prepareFrame: async (frame) => {
        events.push(`prepare:${frame}`);
        // A real reader resolves on a later microtask/macrotask; the loop must wait for it.
        await new Promise((resolve) => setTimeout(resolve, 0));
        events.push(`ready:${frame}`);
      },
    });

    expect(result.totalFrames).toBeGreaterThan(4);
    expect(events.slice(0, 6)).toEqual([
      "prepare:0",
      "ready:0",
      "draw:0",
      "prepare:1",
      "ready:1",
      "draw:1",
    ]);
    expect(events.filter((e) => e.startsWith("prepare:")).length).toBe(
      result.totalFrames,
    );
    // Every draw is preceded by its own prepare: the frames come out in order, one pull each.
    const draws = events.filter((e) => e.startsWith("draw:"));
    expect(draws).toEqual(
      Array.from({ length: result.totalFrames }, (_, f) => `draw:${f}`),
    );
  });

  it("encodes a reel with no prepareFrame exactly as before (no seam, no cost)", async () => {
    const result = await encodeReel(PROPS, { assets: ASSETS });
    expect(events.every((e) => e.startsWith("draw:"))).toBe(true);
    expect(events.length).toBe(result.totalFrames);
  });

  it("does not prepare a frame it will not draw after an abort", async () => {
    const controller = new AbortController();
    const prepared: number[] = [];
    const promise = encodeReel(PROPS, {
      assets: ASSETS,
      signal: controller.signal,
      prepareFrame: (frame) => {
        prepared.push(frame);
        if (frame === 2) controller.abort();
      },
    });
    await expect(promise).rejects.toThrow(/abort/i);
    // Frame 2 was prepared and drawn; the loop then checked the signal and stopped.
    expect(prepared).toEqual([0, 1, 2]);
  });
});
