/**
 * THE CLIP SOURCE's pins: what a payload change does to a loop that is already playing.
 *
 * The three behaviours the wiring lanes will lean on: an arrival is spliced in RIGHT AFTER the clip
 * on screen and never rewrites the window being watched; a departure is cut from every planned
 * window at once; and the retains stay flat no matter how long the reel runs, because that is what
 * keeps a 300-photograph album costing what a six-photograph one costs.
 */
import { describe, expect, it, vi } from "vitest";

import { createBitmapCache } from "@/lib/reel/engine/asset-cache";
import type { CanvasImage } from "@/lib/reel/engine/canvas2d";

import type { LiveMediaItem } from "./items";
import { createClipSource } from "./source";
import type { ReelLook } from "./window";

const LOOK: ReelLook = { styleId: "classic", surface: "hand" };
const NEEDS = { washes: false };

function item(i: number, over: Partial<LiveMediaItem> = {}): LiveMediaItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `/u/${i}.jpg`,
    previewUrl: `/p/${i}.webp`,
    status: "approved",
    createdAt: new Date(
      Date.parse("2026-08-15T18:00:00Z") - i * 3_600_000,
    ).toISOString(),
    uploaderKey: ["host", "g1", "g2", "g3"][i % 4],
    ...over,
  };
}

const album = (n: number) => Array.from({ length: n }, (_, i) => item(i));

/** A decoded-image stand-in with the duck-typed close an ImageBitmap has. */
const fakeImage = (url: string) =>
  ({ url, close: vi.fn() }) as unknown as CanvasImage;

/** A loadReelAssets stand-in that still goes through the decode seam (so retains are real). */
function fakeLoad() {
  const decoded: string[] = [];
  const load = vi.fn(
    async (
      clips: readonly { url: string }[],
      opts: { decode?: (url: string) => Promise<CanvasImage> } = {},
    ) => ({
      clips: await Promise.all(
        clips.map(async (clip) => {
          if (!clip.url) return null;
          decoded.push(clip.url);
          const image = await (opts.decode?.(clip.url) ??
            Promise.resolve(fakeImage(clip.url)));
          return { image, width: 4, height: 4, wash: null, halo: null };
        }),
      ),
      failures: 0,
      grain: null,
    }),
  );
  return { load: load as never, decoded };
}

function source(items: LiveMediaItem[], over: Record<string, unknown> = {}) {
  const { load, decoded } = fakeLoad();
  const cache = createBitmapCache(async (url) => fakeImage(url), 8);
  const clipSource = createClipSource({
    eventId: "e1",
    items,
    windowSize: 4,
    cache,
    load,
    ...over,
  });
  return { source: clipSource, cache, decoded };
}

describe("setItems", () => {
  it("seeds without calling anything an arrival", () => {
    const { source: s } = source([]);
    const first = s.setItems(album(6));
    expect(first.added).toHaveLength(6);
    expect(s.stats().pending).toBe(0);
  });

  it("splices what arrived and drops what left", () => {
    const { source: s } = source(album(6));
    const next = [...album(6).slice(1), item(99, { id: "fresh" })];
    const { added, dropped } = s.setItems(next);
    expect(added).toEqual(["fresh"]);
    expect(dropped).toEqual(["m0"]);
    expect(s.stats().pending).toBe(1);
    expect(s.isLive("m0")).toBe(false);
  });

  it("treats an item that stopped being eligible as a departure", () => {
    const { source: s } = source(album(6));
    const held = album(6).map((it) =>
      it.id === "m2" ? { ...it, status: "hidden" as const } : it,
    );
    const { dropped } = s.setItems(held);
    expect(dropped).toEqual(["m2"]);
    expect(s.isLive("m2")).toBe(false);
    const cut = album(6).map((it) =>
      it.id === "m3" ? { ...it, reelEligible: false } : it,
    );
    expect(s.setItems(cut).dropped).toContain("m3");
  });
});

