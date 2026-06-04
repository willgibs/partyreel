import { describe, expect, it } from "vitest";

import {
  RECENTLY_DELETED_WINDOW_DAYS,
  selectForStandbyEviction,
} from "@/lib/lifecycle/recently-deleted";

const B = (id: string, bytes: number, binned_at: string) => ({
  id,
  file_size_bytes: bytes,
  binned_at,
});

describe("selectForStandbyEviction", () => {
  it("evicts nothing when standby is under (or at) the budget", () => {
    expect(
      selectForStandbyEviction(
        [B("a", 5, "2026-01-01T00:00:00Z"), B("b", 3, "2026-01-02T00:00:00Z")],
        10,
      ),
    ).toEqual([]);
    expect(
      selectForStandbyEviction(
        [B("a", 6, "2026-01-01T00:00:00Z"), B("b", 4, "2026-01-02T00:00:00Z")],
        10,
      ),
    ).toEqual([]);
  });

  it("evicts the OLDEST first, just enough to fit", () => {
    // total 18, budget 10 → drop old@Jan-01 (6) → 12 > 10, drop mid@Jan-02 (5) → 7 ≤ 10.
    expect(
      selectForStandbyEviction(
        [
          B("new", 7, "2026-01-03T00:00:00Z"),
          B("old", 6, "2026-01-01T00:00:00Z"),
          B("mid", 5, "2026-01-02T00:00:00Z"),
        ],
        10,
      ),
    ).toEqual(["old", "mid"]);
  });

  it("keeps the freshest item alive when one eviction suffices (anti-timer-refresh)", () => {
    // total 18, budget 12 → drop only the oldest (6) → 12 ≤ 12; the just-restored 'new' survives.
    expect(
      selectForStandbyEviction(
        [
          B("new", 7, "2026-01-03T00:00:00Z"),
          B("old", 6, "2026-01-01T00:00:00Z"),
          B("mid", 5, "2026-01-02T00:00:00Z"),
        ],
        12,
      ),
    ).toEqual(["old"]);
  });

  it("evicts everything when the budget is 0", () => {
    expect(
      selectForStandbyEviction(
        [B("a", 3, "2026-01-02T00:00:00Z"), B("b", 5, "2026-01-01T00:00:00Z")],
        0,
      ).sort(),
    ).toEqual(["a", "b"]);
  });

  it("handles no bin items", () => {
    expect(selectForStandbyEviction([], 10)).toEqual([]);
  });

  it("constant mirrors the SQL interval in the media purge_at trigger", () => {
    expect(RECENTLY_DELETED_WINDOW_DAYS).toBe(30);
  });
});
