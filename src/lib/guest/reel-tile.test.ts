/**
 * THE HIGHLIGHT REEL TILE'S STILLS, crossfaded from the reel's own take: six slots always, previews
 * only, never a video's raw file, and the album's newest are not simply echoed above the album.
 */
import { describe, expect, it } from "vitest";

import type { LiveMediaItem } from "@/lib/reel/live/items";
import { planTake } from "@/lib/reel/live/take";

import { playableSignature, TILE_SLOTS, tileStills } from "./reel-tile";

function item(i: number, over: Partial<LiveMediaItem> = {}): LiveMediaItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `/o/${i}.jpg`,
    previewUrl: `/p/${i}.webp`,
    status: "approved",
    createdAt: new Date(Date.UTC(2026, 8, 24, 20, 0, i)).toISOString(),
    uploaderKey: ["host", "g1", "g2"][i % 3],
    ...over,
  };
}

describe("tileStills", () => {
  it("always fills six slots, cycling a small album", () => {
    const stills = tileStills([item(1), item(2)], { eventId: "e1" });
    expect(stills).toHaveLength(TILE_SLOTS);
    expect(new Set(stills.map((s) => s.id))).toEqual(new Set(["m1", "m2"]));
  });

  it("reads the reel's own take, in its order", () => {
    const album = Array.from({ length: 20 }, (_, i) => item(i));
    const take = planTake(album, { eventId: "e1", loopIndex: 0 });
    const stills = tileStills(album, { eventId: "e1" });
    expect(stills.map((s) => s.id)).toEqual(take.slice(0, TILE_SLOTS));
  });

  it("draws previews and posters only: never a video's own file, never a clip", () => {
    const stills = tileStills(
      [
        item(1),
        item(2, { type: "video", url: "/o/2.mp4", previewUrl: "/p/2.webp" }),
        item(3, { type: "video", url: "/o/3.mp4", previewUrl: null }),
        item(4, { reelEligible: false }),
      ],
      { eventId: "e1" },
    );
    const urls = new Set(stills.map((s) => s.url));
    expect(urls).toEqual(new Set(["/p/1.webp", "/p/2.webp"]));
  });

  it("is empty when nothing can play", () => {
    expect(tileStills([], { eventId: "e1" })).toEqual([]);
    expect(
      tileStills([item(1, { status: "pending" })], { eventId: "e1" }),
    ).toEqual([]);
  });
});

describe("playableSignature", () => {
  it("moves with membership, never with a url (the half-hourly presign roll)", () => {
    const album = [item(1), item(2)];
    const rolled = album.map((m) => ({ ...m, previewUrl: `${m.previewUrl}?v=2` }));
    expect(playableSignature(rolled)).toBe(playableSignature(album));
    expect(playableSignature([...album, item(3)])).not.toBe(
      playableSignature(album),
    );
    expect(playableSignature([item(1), item(2, { reelEligible: false })])).toBe(
      playableSignature([item(1)]),
    );
  });
});
