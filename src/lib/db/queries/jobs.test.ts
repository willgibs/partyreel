/**
 * THE HEARTBEAT STORE'S TWO READS THE 1,000-ROW ROUND ADDED, on the PostgREST fake: where a rotating
 * sweep left off (`readSweepCursor`, off the newest finished run, a sub-sweep's own row or one sweep's
 * nested tally on the parent's), and a finished run that stopped early surfacing as `stoppedEarly`
 * (which the catalog reads as `attention`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake!),
}));

const { getJobStates, readSweepCursor } = await import("@/lib/db/queries/jobs");

const CURSOR_A = "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9";
const CURSOR_B = "1b2c3d4e-5f60-4172-8384-95a6b7c8d9ea";

function runRow(
  id: number,
  job: string,
  status: string,
  startedAt: string,
  counts: unknown,
): FakeRow {
  return {
    id: `r${id}`,
    job,
    status,
    triggered_by: "schedule",
    started_at: startedAt,
    finished_at: status === "running" ? null : startedAt,
    duration_ms: status === "running" ? null : 1_000,
    counts,
    note: null,
  };
}

beforeEach(() => {
  state.fake = null;
});

describe("readSweepCursor", () => {
  it("reads a sub-sweep's cursor off its newest finished run, past a running and a skipped one", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(
            1,
            "purge_over_capacity",
            "ok",
            "2026-09-21T04:00:00.000000+00:00",
            { resume_after: CURSOR_B },
          ),
          runRow(
            2,
            "purge_over_capacity",
            "error",
            "2026-09-22T04:00:00.000000+00:00",
            { resume_after: CURSOR_A },
          ),
          runRow(
            3,
            "purge_over_capacity",
            "skipped",
            "2026-09-22T12:00:00.000000+00:00",
            null,
          ),
          runRow(
            4,
            "purge_over_capacity",
            "running",
            "2026-09-23T04:00:00.000000+00:00",
            null,
          ),
        ],
      },
    });
    expect(await readSweepCursor("purge_over_capacity")).toBe(CURSOR_A);
  });

  it("reads a parent-row sweep's cursor out of its nested tally", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(1, "purge_cron", "ok", "2026-09-22T04:00:00.000000+00:00", {
            renewal_nudges: { nudged: 400, resume_after: CURSOR_A },
            expired_passes: { recomputed: 10 },
          }),
        ],
      },
    });
    expect(await readSweepCursor("purge_cron", "renewal_nudges")).toBe(
      CURSOR_A,
    );
    expect(await readSweepCursor("purge_cron", "expired_passes")).toBeNull();
  });

  it("starts from the beginning when the newest finished run finished its turn", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(
            1,
            "purge_inactivity",
            "ok",
            "2026-09-21T04:00:00.000000+00:00",
            { resume_after: CURSOR_A },
          ),
          runRow(
            2,
            "purge_inactivity",
            "ok",
            "2026-09-22T04:00:00.000000+00:00",
            { removed: 3 },
          ),
        ],
      },
    });
    expect(await readSweepCursor("purge_inactivity")).toBeNull();
  });

  it("throws on a failed read, which the cron turns into a fresh start and a warning", async () => {
    state.fake = createFakePostgrest({ tables: {} });
    await expect(readSweepCursor("purge_inactivity")).rejects.toThrow(
      /resume cursor/,
    );
  });
});

describe("getJobStates", () => {
  it("marks a finished run that stopped early, and only that one", async () => {
    state.fake = createFakePostgrest({
      tables: {
        job_runs: [
          runRow(1, "purge_cron", "ok", "2026-09-23T04:00:00.000000+00:00", {
            removed_media: { stopped_early: true, remaining: 12 },
            stopped_early: true,
            sweeps_stopped_early: 1,
          }),
          runRow(2, "purge_orphans", "ok", "2026-09-23T04:00:01.000000+00:00", {
            r2_deleted: 0,
          }),
        ],
      },
    });
    const states = await getJobStates();
    const cron = states.find((s) => s.job === "purge_cron");
    const orphans = states.find((s) => s.job === "purge_orphans");
    expect(cron?.lastRun?.stoppedEarly).toBe(true);
    expect(orphans?.lastRun?.stoppedEarly).toBe(false);
  });
});
