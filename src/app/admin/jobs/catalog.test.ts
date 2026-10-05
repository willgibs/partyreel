import { describe, expect, it } from "vitest";

import {
  BREAKER_TRIPPED_KEY,
  DEPTH_AGE_COUNT_KEYS,
  DEPTH_COUNT_KEYS,
  JOBS,
  MISSED_GRACE_MULTIPLIER,
  QUEUE_BACKLOG_ATTENTION,
  STOPPED_EARLY_KEY,
  countsBreakerTripped,
  countsStoppedEarly,
  isJobMissed,
  isUnhealthy,
  jobById,
  jobHealth,
  jobsWithRuns,
  readDepth,
  readDepthAgeMinutes,
  signalHealth,
  subSweepJobs,
  type DepthSource,
  type JobDef,
  type JobRunSummary,
} from "@/app/admin/jobs/catalog";
import { sanitizeCounts } from "@/lib/jobs/sweep-tally";
import type { OrphansTally } from "@/lib/lifecycle/sweeps/orphans";

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
  it("has unique ids, and a uniquely named switch wherever there is one", () => {
    const ids = JOBS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    const flags = JOBS.map((j) => j.flagKey).filter(
      (k): k is string => k !== null,
    );
    expect(new Set(flags).size).toBe(flags.length);
    for (const job of JOBS) {
      if (job.flagKey !== null) expect(job.flagKey).toBe(`${job.id}_enabled`);
    }
  });

  it("gives a switch to everything that RUNS, and to nothing that only reports", () => {
    // A switch on a reading would silence the reading, not the work — the opposite of this console.
    for (const job of JOBS) {
      if (job.kind === "scheduled") expect(job.flagKey).not.toBeNull();
      else expect(job.flagKey).toBeNull();
    }
  });

  it("only offers Run now where the app can actually start the job", () => {
    // A Cloudflare Worker cron and a GitHub Action cannot be triggered from here (no credential,
    // no endpoint), so promising a button would be a lie on the operator's console. Neither can a
    // sub-sweep: it runs inside the purge cron, and its card says to run that. The backup restore's
    // Restore now is no exception to this rule: it asks its Worker's own door (restore-now.ts), a
    // control of its card, never the generic Run now that calls the app's own cron routes.
    for (const job of JOBS) {
      if (job.host !== "vercel_cron") expect(job.canRunNow).toBe(false);
    }
    expect(defOf("purge_cron").canRunNow).toBe(true);
  });

  it("declares a positive cadence for every job that is on a clock", () => {
    for (const job of JOBS) {
      if (job.kind === "scheduled") {
        expect(job.expectedEveryMs).toBeGreaterThan(0);
        expect(job.cron).not.toBeNull();
      } else {
        // A signal or a reading has no clock, so it must not carry a cadence for `isJobMissed` to
        // judge it against. Zero is what makes the missed rule refuse to fire on it.
        expect(job.expectedEveryMs).toBe(0);
        expect(job.cron).toBeNull();
      }
    }
  });

  it("keeps the six purge sub-sweeps on the parent cron's clock", () => {
    const sweeps = subSweepJobs();
    expect(sweeps.map((j) => j.id)).toEqual([
      "purge_orphans",
      "purge_deleted_accounts",
      "purge_inactivity",
      "purge_over_capacity",
      "purge_album_log",
      "develop_rolls",
    ]);
    for (const sweep of sweeps) {
      expect(sweep.cron).toBe(defOf("purge_cron").cron);
      expect(sweep.expectedEveryMs).toBe(defOf("purge_cron").expectedEveryMs);
    }
  });

  it("queries run rows only for the jobs that keep them", () => {
    const withRuns = jobsWithRuns().map((j) => j.id);
    expect(withRuns).not.toContain("backup_queue");
    expect(withRuns).not.toContain("backup_dead_letters");
    expect(withRuns).toContain("email_delivery"); // signals keep their FAILURE rows
  });

  it("points every derived reading at a job that exists and keeps rows", () => {
    const withRuns = new Set(jobsWithRuns().map((j) => j.id));
    for (const job of JOBS) {
      if (job.kind !== "derived") continue;
      expect(job.readFrom?.length).toBeGreaterThan(0);
      for (const source of job.readFrom ?? []) {
        expect(withRuns.has(source)).toBe(true);
      }
    }
  });

  it("pins the depth count keys the Worker writes", () => {
    // ★ CROSS-PACKAGE CONTRACT. workers/backup/src/queue-metrics.ts writes these exact strings and
    // cannot import this module (separate package, separate tsconfig). The literals are asserted on
    // BOTH sides, so changing one without the other turns red here or in the Worker's own suite.
    expect(DEPTH_COUNT_KEYS.backup_queue).toBe("queue_backlog");
    expect(DEPTH_COUNT_KEYS.backup_dead_letters).toBe("dead_letter_backlog");
    expect(DEPTH_AGE_COUNT_KEYS.backup_queue).toBe("queue_oldest_min");
    expect(DEPTH_AGE_COUNT_KEYS.backup_dead_letters).toBe(
      "dead_letter_oldest_min",
    );
  });

  it("counts only the states an operator has to act on as unhealthy", () => {
    // Paused is a decision the operator made; a bell that rings about their own switch is a bell
    // they learn to ignore. `never` is "nothing has happened", which is not a fault either.
    expect(isUnhealthy("missed")).toBe(true);
    expect(isUnhealthy("failed")).toBe(true);
    expect(isUnhealthy("attention")).toBe(true);
    expect(isUnhealthy("paused")).toBe(false);
    expect(isUnhealthy("never")).toBe(false);
    expect(isUnhealthy("ok")).toBe(false);
    expect(isUnhealthy("running")).toBe(false);
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

  it("reports attention for a run that finished but stopped early with work left", () => {
    // The 1,000-row round: a sweep that ran out of time did nothing wrong, and the next run carries
    // on, but a backlog that outlasts a night is exactly what used to grow without a word.
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: { ...run("ok", 60_000, 60_000), stoppedEarly: true },
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("attention");
    expect(isUnhealthy("attention")).toBe(true);
  });

  it("lets a failure, a pause and a missed run outrank stopping early", () => {
    const stopped = (status: JobRunSummary["status"], agoMs: number) => ({
      ...run(status, agoMs, agoMs),
      stoppedEarly: true,
    });
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: stopped("error", 60_000),
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("failed");
    expect(
      jobHealth({
        def,
        enabled: false,
        lastRun: stopped("ok", 60_000),
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("paused");
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: stopped("ok", 4 * DAY),
        lastFinishedAtMs: NOW - 4 * DAY,
        nowMs: NOW,
      }),
    ).toBe("missed");
  });
});

