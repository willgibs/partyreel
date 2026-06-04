import { describe, expect, it } from "vitest";

import {
  RECENTLY_DELETED_WINDOW_DAYS,
  RECOVERY_PURGE_NUDGE_DAYS,
  binCountdownDays,
  binCountdownLabel,
  overStandbyBudget,
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

describe("binCountdownDays", () => {
  const NOW = Date.parse("2026-06-04T00:00:00Z");

  it("counts whole days until purge, rounding up", () => {
    expect(binCountdownDays("2026-07-04T00:00:00Z", NOW)).toBe(30); // exactly 30d out
    expect(binCountdownDays("2026-06-04T12:00:00Z", NOW)).toBe(1); // half a day -> 1
  });

  it("clamps an overdue item (cron not run yet) to 0", () => {
    expect(binCountdownDays("2026-06-03T00:00:00Z", NOW)).toBe(0);
  });

  it("falls back to the full window when purge_at is missing", () => {
    expect(binCountdownDays(null, NOW)).toBe(RECENTLY_DELETED_WINDOW_DAYS);
  });
});

describe("overStandbyBudget", () => {
  it("is false at or under the 1x-cap budget", () => {
    expect(overStandbyBudget(100, 100)).toBe(false);
    expect(overStandbyBudget(99, 100)).toBe(false);
  });

  it("is true above the budget", () => {
    expect(overStandbyBudget(101, 100)).toBe(true);
  });

  it("is never over an unlimited (null) cap", () => {
    expect(overStandbyBudget(Number.MAX_SAFE_INTEGER, null)).toBe(false);
  });
});

describe("binCountdownLabel", () => {
  it("reads naturally for 0 / 1 / N days", () => {
    expect(binCountdownLabel(0)).toBe("Deletes today");
    expect(binCountdownLabel(1)).toBe("Deletes in 1 day");
    expect(binCountdownLabel(30)).toBe("Deletes in 30 days");
  });
});

describe("RECOVERY_PURGE_NUDGE_DAYS", () => {
  it("is a positive nudge window within the recovery window", () => {
    expect(RECOVERY_PURGE_NUDGE_DAYS).toBe(7);
    expect(RECOVERY_PURGE_NUDGE_DAYS).toBeGreaterThan(0);
    expect(RECOVERY_PURGE_NUDGE_DAYS).toBeLessThanOrEqual(
      RECENTLY_DELETED_WINDOW_DAYS,
    );
  });
});
