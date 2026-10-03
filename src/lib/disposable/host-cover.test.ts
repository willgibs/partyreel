/**
 * THE HOST'S COVER, AS DATA (the-wait r1, Will's `cover=guests`): until her album develops, Maya's hub draws what her
 * guests see, from her own manifest: what waits counted and placed by minute as her guests' sheet places it, and her
 * hub's photographs held to what her guests can see.
 */
import { describe, expect, it } from "vitest";

import {
  coverWaitingOf,
  entryWaits,
  hubCovered,
} from "@/lib/disposable/host-cover";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_REEL,
  type ManifestEntry,
} from "@/lib/events/album-wire";

const MIN_US = 60_000_000;
const T0 = 1_790_000_000_000_000 - (1_790_000_000_000_000 % MIN_US);
const SEALED_FROM = new Date((T0 + 10 * MIN_US) / 1000).toISOString();
const AHEAD = new Date(T0 / 1000 + 86_400_000).toISOString();
const NOW = T0 / 1000 + 60 * 60_000;

const entry = (id: string, t: number, flags = ENTRY_REEL): ManifestEntry => [
  id,
  4,
  3,
  flags,
  t,
];

describe("hubCovered: the hub is covered while a develop time is ahead", () => {
  it("covers before the develop, and never with none or once it is reached", () => {
    expect(
      hubCovered({ develops_at: AHEAD, sealed_from: SEALED_FROM }, NOW),
    ).toBe(true);
    expect(hubCovered({ develops_at: null, sealed_from: null }, NOW)).toBe(
      false,
    );
    expect(
      hubCovered(
        { develops_at: AHEAD, sealed_from: SEALED_FROM },
        Date.parse(AHEAD) + 1,
      ),
    ).toBe(false);
    expect(hubCovered(null, NOW)).toBe(false);
  });
});

describe("entryWaits: what her guests cannot see yet, read off her own manifest", () => {
  it("★ a photo added since the develop's period began waits; one before it is the album guests already see", () => {
    expect(entryWaits(entry("new", T0 + 20 * MIN_US), SEALED_FROM)).toBe(true);
    expect(entryWaits(entry("old", T0 + 5 * MIN_US), SEALED_FROM)).toBe(false);
  });

  it("a held one always waits; a hidden one is nobody's to see, so never counted", () => {
    expect(entryWaits(entry("held", T0, ENTRY_PENDING), SEALED_FROM)).toBe(
      true,
    );
    expect(
      entryWaits(entry("hid", T0 + 20 * MIN_US, ENTRY_HIDDEN), SEALED_FROM),
    ).toBe(false);
  });

  it("with no period stamped, everything she has waits (nothing is shown that might be sealed)", () => {
    expect(entryWaits(entry("x", T0), null)).toBe(true);
  });
});

describe("coverWaitingOf: her guests' sheet, from her manifest", () => {
  it("★ counts what waits and places it by minute, the way the guests' sync does (numbers, oldest first)", () => {
    const entries = [
      entry("c", T0 + 21 * MIN_US + 5_000_000),
      entry("b", T0 + 21 * MIN_US),
      entry("a", T0 + 20 * MIN_US),
      entry("before", T0 + 1 * MIN_US),
    ];
    const facts = coverWaitingOf(entries, {
      develops_at: AHEAD,
      sealed_from: SEALED_FROM,
    });
    expect(facts.count).toBe(3);
    expect(facts.minutes).toEqual([
      [(T0 + 20 * MIN_US) / 1000, 1],
      [(T0 + 21 * MIN_US) / 1000, 2],
    ]);
    // The ids of what waits, newest first, are hers (the host's) to read: her own manifest.
    expect(facts.ids).toEqual(["c", "b", "a"]);
  });
});
