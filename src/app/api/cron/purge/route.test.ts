/**
 * THE PURGE ROUTE AS THE ORCHESTRATOR IT IS NOW (the 1,000-row round): every budgeted sweep gets a
 * deadline inside the window, the rotating ones their cursor off the last run, and the parent run
 * closes with what each stopped sweep left (flag, count, note) and never a note line's text in its
 * counts. The sweeps are stubbed here: each has its own test on the clamping fake.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

type Opts = { deadline?: { at: number }; resumeAfter?: string | null };

const state = vi.hoisted(() => ({
  finish: [] as { status: string; counts?: unknown; note?: string }[],
  opts: {} as Record<string, unknown>,
  results: {} as Record<string, unknown>,
  cursors: {} as Record<string, string | null>,
  warnings: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: {},
  assertCronEnv: () => ({ CRON_SECRET: "cron-secret" }),
}));
vi.mock("@/lib/surface", () => ({ servesApp: () => true }));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn((_area: string, message: string) => {
    state.warnings.push(message);
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    asSupabase(
      createFakePostgrest({
        tables: { unlock_attempts: [], action_attempts: [] },
      }),
    ),
}));
vi.mock("@/lib/db/queries/jobs", () => ({
  getJobFlags: vi.fn(
    async () => new Proxy({}, { get: () => true }) as Record<string, boolean>,
  ),
  getJobStates: vi.fn(async () => []),
  readSweepCursor: vi.fn(async (job: string, sweep?: string) => {
    return state.cursors[sweep ? `${job}:${sweep}` : job] ?? null;
  }),
  recordSkippedRun: vi.fn(async () => ({ heartbeatError: null })),
  startJobRun: vi.fn(async (job: string) => ({
    runId: job,
    startedAtMs: 0,
    heartbeatError: null,
  })),
  finishJobRun: vi.fn(
    async (
      run: { runId: string },
      outcome: { status: string; counts?: unknown; note?: string },
    ) => {
      state.finish.push({ ...outcome, job: run.runId } as never);
      return { heartbeatError: null };
    },
  ),
}));

function stub(name: string, argIndex: number) {
  return vi.fn(async (...args: unknown[]) => {
    state.opts[name] = args[argIndex];
    return state.results[name] ?? { ok: 0 };
  });
}

vi.mock("@/lib/lifecycle/sweeps/expired-events", () => ({
  sweepExpiredEvents: stub("expired_events", 3),
}));
vi.mock("@/lib/lifecycle/sweeps/removed-media", () => ({
  sweepRemovedMedia: stub("removed_media", 3),
}));
vi.mock("@/lib/lifecycle/account-deletion", () => ({
  sweepDeletedAccounts: stub("deleted_accounts", 3),
}));
vi.mock("@/lib/lifecycle/sweeps/orphans", () => ({
  sweepOrphans: stub("orphans", 2),
}));
vi.mock("@/lib/lifecycle/sweeps/passes", () => ({
  sweepExpiredPasses: stub("expired_passes", 2),
  sweepRenewalNudges: stub("renewal_nudges", 2),
}));
vi.mock("@/lib/lifecycle/sweeps/over-capacity", () => ({
  sweepOverCapacity: stub("over_capacity", 2),
}));
vi.mock("@/lib/lifecycle/sweeps/inactivity", () => ({
  sweepInactiveFreeEvents: stub("inactive_free_events", 2),
}));
vi.mock("@/lib/lifecycle/sweeps/standby-budget", () => ({
  sweepStandbyBudget: stub("standby_budget", 3),
}));

const { GET } = await import("@/app/api/cron/purge/route");

const BUDGETED = [
  "expired_events",
  "removed_media",
  "deleted_accounts",
  "orphans",
  "expired_passes",
  "over_capacity",
  "renewal_nudges",
  "inactive_free_events",
  "standby_budget",
];

function cron(): Request {
  return new Request("https://partyreel.test/api/cron/purge", {
    headers: { authorization: "Bearer cron-secret" },
  });
}

function parentFinish() {
  return state.finish.find(
    (f) => (f as unknown as { job: string }).job === "purge_cron",
  );
}

beforeEach(() => {
  state.finish = [];
  state.opts = {};
  state.results = {};
  state.cursors = {};
  state.warnings = [];
});

describe("GET /api/cron/purge", () => {
  it("refuses a caller without the cron bearer", async () => {
    const response = await GET(
      new Request("https://partyreel.test/api/cron/purge"),
    );
    expect(response.status).toBe(401);
  });

  it("gives every budgeted sweep a deadline inside the window, and the rotating ones their cursor", async () => {
    state.cursors = {
      purge_over_capacity: "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9",
      purge_inactivity: "1b2c3d4e-5f60-4172-8384-95a6b7c8d9ea",
      "purge_cron:expired_passes": "2c3d4e5f-6071-4283-8495-a6b7c8d9eafb",
      "purge_cron:renewal_nudges": null,
    };
    const before = Date.now();
    const response = await GET(cron());
    expect(response.status).toBe(200);

    for (const name of BUDGETED) {
      const opts = state.opts[name] as Opts | undefined;
      expect(opts?.deadline?.at, `${name} got a deadline`).toBeGreaterThan(
        before,
      );
      expect(opts?.deadline?.at).toBeLessThanOrEqual(Date.now() + 42_000);
    }
    expect((state.opts.over_capacity as Opts).resumeAfter).toBe(
      "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9",
    );
    expect((state.opts.inactive_free_events as Opts).resumeAfter).toBe(
      "1b2c3d4e-5f60-4172-8384-95a6b7c8d9ea",
    );
    expect((state.opts.expired_passes as Opts).resumeAfter).toBe(
      "2c3d4e5f-6071-4283-8495-a6b7c8d9eafb",
    );
    expect((state.opts.renewal_nudges as Opts).resumeAfter).toBeNull();
    expect(parentFinish()).toMatchObject({ status: "ok", note: undefined });
  });

  it("closes the parent run ok but flagged, naming what each stopped sweep left, with no note text in its counts", async () => {
    state.results = {
      removed_media: {
        media_rows: 1_000,
        stopped_early: true,
        remaining: 1_500,
      },
      orphans: {
        scanned_pages: 20,
        stopped_early: true,
        stopped_note: "Listed 20 pages and stopped.",
      },
      over_capacity: {
        candidates: 1_300,
        rows_failed: 0,
        rows_not_attempted: 0,
        stopped_early: true,
        remaining: 999,
        resume_after: "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9",
      },
    };
    await GET(cron());
    const parent = parentFinish();
    expect(parent?.status).toBe("ok");
    expect(parent?.note).toBe(
      "Stopped early, the next run carries on: removed_media (1,500 left), orphans, over_capacity (999 left).",
    );
    const counts = parent?.counts as Record<string, Record<string, unknown>>;
    expect(counts.stopped_early).toBe(true);
    expect(counts.sweeps_stopped_early).toBe(3);
    expect(counts.orphans).toEqual({ scanned_pages: 20, stopped_early: true });
    expect(counts.over_capacity.resume_after).toBe(
      "0a1b2c3d-4e5f-4061-8273-8495a6b7c8d9",
    );
    // One warning per stopped sweep.
    expect(
      state.warnings.filter((w) => w === "sweep_stopped_early"),
    ).toHaveLength(3);
  });

  it("fails the parent run when a sweep riding it lost rows, and keeps the failure's text out of its counts", async () => {
    state.results = {
      renewal_nudges: {
        eligible: 10,
        nudged: 8,
        rows_failed: 2,
        rows_not_attempted: 0,
        rows_note:
          "2 accounts failed, first: no such recipient someone@example.com",
      },
    };
    await GET(cron());
    const parent = parentFinish();
    expect(parent?.status).toBe("error");
    expect(parent?.note).toBe("Rows failed in: renewal_nudges.");
    expect(JSON.stringify(parent?.counts)).not.toContain("example.com");
  });
});
