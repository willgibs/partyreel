/**
 * THE SWEEP RUNNER, for a sweep its time budget stopped (the 1,000-row round): one warning per sweep
 * per run, a promoted sweep's own row closing `ok` with the stop in its note (both lines when rows also
 * failed), and nothing said about a sweep that finished whole.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({
  finish: [] as { status: string; counts?: unknown; note?: string }[],
  warnings: [] as { message: string; extra?: Record<string, unknown> }[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(
    (_area: string, message: string, extra?: Record<string, unknown>) => {
      calls.warnings.push({ message, extra });
    },
  ),
}));
vi.mock("@/lib/db/queries/jobs", () => ({
  getJobFlags: vi.fn(async () => ({
    purge_orphans: true,
    purge_deleted_accounts: true,
    purge_inactivity: true,
    purge_over_capacity: true,
    storage_sums: true,
  })),
  startJobRun: vi.fn(async () => ({
    runId: "run-1",
    startedAtMs: 0,
    heartbeatError: null,
  })),
  finishJobRun: vi.fn(
    async (
      _run: unknown,
      outcome: { status: string; counts?: unknown; note?: string },
    ) => {
      calls.finish.push(outcome);
      return { heartbeatError: null };
    },
  ),
  recordSkippedRun: vi.fn(async () => ({ heartbeatError: null })),
}));

const { createSweepRunner } = await import("@/lib/jobs/purge-sweeps");

beforeEach(() => {
  calls.finish = [];
  calls.warnings = [];
});

describe("createSweepRunner, for a sweep that stopped early", () => {
  it("closes a promoted sweep's row ok, says so in its note, keeps the count, and warns once", async () => {
    const runner = createSweepRunner("schedule");
    const result = await runner.run("over_capacity", async () => ({
      candidates: 1_300,
      rows_failed: 0,
      rows_not_attempted: 0,
      stopped_early: true,
      remaining: 999,
      resume_after: "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9",
    }));
    expect(result).toMatchObject({ stopped_early: true, remaining: 999 });
    expect(calls.finish).toEqual([
      {
        status: "ok",
        counts: {
          candidates: 1_300,
          rows_failed: 0,
          rows_not_attempted: 0,
          stopped_early: true,
          remaining: 999,
          resume_after: "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9",
        },
        note: "Stopped at its time budget with 999 left; the next run carries on.",
      },
    ]);
    expect(calls.warnings).toEqual([
      {
        message: "sweep_stopped_early",
        extra: { sweep: "over_capacity", remaining: 999 },
      },
    ]);
  });

  it("closes as an error with BOTH lines when rows failed too", async () => {
    const runner = createSweepRunner("schedule");
    await runner.run("inactive_free_events", async () => ({
      rows_failed: 2,
      rows_not_attempted: 0,
      rows_note: "2 events failed, first: boom",
      stopped_early: true,
      remaining: 40,
    }));
    expect(calls.finish).toHaveLength(1);
    expect(calls.finish[0].status).toBe("error");
    expect(calls.finish[0].note).toBe(
      "2 events failed, first: boom Stopped at its time budget with 40 left; the next run carries on.",
    );
  });

  it("warns once for a sweep that rides the parent run, and opens no row of its own", async () => {
    const runner = createSweepRunner("schedule");
    await runner.run("removed_media", async () => ({
      media_rows: 1_000,
      stopped_early: true,
      remaining: 1_500,
    }));
    expect(calls.finish).toEqual([]);
    expect(calls.warnings).toEqual([
      {
        message: "sweep_stopped_early",
        extra: { sweep: "removed_media", remaining: 1_500 },
      },
    ]);
  });

  it("says nothing about a sweep that finished whole", async () => {
    const runner = createSweepRunner("schedule");
    await runner.run("orphans", async () => ({
      scanned_pages: 1,
      r2_deleted: 0,
    }));
    await runner.run("expired_events", async () => ({ events: 0 }));
    expect(calls.warnings).toEqual([]);
    expect(calls.finish).toEqual([
      {
        status: "ok",
        counts: { scanned_pages: 1, r2_deleted: 0 },
        note: undefined,
      },
    ]);
  });
});

describe("createSweepRunner, for a sweep whose row keeps its own counts (storage-sums-signal)", () => {
  it("★ writes the row the sweep's own builder makes: the drifted hosts whole beside the flat tally, never the note", async () => {
    const { storageSumsCounts } =
      await import("@/lib/lifecycle/sweeps/storage-sums-state");
    const finding = {
      host_id: "6cb5fdb5-ac8a-4c82-83ce-59b5a2cfcd0b",
      summary_active: 1_001,
      summary_deleted: 0,
      summary_system: 0,
      walk_active: 1_000,
      walk_deleted: 0,
      walk_system: 0,
      events: 1,
      total: true,
      since: "2026-10-07T04:01:00.000Z",
    };
    const runner = createSweepRunner("schedule");
    await runner.run(
      "storage_sums",
      async () => ({
        checked: 3,
        drifted: 1,
        rows_failed: 1,
        rows_note: "1 host's storage sums differ from her items walked.",
        pass_complete: true,
        findings: [finding],
      }),
      { counts: storageSumsCounts },
    );
    expect(calls.finish).toEqual([
      {
        status: "error",
        counts: {
          checked: 3,
          drifted: 1,
          rows_failed: 1,
          pass_complete: true,
          findings: [finding],
        },
        note: "1 host's storage sums differ from her items walked.",
      },
    ]);
  });

  it("keeps every other sweep's row flat, as before", async () => {
    const runner = createSweepRunner("schedule");
    await runner.run("orphans", async () => ({
      scanned_pages: 1,
      findings: [{ host_id: "x" }],
    }));
    expect(calls.finish[0].counts).toEqual({ scanned_pages: 1 });
  });
});
