// The asset loader's contract, pinned when it learned about motion video (the reel round,
// 2026-09-22). THE POSTER IS STILL FIRST: a video clip decodes its poster exactly as before and
// carries its live window alongside, so a reel with no motion behaves identically to the day before
// this lane. The decode itself is injected (the `decode` seam the shared bitmap cache uses), which
// is what lets these run in the node project with no DOM.

import { describe, expect, it, vi } from "vitest";

import { loadReelAssets } from "./assets";
import type { CanvasImage } from "./canvas2d";
import type { ReelClip, ReelVideoFrame, ReelVideoSource } from "./reel-types";

/** A decoded image stand-in: loadReelAssets only reads width/height off it. */
const image = (w = 1920, h = 1080) =>
  ({ width: w, height: h }) as unknown as CanvasImage;

function videoSource(frame: ReelVideoFrame | null = null): ReelVideoSource {
  return { kind: "window", frameAt: () => frame };
}

describe("loadReelAssets", () => {
  it("decodes a clip's poster into its asset", async () => {
    const decode = vi.fn(async () => image(1200, 800));
    const assets = await loadReelAssets(
      [{ url: "a.webp", type: "photo" }] as ReelClip[],
      { washes: false, decode },
    );
    expect(assets.failures).toBe(0);
    expect(assets.clips[0]).toMatchObject({ width: 1200, height: 800 });
  });

  it("carries a video clip's live window on its asset, beside the poster", async () => {
    const source = videoSource();
    const decode = vi.fn(async () => image());
    const assets = await loadReelAssets(
      [
        { url: "poster.webp", type: "video", video: source },
        { url: "photo.webp", type: "photo" },
      ] as ReelClip[],
      { washes: false, decode },
    );
    // Same object, not a copy: the reader's ring is what the draw must reach.
    expect(assets.clips[0]?.video).toBe(source);
    expect(assets.clips[0]?.image).toBeTruthy();
    expect(assets.clips[1]?.video).toBeNull();
  });

  it("leaves `video` null for every clip of a reel without motion", async () => {
    const decode = vi.fn(async () => image());
    const assets = await loadReelAssets(
      [
        { url: "a.webp", type: "photo" },
        { url: "b.webp", type: "video" },
      ] as ReelClip[],
      { washes: false, decode },
    );
    expect(assets.clips.map((c) => c?.video)).toEqual([null, null]);
  });

  it("still holds an empty url to a null asset (the theme-colour hold)", async () => {
    const decode = vi.fn(async () => image());
    const assets = await loadReelAssets(
      [{ url: "", type: "video", video: videoSource() }] as ReelClip[],
      { washes: false, decode },
    );
    // A posterless video has no asset to hang anything on, which is exactly why mood.ts reads the
    // motion source off the CLIP rather than off the asset.
    expect(assets.clips[0]).toBeNull();
    expect(decode).not.toHaveBeenCalled();
  });

  it("counts a failed poster and keeps going (a hold, never a crash)", async () => {
    const decode = vi.fn(async (url: string) => {
      if (url === "bad.webp") throw new Error("boom");
      return image();
    });
    const assets = await loadReelAssets(
      [
        { url: "bad.webp", type: "photo" },
        { url: "good.webp", type: "photo" },
      ] as ReelClip[],
      { washes: false, decode },
    );
    expect(assets.failures).toBe(1);
    expect(assets.clips[0]).toBeNull();
    expect(assets.clips[1]).not.toBeNull();
  });

  it("decodes one url once, however many clips use it", async () => {
    const decode = vi.fn(async () => image());
    await loadReelAssets(
      [
        { url: "same.webp", type: "photo" },
        { url: "same.webp", type: "photo" },
      ] as ReelClip[],
      { washes: false, decode },
    );
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("rethrows an abort rather than counting it as a failure", async () => {
    const decode = vi.fn(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect(
      loadReelAssets([{ url: "a.webp", type: "photo" }] as ReelClip[], {
        washes: false,
        decode,
      }),
    ).rejects.toThrow(/abort/i);
  });
});
