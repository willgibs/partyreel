/**
 * THE HIGHLIGHT REEL TILE'S STILLS, crossfaded from the reel's own take: six slots always, previews
 * only, never a video's raw file, and the album's newest are not simply echoed above the album. Only
 * the take's first pass is planned, and on the paged album a playable item keeps its slot before its
 * link has landed.
 */
import { describe, expect, it } from "vitest";

import type { LiveMediaItem } from "@/lib/reel/live/items";
import { planTake, TAKE_PASS } from "@/lib/reel/live/take";

import {
  keepStills,
  playableSignature,
  TILE_SLOTS,
  tileStills,
} from "./reel-tile";

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

/**
 * ★ THE COVER KEEPS THE STILLS IT IS PLAYING (compute-reads). The take is a seeded shuffle of the WHOLE album, so one
 * arrival changed nearly every still the cover's six were dealt from, and the cover swapped its pictures on every batch
 * and asked for the links of the new ones (a links call behind every delta). Re-dealing is only for what must change.
 */
describe("keepStills", () => {
  const ids = (album: LiveMediaItem[], ownIds?: ReadonlySet<string>) => [
    ...new Set(tileStills(album, { eventId: "e1", ownIds }).map((s) => s.id)),
  ];
  const everyone = () => true;

  /** A party's album as it fills: n photographs, three guests, a minute apart, the newest last. */
  const party = (n: number) => Array.from({ length: n }, (_, i) => item(i));

  it("★ premise: a deal over the album after an arrival is not the deal over the album before it", () => {
    const before = ids(party(40));
    const after = ids(party(45));
    expect(after).not.toEqual(before);
    // Most of it moved, which is what made a re-deal swap the cover and send for the new stills' links.
    expect(after.filter((id) => before.includes(id)).length).toBeLessThan(
      TILE_SLOTS,
    );
  });

  it("★ is the cold deal exactly when nothing plays yet", () => {
    const fresh = ids(party(40));
    expect(keepStills({ playing: [], fresh, stands: everyone })).toEqual(fresh);
  });

  it("★ an arrival changes nothing: the stills it plays stay, as the very array it holds", () => {
    const playing = ids(party(40));
    const fresh = ids(party(45));
    const kept = keepStills({ playing, fresh, stands: everyone });
    expect(kept).toBe(playing);
  });

  it("★ a still the album lost gives its place to the take's next, and the other five stay in theirs", () => {
    const playing = ids(party(40));
    const fresh = ids(party(45));
    const gone = playing[2];
    const kept = keepStills({
      playing,
      fresh,
      stands: (id) => id !== gone,
    });
    expect(kept).toHaveLength(TILE_SLOTS);
    expect(kept.slice(0, 5)).toEqual(playing.filter((id) => id !== gone));
    // The place goes to the first of the cold deal that is not already playing, and it is not the one that left.
    const next = fresh.find((id) => id !== gone && !playing.includes(id));
    expect(kept[5]).toBe(next);
    expect(kept).not.toContain(gone);
  });

  it("a hidden still and a removed one are the same thing here: neither stands", () => {
    const playing = ids(party(40));
    const fresh = ids(party(40));
    const kept = keepStills({
      playing,
      fresh,
      stands: (id) => id !== playing[0] && id !== playing[1],
    });
    expect(kept).toHaveLength(TILE_SLOTS);
    expect(kept.slice(0, 4)).toEqual(playing.slice(2));
  });

  it("★ her own newest leads, as it does in a cold deal, and the tail it displaces is the last the cover held", () => {
    const album = party(45);
    const playing = ids(party(40));
    // She adds a photograph (m44, the newest), and the take leads with it on her device.
    const ownIds = new Set(["m44"]);
    const fresh = ids(album, ownIds);
    expect(fresh[0]).toBe("m44");
    const kept = keepStills({
      playing,
      fresh,
      lead: "m44",
      stands: everyone,
    });
    expect(kept).toEqual(["m44", ...playing.slice(0, TILE_SLOTS - 1)]);
  });

  it("her own newest, already playing, comes to the front without anything else moving", () => {
    const playing = ids(party(40));
    const mine = playing[3];
    const kept = keepStills({
      playing,
      fresh: [mine, ...playing.filter((id) => id !== mine)],
      lead: mine,
      stands: everyone,
    });
    expect(kept).toEqual([mine, ...playing.filter((id) => id !== mine)]);
  });

  it("a lead the cover may not draw leads nothing", () => {
    const playing = ids(party(40));
    const kept = keepStills({
      playing,
      fresh: ["m99", ...playing],
      lead: "m99",
      stands: (id) => id !== "m99",
    });
    expect(kept).toBe(playing);
  });

  it("fills a place that was never filled: a small album that grew", () => {
    expect(
      keepStills({
        playing: ["m1", "m2"],
        fresh: ["m3", "m1", "m2"],
        stands: everyone,
      }),
    ).toEqual(["m1", "m2", "m3"]);
  });

  it("never more than six, never one twice", () => {
    const kept = keepStills({
      playing: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
      fresh: ["m8", "m1", "m9"],
      stands: everyone,
    });
    expect(kept).toEqual(["m1", "m2", "m3", "m4", "m5", "m6"]);
    expect(
      keepStills({
        playing: ["m1", "m1", "m2"],
        fresh: ["m2", "m3", "m3"],
        stands: everyone,
      }),
    ).toEqual(["m1", "m2", "m3"]);
  });

  it("an album that emptied deals nothing", () => {
    expect(
      keepStills({ playing: ["m1", "m2"], fresh: [], stands: () => false }),
    ).toEqual([]);
  });
});