describe("countsStoppedEarly", () => {
  it("reads the flag only as an explicit true at the top of the counts", () => {
    expect(
      countsStoppedEarly({ [STOPPED_EARLY_KEY]: true, remaining: 3 }),
    ).toBe(true);
    expect(countsStoppedEarly({ [STOPPED_EARLY_KEY]: "true" })).toBe(false);
    expect(
      countsStoppedEarly({ removed_media: { [STOPPED_EARLY_KEY]: true } }),
    ).toBe(false);
    expect(countsStoppedEarly(null)).toBe(false);
    expect(countsStoppedEarly([true])).toBe(false);
  });
});

/**
 * ★ A TRIPPED ORPHAN BREAKER READS ATTENTION, NOT HEALTHY. The breaker refuses the delete, fires
 * its Sentry error and the operator email, and returns normally, so the Orphan sweep's run closes
 * `ok`; until now its card read Healthy beside that email.
 */
describe("the orphan breaker's health", () => {
  const def = defOf("purge_orphans");

  // THE KEY IS ONE FACT IN TWO MODULES: the sweep types it on its tally, the catalog reads it back.
  // This line stops type-checking the day either side renames it.
  const typedByTheSweep: keyof OrphansTally = BREAKER_TRIPPED_KEY;

  /** What the Orphan sweep returns when the breaker trips (orphans.ts), as its run row stores it. */
  function trippedRunCounts() {
    const tally: OrphansTally = {
      scanned_pages: 2,
      r2_deleted: 0,
      r2_errored: 0,
      objects_scanned: 1_800,
      [typedByTheSweep]: true,
      breaker_reason: "fraction_cap",
      orphan_candidates: 1_500,
      media_count: 40,
    };
    return sanitizeCounts(tally);
  }

  it("★ reads attention for a run that closed ok with the breaker tripped, end to end from the sweep's tally", () => {
    const counts = trippedRunCounts();
    // The flag survives the run row's sanitising, where every other boolean does too.
    expect(countsBreakerTripped(counts)).toBe(true);
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: {
          ...run("ok", 60_000, 60_000),
          breakerTripped: countsBreakerTripped(counts),
        },
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("attention");
    // Attention is on the operator's bell (the health band), not only on the card.
    expect(isUnhealthy("attention")).toBe(true);
  });

  it("stays ok for an Orphan sweep that deleted what it found", () => {
    const counts = sanitizeCounts({
      scanned_pages: 1,
      r2_deleted: 12,
      r2_errored: 0,
      objects_scanned: 900,
    } satisfies OrphansTally);
    expect(countsBreakerTripped(counts)).toBe(false);
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: {
          ...run("ok", 60_000, 60_000),
          breakerTripped: countsBreakerTripped(counts),
        },
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("ok");
  });

  it("lets a failure, a pause and a missed run outrank a tripped breaker", () => {
    const tripped = (status: JobRunSummary["status"], agoMs: number) => ({
      ...run(status, agoMs, agoMs),
      breakerTripped: true,
    });
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: tripped("error", 60_000),
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("failed");
    expect(
      jobHealth({
        def,
        enabled: false,
        lastRun: tripped("ok", 60_000),
        lastFinishedAtMs: NOW - 60_000,
        nowMs: NOW,
      }),
    ).toBe("paused");
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: tripped("ok", 4 * DAY),
        lastFinishedAtMs: NOW - 4 * DAY,
        nowMs: NOW,
      }),
    ).toBe("missed");
  });

  it("reads the flag only as an explicit true at the top of the counts", () => {
    expect(countsBreakerTripped({ [BREAKER_TRIPPED_KEY]: true })).toBe(true);
    expect(countsBreakerTripped({ [BREAKER_TRIPPED_KEY]: false })).toBe(false);
    expect(countsBreakerTripped({ [BREAKER_TRIPPED_KEY]: "true" })).toBe(false);
    expect(
      countsBreakerTripped({ orphans: { [BREAKER_TRIPPED_KEY]: true } }),
    ).toBe(false);
    expect(countsBreakerTripped(null)).toBe(false);
    expect(countsBreakerTripped([true])).toBe(false);
  });
});

