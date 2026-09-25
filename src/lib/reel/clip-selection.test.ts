import { describe, expect, it } from "vitest";

import type { GalleryItem } from "@/lib/events/gallery-reel";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { FPS } from "@/lib/reel/engine/constants";
import { engineStyleDuration } from "@/lib/reel/engine/registry";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { planTake } from "@/lib/reel/live/take";

import {
  clipPool,
  clipProps,
  clipSeconds,
  fillIds,
  fittingCount,
  keepInPool,
  lengthOffered,
  lengthSecondsFor,
  momentsLeft,
  openWith,
  ownMomentIds,
  toggleMoment,
  type ClipContext,
} from "./clip-selection";

/**
 * A CLIP'S SELECTION: the pool is the reel's (so a clip is never cut from clips), the fills start
 * where the reel is, the length is a promise about the file on every style's own clock, and the
 * export's minute counts moments. The engine's planners are pure, so the real cap is what runs.
 */

function item(i: number, over: Partial<GalleryItem> = {}): GalleryItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `https://r2.test/o/${i}.jpg`,
    previewUrl: `https://r2.test/p/${i}.webp`,
    status: "approved",
    width: i % 2 ? 3000 : 2000,
    height: i % 2 ? 2000 : 3000,
    uploaderKey: `g${i % 4}`,
    createdAt: new Date(Date.UTC(2026, 5, 14, 20, 0, i)).toISOString(),
    ...over,
  };
}

function album(n: number): GalleryItem[] {
  return Array.from({ length: n }, (_, i) => item(i));
}

function ctxFor(
  items: readonly GalleryItem[],
  over: Partial<ClipContext> = {},
): ClipContext {
  return {
    byId: new Map(items.map((m) => [m.id, m])),
    styleId: "classic",
    orientation: "portrait",
    length: "auto",
    maxSeconds: 30,
    watermark: false,
    seed: 4242,
    ...over,
  };
}

describe("the pool", () => {
  it("is the reel's: approved, never a clip, something to draw, in the album's order", () => {
    const items = [
      item(1),
      item(2, { reelEligible: false }),
      item(3, { status: "pending" }),
      item(4, { status: "hidden" }),
      item(5, { type: "video", previewUrl: null }),
      item(6, { type: "video" }),
      item(7),
    ];
    expect(clipPool(items).map((m) => m.id)).toEqual(["m1", "m6", "m7"]);
  });

  it("names a guest's own by this device's ids and the owner's by the host's own uploads", () => {
    const pool = [item(1), item(2, { isHost: true }), item(3)];
    expect(
      ownMomentIds(pool, { isOwner: false, ownIds: new Set(["m3", "zz"]) }),
    ).toEqual(["m3"]);
    expect(
      ownMomentIds(pool, { isOwner: true, ownIds: new Set(["m3"]) }),
    ).toEqual(["m2"]);
    expect(ownMomentIds(pool, { isOwner: false, ownIds: null })).toEqual([]);
  });
});

describe("the length", () => {
  it("Auto is the plan's cap, and a fixed length never passes it", () => {
    expect(lengthSecondsFor("auto", 30)).toBe(30);
    expect(lengthSecondsFor("auto", 60)).toBe(60);
    expect(lengthSecondsFor(15, 30)).toBe(15);
    expect(lengthSecondsFor(60, 30)).toBe(30);
  });

  it("a free plan's 30 s cap does not offer 60", () => {
    expect(lengthOffered(60, 30)).toBe(false);
    expect(lengthOffered(30, 30)).toBe(true);
    expect(lengthOffered("auto", 30)).toBe(true);
    expect(lengthOffered(60, 60)).toBe(true);
  });

  it("fits every style on its own clock: inside the length, and as many moments as fit", () => {
    const items = album(120);
    const ids = items.map((m) => m.id);
    for (const style of STYLE_CATALOG) {
      const whole = buildReelProps({
        orderedIds: ids,
        byId: new Map(items.map((m) => [m.id, m])),
        styleId: style.id,
        seed: 4242,
        lengthSeconds: null,
      });
      for (const seconds of [15, 30, 60] as const) {
        const props = clipProps(
          ids,
          ctxFor(items, { styleId: style.id, length: seconds, maxSeconds: 60 }),
        );
        const kept = props.clips.length;
        const frames = engineStyleDuration(style.id, props);
        expect(
          frames,
          `${style.id} at ${seconds}s runs ${frames / FPS}s`,
        ).toBeLessThanOrEqual(seconds * FPS);
        expect(kept).toBeGreaterThanOrEqual(1);
        // As many as fit: one more moment would run past the length.
        const oneMore = engineStyleDuration(style.id, {
          ...whole,
          clips: whole.clips.slice(0, kept + 1),
        });
        expect(oneMore, `${style.id} at ${seconds}s left room`).toBeGreaterThan(
          seconds * FPS,
        );
      }
    }
  });

  it("keeps a free event's clip inside its 30 s, whichever look it wears", () => {
    const items = album(80);
    for (const style of STYLE_CATALOG) {
      const props = clipProps(
        items.map((m) => m.id),
        ctxFor(items, { styleId: style.id, maxSeconds: 30, watermark: true }),
      );
      expect(clipSeconds(props)).toBeLessThanOrEqual(30);
      // The mark is the server's fact, carried through untouched.
      expect(props.watermark).toBe(true);
    }
  });

  it("plays a short selection whole, and counts what plays", () => {
    const items = album(6);
    const ids = items.map((m) => m.id).slice(0, 3);
    const ctx = ctxFor(items);
    expect(fittingCount(ids, ctx)).toBe(3);
    expect(fittingCount([], ctx)).toBe(0);
    expect(clipSeconds(clipProps([], ctx))).toBe(0);
  });
});

