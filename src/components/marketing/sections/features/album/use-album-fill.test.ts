import { describe, expect, it } from "vitest";

import {
  type AlbumFixture,
  EVERYWHERE_FIXTURES,
  EVERYWHERE_SEED_COUNT,
} from "./album-fill-fixtures";
import { deriveAlbumFill, endTick, stillAlbumFill } from "./use-album-fill";

/**
 * THE DERIVATION'S OWN TABLE: a resting album of six (two a column) and six arrivals, one guest
 * landing twice (Jay) so "a returning guest is counted once" has something to count, and a video
 * among them. It was the album page's hero table until the hero became the live stream; nothing
 * renders it any more, so it lives where it is read, with the numbers the assertions below rest on
 * (five guests at rest, seven at the end). The everywhere pair's real table is the loop's.
 */
const SEED_COUNT = 6;
const FIXTURES: readonly AlbumFixture[] = [
  // The resting album.
  { id: "wedding-golden", col: 0, h: 196, by: "Maya" },
  { id: "reception-table", col: 1, h: 206, by: "Jay" },
  { id: "party-balloons", col: 2, h: 182, by: "Priya" },
  { id: "reception-hall", col: 0, h: 186, by: "Sam" },
  { id: "party-dj", col: 1, h: 176, by: "Theo" },
  { id: "wedding-arch", col: 2, h: 200, by: "Maya" },
  // The arrivals, newest first as they land.
  { id: "wedding-toast", col: 1, h: 160, by: "Maya" },
  { id: "wedding-rings", col: 0, h: 152, by: "Jay" },
  { id: "concert-confetti", col: 2, h: 168, by: "Noor", kind: "video" },
  { id: "festival-crowd", col: 1, h: 150, by: "Priya" },
  { id: "wedding-petals", col: 0, h: 172, by: "Jay" },
  { id: "festival-lights", col: 2, h: 144, by: "Alex" },
];
const table = { fixtures: FIXTURES, seedCount: SEED_COUNT };

describe("the filling album's derivation", () => {
  it("renders the resting album alone at tick 0", () => {
    const v = deriveAlbumFill(0, table);
    expect(v.photos).toBe(SEED_COUNT);
    expect(v.columns.flat().every((t) => t.status === "seed")).toBe(true);
    // Oldest at the BOTTOM: the first fixture is the last tile of its column.
    const col0 = v.columns[0];
    expect(col0[col0.length - 1].fixture.id).toBe(FIXTURES[0].id);
    expect(v.guests).toBe(5); // Maya, Jay, Priya, Sam, Theo
  });

  it("mounts the next arrival at the HEAD of its column on the odd tick, then lands it on the same key", () => {
    const up = deriveAlbumFill(1, table);
    const next = FIXTURES[SEED_COUNT];
    const head = up.columns[next.col][0];
    expect(head.status).toBe("uploading");
    expect(head.fixture.id).toBe(next.id);
    expect(up.photos).toBe(SEED_COUNT); // not counted until it lands

    const landed = deriveAlbumFill(2, table);
    expect(landed.columns[next.col][0].key).toBe(head.key);
    expect(landed.columns[next.col][0].status).toBe("landed");
    expect(landed.columns[next.col][0].check).toBe(true);
    expect(landed.photos).toBe(SEED_COUNT + 1);
  });

  it("changes the layout key on the mount, not on the landing", () => {
    const a = deriveAlbumFill(0, table).layoutKey;
    const b = deriveAlbumFill(1, table).layoutKey;
    const c = deriveAlbumFill(2, table).layoutKey;
    expect(b).not.toBe(a);
    expect(c).toBe(b);
  });

  it("clears the check after the window and counts a new guest only once", () => {
    const beats = Math.ceil(2500 / 800);
    const landedAt = 2;
    const later = deriveAlbumFill(landedAt + 2 * beats, table);
    const first = later.columns.flat().find((t) => t.key.endsWith("#0"));
    expect(first?.check).toBe(false);
    // Two arrivals by Jay add no second guest.
    const all = deriveAlbumFill(endTick(table), table);
    expect(all.guests).toBe(7);
    expect(all.photos).toBe(FIXTURES.length);
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

  it("names the newest landed tile, the resting album's last seed before any lands", () => {
    // The everywhere pair hints "open me" on this tile: it must exist from the
    // first frame, and an uploading tile (not landed yet) must never take it.
    const rest = deriveAlbumFill(0, table);
    expect(rest.newest).toBe(`seed:${FIXTURES[SEED_COUNT - 1].id}`);
    expect(deriveAlbumFill(1, table).newest).toBe(rest.newest);

    const first = FIXTURES[SEED_COUNT];
    const landed = deriveAlbumFill(2, table);
    expect(landed.newest).toBe(`${first.id}#0`);
    // It is a tile that is really on screen: the head of its own column.
    expect(landed.columns[first.col][0].key).toBe(landed.newest);
    const next = FIXTURES[SEED_COUNT + 1];
    expect(deriveAlbumFill(4, table).newest).toBe(`${next.id}#1`);
  });

  it("keeps the newest on screen in a bounded loop and in a looping fill's still", () => {
    const opts = {
      fixtures: EVERYWHERE_FIXTURES,
      seedCount: EVERYWHERE_SEED_COUNT,
      loop: true,
      upload: false,
      maxPerColumn: 4,
    };
    for (const tick of [0, 1, 2, 7, 18, 40, 41, 99]) {
      const v = deriveAlbumFill(tick, opts);
      const keys = v.columns.flat().map((t) => t.key);
      expect(keys, `tick ${tick}`).toContain(v.newest);
      // Newest first: it heads whichever column it sits in.
      const col = v.columns.find((c) => c.some((t) => t.key === v.newest))!;
      expect(col[0].key, `tick ${tick}`).toBe(v.newest);
    }
    const still = stillAlbumFill(opts);
    expect(still.columns.flat().map((t) => t.key)).toContain(still.newest);
    expect(deriveAlbumFill(Number.POSITIVE_INFINITY, opts).newest).toBe(
      still.newest,
    );
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
