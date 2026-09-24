import { describe, expect, it } from "vitest";

import { jobById } from "@/app/admin/jobs/catalog";
import {
  RESUME_KEY,
  SUB_SWEEP_JOB_BY_NAME,
  cursorFrom,
  purgeRunVerdict,
  readRemaining,
  readRowsNote,
  sanitizeCounts,
  stoppedEarlyNote,
  subSweepJobFor,
  subSweepParityGap,
  sweepStoppedEarly,
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
    // The other eight are cheap, loop-free or both; a card each would drown the console.
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

describe("stopped early (the 1,000-row round)", () => {
  const cursor = "0f1e2d3c-4b5a-4968-8776-655443322110";

  it("reads the catalog's flag, and only an explicit true", () => {
    expect(sweepStoppedEarly({ stopped_early: true, remaining: 3 })).toBe(true);
    expect(sweepStoppedEarly({ stopped_early: "yes" })).toBe(false);
    expect(sweepStoppedEarly({ media_rows: 3 })).toBe(false);
    expect(sweepStoppedEarly(null)).toBe(false);
  });

  it("keeps the flag, the count and the cursor on a sub-sweep's own row, and drops the note", () => {
    expect(
      sanitizeCounts({
        candidates: 9,
        stopped_early: true,
        remaining: 4,
        [RESUME_KEY]: cursor,
        stopped_note: "a line for the note column",
      }),
    ).toEqual({
      candidates: 9,
      stopped_early: true,
      remaining: 4,
      resume_after: cursor,
    });
  });

  it("writes the run note from the count, or the sweep's own line", () => {
    expect(stoppedEarlyNote({ stopped_early: true, remaining: 1_200 })).toBe(
      "Stopped at its time budget with 1,200 left; the next run carries on.",
    );
    expect(stoppedEarlyNote({ stopped_early: true })).toBe(
      "Stopped at its time budget with work left; the next run carries on.",
    );
    expect(
      stoppedEarlyNote({
        stopped_early: true,
        stopped_note: "Listed 20 pages.",
      }),
    ).toBe("Listed 20 pages.");
    expect(stoppedEarlyNote({ remaining: 3 })).toBeUndefined();
    expect(readRemaining({ remaining: 7 })).toBe(7);
    expect(readRemaining({ remaining: "7" })).toBeNull();
  });

  it("reads a cursor off a sub-sweep's row, or off one sweep's nested tally on the parent row", () => {
    expect(cursorFrom({ [RESUME_KEY]: cursor })).toBe(cursor);
    expect(
      cursorFrom(
        { renewal_nudges: { [RESUME_KEY]: cursor } },
        "renewal_nudges",
      ),
    ).toBe(cursor);
    expect(
      cursorFrom({ renewal_nudges: { error: true } }, "renewal_nudges"),
    ).toBeNull();
    // Only a uuid is a cursor: anything else starts from the beginning.
    expect(cursorFrom({ [RESUME_KEY]: "id.gt.x,or(y)" })).toBeNull();
    expect(cursorFrom(null)).toBeNull();
    expect(cursorFrom({ [RESUME_KEY]: cursor.toUpperCase() })).toBe(cursor);
  });
});

describe("purgeRunVerdict", () => {
  it("is a clean ok with nothing to say when every sweep finished whole", () => {
    expect(
      purgeRunVerdict({
        expired_events: { events: 2 },
        orphans: { r2_deleted: 0 },
      }),
    ).toEqual({ status: "ok", note: undefined, flags: {} });
  });

  it("fails the run for a thrown sweep AND for failed rows in a sweep that rides the parent row", () => {
    const verdict = purgeRunVerdict({
      removed_media: { error: "boom" },
      renewal_nudges: { nudged: 3, rows_failed: 2 },
    });
    expect(verdict.status).toBe("error");
    expect(verdict.note).toBe(
      "Sweeps failed: removed_media. Rows failed in: renewal_nudges.",
    );
  });

  it("leaves a stopped run ok but flagged, and names what each stopped sweep left", () => {
    const verdict = purgeRunVerdict({
      removed_media: {
        media_rows: 1_000,
        stopped_early: true,
        remaining: 1_500,
      },
      orphans: { scanned_pages: 20, stopped_early: true },
      expired_events: { events: 0 },
    });
    expect(verdict).toEqual({
      status: "ok",
      note: "Stopped early, the next run carries on: removed_media (1,500 left), orphans.",
      flags: { stopped_early: true, sweeps_stopped_early: 2 },
    });
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
