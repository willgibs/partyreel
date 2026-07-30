/**
 * Pins for the quick-add pick. These are the CLAIMS the button's copy makes, so each one is a promise
 * to the host: the same tap gives the same reel, likes only lead when likes exist, every guest gets
 * seen, and the mix stays a montage.
 */
import { describe, expect, it } from "vitest";

import {
  pickQuickAdd,
  QUICK_ADD_MAX,
  QUICK_ADD_MIN,
  type QuickAddCandidate,
} from "@/lib/reel/quick-add";

const HOUR = 3_600_000;
const T0 = Date.parse("2026-07-30T20:00:00.000Z");

/** `hoursAgo` counts back from a FIXED base, so no fixture depends on the wall clock. */
function item(
  id: string,
  over: Partial<QuickAddCandidate> & { hoursAgo?: number } = {},
): QuickAddCandidate {
  const { hoursAgo = 0, ...rest } = over;
  return {
    id,
    type: "photo",
    createdAt: new Date(T0 - hoursAgo * HOUR).toISOString(),
    uploaderKey: "g1",
    ...rest,
  };
}

/** N photos from N different guests, evenly spaced back in time. */
function spread(n: number, over: Partial<QuickAddCandidate> = {}) {
  return Array.from({ length: n }, (_, i) =>
    item(`m${i}`, { hoursAgo: i, uploaderKey: `g${i}`, ...over }),
  );
}

