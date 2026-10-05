/**
 * THE HUB'S ROLL (crumbs-73): what her first open after the develop develops is the guests' roll, read off her own
 * manifest. Her manifest holds the whole album, so what her guests never had is taken out first (a hidden photograph,
 * a held one), and nothing else differs from the guests' read: the two sides' sheets count the same photographs.
 */
import { describe, expect, it } from "vitest";

import {
  hubRollOf,
  videoIdsOf,
} from "@/components/app/event-feed/hub-develop-roll";
import { rollOfEntries } from "@/lib/disposable/contact-sheet-develop";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  type ManifestEntry,
} from "@/lib/events/album-wire";

const MIN_US = 60_000_000;
const DEVELOP_MS = Date.UTC(2026, 9, 10, 9, 0, 0);
const T0 = DEVELOP_MS * 1000 - 600 * MIN_US;
const FLAGS = ENTRY_REEL | ENTRY_PREVIEW;
const entry = (id: string, minutes: number, flags = FLAGS): ManifestEntry => [
  id,
  4,
  3,
  flags,
  T0 + minutes * MIN_US,
];

describe("★ the hub's roll is the guests' roll", () => {
  it("is every photograph created at or before the develop time, newest first as the manifest holds them", () => {
    const entries = [
      entry("after", 700),
      entry("c", 30),
      entry("b", 20),
      entry("a", 10),
    ];
    expect(hubRollOf(entries, DEVELOP_MS, null)).toEqual(["c", "b", "a"]);
  });

  it("★ never a hidden photograph, nor a held one: nobody saw either develop", () => {
    const entries = [
      entry("held", 40, FLAGS | ENTRY_PENDING),
      entry("hidden", 30, FLAGS | ENTRY_HIDDEN),
      entry("shown", 20),
    ];
    expect(hubRollOf(entries, DEVELOP_MS, null)).toEqual(["shown"]);
  });

  it("★ counts what her guests' own read counts: the same entries, minus what only her manifest holds", () => {
    const guestsSee = [entry("c", 30), entry("b", 20), entry("a", 10)];
    const hers = [
      entry("held", 35, FLAGS | ENTRY_PENDING),
      ...guestsSee,
      entry("hidden", 5, FLAGS | ENTRY_HIDDEN),
    ];
    expect(hubRollOf(hers, DEVELOP_MS, null)).toEqual(
      rollOfEntries(guestsSee, DEVELOP_MS, null),
    );
  });

  it("a develop she moved later develops only what came after the one this phone saw", () => {
    const entries = [entry("c", 30), entry("b", 20), entry("a", 10)];
    const saw = (T0 + 15 * MIN_US) / 1000;
    expect(hubRollOf(entries, DEVELOP_MS, saw)).toEqual(["c", "b"]);
  });

  it("an album with nothing she can develop has an empty roll", () => {
    expect(hubRollOf([], DEVELOP_MS, null)).toEqual([]);
    expect(
      hubRollOf([entry("x", 10, FLAGS | ENTRY_HIDDEN)], DEVELOP_MS, null),
    ).toEqual([]);
  });
});

describe("the roll's videos", () => {
  it("names the roll's videos alone", () => {
    const entries = [
      entry("clip", 30, FLAGS | ENTRY_VIDEO),
      entry("photo", 20),
      entry("other-clip", 10, FLAGS | ENTRY_VIDEO),
    ];
    expect([...videoIdsOf(entries, ["clip", "photo"])]).toEqual(["clip"]);
  });
});