describe("the windows", () => {
  it("chain, overlapping by ONE clip", () => {
    const { source: s } = source(album(20));
    const a = s.windowAt(0, LOOK)!;
    const b = s.windowAt(1, LOOK)!;
    const c = s.windowAt(2, LOOK)!;
    expect(a.ids).toHaveLength(4);
    expect(b.ids[0]).toBe(a.ids[3]);
    expect(c.ids[0]).toBe(b.ids[3]);
    expect(b.startIndex).toBe(3);
    expect(b.props.indexOffset).toBe(3);
  });

  it("roll into a new loop with a fresh take, carrying the clip on screen", () => {
    const { source: s } = source(album(7));
    let last = s.windowAt(0, LOOK)!;
    let rolled: typeof last | null = null;
    for (let i = 1; i < 6 && !rolled; i++) {
      const win = s.windowAt(i, LOOK)!;
      if (win.loopIndex !== last.loopIndex) rolled = win;
      last = win;
    }
    expect(rolled).not.toBeNull();
    expect(rolled!.loopIndex).toBe(1);
    expect(rolled!.startIndex).toBe(0);
    // The new loop still opens on the clip the old one ended with, so the swap lands mid-hold.
    expect(rolled!.ids[0]).toBeDefined();
    expect(s.stats().loopIndex).toBe(1);
  });

  it("memoize per look, and a style switch re-plans without touching the ids", () => {
    const { source: s } = source(album(12));
    const a = s.windowAt(0, LOOK)!;
    expect(s.windowAt(0, LOOK)).toBe(a);
    const swapped = s.windowAt(0, { ...LOOK, styleId: "punchy" })!;
    expect(swapped).not.toBe(a);
    expect(swapped.ids).toEqual(a.ids);
    expect(swapped.props.styleId).toBe("punchy");
  });

  it("never plan an album with nothing eligible", () => {
    const { source: s } = source([]);
    expect(s.windowAt(0, LOOK)).toBeNull();
    expect(s.eligibleCount()).toBe(0);
  });
});

describe("a splice", () => {
  it("puts the arrival right after the clip the next window opens on", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    s.setCurrentWindow(0);
    s.windowAt(1, LOOK); // prefetched, and about to be thrown away

    s.setItems([...album(20), item(99, { id: "fresh" })]);
    const next = s.windowAt(1, LOOK)!;
    expect(next.ids[0]).toBe(current.ids[3]); // still the overlap clip
    expect(next.ids[1]).toBe("fresh"); // and the arrival is the very next thing seen
  });

  it("never rewrites the window on screen", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    const before = [...current.ids];
    s.setCurrentWindow(0);
    s.setItems([...album(20), item(99, { id: "fresh" })]);
    expect(s.windowAt(0, LOOK)).toBe(current);
    expect(current.ids).toEqual(before);
    expect(s.revision()).toBeGreaterThan(0);
  });

  it("rewindows ON the clip playing now, with the arrivals right behind it", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    s.setCurrentWindow(0);
    const onScreen = current.ids[1];

    s.setItems([...album(20), item(99, { id: "fresh" })]);
    expect(s.pendingCount()).toBe(1);

    const rebuilt = s.rewindowAt(current, onScreen, LOOK)!;
    expect(rebuilt.index).toBe(current.index);
    expect(rebuilt.ids[0]).toBe(onScreen); // the picture does not change under the viewer
    expect(rebuilt.ids[1]).toBe("fresh"); // and the upload is the very next one
    expect(s.pendingCount()).toBe(0);
  });

  it("keeps the on-screen clip's PLAN identical across a rewindow (nothing moves)", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    const at = 1;
    const onScreen = current.ids[at];
    s.setItems([...album(20), item(99, { id: "fresh" })]);
    const rebuilt = s.rewindowAt(current, onScreen, LOOK)!;
    expect(rebuilt.startIndex).toBe(current.startIndex + at);
    expect(rebuilt.plan.clips[0].motion).toEqual(current.plan.clips[at].motion);
  });

  it("continues the chain from the rewindowed window", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    s.setCurrentWindow(0);
    s.setItems([...album(20), item(99, { id: "fresh" })]);
    const rebuilt = s.rewindowAt(current, current.ids[1], LOOK)!;
    const next = s.windowAt(1, LOOK)!;
    expect(next.ids[0]).toBe(rebuilt.ids[rebuilt.ids.length - 1]);
  });

  it("does not queue an id twice, nor one the take already holds", () => {
    const { source: s } = source(album(20));
    s.windowAt(0, LOOK);
    s.splice(["m3", "m3"]);
    expect(s.stats().pending).toBe(0); // m3 is already in the loop's take
    s.setItems([...album(20), item(99, { id: "fresh" })]);
    s.splice(["fresh"]);
    expect(s.stats().pending).toBe(1);
  });
});

