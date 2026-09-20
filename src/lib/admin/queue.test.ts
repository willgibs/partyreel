// @contract-for: src/lib/admin/queue.ts
import { describe, expect, it } from "vitest";

import { buildOperatorQueue, waitedLabel } from "@/lib/admin/queue";
import type { JobHealthReport } from "@/lib/jobs/health-summary";

/**
 * WHAT IS WAITING, RANKED (admin-wiring, 2026-09-20; the home's queue).
 *
 * The ranking IS the design. The nine-card grid this replaces drew the same
 * page whether the platform was calm or on fire, and the one thing a ranked
 * list can say that a grid cannot is that a failed purge outranks a press
 * enquiry. So the ladder is pinned by NUMBER rather than by the order of a few
 * `push` calls, and the two honesty rules beside it are pinned too: an
 * unreadable heartbeat is never a count, and a surface with nothing pending is
 * simply absent.
 */

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 8, 20, 12, 0, 0);

const healthy: JobHealthReport = {
  readable: true,
  unhealthy: [],
  pausedCount: 0,
  heartbeatAgeMs: HOUR,
};

const quiet = {
  health: healthy,
  reports: { count: 0, oldestAtMs: null },
  support: { count: 0, oldestAtMs: null },
  applicants: { count: 0, oldestAtMs: null },
  nowMs: NOW,
};

describe("the ladder", () => {
  it("puts an unreadable console above everything, and never gives it a number", () => {
    const [first] = buildOperatorQueue({
      ...quiet,
      health: { ...healthy, readable: false, heartbeatAgeMs: null },
      reports: { count: 3, oldestAtMs: NOW - 5 * HOUR },
    });
    expect(first.rank).toBe(0);
    expect(first.kind).toBe("jobs");
    // A fabricated "1 job" is the console inventing the answer it exists to go
    // and find, so the row says what happened instead.
    expect(first.what).not.toMatch(/\d/);
    expect(first.waitedMs).toBeNull();
  });

  it("orders a failure, then an overdue job, then safety, then the inboxes", () => {
    const rows = buildOperatorQueue({
      ...quiet,
      health: {
        ...healthy,
        unhealthy: [
          { id: "backup_reconcile", label: "Backup reconcile", health: "missed" },
          { id: "purge_cron", label: "Purge sweep", health: "failed" },
        ],
      },
      reports: { count: 3, oldestAtMs: NOW - 5 * HOUR },
      support: { count: 9, oldestAtMs: NOW - 30 * HOUR },
      applicants: { count: 2, oldestAtMs: NOW - 70 * HOUR },
    });
    expect(rows.map((r) => r.id)).toEqual([
      "job-purge_cron",
      "job-backup_reconcile",
      "reports",
      "support",
      "applicants",
    ]);
    // An applicant waiting three days still sits under a report waiting five
    // hours: the ladder is severity first and age only inside a rung.
    expect(rows.at(-1)?.waitedMs).toBeGreaterThan(rows[2].waitedMs ?? 0);
  });

  it("tints a failure and leaves an inbox alone", () => {
    const rows = buildOperatorQueue({
      ...quiet,
      health: {
        ...healthy,
        unhealthy: [{ id: "purge_cron", label: "Purge sweep", health: "failed" }],
      },
      support: { count: 4, oldestAtMs: NOW - HOUR },
    });
    expect(rows[0].tone).toBe("destructive");
    // Four tinted rows is a spreadsheet with a highlighter through it, and the
    // one you are scrolling for stops standing out.
    expect(rows[1].tone).toBeUndefined();
  });

  it("is empty on a good day, rather than a list of zeroes", () => {
    expect(buildOperatorQueue(quiet)).toEqual([]);
  });

  it("names a report by its kind and its age, and says nothing about its content", () => {
    // What a report holds and what answering it costs is admin-triage's
    // language, on its own surface.
    const [row] = buildOperatorQueue({
      ...quiet,
      reports: { count: 2, oldestAtMs: NOW - 4 * HOUR },
    });
    expect(row.what).toBe("2 open reports");
    expect(row.waitedMs).toBe(4 * HOUR);
  });
});

describe("how long it has waited", () => {
  it("rounds down at every step, and steps up at the whole unit", () => {
    // Rounding up would say "4 days" for something three days old, which is
    // wrong in the direction that makes an operator relax.
    expect(waitedLabel(30_000)).toBe("just now");
    expect(waitedLabel(5 * 60_000)).toBe("5m");
    expect(waitedLabel(90 * 60_000)).toBe("1h");
    expect(waitedLabel(47 * HOUR)).toBe("47h");
    expect(waitedLabel(50 * HOUR)).toBe("2d");
  });

  it("says nothing at all about a row nothing dates", () => {
    expect(waitedLabel(null)).toBe("");
  });
});
