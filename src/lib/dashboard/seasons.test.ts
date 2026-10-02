import { describe, expect, it } from "vitest";

import { seasonsOf } from "./seasons";

/**
 * YOUR EVENTS, GROUPED BY WHEN (host-dashboard r1, `events=seasons`): coming up, just past, earlier this
 * year, then each earlier year folded. Every event lands in exactly one group, in the group's own
 * order, and an undated album sits where its photographs say.
 */

const FRIDAY = "2026-10-02";
const at = (
  id: string,
  date: string | null,
  lastDay: string | null = null,
  createdAt = "2026-01-01T00:00:00Z",
) => ({
  id,
  date,
  lastArrival: lastDay ? { at: `${lastDay}T20:00:00Z`, day: lastDay } : null,
  createdAt,
});

describe("seasonsOf", () => {
  const events = [
    at("nye", "2026-12-31"),
    at("tonight", FRIDAY),
    at("tomorrow", "2026-10-03"),
    at("setting-up", null, null, "2026-09-30T00:00:00Z"),
    at("abandoned", null, null, "2026-02-01T00:00:00Z"),
    at("last-week", "2026-09-26"),
    at("undated-party", null, "2026-09-20"),
    at("spring", "2026-04-11"),
    at("winter", "2026-01-24"),
    at("y25-june", "2025-06-07"),
    at("y25-jan", "2025-01-01"),
    at("y24", "2024-11-02"),
  ];
  const seasons = seasonsOf(events, FRIDAY);

  it("groups by when, largest where the photographs are freshest", () => {
    expect(seasons.map((s) => [s.label, s.size])).toEqual([
      ["Coming up", "medium"],
      ["Just past", "large"],
      ["Earlier in 2026", "small"],
      ["2025", "folded"],
      ["2024", "folded"],
    ]);
  });

  it("orders each group its own way: soonest first, then newest first", () => {
    expect(seasons[0]?.ids).toEqual([
      "tonight",
      "tomorrow",
      "nye",
      // No day at all: still being set up, the newest made first.
      "setting-up",
      "abandoned",
    ]);
    expect(seasons[1]?.ids).toEqual(["last-week", "undated-party"]);
    expect(seasons[2]?.ids).toEqual(["spring", "winter"]);
    expect(seasons[3]?.ids).toEqual(["y25-june", "y25-jan"]);
  });

  it("puts every event in exactly one group", () => {
    const all = seasons.flatMap((s) => s.ids);
    expect(all).toHaveLength(events.length);
    expect(new Set(all).size).toBe(events.length);
  });

  it("draws nothing for an empty account", () => {
    expect(seasonsOf([], FRIDAY)).toEqual([]);
  });
});