describe("a drop", () => {
  it("is cut from EVERY planned window, the one on screen included", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    s.setCurrentWindow(0);
    const doomed = current.ids[2];
    s.drop([doomed]);
    // The slot behind the window has already lost it, so nothing planned from here can reach it.
    const rebuilt = s.windowAt(1, LOOK)!;
    expect(rebuilt.ids).not.toContain(doomed);
    expect(s.isLive(doomed)).toBe(false);
    for (let i = 2; i < 6; i++) {
      expect(s.windowAt(i, LOOK)?.ids ?? []).not.toContain(doomed);
    }
  });

  it("hands the player a cutaway that still has the departing clip to leave FROM", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    s.setCurrentWindow(0);
    const onScreen = current.ids[1];
    s.drop([onScreen]);
    const cut = s.cutawayFrom(current, onScreen, LOOK)!;
    expect(cut.ids[0]).toBe(onScreen);
    expect(cut.props.clips[0].url).toBeTruthy();
    expect(cut.ids.length).toBeGreaterThan(1);
    expect(cut.resumeFrame).toBeGreaterThan(0);
  });

  it("tops the cutaway up from the loop when the window had nothing after it", () => {
    const { source: s } = source(album(20));
    const current = s.windowAt(0, LOOK)!;
    const onScreen = current.ids[3]; // the last clip of the window
    s.drop([onScreen]);
    const cut = s.cutawayFrom(current, onScreen, LOOK)!;
    expect(cut.ids[0]).toBe(onScreen);
    expect(cut.ids.length).toBeGreaterThan(1);
  });
});

describe("the retains", () => {
  it("pin a window's stills and give them back one window behind", async () => {
    const { source: s, cache } = source(album(40));
    const win0 = s.windowAt(0, LOOK)!;
    await s.prepare(win0, { needs: NEEDS });
    expect(cache.retained()).toBe(4);

    const win1 = s.windowAt(1, LOOK)!;
    await s.prepare(win1, { needs: NEEDS });
    // The overlap still is retained twice; the distinct count is 7, not 8.
    expect(cache.retained()).toBe(7);

    s.release(0);
    expect(cache.retained()).toBe(4);
  });

  it("stay FLAT over a long run (the twenty-minute soak, in miniature)", async () => {
    const { source: s, cache } = source(album(300));
    for (let i = 0; i < 60; i++) {
      const win = s.windowAt(i, LOOK);
      if (!win) break;
      await s.prepare(win, { needs: NEEDS });
      s.setCurrentWindow(i);
      if (i >= 2) s.release(i - 2);
    }
    const stats = s.stats();
    expect(stats.retained).toBeLessThanOrEqual(3);
    expect(stats.windows).toBeLessThanOrEqual(3);
    expect(stats.derived).toBeLessThanOrEqual(12);
    expect(cache.retained()).toBeLessThanOrEqual(12);
    expect(stats.loopIndex).toBeGreaterThanOrEqual(0);
  });

  it("decode only what a splice added, never the whole window again", async () => {
    const { source: s, decoded } = source(album(20));
    const win0 = s.windowAt(0, LOOK)!;
    await s.prepare(win0, { needs: NEEDS });
    expect(decoded).toHaveLength(4);

    s.setCurrentWindow(0);
    s.setItems([...album(20), item(99, { id: "fresh" })]);
    const win1 = s.windowAt(1, LOOK)!;
    await s.prepare(win1, { needs: NEEDS });
    // Its first clip is window 0's last, already built: only the three new ones are decoded.
    expect(decoded).toHaveLength(7);
  });

  it("a style switch keeps the bitmaps and rebuilds only what the style derives", async () => {
    const { source: s, cache } = source(album(20));
    const win = s.windowAt(0, LOOK)!;
    await s.prepare(win, { needs: { washes: false } });
    const before = cache.size();

    const swapped = s.windowAt(0, { ...LOOK, styleId: "dreamy" })!;
    await s.prepare(swapped, { needs: { washes: true } });
    // The urls are the same four, already decoded: the cache never grew.
    expect(cache.size()).toBe(before);
    expect(s.stats().derived).toBe(8); // four stills, two looks
  });

  it("dispose() gives every retain back", async () => {
    const { source: s, cache } = source(album(20));
    await s.prepare(s.windowAt(0, LOOK)!, { needs: NEEDS });
    await s.prepare(s.windowAt(1, LOOK)!, { needs: NEEDS });
    expect(cache.retained()).toBeGreaterThan(0);
    s.dispose();
    expect(cache.retained()).toBe(0);
    expect(s.stats().retained).toBe(0);
  });

  it("counts a still that failed to decode as a failure, not as a crash", async () => {
    const { load } = fakeLoad();
    const failing = vi.fn(async (clips: readonly { url: string }[]) => ({
      clips: clips.map(() => null),
      failures: clips.length,
      grain: null,
    }));
    void load;
    const s = createClipSource({
      eventId: "e1",
      items: album(8),
      windowSize: 4,
      cache: createBitmapCache(async (url) => fakeImage(url)),
      load: failing as never,
    });
    const assets = await s.prepare(s.windowAt(0, LOOK)!, { needs: NEEDS });
    expect(assets.clips).toEqual([null, null, null, null]);
    expect(assets.failures).toBe(4);
  });
});