describe("isJobMissed, for jobs with no clock", () => {
  it("never judges a signal or a reading as late", () => {
    // The purge cron's freshness scan walks EVERY entry. A signal job has no cadence to be late
    // against, so the rule has to refuse rather than divide by a zero cadence and page every night.
    for (const id of ["email_delivery", "abuse_limiter", "backup_queue"]) {
      expect(isJobMissed(defOf(id), NOW - 400 * DAY, NOW)).toBe(false);
    }
  });
});

describe("signalHealth", () => {
  it("is a failure the moment anything failed", () => {
    // These are paths that are SUPPOSED to be silent. Anything they logged is by definition the
    // thing nobody could see before, so one is enough.
    expect(signalHealth({ ok24h: 900, failed24h: 1 })).toBe("failed");
  });

  it("is healthy when work happened and none of it failed", () => {
    expect(signalHealth({ ok24h: 12, failed24h: 0 })).toBe("ok");
  });

  it("reports no activity rather than a green light", () => {
    // ★ Zero of everything is the calm-empty-page reading this console exists to refuse: a dead
    // limiter and a quiet night produce the same zero, so the card must not paint it green.
    expect(signalHealth({ ok24h: 0, failed24h: 0 })).toBe("never");
  });

  it("reports nothing at all when the window could not be read", () => {
    expect(signalHealth(null)).toBe("never");
  });

  // ★ crumbs-75: a notice kept for its retry, or a download the Worker never said ended, failed nothing inside the
  // window, which is exactly how it stayed off the bell; owed work is a look, under a failure, over a quiet day.
  it("★ reads owed work as Needs a look: under a failure, over sends that went and over a quiet day", () => {
    expect(signalHealth({ ok24h: 40, failed24h: 0, owed: 1 })).toBe(
      "attention",
    );
    expect(signalHealth({ ok24h: 0, failed24h: 0, owed: 2 })).toBe("attention");
    expect(signalHealth({ ok24h: 0, failed24h: 1, owed: 2 })).toBe("failed");
    expect(signalHealth({ ok24h: 3, failed24h: 0, owed: 0 })).toBe("ok");
    expect(isUnhealthy(signalHealth({ ok24h: 0, failed24h: 0, owed: 1 }))).toBe(
      true,
    );
  });
});

