// @contract-for: src/lib/dashboard/arrivals.ts
import { describe, expect, it } from "vitest";

import { describeArrivals, pickArrivalWindow } from "./arrivals";

/**
 * "JUST ARRIVED" WIDENS RATHER THAN EMPTIES (home-wiring, 2026-09-20).
 *
 * The contract is that the band is never a void AND never a lie: it takes the
 * narrowest window that has something in it, prefers a wider one only when the
 * narrow one is empty, and always reports which window it settled on. Will
 * approved the pulse while warning against a home that feels "limited and
 * empty... until more things start to happen"; a strip that blanks itself
 * between parties is exactly that, and a strip that presents week-old
 * photographs as "the last hour" is worse.
 */

const NOW = Date.parse("2026-09-20T20:00:00.000Z");
const START_OF_TODAY = Date.parse("2026-09-20T00:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

describe("the widening window", () => {
  it("stays on the last hour when the hour holds twelve", () => {
    const rows = Array.from({ length: 14 }, (_, i) => ago(i * MIN));
    expect(pickArrivalWindow(rows, NOW, START_OF_TODAY)).toEqual({
      window: "hour",
      count: 14,
    });
  });

  it("widens to today when the hour is short", () => {
    const rows = [
      ...Array.from({ length: 2 }, (_, i) => ago(i * MIN)),
      ...Array.from({ length: 15 }, (_, i) => ago(3 * HOUR + i * MIN)),
    ];
    // Two this hour, seventeen today: the strip fills from today rather than
    // showing two tiles under a fresher-sounding label. This case is why the
    // "keep the narrow window whenever it has anything" branch came out.
    expect(pickArrivalWindow(rows, NOW, START_OF_TODAY)).toEqual({
      window: "today",
      count: 17,
    });
  });

  it("takes the widest window when nothing fills the strip, and dates it", () => {
    const rows = Array.from({ length: 6 }, (_, i) => ago(10 * MIN + i * MIN));
    const picked = pickArrivalWindow(rows, NOW, START_OF_TODAY);
    expect(picked).toEqual({ window: "recent", count: 6 });
    // The caption is where freshness still reaches the host.
    expect(describeArrivals(picked.window, picked.count, rows[0], NOW)).toBe(
      "Newest, 10 min ago",
    );
  });

  it("widens past today only when today is genuinely empty", () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      ago(3 * 24 * HOUR + i * MIN),
    );
    expect(pickArrivalWindow(rows, NOW, START_OF_TODAY).window).toBe("recent");
  });

  it("says which window it settled on, including how stale the newest is", () => {
    expect(describeArrivals("hour", 12, ago(MIN), NOW)).toContain(
      "in the last hour",
    );
    expect(describeArrivals("today", 5, ago(5 * HOUR), NOW)).toContain("today");
    // His own phrasing for the fallback.
    expect(
      describeArrivals("recent", 9, ago(3 * 24 * HOUR), NOW),
    ).toBe("Newest, 3 days ago");
  });

  it("never claims freshness it cannot back up", () => {
    // A host with nothing at all gets a caption that says so, not "0 in the
    // last hour, across your events".
    expect(describeArrivals("recent", 0, null, NOW)).toBe("Nothing yet");
  });
});