describe("pickQuickAdd determinism", () => {
  it("is stable for the same items + seed, and different for a different seed", () => {
    const items = spread(30);
    const a = pickQuickAdd(items, { seed: 4242 });
    const b = pickQuickAdd(items, { seed: 4242 });
    expect(a.ids).toEqual(b.ids);

    // A shuffle (a new seed) must actually yield a different take, or "shuffle" is a lie.
    const other = pickQuickAdd(items, { seed: 99 });
    expect(other.ids).not.toEqual(a.ids);
    expect(other.ids).toHaveLength(a.ids.length);
  });

  it("never reaches for Math.random (the whole reel is seed-reproducible)", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(
      new URL("./quick-add.ts", import.meta.url),
      "utf8",
    );
    // Comments stripped: the module DISCUSSES the Math.random it replaced, at length.
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toContain("Math.random");
  });

  it("returns no duplicate ids", () => {
    const items = spread(40);
    const { ids } = pickQuickAdd(items, { seed: 7 });
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("pickQuickAdd counts", () => {
  it("takes up to max and no more", () => {
    const { ids } = pickQuickAdd(spread(50), { seed: 1 });
    expect(ids).toHaveLength(QUICK_ADD_MAX);
    expect(pickQuickAdd(spread(50), { seed: 1, max: 5 }).ids).toHaveLength(5);
  });

  it("returns the whole pool when it is smaller than the floor", () => {
    const items = spread(2);
    const { ids } = pickQuickAdd(items, { seed: 1, min: QUICK_ADD_MIN });
    // It cannot invent moments: min is a floor to reach, not a guarantee.
    expect(ids).toHaveLength(2);
    expect([...ids].sort()).toEqual(["m0", "m1"]);
  });

  it("handles an empty pool", () => {
    expect(pickQuickAdd([], { seed: 1 })).toEqual({
      ids: [],
      signals: { likes: false },
    });
  });
});

describe("pickQuickAdd likes", () => {
  it("leads with the most-liked moments when likes are rich", () => {
    // 20 photos, one guest, all the same age -> likes are the only real signal.
    const items = Array.from({ length: 20 }, (_, i) =>
      item(`m${i}`, { likeCount: i }),
    );
    const { ids, signals } = pickQuickAdd(items, { seed: 3, max: 5 });
    expect(signals.likes).toBe(true);
    // The top-liked ids (m19..m15) should dominate; allow the jitter one slot of latitude.
    const top = new Set(["m19", "m18", "m17", "m16", "m15", "m14"]);
    expect(ids.filter((id) => top.has(id)).length).toBeGreaterThanOrEqual(4);
  });

  it("rank-normalizes, so one runaway-popular photo cannot dominate", () => {
    // m0 has 500 likes; m1..m3 have 1 each. Rank (not magnitude) means m0 is merely FIRST, and the
    // other liked photos still score well above the unliked ones.
    const items = [
      item("m0", { likeCount: 500, hoursAgo: 40 }),
      item("m1", { likeCount: 1, hoursAgo: 40 }),
      item("m2", { likeCount: 1, hoursAgo: 40 }),
      item("m3", { likeCount: 1, hoursAgo: 40 }),
      ...Array.from({ length: 10 }, (_, i) =>
        item(`u${i}`, { hoursAgo: 40 - i * 0.01 }),
      ),
    ];
    const { ids } = pickQuickAdd(items, { seed: 5, max: 4 });
    expect(ids).toContain("m0");
    // All three lightly-liked photos beat the ten unliked ones of the same vintage.
    expect(ids.filter((id) => ["m1", "m2", "m3"].includes(id))).toHaveLength(3);
  });

  it("falls back to recency + coverage when likes are SPARSE, and says so", () => {
    // A single stray heart must not license "crowd favorites" copy.
    const items = spread(12);
    items[7] = { ...items[7], likeCount: 4 };
    const { ids, signals } = pickQuickAdd(items, { seed: 8, max: 6 });
    expect(signals.likes).toBe(false);
    // m7 sits in the OLDER half of a 12-photo pool, so only its heart gets it into a 6-pick:
    // sparse likes still steer the cut, they just don't get to headline it.
    expect(ids).toContain("m7");
  });

  it("reports likes only once enough liked moments actually make the cut", () => {
    const twoLiked = spread(12).map((m, i) =>
      i < 2 ? { ...m, likeCount: 3 } : m,
    );
    expect(pickQuickAdd(twoLiked, { seed: 2 }).signals.likes).toBe(false);
    const threeLiked = spread(12).map((m, i) =>
      i < 3 ? { ...m, likeCount: 3 } : m,
    );
    expect(pickQuickAdd(threeLiked, { seed: 2 }).signals.likes).toBe(true);
  });

  it("treats a pool with NO likes as likes-free (the early-event case)", () => {
    expect(pickQuickAdd(spread(20), { seed: 2 }).signals.likes).toBe(false);
  });
});

describe("pickQuickAdd recency", () => {
  it("favors the newest moments", () => {
    // One guest, no likes: recency decides. hoursAgo 0..29.
    const items = Array.from({ length: 30 }, (_, i) =>
      item(`m${i}`, { hoursAgo: i }),
    );
    const { ids } = pickQuickAdd(items, { seed: 6 });
    const ages = ids.map((id) => Number(id.slice(1)));
    // Everything picked is from the newer half of the night.
    expect(Math.max(...ages)).toBeLessThan(15);
  });

  it("decays from the NEWEST upload, not wall-clock now (an old album behaves the same)", () => {
    const recent = Array.from({ length: 20 }, (_, i) =>
      item(`m${i}`, { hoursAgo: i }),
    );
    // The identical album, shifted two years into the past.
    const ancient = recent.map((m) => ({
      ...m,
      createdAt: new Date(
        Date.parse(m.createdAt!) - 730 * 24 * HOUR,
      ).toISOString(),
    }));
    expect(pickQuickAdd(ancient, { seed: 6 }).ids).toEqual(
      pickQuickAdd(recent, { seed: 6 }).ids,
    );
  });

  it("survives a pool with NO timestamps at all", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      type: "photo" as const,
      uploaderKey: `g${i}`,
    }));
    const { ids } = pickQuickAdd(items, { seed: 6, max: 6 });
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
  });
});

