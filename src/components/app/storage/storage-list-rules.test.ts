/**
 * THE SIZE LIST'S RULES, PINNED BY BEHAVIOUR (host-storage r1: `order=flat` with an All or
 * per-event filter, `goal=live`). The order, the filter, the strip's arithmetic and its button's
 * next step, and the words a selection is named by. Copy is read for its facts (a count, a unit),
 * never its phrasing.
 */
import { describe, expect, it } from "vitest";

import { GIGABYTE } from "@/lib/constants/tiers";
import type { StorageItem } from "@/lib/db/queries/storage-list";

import {
  addedLabel,
  byEvent,
  formatDuration,
  goalCount,
  goalStep,
  itemsWords,
  largestFirst,
  pick,
  shownItems,
  totalBytes,
  type Picked,
} from "./storage-list-rules";

function item(
  id: string,
  gb: number,
  over: Partial<StorageItem> = {},
): StorageItem {
  return {
    id,
    eventId: "wedding",
    type: "video",
    bytes: Math.round(gb * GIGABYTE),
    durationSeconds: 300,
    createdAt: "2026-06-14T18:00:00.000000+00:00",
    url: `https://r2.test/${id}`,
    previewUrl: null,
    by: { name: null, isHost: true, isVerified: true },
    ...over,
  };
}

describe("the order: largest first, across every event", () => {
  it("ranks by size, whatever event an item came from", () => {
    const list = [
      item("a", 1.2, { eventId: "party" }),
      item("b", 9.4),
      item("c", 4.1, { eventId: "party" }),
    ].sort(largestFirst);
    expect(list.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks a tie on the id, descending, as the server's keyset does", () => {
    const list = [item("a", 2), item("c", 2), item("b", 2)].sort(largestFirst);
    expect(list.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });
});

describe("the filter: All, or one event", () => {
  const loaded = [
    item("a", 1, { eventId: "party" }),
    item("b", 9),
    item("c", 4, { eventId: "party" }),
  ];

  it("shows every event under All, one event's items under its chip", () => {
    expect(shownItems(loaded, "all", new Map()).map((i) => i.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(shownItems(loaded, "party", new Map()).map((i) => i.id)).toEqual([
      "c",
      "a",
    ]);
  });

  it("never shows what this visit removed", () => {
    const removed = new Map<string, Picked>([["c", pick(loaded[2])]]);
    expect(shownItems(loaded, "all", removed).map((i) => i.id)).toEqual([
      "b",
      "a",
    ]);
  });
});

describe("the goal strip counts what the check counts", () => {
  // Priya: 110.83 GB stored, Pro 100 GB tapped: 10.83 GB to free.
  const stored = Math.round(110.83 * GIGABYTE);
  const cap = 100 * GIGABYTE;

  it("counts down as items are selected, and removed ones stay counted", () => {
    const counting = goalCount({
      storedBytes: stored,
      capBytes: cap,
      removedBytes: 4 * GIGABYTE,
      selectedBytes: 5 * GIGABYTE,
      selectedCount: 2,
    });
    expect(counting.gap).toBe(stored - cap);
    expect(counting.remaining).toBe(stored - cap - 9 * GIGABYTE);
    expect(counting.done).toBe(false);
    expect(goalStep(counting)).toBe("counting");
    expect(counting.percent).toBeGreaterThan(0);
    expect(counting.percent).toBeLessThan(100);
  });

  it("removes first while anything freed is only selected", () => {
    // The storage check reads what is STORED: a selection has not freed anything yet.
    const selected = goalCount({
      storedBytes: stored,
      capBytes: cap,
      removedBytes: 0,
      selectedBytes: 11 * GIGABYTE,
      selectedCount: 3,
    });
    expect(selected.done).toBe(true);
    expect(goalStep(selected)).toBe("remove-and-switch");
  });

  it("switches once everything freed has gone to Deleted", () => {
    const removed = goalCount({
      storedBytes: stored,
      capBytes: cap,
      removedBytes: 11 * GIGABYTE,
      selectedBytes: 0,
      selectedCount: 0,
    });
    expect(removed.remaining).toBe(0);
    expect(goalStep(removed)).toBe("switch");
    expect(removed.percent).toBe(100);
  });

  it("reaches zero exactly at the plain cap, never short of it", () => {
    const short = goalCount({
      storedBytes: stored,
      capBytes: cap,
      removedBytes: stored - cap - 1,
      selectedBytes: 0,
      selectedCount: 0,
    });
    expect(short.done).toBe(false);
    expect(short.remaining).toBe(1);
    const exact = goalCount({
      storedBytes: stored,
      capBytes: cap,
      removedBytes: stored - cap,
      selectedBytes: 0,
      selectedCount: 0,
    });
    expect(exact.done).toBe(true);
  });
});

describe("a selection, grouped and named", () => {
  it("groups by event, which is how Remove and Download reach the server", () => {
    const groups = byEvent([
      pick(item("a", 1, { eventId: "party" })),
      pick(item("b", 2)),
      pick(item("c", 3, { eventId: "party" })),
    ]);
    expect(groups.get("party")?.map((p) => p.id)).toEqual(["a", "c"]);
    expect(groups.get("wedding")?.map((p) => p.id)).toEqual(["b"]);
    expect(totalBytes(groups.get("party") ?? [])).toBe(4 * GIGABYTE);
  });

  it("names photos, videos, or a mix", () => {
    expect(itemsWords([{ type: "photo" }])).toBe("1 photo");
    expect(itemsWords([{ type: "video" }, { type: "video" }])).toBe("2 videos");
    expect(itemsWords([{ type: "video" }, { type: "photo" }])).toBe("2 items");
  });
});

describe("a row's facts", () => {
  it("reads a video's length the way a player does", () => {
    expect(formatDuration(42)).toBe("0:42");
    expect(formatDuration(727)).toBe("12:07");
    expect(formatDuration(3727)).toBe("1:02:07");
  });

  it("dates an item short, with the year only once it is not this year's", () => {
    const now = new Date("2026-09-28T12:00:00Z");
    expect(addedLabel("2026-06-14T12:00:00Z", now)).not.toMatch(/2026/);
    expect(addedLabel("2025-06-14T12:00:00Z", now)).toMatch(/2025/);
    expect(addedLabel("not a date", now)).toBe("");
  });
});
