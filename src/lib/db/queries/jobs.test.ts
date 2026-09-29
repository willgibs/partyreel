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

const { getJobSignals, getJobStates, readSweepCursor } =
  await import("@/lib/db/queries/jobs");

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

describe("getJobSignals", () => {
  // The feedback beacon's window (help-center r1 `feedback=beacon`): the success half is its own
  // rows in the last 24 hours, the failure half the `job_runs` error rows the route writes, so the
  // console can tell "nobody answered" from "every answer was dropped".
  it("windows the help feedback signal on its own rows and its failures", async () => {
    const now = Date.parse("2026-09-28T12:00:00.000Z");
    state.fake = createFakePostgrest({
      tables: {
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        article_feedback: [
          {
            slug: "you-cant-sign-in",
            helpful: true,
            created_at: "2026-09-28T11:00:00.000000+00:00",
          },
          {
            slug: "you-cant-sign-in",
            helpful: false,
            created_at: "2026-09-28T02:00:00.000000+00:00",
          },
          {
            slug: "a-video-wont-play",
            helpful: true,
            created_at: "2026-09-26T12:00:00.000000+00:00",
          },
        ],
        job_runs: [
          runRow(
            1,
            "help_feedback",
            "error",
            "2026-09-28T10:00:00.000000+00:00",
            null,
          ),
          runRow(
            2,
            "help_feedback",
            "error",
            "2026-09-25T10:00:00.000000+00:00",
            null,
          ),
          runRow(
            3,
            "abuse_limiter",
            "error",
            "2026-09-28T10:00:00.000000+00:00",
            null,
          ),
        ],
      },
    });
    const signals = await getJobSignals(now);
    expect(signals.help_feedback).toEqual({ ok24h: 2, failed24h: 1 });
    expect(signals.abuse_limiter).toEqual({ ok24h: 0, failed24h: 1 });
  });

  it("throws when the beacon's table cannot be read, never reading it as quiet", async () => {
    state.fake = createFakePostgrest({
      tables: {
        sent_emails: [],
        action_attempts: [],
        unlock_attempts: [],
        job_runs: [],
      },
    });
    await expect(getJobSignals()).rejects.toThrow(/help feedback/);
  });
});
