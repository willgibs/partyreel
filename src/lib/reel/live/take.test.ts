/**
 * THE TAKE's pins. Deterministic per (items, eventId, loopIndex); every eligible item placed exactly
 * once; the quick-add brain's guarantees holding LOCALLY, in the part of the loop a viewer is
 * actually watching; cuts never in the order; "yours first" leading with the guest's newest.
 */
import { describe, expect, it } from "vitest";

import type { LiveMediaItem } from "./items";
import { planTake, seedFor, takeSeed } from "./take";

const HOUR = 3_600_000;
const BASE = Date.parse("2026-08-15T18:00:00.000Z");

function item(i: number, over: Partial<LiveMediaItem> = {}): LiveMediaItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `/u/${i}.jpg`,
    previewUrl: `/p/${i}.webp`,
    status: "approved",
    createdAt: new Date(BASE - i * HOUR).toISOString(),
    uploaderKey: ["host", "g1", "g2", "g3"][i % 4],
    ...over,
  };
}

const album = (n: number) => Array.from({ length: n }, (_, i) => item(i));

describe("planTake", () => {
  it("places every eligible item exactly once", () => {
    const items = album(37);
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    expect(take).toHaveLength(37);
    expect(new Set(take).size).toBe(37);
    for (const it of items) expect(take).toContain(it.id);
  });

  it("is deterministic for the same event and loop, and re-rolls on the next loop", () => {
    const items = album(20);
    const a = planTake(items, { eventId: "e1", loopIndex: 3 });
    const b = planTake(items, { eventId: "e1", loopIndex: 3 });
    const next = planTake(items, { eventId: "e1", loopIndex: 4 });
    const other = planTake(items, { eventId: "e2", loopIndex: 3 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(next);
    expect(a).not.toEqual(other);
  });

  it("never puts a CUT in the order (reelEligible false)", () => {
    const items = [...album(10), item(99, { id: "cut1", reelEligible: false })];
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    expect(take).not.toContain("cut1");
    expect(take).toHaveLength(10);
  });

  it("leaves out anything the album is not showing (held, hidden, removed, posterless)", () => {
    const items = [
      ...album(6),
      item(20, { id: "held", status: "pending" }),
      item(21, { id: "hidden", status: "hidden" }),
      item(22, { id: "gone", status: "removed" }),
      // A video whose poster never generated: the engine would draw a theme-colour hold.
      { id: "posterless", type: "video" as const, url: "/v.mp4", previewUrl: null },
    ];
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    expect(take.sort()).toEqual(album(6).map((i) => i.id).sort());
  });

  it("covers every uploader inside the FIRST pass (the party, not one camera roll)", () => {
    // Twelve of the twenty are one guest's; the coverage guarantee must still surface the others.
    const items = [
      ...Array.from({ length: 12 }, (_, i) => item(i, { uploaderKey: "g1" })),
      ...Array.from({ length: 8 }, (_, i) => item(20 + i, { uploaderKey: `g${i % 3 + 2}` })),
    ];
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    const byId = new Map(items.map((i) => [i.id, i]));
    const firstPass = take.slice(0, 12).map((id) => byId.get(id)!.uploaderKey);
    expect(new Set(firstPass).size).toBeGreaterThanOrEqual(4);
  });

  it("front-loads the newest: the first pass holds the freshest twelve", () => {
    const items = album(30);
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    const age = (id: string) => Number(id.slice(1)); // m0 is newest, m29 oldest
    const firstPass = take.slice(0, 12).map(age);
    const lastPass = take.slice(-12).map(age);
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean(firstPass)).toBeLessThan(mean(lastPass));
  });

  it("gets a video into the first pass when the album has one", () => {
    const items = [...album(20), item(50, { id: "vid", type: "video" })];
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    expect(take.slice(0, 12)).toContain("vid");
  });

  it("leads with the device's OWN newest item, and only moves that one", () => {
    const items = album(20);
    const plain = planTake(items, { eventId: "e1", loopIndex: 0 });
    const mine = planTake(items, {
      eventId: "e1",
      loopIndex: 0,
      // m5 is older than m2 (ids count backwards in time), so m2 leads.
      ownIds: new Set(["m5", "m2"]),
    });
    expect(mine[0]).toBe("m2");
    expect(mine.slice(1)).toEqual(plain.filter((id) => id !== "m2"));
  });

  it("leaves the order alone when the device owns nothing yet", () => {
    const items = album(12);
    expect(planTake(items, { eventId: "e1", loopIndex: 1, ownIds: new Set() })).toEqual(
      planTake(items, { eventId: "e1", loopIndex: 1 }),
    );
  });

  it("handles the small album the reel is born at, and the empty one", () => {
    expect(planTake([], { eventId: "e1", loopIndex: 0 })).toEqual([]);
    expect(planTake(album(3), { eventId: "e1", loopIndex: 0 })).toHaveLength(3);
    expect(planTake(album(1), { eventId: "e1", loopIndex: 0 })).toHaveLength(1);
  });


  it("keeps two photographs from one guest apart while another guest has one left", () => {
    const items = [
      ...Array.from({ length: 10 }, (_, i) => item(i, { uploaderKey: "g1" })),
      ...Array.from({ length: 10 }, (_, i) => item(20 + i, { uploaderKey: "g2" })),
    ];
    const byId = new Map(items.map((i) => [i.id, i]));
    for (let loop = 0; loop < 6; loop++) {
      const take = planTake(items, { eventId: "e1", loopIndex: loop });
      const runs = take.filter(
        (id, i) =>
          i > 0 && byId.get(id)!.uploaderKey === byId.get(take[i - 1])!.uploaderKey,
      );
      // Only where a pass genuinely runs out of the other guest: at most one clump per pass.
      expect(runs.length, `loop ${loop}`).toBeLessThanOrEqual(2);
    }
  });

  it("plays a different film every loop (a loop that repeats is not a new take)", () => {
    const items = album(24);
    const seen = new Set<string>();
    for (let loop = 0; loop < 8; loop++) {
      seen.add(planTake(items, { eventId: "e1", loopIndex: loop }).join(","));
    }
    expect(seen.size).toBe(8);
  });

  it("weighs likes only where the payload carries them", () => {
    const withCounts = album(20).map((it, i) =>
      i === 17 ? { ...it, likeCount: 40 } : it,
    );
    const liked = planTake(withCounts, { eventId: "e1", loopIndex: 0 });
    const blind = planTake(album(20), { eventId: "e1", loopIndex: 0 });
    // The much-liked photograph (an old one) is pulled forward; the guest payload, which carries no
    // counts at all, is unaffected.
    expect(liked.indexOf("m17")).toBeLessThan(blind.indexOf("m17"));
  });
});

describe("the seeds", () => {
  it("stay under 1e6, where seeded()'s multiply is still exact", () => {
    for (let loop = 0; loop < 200; loop++) {
      const seed = takeSeed("11111111-1111-4111-8111-111111111111", loop);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(1_000_000);
      // The product a plan actually computes must stay inside the exact-integer range.
      expect(seed * 2654435761 + 500 * 40503).toBeLessThan(Number.MAX_SAFE_INTEGER);
    }
  });

  it("separates the streams a take draws on", () => {
    expect(seedFor("e", 1)).not.toBe(seedFor("e", 2));
    expect(takeSeed("e", 1)).not.toBe(takeSeed("f", 1));
  });
});
