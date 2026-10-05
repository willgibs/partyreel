import { describe, expect, it } from "vitest";

import {
  arrivalsOf,
  landedWith,
  LIT_WITHIN_MINUTES,
  newestOf,
  STRIP_TIERS,
  stripMarks,
} from "@/components/app/event-feed/event-hub-head-strip-marks";
import type { ManifestEntry } from "@/lib/events/album-wire";

import { NIGHT_PHOTOS, nightArrivals, TONIGHT_AGE_MINUTES } from "./hub-night";

/**
 * THE LIBRARY'S NIGHT HOLDS THE HUB-HEAD SPECIMENS TO WHAT THEY SAY (`hub-night.ts`): the strip is drawn from the
 * arrivals it is handed, so the night has to be the 214 photographs the specimens' number says, in the order the strip
 * reads them (oldest first), a night with a shape rather than a flat line, and one whose newest end is lit when the
 * specimen opens (a few minutes old on the page's clock) and only that end.
 */

const NEWEST = Date.UTC(2026, 9, 4, 20, 0, 0) / 60_000;
const DESK = STRIP_TIERS.find((t) => t.id === "desk")!;

describe("the wedding's night", () => {
  it("★ is the 214 photographs the specimens' number says", () => {
    expect(NIGHT_PHOTOS).toBe(214);
    expect(nightArrivals(NEWEST)).toHaveLength(214);
  });

  it("★ stands oldest first, its newest photograph at the minute it is given, the same night wherever the clock is", () => {
    const night = nightArrivals(NEWEST);
    expect([...night].sort((a, b) => a - b)).toEqual(night);
    expect(newestOf(night)).toBe(NEWEST);
    // Only its distances are drawn, so a server's copy and a browser's paint the same marks.
    const later = nightArrivals(NEWEST + 1000);
    expect(later.map((t, i) => t - night[i])).toEqual(night.map(() => 1000));
  });

  it("★ has a shape: a rush at the toasts, a lull at dinner, never a flat line", () => {
    const heights = landedWith(nightArrivals(NEWEST));
    // How many landed within ten minutes of a photograph: a lone one stands short, the toasts tall.
    expect(Math.min(...heights)).toBeLessThanOrEqual(4);
    expect(Math.max(...heights)).toBeGreaterThanOrEqual(30);
    // And it is an evening, not a burst: hours from the first to the last.
    const night = nightArrivals(NEWEST);
    expect(NEWEST - night[0]).toBeGreaterThan(5 * 60);
  });

  it("★ opens lit at its newest end only: a handful of marks, never the whole line", () => {
    expect(TONIGHT_AGE_MINUTES).toBeLessThan(LIT_WITHIN_MINUTES);
    const marks = stripMarks(nightArrivals(NEWEST), DESK.most);
    const lit = marks.filter((m) => m.fresh);
    expect(lit.length).toBeGreaterThanOrEqual(2);
    expect(lit.length).toBeLessThanOrEqual(12);
    // The lit marks are the newest ones, the line's right-hand end.
    expect(marks.slice(-lit.length).every((m) => m.fresh)).toBe(true);
  });

  it("is what the hub itself would read off a manifest of the same photographs", () => {
    // `created_at` in microseconds, newest first: `arrivalsOf`'s own input, so the specimen cannot drift from
    // the shape the hub draws.
    const night = nightArrivals(NEWEST);
    const manifest = [...night]
      .reverse()
      .map(
        (minute, i): ManifestEntry => [
          `m${i}`,
          100,
          100,
          0,
          minute * 60_000_000,
        ],
      );
    expect(arrivalsOf(manifest)).toEqual(night);
  });
});
