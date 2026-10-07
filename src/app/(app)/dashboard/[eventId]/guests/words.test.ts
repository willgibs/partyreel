import { describe, expect, it } from "vitest";

import {
  addedHead,
  addedWords,
  atWords,
  waitedShort,
  whenShort,
} from "./words";

/**
 * THE ROOM'S SHORT WORDS FOR WHEN (guests-room r1, `rows=list`): how long someone has waited, in the characters a row
 * has beside a name, and when something happened, on the night's own clock or, before it, its date, in the host's zone.
 */

const NOW = Date.parse("2026-10-03T21:40:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("waitedShort", () => {
  it.each([
    [ago(20_000), "now"],
    [ago(2 * 60_000), "2 min"],
    [ago(59 * 60_000), "59 min"],
    [ago(60 * 60_000), "1 hr"],
    [ago(23 * 3_600_000), "23 hr"],
    [ago(25 * 3_600_000), "1 day"],
    [ago(4 * 86_400_000), "4 days"],
    // A time that is no time, or one ahead of the clock, has waited no time at all.
    ["not a time", "now"],
    [new Date(NOW + 60_000).toISOString(), "now"],
  ])("%s → %s", (askedAt, words) => {
    expect(waitedShort(askedAt, NOW)).toBe(words);
  });
});

describe("whenShort", () => {
  it.each([
    // Tonight, in her zone: the time.
    ["2026-10-03T21:12:00Z", "UTC", "9:12 PM"],
    // ★ HER zone decides what "tonight" is: 21:12 UTC is 5:12 PM in New York, still the same day there.
    ["2026-10-03T21:12:00Z", "America/New_York", "5:12 PM"],
    // An earlier day this year: the date.
    ["2026-09-28T10:00:00Z", "UTC", "Sep 28"],
    // ★ 01:00 UTC on the 3rd is still the 2nd in New York: its date there.
    ["2026-10-03T01:00:00Z", "America/New_York", "Oct 2"],
    // Another year: the year beside it.
    ["2025-10-03T10:00:00Z", "UTC", "Oct 3, 2025"],
    ["no time", "UTC", ""],
  ])("%s in %s → %s", (iso, zone, words) => {
    expect(whenShort(iso, zone, NOW)).toBe(words);
  });

  it("says a time of day 'at' and a date 'on', inside a sentence", () => {
    expect(atWords("9:12 PM")).toBe("at 9:12 PM");
    expect(atWords("Oct 3")).toBe("on Oct 3");
    expect(atWords("Oct 3, 2025")).toBe("on Oct 3, 2025");
  });
});

describe("what someone added", () => {
  it.each([
    [{ photos: 24, videos: 0 }, "24 photos", "Photos"],
    [{ photos: 1, videos: 0 }, "1 photo", "Photos"],
    [{ photos: 0, videos: 1 }, "1 video", "Videos"],
    [{ photos: 3, videos: 2 }, "5 photos & videos", "Photos & videos"],
  ])("%j → %s, headed %s", (added, words, head) => {
    expect(addedWords(added)).toBe(words);
    expect(addedHead(added)).toBe(head);
  });
});