describe("jobHealth, across the three kinds", () => {
  it("routes a signal job through its window, not its rows", () => {
    const def = defOf("email_delivery");
    expect(
      jobHealth({
        def,
        enabled: true,
        // A stale last-failure row must not make a healthy signal read as failed or missed.
        lastRun: run("error", 40 * DAY, 40 * DAY),
        lastFinishedAtMs: NOW - 40 * DAY,
        nowMs: NOW,
        signal: { ok24h: 30, failed24h: 0 },
      }),
    ).toBe("ok");
  });

  it("routes a derived job through its reading", () => {
    const def = defOf("backup_dead_letters");
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs: NOW,
        reading: { value: 0, readAtMs: NOW - 3600_000, sourceHealth: "ok" },
      }),
    ).toBe("ok");
  });

  it("gives an honest answer to a caller that knows nothing about the new kinds", () => {
    // ★ The purge cron's freshness scan calls jobHealth with only the scheduled inputs. It must get
    // `never` (which it skips) and never `missed`, or every signal job would page nightly.
    for (const id of ["email_delivery", "backup_dead_letters"]) {
      expect(
        jobHealth({
          def: defOf(id),
          enabled: true,
          lastRun: null,
          lastFinishedAtMs: null,
          nowMs: NOW,
        }),
      ).toBe("never");
    }
  });

  it("still lets a switch outrank everything, including a signal", () => {
    expect(
      jobHealth({
        def: defOf("purge_over_capacity"),
        enabled: false,
        lastRun: run("error", 10 * DAY, 10 * DAY),
        lastFinishedAtMs: NOW - 10 * DAY,
        nowMs: NOW,
      }),
    ).toBe("paused");
  });

  it("treats a sub-sweep exactly like any other daily job", () => {
    const def = defOf("purge_inactivity");
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: run("ok", 3 * DAY, 3 * DAY),
        lastFinishedAtMs: NOW - 3 * DAY,
        nowMs: NOW,
      }),
    ).toBe("missed");
  });
});

