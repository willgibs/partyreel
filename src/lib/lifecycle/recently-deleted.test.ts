import { describe, expect, it } from "vitest";

import {
  RECENTLY_DELETED_WINDOW_DAYS,
  RECOVERY_PURGE_NUDGE_DAYS,
  binCountdownDays,
  binCountdownLabel,
} from "@/lib/lifecycle/recently-deleted";

// ★ RESHAPED ON PURPOSE (trash-in-storage, 2026-10-03; scar kept: the window is 30 days and mirrors the SQL). The
// standby budget's selector and its warning went with the budget: Deleted counts in storage, so the cap bounds it, and
// its oldest-first eviction is `leave_deleted`'s now (proved in its migration, 20261003220000).

describe("the recovery window", () => {
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
