/**
 * THE JOB HEARTBEAT'S ENDPOINT (admin-observability.md, "Backend jobs"): what a job that cannot reach the database is
 * told as its run starts (its switch, and for the backup prune the operator's release stamp beside it), and what is
 * raised where its report lands (a held prune: a Sentry warning and the ops mail, as the dead letters raise theirs).
 * The hold itself is the Worker's (workers/backup/src/prune-ledger.ts); this is where a person hears of it and where
 * the release they press reaches it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const RUN_ID = "11111111-2222-4333-8444-555555555555";

const jobs = vi.hoisted(() => ({
  isJobEnabled: vi.fn(),
  startJobRun: vi.fn(),
  finishJobRun: vi.fn(),
  recordSkippedRun: vi.fn(),
}));
const hold = vi.hoisted(() => ({ releasedAtMs: vi.fn() }));
const mail = vi.hoisted(() => ({ sendOnce: vi.fn() }));
const sentry = vi.hoisted(() => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: {},
  assertPruneApiEnv: () => ({ PRUNE_API_SECRET: "s3cret" }),
}));
vi.mock("@/lib/db/queries/jobs", () => jobs);
vi.mock("@/app/admin/jobs/prune-hold", () => ({
  readPruneHoldReleasedAtMs: () => hold.releasedAtMs(),
}));
vi.mock("@/lib/email/send", () => mail);
vi.mock("@/lib/observability/sentry", () => sentry);

const { POST } = await import("@/app/api/internal/job-run/route");

function call(body: unknown, auth = "Bearer s3cret") {
  return POST(
    new Request("https://partyreel.com/api/internal/job-run", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: auth },
      body: JSON.stringify(body),
    }),
  );
}

const STARTED = Date.parse("2026-10-12T06:00:00.000Z");

/** What the Worker reports for a run the hold stopped (prune-run.ts's held branch). */
const HELD_COUNTS = {
  remaining: 4_002,
  gone_media: 2_001,
  scanned: 9_000,
  mode: "live",
  hold_threshold: 2_000,
  held_since: "2026-10-12T06:00:00.000Z",
  held_media: 2_001,
  breaker_tripped: true,
};

function finish(job: string, counts: Record<string, unknown>, note?: string) {
  return call({
    phase: "finish",
    job,
    runId: RUN_ID,
    startedAtMs: STARTED,
    status: "ok",
    counts,
    note,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  jobs.isJobEnabled.mockResolvedValue(true);
  jobs.startJobRun.mockResolvedValue({
    runId: RUN_ID,
    startedAtMs: STARTED,
    heartbeatError: null,
  });
  jobs.finishJobRun.mockResolvedValue({ heartbeatError: null });
  jobs.recordSkippedRun.mockResolvedValue({ heartbeatError: null });
  hold.releasedAtMs.mockResolvedValue(null);
  mail.sendOnce.mockResolvedValue(true);
});

describe("the start answer", () => {
  it("carries the prune's release stamp beside paused", async () => {
    hold.releasedAtMs.mockResolvedValue(STARTED - 3_600_000);
    const res = await call({ phase: "start", job: "backup_prune" });
    expect(await res.json()).toEqual({
      ok: true,
      paused: false,
      runId: RUN_ID,
      startedAtMs: STARTED,
      releasedAtMs: STARTED - 3_600_000,
    });
  });

  it("answers no release when none was ever stamped", async () => {
    const res = await call({ phase: "start", job: "backup_prune" });
    expect(await res.json()).toMatchObject({ releasedAtMs: null });
  });

  it("reads no stamp for a job that cannot be held", async () => {
    const res = await call({ phase: "start", job: "backup_reconcile" });
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, paused: false, runId: RUN_ID });
    expect("releasedAtMs" in body).toBe(false);
    expect(hold.releasedAtMs).not.toHaveBeenCalled();
  });

  it("answers no release, and says so, when the stamp cannot be read: a hold then stays held", async () => {
    hold.releasedAtMs.mockRejectedValue(new Error("ops_flags unreachable"));
    const res = await call({ phase: "start", job: "backup_prune" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      paused: false,
      releasedAtMs: null,
    });
    expect(sentry.captureWarning).toHaveBeenCalledWith(
      "cron",
      "prune_hold_release_unreadable",
      expect.objectContaining({ job: "backup_prune" }),
    );
  });

  it("still answers a paused prune with its pause alone", async () => {
    jobs.isJobEnabled.mockResolvedValue(false);
    hold.releasedAtMs.mockResolvedValue(STARTED);
    const res = await call({ phase: "start", job: "backup_prune" });
    expect(await res.json()).toEqual({ ok: true, paused: true });
  });

  it("refuses a caller without the bearer", async () => {
    const res = await call(
      { phase: "start", job: "backup_prune" },
      "Bearer no",
    );
    expect(res.status).toBe(401);
    expect(jobs.startJobRun).not.toHaveBeenCalled();
  });
});

describe("a held prune raises, where its report lands", () => {
  it("★ raises a Sentry warning and the ops mail, once a run", async () => {
    const res = await finish(
      "backup_prune",
      HELD_COUNTS,
      "Held: 2,001 items gone against a usual 12 (it holds past 2,000), deleted nothing.",
    );
    expect(res.status).toBe(200);
    expect(sentry.captureWarning).toHaveBeenCalledWith(
      "cron",
      "backup_prune_held",
      expect.objectContaining({
        job: "backup_prune",
        held_media: 2_001,
        held_keys: 4_002,
        hold_threshold: 2_000,
      }),
    );
    expect(mail.sendOnce).toHaveBeenCalledTimes(1);
    const sent = mail.sendOnce.mock.calls[0][0];
    expect(sent).toMatchObject({
      kind: "prune_breaker",
      dedupeKey: "hold:2026-10-12",
    });
    expect(sent.subject).toMatch(/^\[Partyreel\] /);
    expect(sent.text).toContain("2,001");
    expect(sent.text).toMatch(/Release the hold/);
    // The row is still written, with the counts as the Worker sent them.
    expect(jobs.finishJobRun).toHaveBeenCalledTimes(1);
  });

  it("raises nothing for a run that did not hold, nor for another job's report", async () => {
    await finish("backup_prune", { deleted: 41, gone_media: 31, mode: "live" });
    await finish("backup_prune", { would_hold: true, mode: "dryrun" });
    // A run that aborted while a hold stood reports the hold, but raises nothing new: its failure is the alarm.
    await finish("backup_prune", {
      deleted: 0,
      mode: "live",
      held_since: "2026-10-12T06:00:00.000Z",
      held_media: 2_001,
    });
    await finish("backup_reconcile", { breaker_tripped: true });
    expect(sentry.captureWarning).not.toHaveBeenCalledWith(
      "cron",
      "backup_prune_held",
      expect.anything(),
    );
    expect(mail.sendOnce).not.toHaveBeenCalled();
  });

  it("never lets a failed mail cost the run its row", async () => {
    mail.sendOnce.mockRejectedValue(new Error("Resend is down"));
    const res = await finish("backup_prune", HELD_COUNTS);
    expect(res.status).toBe(200);
    expect(jobs.finishJobRun).toHaveBeenCalledTimes(1);
    expect(sentry.captureError).toHaveBeenCalledWith(
      "cron",
      expect.any(Error),
      expect.objectContaining({ job: "backup_prune", phase: "hold_alert" }),
    );
  });
});