describe("readDepth and the reading rules", () => {
  function source(
    job: string,
    counts: unknown,
    startedAgoMs: number,
    health = "ok",
  ): DepthSource {
    return {
      job: job as DepthSource["job"],
      counts,
      startedAtMs: NOW - startedAgoMs,
      health: health as DepthSource["health"],
    };
  }

  it("reads the depth the Worker reported", () => {
    const reading = readDepth(defOf("backup_dead_letters"), [
      source(
        "backup_reconcile",
        { dead_letter_backlog: 3, copied: 9 },
        3600_000,
      ),
    ]);
    expect(reading?.value).toBe(3);
    expect(reading?.sourceHealth).toBe("ok");
  });

  it("prefers the freshest run that actually carried a number", () => {
    const reading = readDepth(defOf("backup_queue"), [
      source("backup_prune", { queue_backlog: 40 }, 7 * DAY),
      source("backup_reconcile", { queue_backlog: 2 }, 3600_000),
    ]);
    expect(reading?.value).toBe(2);
  });

  it("ignores a run of some other job", () => {
    const reading = readDepth(defOf("backup_queue"), [
      source("purge_cron", { queue_backlog: 999 }, 60_000),
      source("backup_reconcile", { queue_backlog: 1 }, 3600_000),
    ]);
    expect(reading?.value).toBe(1);
  });

  it("reports NO reading rather than a zero when the Worker never sent one", () => {
    // ★ The whole point of the derived card. A fabricated zero on a dead-letter card is worse than
    // no card at all: it is a health signal inventing the answer it was built to go and find.
    const reading = readDepth(defOf("backup_dead_letters"), [
      source("backup_reconcile", { copied: 4 }, 3600_000),
    ]);
    expect(reading?.value).toBeNull();
    expect(
      jobHealth({
        def: defOf("backup_dead_letters"),
        enabled: true,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs: NOW,
        reading,
      }),
    ).toBe("never");
  });

  it("returns null when there is no source run at all", () => {
    expect(readDepth(defOf("backup_queue"), [])).toBeNull();
  });

  it("refuses to read a depth for a job that is not derived", () => {
    expect(
      readDepth(defOf("backup_reconcile"), [
        source("backup_reconcile", { queue_backlog: 1 }, 1000),
      ]),
    ).toBeNull();
  });

  it("makes any dead letter a failure", () => {
    const def = defOf("backup_dead_letters");
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs: NOW,
        reading: { value: 1, readAtMs: NOW - 1000, sourceHealth: "ok" },
      }),
    ).toBe("failed");
  });

  it("treats a big live backlog as attention, not failure", () => {
    // An upload burst legitimately queues, and the daily reconcile copies whatever it never reached.
    const def = defOf("backup_queue");
    const at = (value: number) =>
      jobHealth({
        def,
        enabled: true,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs: NOW,
        reading: { value, readAtMs: NOW - 1000, sourceHealth: "ok" },
      });
    expect(at(QUEUE_BACKLOG_ATTENTION - 1)).toBe("ok");
    expect(at(QUEUE_BACKLOG_ATTENTION)).toBe("attention");
  });

  it("lets an unwell source outrank the number it carried", () => {
    // ★ A depth of zero read four days ago is not a healthy queue, it is no reading. Inheriting the
    // source's verdict is what stops a stale zero from painting the card green forever.
    const def = defOf("backup_dead_letters");
    expect(
      jobHealth({
        def,
        enabled: true,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs: NOW,
        reading: { value: 0, readAtMs: NOW - 4 * DAY, sourceHealth: "missed" },
      }),
    ).toBe("missed");
  });

  it("reads the oldest-message age off the same counts", () => {
    expect(
      readDepthAgeMinutes(defOf("backup_dead_letters"), {
        dead_letter_backlog: 2,
        dead_letter_oldest_min: 45,
      }),
    ).toBe(45);
    expect(readDepthAgeMinutes(defOf("backup_dead_letters"), {})).toBeNull();
    expect(readDepthAgeMinutes(defOf("purge_cron"), { x: 1 })).toBeNull();
  });
});

/**
 * ★ HELD BY THE BACKUP ALONE (crumbs-75; ROADMAP: the prune's `primary_missing` closed its run ok with a note). A key
 * whose row lives while the primary lost its object is a host's photo with one copy left, so it is a failure on a
 * card of its own beside the dead letters, read off the prune's own run (which writes the count, zero included).
 */
