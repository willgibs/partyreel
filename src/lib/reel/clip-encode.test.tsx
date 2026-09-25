/**
 * MAKING THE FILE (clip-encode.ts): the engine's own encode, with what a clip adds around it.
 *
 * - A backgrounded tab pauses (`wait=stack`): the encoder's seam holds the loop while the tab is
 *   hidden and says so, and lets go the moment it is visible again.
 * - Cancelling while a hidden tab holds it still cancels (an AbortError, never a hang).
 * - The file is named, typed video/mp4, and its poster is the clip's own frame (null, never a
 *   throw, where the frame would not draw).
 *
 * A .tsx for the jsdom project: the pause reads `document.visibilityState`. The encoder itself is
 * stubbed (its own seam test pins the loop); only what this module adds is pinned here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { THEME_CLASSIC } from "@/lib/reel/engine/reel-types";

const h = vi.hoisted(() => ({
  frames: 4,
  prepared: [] as number[],
}));

vi.mock("@/lib/reel/engine/encode", () => ({
  encodeReel: async (
    _props: unknown,
    opts: {
      signal: AbortSignal;
      onProgress: (p: number) => void;
      prepareFrame?: (f: number) => void | Promise<void>;
    },
  ) => {
    for (let f = 0; f < h.frames; f++) {
      if (opts.signal.aborted) throw new DOMException("aborted", "AbortError");
      await opts.prepareFrame?.(f);
      h.prepared.push(f);
      opts.onProgress(f / h.frames);
    }
    return {
      blob: new Blob([new Uint8Array(64)], { type: "video/mp4" }),
      totalFrames: 48,
      wallMs: 5,
    };
  },
}));

// The poster's decode: no network in this project (a real fetch of a fixture host only waits).
vi.mock("@/lib/reel/engine/assets", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/reel/engine/assets")>()),
  loadReelAssets: async () => ({ clips: [null], failures: 0, grain: null }),
}));

const { encodeClip } = await import("./clip-encode");

const PROPS: ReelProps = {
  clips: [
    {
      url: "https://r2.test/p/1.webp",
      type: "photo",
      width: 1200,
      height: 1600,
    },
  ],
  theme: THEME_CLASSIC,
  seed: 7,
  orientation: "portrait",
  styleId: "classic",
};

let visibility: DocumentVisibilityState = "visible";

function setVisibility(next: DocumentVisibilityState) {
  visibility = next;
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  h.frames = 4;
  h.prepared = [];
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(
    () => visibility,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("encodeClip", () => {
  it("names the file, types it video/mp4, and times it from the frames", async () => {
    const out = await encodeClip(PROPS, {
      filename: "maya-jay-clip.mp4",
      signal: new AbortController().signal,
      onProgress: () => {},
    });
    expect(out.file.name).toBe("maya-jay-clip.mp4");
    expect(out.file.type).toBe("video/mp4");
    expect(out.seconds).toBe(2);
    // jsdom draws nothing: the poster is null rather than a throw, and the uploader then makes one.
    expect(out.poster).toBeNull();
  });

  it("holds the loop while the tab is hidden, says so, and goes on when it comes back", async () => {
    const paused: boolean[] = [];
    visibility = "hidden";
    const run = encodeClip(PROPS, {
      filename: "clip.mp4",
      signal: new AbortController().signal,
      onProgress: () => {},
      onPaused: (p) => paused.push(p),
    });
    await new Promise((r) => setTimeout(r, 20));
    // Not a frame drawn while hidden.
    expect(h.prepared).toEqual([]);
    expect(paused).toEqual([true]);
    setVisibility("visible");
    await run;
    expect(h.prepared).toEqual([0, 1, 2, 3]);
    expect(paused).toEqual([true, false]);
  });

  it("cancels while hidden with an AbortError, never a hang", async () => {
    visibility = "hidden";
    const controller = new AbortController();
    const run = encodeClip(PROPS, {
      filename: "clip.mp4",
      signal: controller.signal,
      onProgress: () => {},
    });
    await new Promise((r) => setTimeout(r, 10));
    controller.abort();
    await expect(run).rejects.toMatchObject({ name: "AbortError" });
    expect(h.prepared).toEqual([]);
  });
});
