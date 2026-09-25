import { describe, expect, it } from "vitest";

import { idsOf, isOrdered, mergeEntries } from "@/lib/album/manifest";
import type { ManifestEntry } from "@/lib/events/album-wire";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const e = (n: number, t: number, flags = 0): ManifestEntry => [
  id(n),
  4,
  3,
  flags,
  t,
];

describe("mergeEntries: every change is a merge by id into the server's order", () => {
  const album = [e(5, 50), e(4, 40), e(3, 30), e(2, 20), e(1, 10)];

  it("threads new entries in at their place, newest first", () => {
    const out = mergeEntries(album, [e(9, 35), e(8, 55), e(7, 5)]);
    expect(out.map((x) => x[4])).toEqual([55, 50, 40, 35, 30, 20, 10, 5]);
    expect(isOrdered(out)).toBe(true);
  });

  it("removes by id, and an unknown id is a no-op", () => {
    const out = mergeEntries(album, [], [id(3), id(99)]);
    expect(out.map((x) => x[4])).toEqual([50, 40, 20, 10]);
  });

  it("an upsert of a held id replaces it (a host's hidden flag), never duplicates it", () => {
    const out = mergeEntries(album, [e(3, 30, 8)]);
    expect(out).toHaveLength(5);
    expect(out[2]).toEqual(e(3, 30, 8));
  });

  it("is idempotent: the same change twice is the same album", () => {
    const once = mergeEntries(album, [e(9, 35)], [id(2)]);
    expect(mergeEntries(once, [e(9, 35)], [id(2)])).toEqual(once);
  });

  it("a removal beats an upsert of the same id in one change", () => {
    expect(idsOf(mergeEntries(album, [e(9, 35)], [id(9)])).has(id(9))).toBe(
      false,
    );
  });

  it("the last upsert of an id wins", () => {
    const out = mergeEntries(album, [e(9, 35, 8), e(9, 35, 16)]);
    expect(out.filter((x) => x[0] === id(9))).toEqual([e(9, 35, 16)]);
  });

  it("ties on the microsecond fall to the larger id first", () => {
    const out = mergeEntries([e(1, 10)], [e(3, 10), e(2, 10)]);
    expect(out.map((x) => x[0])).toEqual([id(3), id(2), id(1)]);
  });

  it("never touches the array it was handed (copy on write)", () => {
    const frozen = Object.freeze(album.slice());
    const out = mergeEntries(frozen, [e(9, 35)], [id(1)]);
    expect(frozen).toHaveLength(5);
    expect(out).not.toBe(frozen);
    expect(mergeEntries(frozen, [])).not.toBe(frozen);
  });

  it("isOrdered refuses a repeat or an inversion", () => {
    expect(isOrdered([e(2, 20), e(2, 20)])).toBe(false);
    expect(isOrdered([e(1, 10), e(2, 20)])).toBe(false);
    expect(isOrdered([])).toBe(true);
  });
});
