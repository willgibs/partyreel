import { describe, expect, it } from "vitest";

import {
  JOBS,
  MISSED_GRACE_MULTIPLIER,
  isJobMissed,
  jobById,
  jobHealth,
  type JobDef,
  type JobRunSummary,
} from "@/app/admin/jobs/catalog";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-09-02T12:00:00.000Z");

function defOf(id: string): JobDef {
  const def = jobById(id);
  if (!def) throw new Error(`no such job: ${id}`);
  return def;
}

function run(
  status: JobRunSummary["status"],
  startedAgoMs: number,
  finishedAgoMs: number | null = null,
): JobRunSummary {
  return {
    status,
    startedAtMs: NOW - startedAgoMs,
    finishedAtMs: finishedAgoMs === null ? null : NOW - finishedAgoMs,
  };
}

describe("the job catalog", () => {
  it("has unique ids and a flag key per job", () => {
    const ids = JOBS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    const flags = JOBS.map((j) => j.flagKey);
    expect(new Set(flags).size).toBe(flags.length);
    for (const job of JOBS) expect(job.flagKey).toBe(`${job.id}_enabled`);
  });

  it("only offers Run now where the app can actually start the job", () => {
    // A Cloudflare Worker cron and a GitHub Action cannot be triggered from here (no credential,
    // no endpoint), so promising a button would be a lie on the operator's console.
    for (const job of JOBS) {
      if (job.host !== "vercel_cron") expect(job.canRunNow).toBe(false);
    }
    expect(defOf("purge_cron").canRunNow).toBe(true);
  });

  it("declares a positive cadence for every job", () => {
    for (const job of JOBS) expect(job.expectedEveryMs).toBeGreaterThan(0);
  });
});

describe("isJobMissed", () => {
  const daily = defOf("purge_cron");

  it("treats a job that has never reported as not-missed", () => {
    // Nothing to be late for. A fresh deploy would otherwise page on every job at once.
    expect(isJobMissed(daily, null, NOW)).toBe(false);
  });

  it("allows a full grace multiple of the cadence", () => {
    expect(isJobMissed(daily, NOW - DAY, NOW)).toBe(false);
    expect(
      isJobMissed(daily, NOW - DAY * MISSED_GRACE_MULTIPLIER + 1, NOW),
    ).toBe(false);
  });

  it("flags a job that has not reported past the grace window", () => {
    expect(
      isJobMissed(daily, NOW - DAY * MISSED_GRACE_MULTIPLIER - 1, NOW),
    ).toBe(true);
    expect(isJobMissed(daily, NOW - 5 * DAY, NOW)).toBe(true);
  });

  it("scales with the job's own cadence, not a fixed window", () => {
    const weekly = defOf("backup_prune");
    // Three days silent is fine for a weekly job and a fault for a daily one.
    expect(isJobMissed(weekly, NOW - 3 * DAY, NOW)).toBe(false);
    expect(isJobMissed(daily, NOW - 3 * DAY, NOW)).toBe(true);
  });
});

describe("jobHealth", () => {
  const def = defOf("purge_cron");

  it("reports paused ahead of everything else", () => {
    // Pausing is a decision. It must not also read as a fault, or the operator learns to ignore red.
    expect(
      jobHealth({
        def,
        enabled: false,
        lastRun: run("error", 10 * DAY, 10 * DAY),
        lastFinishedAtMs: NOW - 10 * DAY,
        nowMs: NOW,
      }),
    ).toBe("paused");
  });

  it("reports never when nothing has ever run", () => {
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs: NOW,
      }),
    ).toBe("never");
  });

  it("reports ok for a recent successful run", () => {
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: run("ok", 2 * 60 * 60 * 1000, 2 * 60 * 60 * 1000),
        lastFinishedAtMs: NOW - 2 * 60 * 60 * 1000,
        nowMs: NOW,
      }),
    ).toBe("ok");
  });

  it("counts a skipped run as reporting in", () => {
    // The kill switch writes a skipped row precisely so a paused job never looks dead.
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: run("skipped", 60_000, 60_000),
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("ok");
  });

  it("reports failed for a recent error", () => {
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: run("error", 60_000, 60_000),
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("failed");
  });

  it("reports missed when the last finish is stale, whatever its status was", () => {
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: run("ok", 4 * DAY, 4 * DAY),
        lastFinishedAtMs: NOW - 4 * DAY,
        nowMs: NOW,
      }),
    ).toBe("missed");
  });

  it("reports running for a run still inside its window", () => {
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: run("running", 60_000),
        lastFinishedAtMs: NOW - DAY,
        nowMs: NOW,
      }),
    ).toBe("running");
  });

  it("reports missed for a run stuck open past its window", () => {
    // A row that never closed never reported a result, which is the shape of a job that died
    // mid-flight. Nothing will ever finish it, so silence is the honest reading.
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: run("running", 5 * DAY),
        lastFinishedAtMs: null,
        nowMs: NOW,
      }),
    ).toBe("missed");
  });
});
