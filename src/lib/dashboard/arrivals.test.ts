// @contract-for: src/lib/dashboard/arrivals.ts
import { describe, expect, it } from "vitest";

import {
  arrivalWindowStarts,
  describeArrivals,
  pickArrivalWindow,
} from "./arrivals";

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
 *
 * ★ And the number it says is the whole number (the 1,000-row round,
 * 2026-09-23): the window is picked from two exact counts, so a first hour of
 * 1,500 uploads reads 1,500, where counting the rows of a 240-row read could
 * never say more than 240.
 */

const NOW = Date.parse("2026-09-20T20:00:00.000Z");
const START_OF_TODAY = Date.parse("2026-09-20T00:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

describe("the widening window", () => {
  it("stays on the last hour when the hour holds twelve", () => {
    expect(pickArrivalWindow({ inHour: 14, inToday: 30 })).toEqual({
      window: "hour",
      count: 14,
    });
  });

  it("says the whole count, past any read's length, grouped for reading", () => {
    // A wedding's first hour: every upload counts, not the newest 240 — and
    // it groups like every other count in the product (the 1,000-row round's
    // follow-on: `lib/format/count.ts`).
    const picked = pickArrivalWindow({ inHour: 1500, inToday: 1500 });
    expect(picked).toEqual({ window: "hour", count: 1500 });
    expect(describeArrivals(picked.window, picked.count, ago(MIN), NOW)).toBe(
      "1,500 in the last hour, across your events",
    );
  });

  it("widens to today when the hour is short", () => {
    // Two this hour, seventeen today: the strip fills from today rather than
    // showing two tiles under a fresher-sounding label. This case is why the
    // "keep the narrow window whenever it has anything" branch came out.
    expect(pickArrivalWindow({ inHour: 2, inToday: 17 })).toEqual({
      window: "today",
      count: 17,
    });
  });

  it("takes the widest window when nothing fills the strip, and dates it", () => {
    const picked = pickArrivalWindow({ inHour: 6, inToday: 6 });
    expect(picked.window).toBe("recent");
    // The caption is where freshness still reaches the host.
    expect(
      describeArrivals(picked.window, picked.count, ago(10 * MIN), NOW),
    ).toBe("Newest, 10 min ago");
  });

  it("widens past today only when today is genuinely empty", () => {
    expect(pickArrivalWindow({ inHour: 0, inToday: 0 }).window).toBe("recent");
  });

  it("counts each window from where it starts: the last sixty minutes, and the host's midnight", () => {
    expect(arrivalWindowStarts(NOW, START_OF_TODAY)).toEqual({
      hour: ago(HOUR),
      today: "2026-09-20T00:00:00.000Z",
    });
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