describe("the backup's lone copies (crumbs-75)", () => {
  const def = () => defOf("backup_primary_missing");
  const at = (
    counts: unknown,
    health: DepthSource["health"] = "ok",
  ): DepthSource => ({
    job: "backup_prune",
    counts,
    startedAtMs: NOW - 3_600_000,
    health,
  });
  const verdict = (sources: DepthSource[]) =>
    jobHealth({
      def: def(),
      enabled: true,
      lastRun: null,
      lastFinishedAtMs: null,
      nowMs: NOW,
      reading: readDepth(def(), sources),
    });

  it("is a reading of the prune's runs and the restore's passes, beside the dead letters, with nothing to pause or run", () => {
    expect(def()).toMatchObject({
      kind: "derived",
      host: "cloudflare_worker",
      readFrom: ["backup_prune", "backup_restore"],
      flagKey: null,
      canRunNow: false,
    });
    const ids = JOBS.map((j) => j.id);
    expect(ids.indexOf("backup_primary_missing")).toBe(
      ids.indexOf("backup_dead_letters") + 1,
    );
  });

  it("pins the key the prune writes (the Worker's suite asserts the same string)", () => {
    expect(DEPTH_COUNT_KEYS.backup_primary_missing).toBe("primary_missing");
  });

  it("★ makes any lone copy a failure, and a judged zero healthy", () => {
    expect(verdict([at({ primary_missing: 2, scanned: 900 })])).toBe("failed");
    expect(verdict([at({ primary_missing: 0, scanned: 900 })])).toBe("ok");
  });

  it("reads no number as no reading, never as none missing, and lets an unwell prune outrank it", () => {
    // An aborted run (a doubt) carries no count: no reading.
    expect(verdict([at({ scanned: 12, deleted: 0 })])).toBe("never");
    expect(verdict([at({ primary_missing: 0 }, "missed")])).toBe("missed");
    // The reconcile's runs never carry it.
    expect(
      readDepth(def(), [
        {
          job: "backup_reconcile",
          counts: { primary_missing: 5 },
          startedAtMs: NOW,
          health: "ok",
        },
      ]),
    ).toBeNull();
  });

  it("★ reads the restore's pass after the prune that found them, freshest first: copied back, it reads healthy at once", () => {
    const restored: DepthSource = {
      job: "backup_restore",
      counts: { primary_missing: 0, restored: 2, restore_mode: "on" },
      startedAtMs: NOW - 1_800_000,
      health: "ok",
    };
    expect(verdict([at({ primary_missing: 2 }), restored])).toBe("ok");
    // A restore that could not copy them back carries what it left, and its failure.
    expect(
      verdict([
        at({ primary_missing: 2 }),
        {
          ...restored,
          counts: { primary_missing: 1, failed: 1 },
          health: "failed",
        },
      ]),
    ).toBe("failed");
    // A newer prune that found more outranks an older restore's zero.
    expect(
      verdict([{ ...at({ primary_missing: 3 }), startedAtMs: NOW }, restored]),
    ).toBe("failed");
  });
});

describe("the backup restore (durability-restore)", () => {
  it("is a scheduled Worker job with its own switch, beside the lone copies it restores, its Run now its own", () => {
    expect(defOf("backup_restore")).toMatchObject({
      kind: "scheduled",
      host: "cloudflare_worker",
      flagKey: "backup_restore_enabled",
      canRunNow: false,
      expectedEveryMs: DAY,
    });
    const ids = JOBS.map((j) => j.id);
    expect(ids.indexOf("backup_restore")).toBe(
      ids.indexOf("backup_primary_missing") + 1,
    );
  });

  it("rides the cron its Worker deploys for the reconcile, so the missed-run rule judges the real clock", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const wrangler = readFileSync(
      join(process.cwd(), "workers", "backup", "wrangler.jsonc"),
      "utf8",
    );
    expect(defOf("backup_restore").cron).toBe(defOf("backup_reconcile").cron);
    expect(wrangler).toContain(`"${defOf("backup_restore").cron}"`);
  });
});

