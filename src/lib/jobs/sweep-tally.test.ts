import { describe, expect, it } from "vitest";

import { jobById } from "@/app/admin/jobs/catalog";
import {
  SUB_SWEEP_JOB_BY_NAME,
  readRowsNote,
  sanitizeCounts,
  subSweepJobFor,
  subSweepParityGap,
  tallyReportsFailedRows,
} from "@/lib/jobs/sweep-tally";
import { Throttle } from "@/lib/jobs/throttle";

describe("the sub-sweep map", () => {
  it("names the four sweeps the round promoted", () => {
    expect(Object.keys(SUB_SWEEP_JOB_BY_NAME).sort()).toEqual([
      "deleted_accounts",
      "inactive_free_events",
      "orphans",
      "over_capacity",
    ]);
  });

  it("leaves every other sweep riding the parent run", () => {
    // The other seven are cheap, loop-free or both; a card each would drown the console.
    expect(subSweepJobFor("expired_passes")).toBeNull();
    expect(subSweepJobFor("job_health")).toBeNull();
    expect(subSweepJobFor("standby_budget")).toBeNull();
  });

  it("stays in step with the catalog in both directions", () => {
    // A catalogued sweep nobody runs reads as permanently missed (a false alarm); a promoted sweep
    // with no entry writes rows no card reads (a silent failure). Neither may happen by drift.
    expect(subSweepParityGap()).toEqual([]);
  });

  it("gives every promoted sweep a kill switch of its own", () => {
    for (const id of Object.values(SUB_SWEEP_JOB_BY_NAME)) {
      expect(jobById(id)?.flagKey).toBe(`${id}_enabled`);
    }
  });
});

describe("sanitizeCounts", () => {
  it("keeps the numbers a tally is made of", () => {
    expect(
      sanitizeCounts({ events: 3, media_rows: 0, freed_bytes: 12 }),
    ).toEqual({ events: 3, media_rows: 0, freed_bytes: 12 });
  });

  it("keeps booleans and short strings, like a cutoff stamp", () => {
    expect(
      sanitizeCounts({
        breaker_tripped: false,
        before: "2026-09-18T00:00:00Z",
      }),
    ).toEqual({ breaker_tripped: false, before: "2026-09-18T00:00:00Z" });
  });

  it("drops the error key and any long string", () => {
    // A failed send's message can quote a recipient address, and `counts` renders on a page rather
    // than through Sentry's scrubber. Numbers only, plus the short stamps.
    const out = sanitizeCounts({
      ok: 1,
      error:
        "resend send (over_cap_reminder): no such recipient will@example.com",
      note: "x".repeat(200),
    });
    expect(out).toEqual({ ok: 1 });
  });

  it("drops nested objects — a run row is a tally, not a log", () => {
    expect(sanitizeCounts({ ok: 1, detail: { a: 1 } })).toEqual({ ok: 1 });
  });

  it("returns null for anything that is not a tally", () => {
    expect(sanitizeCounts(null)).toBeNull();
    expect(sanitizeCounts("done")).toBeNull();
    expect(sanitizeCounts([1, 2])).toBeNull();
    expect(sanitizeCounts({})).toBeNull();
    expect(sanitizeCounts({ error: "boom" })).toBeNull();
  });

  it("drops a NaN rather than storing it as a number", () => {
    expect(sanitizeCounts({ ok: 2, bad: Number.NaN })).toEqual({ ok: 2 });
  });
});

describe("tallyReportsFailedRows", () => {
  it("is false for a clean sweep", () => {
    expect(tallyReportsFailedRows({ accounts: 10, rows_failed: 0 })).toBe(
      false,
    );
    expect(tallyReportsFailedRows({ accounts: 10 })).toBe(false);
  });

  it("is true when isolation skipped a row", () => {
    // The point of QA #27 is that the rows BEHIND a bad one still run. It is not that a night with
    // lost rows closes green.
    expect(tallyReportsFailedRows({ accounts: 10, rows_failed: 1 })).toBe(true);
    expect(tallyReportsFailedRows({ rows_not_attempted: 4 })).toBe(true);
  });

  it("ignores a non-numeric count rather than guessing", () => {
    expect(tallyReportsFailedRows({ rows_failed: "1" })).toBe(false);
    expect(tallyReportsFailedRows(null)).toBe(false);
  });
});

describe("readRowsNote", () => {
  it("lifts the sweep's own line for the run note", () => {
    expect(readRowsNote({ rows_note: "2 accounts failed" })).toBe(
      "2 accounts failed",
    );
  });

  it("is undefined when the sweep said nothing", () => {
    expect(readRowsNote({ accounts: 1 })).toBeUndefined();
    expect(readRowsNote({ rows_note: "" })).toBeUndefined();
    expect(readRowsNote(null)).toBeUndefined();
  });

  it("bounds the note, because a note column is not a log", () => {
    expect(readRowsNote({ rows_note: "x".repeat(900) })?.length).toBe(300);
  });
});

describe("the failure-log throttle", () => {
  it("lets the FIRST failure through — the one the signal needs", () => {
    const t = new Throttle<string>(1000);
    expect(t.claim("abuse_limiter", 0)).toBe(true);
  });

  it("damps the burst behind it", () => {
    // An outage produces one failure per request. Sentry is built for that; job_runs is not, and
    // hammering the table the health console reads would make the outage worse.
    const t = new Throttle<string>(1000);
    t.claim("abuse_limiter", 0);
    expect(t.claim("abuse_limiter", 1)).toBe(false);
    expect(t.claim("abuse_limiter", 999)).toBe(false);
  });

  it("reopens once the window passes", () => {
    const t = new Throttle<string>(1000);
    t.claim("abuse_limiter", 0);
    expect(t.claim("abuse_limiter", 1000)).toBe(true);
  });

  it("keeps a window per key, so one noisy job never mutes another", () => {
    const t = new Throttle<string>(1000);
    t.claim("abuse_limiter", 0);
    expect(t.claim("unlock_limiter", 1)).toBe(true);
  });
});
