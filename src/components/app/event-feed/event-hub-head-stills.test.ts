import { describe, expect, it } from "vitest";

import {
  isCoverEntry,
  newestCoverStills,
  reelCoverStills,
} from "@/components/app/event-feed/event-hub-head-stills";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  type ManifestEntry,
} from "@/lib/events/album-wire";

/**
 * THE HUB'S COVER, WHICH PHOTOGRAPHS (`event-header` r1, `host=shared`): Maya's head wears her guests' cover, so it
 * shows only what a guest's cover could, the reel's opening while it plays and the newest a guest can see otherwise.
 * Her host manifest holds more than a guest's (hidden, held), which is exactly what must never reach it.
 */
const T0 = 1_790_000_000_000_000;
const entry = (id: string, flags: number, i = 0): ManifestEntry => [
  id,
  640,
  480,
  flags,
  T0 - i,
];
const PHOTO = ENTRY_REEL | ENTRY_PREVIEW;

describe("what a cover may show", () => {
  it("★ an approved photograph, and a video only with its poster", () => {
    expect(isCoverEntry(entry("a", PHOTO))).toBe(true);
    expect(isCoverEntry(entry("b", ENTRY_REEL))).toBe(true);
    expect(
      isCoverEntry(entry("c", ENTRY_REEL | ENTRY_VIDEO | ENTRY_PREVIEW)),
    ).toBe(true);
    expect(isCoverEntry(entry("d", ENTRY_REEL | ENTRY_VIDEO))).toBe(false);
  });

  it("★ never what the host tucked away or still holds, never a clip", () => {
    expect(isCoverEntry(entry("a", PHOTO | ENTRY_HIDDEN))).toBe(false);
    expect(isCoverEntry(entry("b", PHOTO | ENTRY_PENDING))).toBe(false);
    expect(isCoverEntry(entry("c", ENTRY_PREVIEW | ENTRY_VIDEO))).toBe(false);
  });
});

describe("the newest a guest can see", () => {
  it("in the album's order, only with a still in hand, at most six", () => {
    const entries = [
      entry("n1", PHOTO, 0),
      entry("n2", PHOTO | ENTRY_HIDDEN, 1),
      entry("n3", PHOTO, 2),
      ...Array.from({ length: 8 }, (_, i) => entry(`m${i}`, PHOTO, 3 + i)),
    ];
    const tiles = new Map(
      entries.map(([id]) => [id, `https://r2.test/p/${id}.webp`]),
    );
    tiles.delete("n3");
    const stills = newestCoverStills(entries, (id) => tiles.get(id));
    expect(stills.map((s) => s.id)).toEqual([
      "n1",
      "m0",
      "m1",
      "m2",
      "m3",
      "m4",
    ]);
    expect(stills[0]!.tile).toBe("https://r2.test/p/n1.webp");
  });
});

describe("the reel's opening stills", () => {
  it("pairs the reel's ids with its stills, and drops a still that never came", () => {
    expect(
      reelCoverStills({ stillIds: ["a", "b", "c"], stills: ["sa", "", "sc"] }),
    ).toEqual([
      { id: "a", tile: "sa" },
      { id: "c", tile: "sc" },
    ]);
  });
});
