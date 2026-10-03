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
  waitsOf,
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

/* RED-TEAM 46's MEDIUM (an album with 195 photos held, switched from approving each to a develop time: its guests read
   "195 photos developing", her cover said "0 developing" and her head wore six of them). The switch approves every
   held photograph and seals it with the develop (`events_hold_released`, `media_seal_on_approval`), but the period
   (`events.sealed_from`) is stamped BY the switch, after they were created: every one read as seen. A row waits by its
   seal, and her manifest never sees the seal (the host's scope), so the page reads the rows a switch put in the roll
   (`joined`: approved, sealed, created before the period) beside the develop facts. */
describe("★ a switched album: held photos that joined the roll wait by their seal, not by when they were created", () => {
  // Created BEFORE the period began (SEALED_FROM is T0 + 10 min), as the held ones were.
  const heldThenJoined = [
    entry("j1", T0 + 2 * MIN_US),
    entry("j2", T0 + 2 * MIN_US + 5_000_000),
    entry("j3", T0 + 4 * MIN_US),
    entry("j4", T0 + 6 * MIN_US),
  ];
  // Approved by her before the switch: her guests saw these, and see them still.
  const approvedBefore = [
    entry("s1", T0 + 3 * MIN_US),
    entry("s2", T0 + 5 * MIN_US),
  ];
  const JOINED = heldThenJoined.map((e) => e[0]);

  it("entryWaits: an approved row from before the period waits when the roll holds it, and one the roll does not hold is still seen", () => {
    const joined = new Set(JOINED);
    expect(entryWaits(heldThenJoined[0]!, SEALED_FROM, joined)).toBe(true);
    expect(entryWaits(approvedBefore[0]!, SEALED_FROM, joined)).toBe(false);
    // Without the roll it reads as it always did: before the period, seen.
    expect(entryWaits(heldThenJoined[0]!, SEALED_FROM)).toBe(false);
  });

  it("★ coverWaitingOf: the switched album reads what its guests read, the held photographs all developing and the approved ones seen", () => {
    const facts = coverWaitingOf(
      [...approvedBefore, ...heldThenJoined].sort((a, b) => b[4] - a[4]),
      { develops_at: AHEAD, sealed_from: SEALED_FROM, joined: JOINED },
    );
    expect(facts.count).toBe(4);
    // Placed by the minute each was created, as her guests' sync places them (numbers, oldest first).
    expect(facts.minutes).toEqual([
      [(T0 + 2 * MIN_US) / 1000, 2],
      [(T0 + 4 * MIN_US) / 1000, 1],
      [(T0 + 6 * MIN_US) / 1000, 1],
    ]);
    expect(facts.ids).toEqual(["j4", "j3", "j2", "j1"]);
  });

  it("it adds to the period's own: photographs added since it began wait beside the joined ones", () => {
    const facts = coverWaitingOf(
      [entry("new", T0 + 20 * MIN_US), ...heldThenJoined, ...approvedBefore],
      { develops_at: AHEAD, sealed_from: SEALED_FROM, joined: JOINED },
    );
    expect(facts.count).toBe(5);
    expect(facts.ids).toContain("new");
  });

  it("a joined photograph the manifest no longer holds (taken back) counts nothing, and a hidden one is never counted", () => {
    const hidden = entry("j1", T0 + 2 * MIN_US);
    const flagged: ManifestEntry = [hidden[0], 4, 3, ENTRY_HIDDEN, hidden[4]];
    const facts = coverWaitingOf(
      [flagged, heldThenJoined[1]!, ...approvedBefore],
      {
        develops_at: AHEAD,
        sealed_from: SEALED_FROM,
        joined: [...JOINED, "taken-back"],
      },
    );
    expect(facts.count).toBe(1);
    expect(facts.ids).toEqual(["j2"]);
  });

  it("waitsOf: one test for the cover and the head, reading the facts once; no roll reads as before", () => {
    const waits = waitsOf({ sealed_from: SEALED_FROM, joined: JOINED });
    expect(waits(heldThenJoined[2]!)).toBe(true);
    expect(waits(approvedBefore[1]!)).toBe(false);
    expect(waits(entry("new", T0 + 20 * MIN_US))).toBe(true);
    const plain = waitsOf({ sealed_from: SEALED_FROM });
    expect(plain(heldThenJoined[2]!)).toBe(false);
    expect(waitsOf(null)(entry("x", T0))).toBe(true);
  });
});
