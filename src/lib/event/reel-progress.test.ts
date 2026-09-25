import { describe, expect, it } from "vitest";

import type { LiveMediaItem } from "@/lib/reel/live/items";

import {
  hubReel,
  photosToGo,
  REEL_CARD_STILLS,
  REEL_MINIMUM,
  reelState,
  spreadSample,
  TAKE_POOL,
} from "./reel-progress";

/**
 * The host's reel state, pinned as a rule. What is contract here: the minimum is the guest's
 * (the card flips on the photo that makes the guest's tile appear), the switch beats the count,
 * and "can play" is the live reel's own `isReelEligible`, never a looser count of approved items.
 */

const photo = (
  i: number,
  over: Partial<LiveMediaItem> = {},
): LiveMediaItem => ({
  id: `m${i}`,
  type: "photo",
  url: `original-${i}`,
  previewUrl: `preview-${i}`,
  status: "approved",
  createdAt: `2026-09-25T12:${String(i).padStart(2, "0")}:00.000000+00:00`,
  uploaderKey: `guest-${i % 3}`,
  ...over,
});

describe("reelState", () => {
  it("plays from the second item, with the switch on", () => {
    expect(reelState({ showReel: true, playable: 0 })).toBe("counting");
    expect(reelState({ showReel: true, playable: 1 })).toBe("counting");
    expect(reelState({ showReel: true, playable: REEL_MINIMUM })).toBe("live");
    expect(reelState({ showReel: true, playable: 400 })).toBe("live");
  });

  it("is off whenever the host turned it off, whatever the album holds", () => {
    expect(reelState({ showReel: false, playable: 0 })).toBe("off");
    expect(reelState({ showReel: false, playable: 40 })).toBe("off");
  });

  it("counts down to zero and stops there", () => {
    expect(photosToGo(0)).toBe(2);
    expect(photosToGo(1)).toBe(1);
    expect(photosToGo(2)).toBe(0);
    expect(photosToGo(9)).toBe(0);
  });
});

describe("hubReel: the Reel card's face", () => {
  it("counts only what the live reel would play", () => {
    const items = [
      photo(1, { status: "hidden" }),
      photo(2, { status: "pending" }),
      // A clip someone added to the album never plays in the reel it came from.
      photo(3, { type: "video", reelEligible: false }),
      // A video with no poster has nothing the reel can draw.
      photo(4, { type: "video", previewUrl: null }),
      photo(5),
    ];
    const face = hubReel({ eventId: "e1", showReel: true, items });
    expect(face.state).toBe("counting");
    expect(face.have).toBe(1);
    // The one photograph it has sits under the card's overlay.
    expect(face.stills).toEqual(["preview-5"]);
  });

  it("draws a plain card with nothing yet", () => {
    expect(hubReel({ eventId: "e1", showReel: true, items: [] })).toEqual({
      state: "counting",
      have: 0,
      stills: [],
    });
  });

  it("goes live at two, dissolving through the reel's own opening stills", () => {
    const items = Array.from({ length: 12 }, (_, i) => photo(i));
    const face = hubReel({ eventId: "e1", showReel: true, items });
    expect(face.state).toBe("live");
    expect(face.have).toBe(REEL_MINIMUM);
    expect(face.stills).toHaveLength(REEL_CARD_STILLS);
    expect(new Set(face.stills).size).toBe(REEL_CARD_STILLS);
    // Deterministic per event: the same album opens the same way on every render.
    expect(hubReel({ eventId: "e1", showReel: true, items }).stills).toEqual(
      face.stills,
    );
  });

  it("draws a video's poster, never its original, which an <img> cannot show", () => {
    const items = [
      photo(1, { type: "video", previewUrl: "poster-1" }),
      photo(2, { type: "video", previewUrl: "poster-2" }),
    ];
    const face = hubReel({ eventId: "e1", showReel: true, items });
    expect(face.state).toBe("live");
    expect([...face.stills].sort()).toEqual(["poster-1", "poster-2"]);
  });

  it("shows nothing behind an off card", () => {
    const items = Array.from({ length: 5 }, (_, i) => photo(i));
    expect(hubReel({ eventId: "e1", showReel: false, items })).toEqual({
      state: "off",
      have: 2,
      stills: [],
    });
  });
});

describe("the take's pool: a spread of the whole album, never its head", () => {
  it("keeps a small album whole", () => {
    expect(spreadSample([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });

  it("samples a big one evenly, newest and oldest both in, the same way every render", () => {
    const album = Array.from({ length: 1000 }, (_, i) => i);
    const pool = spreadSample(album, TAKE_POOL);
    expect(pool).toHaveLength(TAKE_POOL);
    expect(pool[0]).toBe(0);
    expect(pool.at(-1)).toBe(999);
    expect(new Set(pool).size).toBe(TAKE_POOL);
    expect(spreadSample(album, TAKE_POOL)).toEqual(pool);
  });

  it("gives a big album's card stills from its pool, not from the newest tiles alone", () => {
    const items = Array.from({ length: 3000 }, (_, i) => photo(i));
    const pool = new Set(
      spreadSample(items, TAKE_POOL).map((m) => `preview-${m.id.slice(1)}`),
    );
    const face = hubReel({ eventId: "e1", showReel: true, items });
    expect(face.state).toBe("live");
    expect(face.stills).toHaveLength(REEL_CARD_STILLS);
    for (const still of face.stills) expect(pool.has(still)).toBe(true);
  });
});
