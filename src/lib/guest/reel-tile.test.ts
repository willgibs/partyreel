/**
 * THE HIGHLIGHT REEL TILE'S STILLS, crossfaded from the reel's own take: six slots always, previews
 * only, never a video's raw file, and the album's newest are not simply echoed above the album. Only
 * the take's first pass is planned, and on the paged album a playable item keeps its slot before its
 * link has landed.
 */
import { describe, expect, it } from "vitest";

import type { LiveMediaItem } from "@/lib/reel/live/items";
import { planTake, TAKE_PASS } from "@/lib/reel/live/take";

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

/** A manifest item of the paged album: no links yet, `drawable` says it has a still. */
function unlinked(i: number, over: Partial<LiveMediaItem> = {}) {
  return item(i, { url: "", previewUrl: null, drawable: true, ...over });
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

  it("plans only the first pass, which is exactly the whole take's head", () => {
    const album = Array.from({ length: 90 }, (_, i) => item(i));
    const head = planTake(album, { eventId: "e1", loopIndex: 0, passes: 1 });
    expect(head).toHaveLength(TAKE_PASS);
    expect(tileStills(album, { eventId: "e1" }).map((s) => s.id)).toEqual(
      head.slice(0, TILE_SLOTS),
    );
  });

  it("leads with the device's own newest, even one the take would place late", () => {
    // An hour apart, newest first: m89 is three and a half days older than m0, so the take's
    // recency places it in a late pass, far past the tile's six.
    const album = Array.from({ length: 90 }, (_, i) =>
      item(i, {
        createdAt: new Date(
          Date.UTC(2026, 8, 24, 20) - i * 3_600_000,
        ).toISOString(),
      }),
    );
    const ownIds = new Set(["m89"]);
    const whole = planTake(album, { eventId: "e1", loopIndex: 0 });
    expect(whole.indexOf("m89")).toBeGreaterThanOrEqual(TAKE_PASS);
    const stills = tileStills(album, { eventId: "e1", ownIds });
    expect(stills[0].id).toBe("m89");
    expect(stills.map((s) => s.id)).toEqual(
      planTake(album, { eventId: "e1", loopIndex: 0, ownIds }).slice(
        0,
        TILE_SLOTS,
      ),
    );
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

  it("keeps a playable item's slot before its link lands (the caller resolves it by id)", () => {
    const album = [
      unlinked(1),
      unlinked(2),
      item(3),
      // A manifest video with no poster is not playable, link or no link.
      unlinked(4, { type: "video", drawable: false }),
    ];
    const stills = tileStills(album, { eventId: "e1" });
    expect(stills).toHaveLength(TILE_SLOTS);
    expect(new Set(stills.map((s) => s.id))).toEqual(
      new Set(["m1", "m2", "m3"]),
    );
    for (const still of stills) {
      expect(still.url).toBe(still.id === "m3" ? "/p/3.webp" : "");
    }
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
    const rolled = album.map((m) => ({
      ...m,
      previewUrl: `${m.previewUrl}?v=2`,
    }));
    expect(playableSignature(rolled)).toBe(playableSignature(album));
    expect(playableSignature([...album, item(3)])).not.toBe(
      playableSignature(album),
    );
    expect(playableSignature([item(1), item(2, { reelEligible: false })])).toBe(
      playableSignature([item(1)]),
    );
  });

  it("counts a drawable item with no link yet, and does not move when the link lands", () => {
    const before = [item(1), unlinked(2)];
    const linked = [item(1), { ...unlinked(2), previewUrl: "/p/2.webp" }];
    expect(playableSignature(before)).toBe(
      playableSignature([item(1), item(2)]),
    );
    expect(playableSignature(linked)).toBe(playableSignature(before));
    // The reel's own rule: a posterless manifest video, or an item the album is not showing, is not.
    expect(
      playableSignature([
        item(1),
        unlinked(3, { type: "video", drawable: false }),
        item(4, { status: "hidden" }),
      ]),
    ).toBe(playableSignature([item(1)]));
  });
});
