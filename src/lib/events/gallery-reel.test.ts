/**
 * THE LIVE REEL'S FACTS AND THE ONE RULE THAT READS THEM.
 *
 * The reel exists for a guest from the SECOND reel-eligible item, and below it (or with the host's
 * switch off, the platform lever off, or a door still standing) there is no tile, no view and no
 * `?reel`. A clip never counts toward the two. And every tier-shaped fact is derived here from a
 * tier the server read.
 */
import { describe, expect, it } from "vitest";

import {
  clipFactsForTier,
  LIVE_REEL_MINIMUM,
  liveReelAvailable,
  reelEligibleCount,
  reelFactsFor,
  type GalleryItem,
  type GalleryReel,
} from "./gallery-reel";

const item = (i: number, over: Partial<GalleryItem> = {}): GalleryItem => ({
  id: `m${i}`,
  type: "photo",
  url: `/u/${i}.jpg`,
  previewUrl: `/p/${i}.webp`,
  status: "approved",
  ...over,
});

const ON: GalleryReel = {
  showReel: true,
  liveReelEnabled: true,
  styleId: null,
  clip: clipFactsForTier("pro"),
};

describe("reelFactsFor", () => {
  it("says nothing at all below full access (the door is guarding the album)", () => {
    for (const access of ["none", "teaser"] as const) {
      expect(
        reelFactsFor({
          access,
          showReel: true,
          liveReelEnabled: true,
          styleId: "warm",
          tier: "pro",
        }),
      ).toBeNull();
    }
  });

  it("carries the host's switch and mood, the lever, and the plan's creator facts", () => {
    expect(
      reelFactsFor({
        access: "full",
        showReel: false,
        liveReelEnabled: true,
        styleId: "warm",
        tier: "free",
      }),
    ).toEqual({
      showReel: false,
      liveReelEnabled: true,
      styleId: "warm",
      clip: { videoAllowed: false, watermark: true, maxSeconds: 30 },
    });
  });

  it("keeps the reel and drops only the creator when the plan could not be read", () => {
    const facts = reelFactsFor({
      access: "full",
      showReel: true,
      liveReelEnabled: true,
      styleId: null,
      tier: null,
    });
    expect(facts?.showReel).toBe(true);
    expect(facts?.clip).toBeNull();
  });
});

describe("clipFactsForTier", () => {
  it("lets a paid plan save a video clip without the mark, at the paid length", () => {
    expect(clipFactsForTier("pro")).toEqual({
      videoAllowed: true,
      watermark: false,
      maxSeconds: 60,
    });
    expect(clipFactsForTier("event_pass")).toEqual({
      videoAllowed: true,
      watermark: false,
      maxSeconds: 60,
    });
  });
});

describe("liveReelAvailable: the minimum is TWO", () => {
  it("is absent at one item and present at two", () => {
    expect(LIVE_REEL_MINIMUM).toBe(2);
    expect(liveReelAvailable(ON, [item(1)])).toBe(false);
    expect(liveReelAvailable(ON, [item(1), item(2)])).toBe(true);
  });

  it("never counts a clip, a held item, or one with nothing to draw", () => {
    const clip = item(2, { reelEligible: false });
    const held = item(3, { status: "pending" });
    const blank = item(4, { type: "video", previewUrl: null });
    expect(reelEligibleCount([item(1), clip, held, blank])).toBe(1);
    expect(liveReelAvailable(ON, [item(1), clip, held, blank])).toBe(false);
  });

  it("reads an absent reelEligible as eligible (a payload from before the column)", () => {
    const legacy = [item(1), item(2)].map(({ reelEligible: _r, ...rest }) => {
      void _r;
      return rest;
    });
    expect(liveReelAvailable(ON, legacy)).toBe(true);
  });

  it("is absent with the host's switch off, the lever off, or no facts at all", () => {
    const two = [item(1), item(2)];
    expect(liveReelAvailable({ ...ON, showReel: false }, two)).toBe(false);
    expect(liveReelAvailable({ ...ON, liveReelEnabled: false }, two)).toBe(false);
    expect(liveReelAvailable(null, two)).toBe(false);
  });
});