describe("the fills", () => {
  const items = album(40).map((m, i) =>
    i % 5 === 0 ? { ...m, isHost: true } : m,
  );
  const pool = clipPool(items);
  const base = {
    pool,
    eventId: "ev-1",
    isOwner: false,
    ownIds: new Set(["m3", "m9"]),
  };

  it("the reel's picks are the take the reel opens on, capped to what plays", () => {
    const ctx = ctxFor(items);
    const picks = fillIds("reel", { ...base, ctx });
    const take = planTake(pool, {
      eventId: "ev-1",
      loopIndex: 0,
      ownIds: base.ownIds,
    });
    expect(picks.length).toBeGreaterThan(1);
    expect(picks).toEqual(take.slice(0, picks.length));
    // Capped: the whole of it plays.
    expect(fittingCount(picks, ctx)).toBe(picks.length);
    expect(picks.length).toBeLessThan(pool.length);
  });

  it("only mine is the viewer's own, and everything is the whole pool in the album's order", () => {
    const ctx = ctxFor(items);
    expect(fillIds("mine", { ...base, ctx })).toEqual(["m3", "m9"]);
    expect(fillIds("mine", { ...base, isOwner: true, ctx })).toEqual(
      pool.filter((m) => m.isHost).map((m) => m.id),
    );
    expect(fillIds("all", { ...base, ctx })).toEqual(pool.map((m) => m.id));
  });
});

describe("the edits", () => {
  it("a tap takes a moment out, or adds it at the end", () => {
    expect(toggleMoment(["a", "b", "c"], "b")).toEqual(["a", "c"]);
    expect(toggleMoment(["a", "c"], "b")).toEqual(["a", "c", "b"]);
  });

  it("the opening shot moves to the front and keeps the rest in order", () => {
    expect(openWith(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
    expect(openWith(["a", "b"], "a")).toEqual(["a", "b"]);
    expect(openWith(["a", "b"], "zz")).toEqual(["a", "b"]);
  });

  it("drops what left the pool and hands the same list back when nothing did", () => {
    const pool = [item(1), item(2)];
    const ids = ["m1", "m2"];
    expect(keepInPool(ids, pool)).toBe(ids);
    expect(keepInPool(["m2", "m7", "m1"], pool)).toEqual(["m2", "m1"]);
  });
});

describe("the export's minute", () => {
  it("counts moments down from all of them to none", () => {
    expect(momentsLeft(0, 8)).toBe(8);
    expect(momentsLeft(0.5, 8)).toBe(4);
    expect(momentsLeft(0.99, 8)).toBe(1);
    expect(momentsLeft(1, 8)).toBe(0);
  });

  it("never leaves the range, whatever the encoder reports", () => {
    expect(momentsLeft(-1, 8)).toBe(8);
    expect(momentsLeft(3, 8)).toBe(0);
    expect(momentsLeft(Number.NaN, 8)).toBe(8);
    expect(momentsLeft(0.5, 0)).toBe(0);
  });
});