describe("pickQuickAdd uploader coverage", () => {
  it("gives every guest a slot before any guest gets a second", () => {
    // 6 guests x 10 photos each. A 12-pick must be exactly 2 per guest.
    const items = Array.from({ length: 60 }, (_, i) =>
      item(`g${i % 6}-${i}`, { uploaderKey: `g${i % 6}`, hoursAgo: i * 0.1 }),
    );
    const { ids } = pickQuickAdd(items, { seed: 12 });
    const perGuest = new Map<string, number>();
    for (const id of ids) {
      const guest = id.split("-")[0];
      perGuest.set(guest, (perGuest.get(guest) ?? 0) + 1);
    }
    expect(perGuest.size).toBe(6);
    expect([...perGuest.values()]).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it("does not let ONE prolific uploader fill the reel", () => {
    // The old Math.random pick would hand ~11 of 12 slots to the guest with 100 photos.
    const items = [
      ...Array.from({ length: 100 }, (_, i) =>
        item(`hog${i}`, { uploaderKey: "hog", hoursAgo: i * 0.05 }),
      ),
      item("quiet-a", { uploaderKey: "quiet", hoursAgo: 20 }),
      item("quiet-b", { uploaderKey: "quiet", hoursAgo: 21 }),
    ];
    const { ids } = pickQuickAdd(items, { seed: 14 });
    expect(ids).toContain("quiet-a");
    expect(ids).toContain("quiet-b");
    expect(ids.filter((id) => id.startsWith("hog"))).toHaveLength(10);
  });

  it("pools unattributable uploads into ONE anonymous bucket", () => {
    // 20 anonymous + 1 named guest: the named guest must not be drowned out.
    const items = [
      ...Array.from({ length: 20 }, (_, i) =>
        item(`anon${i}`, { uploaderKey: null, hoursAgo: i * 0.1 }),
      ),
      item("named", { uploaderKey: "g9", hoursAgo: 30 }),
    ];
    const { ids } = pickQuickAdd(items, { seed: 15 });
    expect(ids).toContain("named");
  });

  it("keeps the host in the rotation as their own uploader", () => {
    const items = [
      ...Array.from({ length: 20 }, (_, i) =>
        item(`g${i}`, { uploaderKey: "guest", hoursAgo: i * 0.1 }),
      ),
      item("hostshot", { uploaderKey: "host", hoursAgo: 30 }),
    ];
    expect(pickQuickAdd(items, { seed: 16 }).ids).toContain("hostshot");
  });
});

describe("pickQuickAdd photo/video mix", () => {
  it("always includes at least one video when the album has any", () => {
    // The single video is the OLDEST and unliked, so nothing but the mix rule gets it in.
    const items = [
      ...Array.from({ length: 30 }, (_, i) =>
        item(`p${i}`, { uploaderKey: `g${i % 5}`, hoursAgo: i * 0.1 }),
      ),
      item("v0", { type: "video", uploaderKey: "g0", hoursAgo: 200 }),
    ];
    const { ids } = pickQuickAdd(items, { seed: 17 });
    expect(ids).toContain("v0");
    expect(ids).toHaveLength(QUICK_ADD_MAX);
  });

  it("caps videos near a third of the pick", () => {
    // A video-only-ish album: 30 videos (all newest) + 30 photos.
    const items = [
      ...Array.from({ length: 30 }, (_, i) =>
        item(`v${i}`, { type: "video", uploaderKey: `g${i % 6}`, hoursAgo: 0 }),
      ),
      ...Array.from({ length: 30 }, (_, i) =>
        item(`p${i}`, { uploaderKey: `g${i % 6}`, hoursAgo: 1 }),
      ),
    ];
    const { ids } = pickQuickAdd(items, { seed: 18 });
    const videos = ids.filter((id) => id.startsWith("v")).length;
    expect(videos).toBeGreaterThanOrEqual(1);
    expect(videos).toBeLessThanOrEqual(Math.ceil(QUICK_ADD_MAX / 3));
  });

  it("relaxes the cap rather than under-filling a video-only album", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      item(`v${i}`, { type: "video", uploaderKey: `g${i % 4}`, hoursAgo: i }),
    );
    const { ids } = pickQuickAdd(items, { seed: 19 });
    expect(ids).toHaveLength(QUICK_ADD_MAX);
  });

  it("does nothing special when the album has no video", () => {
    const { ids } = pickQuickAdd(spread(20), { seed: 20 });
    expect(ids).toHaveLength(QUICK_ADD_MAX);
  });
});

describe("pickQuickAdd output order", () => {
  it("returns the cut CHRONOLOGICALLY (the first cut reads as the night's story)", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      item(`m${i}`, { hoursAgo: i, uploaderKey: `g${i % 4}` }),
    );
    const { ids } = pickQuickAdd(items, { seed: 21 });
    const times = ids.map((id) =>
      Date.parse(items.find((m) => m.id === id)!.createdAt!),
    );
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
