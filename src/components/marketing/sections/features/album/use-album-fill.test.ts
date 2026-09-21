import { describe, expect, it } from "vitest";

import {
  EVERYWHERE_FIXTURES,
  EVERYWHERE_SEED_COUNT,
  HERO_FIXTURES,
  HERO_SEED_COUNT,
} from "./album-fill-fixtures";
import { deriveAlbumFill, endTick, stillAlbumFill } from "./use-album-fill";

const hero = { fixtures: HERO_FIXTURES, seedCount: HERO_SEED_COUNT };

describe("the filling album's derivation", () => {
  it("renders the resting album alone at tick 0", () => {
    const v = deriveAlbumFill(0, hero);
    expect(v.photos).toBe(HERO_SEED_COUNT);
    expect(v.columns.flat().every((t) => t.status === "seed")).toBe(true);
    // Oldest at the BOTTOM: the first fixture is the last tile of its column.
    const col0 = v.columns[0];
    expect(col0[col0.length - 1].fixture.id).toBe(HERO_FIXTURES[0].id);
    expect(v.guests).toBe(5); // Maya, Jay, Priya, Sam, Theo
  });

  it("mounts the next arrival at the HEAD of its column on the odd tick, then lands it on the same key", () => {
    const up = deriveAlbumFill(1, hero);
    const next = HERO_FIXTURES[HERO_SEED_COUNT];
    const head = up.columns[next.col][0];
    expect(head.status).toBe("uploading");
    expect(head.fixture.id).toBe(next.id);
    expect(up.photos).toBe(HERO_SEED_COUNT); // not counted until it lands

    const landed = deriveAlbumFill(2, hero);
    expect(landed.columns[next.col][0].key).toBe(head.key);
    expect(landed.columns[next.col][0].status).toBe("landed");
    expect(landed.columns[next.col][0].check).toBe(true);
    expect(landed.photos).toBe(HERO_SEED_COUNT + 1);
  });

  it("changes the layout key on the mount, not on the landing", () => {
    const a = deriveAlbumFill(0, hero).layoutKey;
    const b = deriveAlbumFill(1, hero).layoutKey;
    const c = deriveAlbumFill(2, hero).layoutKey;
    expect(b).not.toBe(a);
    expect(c).toBe(b);
  });

  it("clears the check after the window and counts a new guest only once", () => {
    const beats = Math.ceil(2500 / 800);
    const landedAt = 2;
    const later = deriveAlbumFill(landedAt + 2 * beats, hero);
    const first = later.columns.flat().find((t) => t.key.endsWith("#0"));
    expect(first?.check).toBe(false);
    // Two arrivals by Jay add no second guest.
    const all = deriveAlbumFill(endTick(hero), hero);
    expect(all.guests).toBe(7);
    expect(all.photos).toBe(HERO_FIXTURES.length);
    expect(all.done).toBe(true);
    expect(all.columns.flat().some((t) => t.check)).toBe(false);
  });

  it("loops with unique keys and a bounded DOM", () => {
    const opts = {
      fixtures: EVERYWHERE_FIXTURES,
      seedCount: EVERYWHERE_SEED_COUNT,
      loop: true,
      upload: false,
      maxPerColumn: 4,
    };
    const v = deriveAlbumFill(40, opts);
    const keys = v.columns.flat().map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(v.columns.every((c) => c.length <= 4)).toBe(true);
    expect(v.done).toBe(false);
  });

  it("gives a looping fill a finite still: one pass landed, bounded, no strip and no check", () => {
    // /features/album threw for every reader with Reduce Motion on: the
    // everywhere pair loops, a loop's end tick was Infinity, and the jump to
    // it indexed arrivals[NaN]. A loop's still is one settled pass.
    const opts = {
      fixtures: EVERYWHERE_FIXTURES,
      seedCount: EVERYWHERE_SEED_COUNT,
      loop: true,
      upload: false,
      maxPerColumn: 4,
    };
    expect(Number.isFinite(endTick(opts))).toBe(true);
    const still = stillAlbumFill(opts);
    expect(still.photos).toBe(EVERYWHERE_FIXTURES.length);
    expect(still.columns.every((c) => c.length <= 4)).toBe(true);
    expect(
      still.columns.flat().every((x) => x.status !== "uploading" && !x.check),
    ).toBe(true);
    expect(still.done).toBe(false);
    // The pure repro, as reported: never a throw, at the pass end or past any clock.
    const nine = Array.from({ length: 9 }, (_, i) => ({
      ...EVERYWHERE_FIXTURES[i % EVERYWHERE_FIXTURES.length],
      id: `f${i}`,
      col: (i % 3) as 0 | 1 | 2,
      by: "A",
    }));
    const minimal = { fixtures: nine, seedCount: 3, loop: true };
    expect(() => deriveAlbumFill(endTick(minimal), minimal)).not.toThrow();
    expect(deriveAlbumFill(Number.POSITIVE_INFINITY, opts)).toEqual(still);
  });

  it("never clamps a running loop at its pass end", () => {
    const opts = {
      fixtures: EVERYWHERE_FIXTURES,
      seedCount: EVERYWHERE_SEED_COUNT,
      loop: true,
      upload: false,
      maxPerColumn: 4,
    };
    const end = endTick(opts);
    const atEnd = deriveAlbumFill(end, opts);
    const later = deriveAlbumFill(end + 20, opts);
    expect(later.done).toBe(false);
    expect(later.photos).toBe(atEnd.photos + 10);
    expect(later.columns.every((c) => c.length <= 4)).toBe(true);
  });
});