describe("the Download all Worker (export-ends)", () => {
  it("beats daily on the exports' own switch, on the cron its Worker deploys", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const beat = defOf("export");
    expect(beat).toMatchObject({
      kind: "scheduled",
      host: "cloudflare_worker",
      // The switch /admin/exports flips: pausing downloads is the one thing a switch here could mean.
      flagKey: "export_enabled",
      canRunNow: false,
      expectedEveryMs: DAY,
    });
    // The card's cron is the one wrangler.jsonc deploys, so the missed-run rule judges the real clock.
    const wrangler = readFileSync(
      join(process.cwd(), "workers", "export", "wrangler.jsonc"),
      "utf8",
    );
    expect(wrangler).toMatch(
      new RegExp(
        `"crons":\\s*\\[\\s*"${beat.cron!.replace(/\*/g, "\\*")}"\\s*\\]`,
      ),
    );
  });

  it("counts the downloads as a signal: no switch, no clock", () => {
    expect(defOf("export_delivery")).toMatchObject({
      kind: "signal",
      host: "app",
      flagKey: null,
      cron: null,
      expectedEveryMs: 0,
    });
  });
});

describe("the spend watch (spend-watch)", () => {
  it("is a scheduled app cron with its own switch, never a ride on the purge's run", () => {
    expect(defOf("spend_watch")).toMatchObject({
      kind: "scheduled",
      host: "vercel_cron",
      flagKey: "spend_watch_enabled",
      canRunNow: true,
      runPath: "/api/cron/spend-watch",
      expectedEveryMs: DAY,
    });
    // It must run while the purge is paused, and it may be the one pausing it.
    expect(defOf("spend_watch").runPath).not.toBe(defOf("purge_cron").runPath);
  });

  it("★ gives every job the app can start the route vercel.json schedules, on the catalog's own cron", async () => {
    const { existsSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const vercel = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
    ) as { crons?: { path: string; schedule: string }[] };
    for (const job of JOBS.filter((j) => j.canRunNow)) {
      expect(job.runPath, job.id).toBeDefined();
      const crons = (vercel.crons ?? []).filter((c) => c.path === job.runPath);
      expect(crons, job.id).toHaveLength(1);
      expect(crons[0].schedule, job.id).toBe(job.cron);
      expect(
        existsSync(join(process.cwd(), `src/app${job.runPath}/route.ts`)),
        job.id,
      ).toBe(true);
    }
    // And nothing vercel.json schedules goes without a card.
    for (const cron of vercel.crons ?? []) {
      expect(
        JOBS.some((j) => j.runPath === cron.path),
        cron.path,
      ).toBe(true);
    }
  });

  it("★ reads attention while a reading trips or a pause of its own stands, through the breaker's own key", async () => {
    const { runCounts } = await import("@/lib/jobs/spend-watch");
    const tripped = runCounts({
      nowMs: NOW,
      baseline: null,
      verdicts: [
        {
          id: "downloads",
          state: "tripped",
          value: 900,
          atLeast: false,
          peak: 10,
          ceiling: 100,
          basis: "peak",
        },
      ],
      snap: {},
      pausedAt: {},
    });
    const quiet = runCounts({
      nowMs: NOW,
      baseline: null,
      verdicts: [],
      snap: {},
      pausedAt: {},
    });
    const health = (counts: unknown) =>
      jobHealth({
        def: defOf("spend_watch"),
        enabled: true,
        lastRun: {
          ...run("ok", 60_000, 59_000),
          breakerTripped: countsBreakerTripped(counts),
        },
        lastFinishedAtMs: NOW - 59_000,
        nowMs: NOW,
      });
    expect(health(tripped)).toBe("attention");
    expect(health(quiet)).toBe("ok");
  });
});
