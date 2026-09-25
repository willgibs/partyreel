/**
 * THE TAKE's pins. Deterministic per (items, eventId, loopIndex); every eligible item placed exactly
 * once; the quick-add brain's guarantees holding LOCALLY, in the part of the loop a viewer is
 * actually watching, and in EVERY pass rather than only the first; clips never in the order; "yours
 * first" leading with the guest's newest; a cut-short take exactly the whole one's head; and the
 * whole take cheap enough to re-plan on every arrival at any album size.
 */
import { describe, expect, it } from "vitest";

import { mulberry32 } from "@/lib/reel/engine/seed";

import type { LiveMediaItem } from "./items";
import { planTake, seedFor, TAKE_PASS, takeSeed } from "./take";

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
      {
        id: "posterless",
        type: "video" as const,
        url: "/v.mp4",
        previewUrl: null,
      },
    ];
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    expect(take.sort()).toEqual(
      album(6)
        .map((i) => i.id)
        .sort(),
    );
  });

  it("covers every uploader inside the FIRST pass (the party, not one camera roll)", () => {
    // Twelve of the twenty are one guest's; the coverage guarantee must still surface the others.
    const items = [
      ...Array.from({ length: 12 }, (_, i) => item(i, { uploaderKey: "g1" })),
      ...Array.from({ length: 8 }, (_, i) =>
        item(20 + i, { uploaderKey: `g${(i % 3) + 2}` }),
      ),
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
    expect(
      planTake(items, { eventId: "e1", loopIndex: 1, ownIds: new Set() }),
    ).toEqual(planTake(items, { eventId: "e1", loopIndex: 1 }));
  });

  it("handles the small album the reel is born at, and the empty one", () => {
    expect(planTake([], { eventId: "e1", loopIndex: 0 })).toEqual([]);
    expect(planTake(album(3), { eventId: "e1", loopIndex: 0 })).toHaveLength(3);
    expect(planTake(album(1), { eventId: "e1", loopIndex: 0 })).toHaveLength(1);
  });

  it("keeps two photographs from one guest apart while another guest has one left", () => {
    const items = [
      ...Array.from({ length: 10 }, (_, i) => item(i, { uploaderKey: "g1" })),
      ...Array.from({ length: 10 }, (_, i) =>
        item(20 + i, { uploaderKey: "g2" }),
      ),
    ];
    const byId = new Map(items.map((i) => [i.id, i]));
    for (let loop = 0; loop < 6; loop++) {
      const take = planTake(items, { eventId: "e1", loopIndex: loop });
      const runs = take.filter(
        (id, i) =>
          i > 0 &&
          byId.get(id)!.uploaderKey === byId.get(take[i - 1])!.uploaderKey,
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

/** A seeded party: uneven uploaders (one prolific phone, a long tail), a share of videos. */
function party(
  n: number,
  opts: { seed: number; uploaders: number; videoShare: number },
): LiveMediaItem[] {
  const rand = mulberry32(opts.seed);
  return Array.from({ length: n }, (_, i) =>
    item(i, {
      type: rand() < opts.videoShare ? "video" : "photo",
      // Skewed: the square pulls most items onto the first few guests.
      uploaderKey: `g${Math.floor(rand() ** 2 * opts.uploaders)}`,
      createdAt: new Date(BASE - i * 90_000).toISOString(),
    }),
  );
}

/** The take cut into its passes, each with what was left to place when it began. */
function passesOf(items: LiveMediaItem[], take: string[]) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const placed = new Set<string>();
  const out: { pass: LiveMediaItem[]; left: LiveMediaItem[] }[] = [];
  for (let at = 0; at < take.length; at += TAKE_PASS) {
    const left = items.filter((i) => !placed.has(i.id));
    const pass = take.slice(at, at + TAKE_PASS).map((id) => byId.get(id)!);
    for (const it of pass) placed.add(it.id);
    out.push({ pass, left });
  }
  return out;
}

const countBy = (items: LiveMediaItem[], key: (i: LiveMediaItem) => string) => {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(key(it), (counts.get(key(it)) ?? 0) + 1);
  return counts;
};

describe("every pass, not only the first", () => {
  it("never shows a guest twice before every guest with something left has shown once", () => {
    for (const seed of [1, 2, 3]) {
      const items = party(150, { seed, uploaders: 7, videoShare: 0 });
      const take = planTake(items, { eventId: "e1", loopIndex: seed });
      for (const [p, { pass, left }] of passesOf(items, take).entries()) {
        const shown = countBy(pass, (i) => i.uploaderKey!);
        const had = countBy(left, (i) => i.uploaderKey!);
        // The round-robin: counts inside a pass differ by at most one, except for a guest the pass
        // ran out of (everything they had left is in it).
        for (const [u, n] of shown) {
          for (const [v, stock] of had) {
            const m = shown.get(v) ?? 0;
            if (m === stock) continue;
            expect(
              n - m,
              `seed ${seed}, pass ${p}: ${u} vs ${v}`,
            ).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  it("gives a pass to the guests whose best is strongest when there are more guests than room", () => {
    // Thirty guests with one photograph each, an hour apart: each guest's best is their only one, so
    // the strongest guests are the newest, and those are the ones a pass has room for.
    const items = Array.from({ length: 30 }, (_, i) =>
      item(i, { uploaderKey: `solo${i}` }),
    );
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    const age = (id: string) => Number(id.slice(1));
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(take.slice(0, TAKE_PASS)).toContain("m0");
    expect(mean(take.slice(0, TAKE_PASS).map(age))).toBeLessThan(10);
    expect(take.slice(-6)).toContain("m29");
  });

  it("holds a video in every pass while any remain", () => {
    for (const seed of [4, 5]) {
      // Five videos in two hundred items: the first passes each get one, never a run of stills.
      const items = party(200, { seed, uploaders: 9, videoShare: 0 }).map(
        (it, i) => (i % 37 === 36 ? { ...it, type: "video" as const } : it),
      );
      const take = planTake(items, { eventId: "e1", loopIndex: seed });
      for (const [p, { pass, left }] of passesOf(items, take).entries()) {
        if (!left.some((i) => i.type === "video")) continue;
        expect(
          pass.some((i) => i.type === "video"),
          `seed ${seed}, pass ${p}`,
        ).toBe(true);
      }
    }
  });

  it("caps a pass near a third videos while photographs remain, and fills from videos after", () => {
    const items = party(120, { seed: 6, uploaders: 5, videoShare: 0.6 });
    const take = planTake(items, { eventId: "e1", loopIndex: 0 });
    expect(take).toHaveLength(120);
    const cut = passesOf(items, take);
    for (const [p, { pass }] of cut.entries()) {
      const videos = pass.filter((i) => i.type === "video").length;
      const photosLater = cut
        .slice(p + 1)
        .some(({ pass: later }) => later.some((i) => i.type === "photo"));
      if (photosLater) {
        expect(videos, `pass ${p}`).toBeLessThanOrEqual(
          Math.max(1, Math.floor(pass.length / 3)),
        );
      }
    }
  });
});

describe("a cut-short take (passes)", () => {
  it("is exactly the head of the whole take, pass for pass", () => {
    const items = party(100, { seed: 7, uploaders: 6, videoShare: 0.2 });
    const whole = planTake(items, { eventId: "e1", loopIndex: 2 });
    for (const passes of [1, 2, 3]) {
      expect(planTake(items, { eventId: "e1", loopIndex: 2, passes })).toEqual(
        whole.slice(0, TAKE_PASS * passes),
      );
    }
    expect(
      planTake(items, { eventId: "e1", loopIndex: 2, passes: 99 }),
    ).toEqual(whole);
  });

  it("still leads with the device's own newest, even one the whole take places late", () => {
    const items = album(60); // an hour apart: m59 is the oldest, placed in a late pass
    const ownIds = new Set(["m59"]);
    expect(
      planTake(items, { eventId: "e1", loopIndex: 0 }).indexOf("m59"),
    ).toBeGreaterThanOrEqual(TAKE_PASS);
    const whole = planTake(items, { eventId: "e1", loopIndex: 0, ownIds });
    const first = planTake(items, {
      eventId: "e1",
      loopIndex: 0,
      ownIds,
      passes: 1,
    });
    expect(first[0]).toBe("m59");
    expect(first).toHaveLength(TAKE_PASS);
    expect(first).toEqual(whole.slice(0, TAKE_PASS));
  });
});

describe("the cost", () => {
  it("plans a 6,000-item album well inside a re-plan's budget (one sort, not a pick per pass)", () => {
    // The take used to re-run the whole quick-add pick over what was left, pass after pass: about
    // 600 ms here. Scored once and walked with a heap it is a few milliseconds; the bound is loose on
    // purpose (a busy CI box), and still far below where the quadratic lived.
    const items = party(6000, { seed: 8, uploaders: 60, videoShare: 0.15 });
    planTake(items, { eventId: "e1", loopIndex: 0 }); // warm the JIT
    const start = performance.now();
    const take = planTake(items, { eventId: "e1", loopIndex: 1 });
    const elapsed = performance.now() - start;
    expect(take).toHaveLength(6000);
    expect(new Set(take).size).toBe(6000);
    expect(elapsed).toBeLessThan(150);
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
      expect(seed * 2654435761 + 500 * 40503).toBeLessThan(
        Number.MAX_SAFE_INTEGER,
      );
    }
  });

  it("separates the streams a take draws on", () => {
    expect(seedFor("e", 1)).not.toBe(seedFor("e", 2));
    expect(takeSeed("e", 1)).not.toBe(takeSeed("f", 1));
  });
});
