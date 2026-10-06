/**
 * THE RUN, END TO END over its edges (the job heartbeat, the reading RPC, Resend, the switches, the mail and Sentry
 * stubbed; the rules real). Red first for each direction: a quiet night is ok and silent; a new trip of downloads
 * pauses them and alerts once; a trip of uploads alerts and offers, never pauses; a reading it could not take fails
 * the run and never passes as zero; an unreadable own switch alerts without pausing; a trip that goes on never
 * re-pauses what an operator turned back on; the purge's own silence pages; and the plan limits that ride the run
 * (stubbed here: `limits-watch-run.test.ts` holds their rules) are kept in its record, fail it when a read of them
 * failed, hold it at attention when one is critical, and are never read while it is paused.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StoredReading } from "@/lib/jobs/spend-watch";

const NOW = new Date("2026-10-03T05:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ── edges ──────────────────────────────────────────────────────────────────────────────────────────
const getJobFlags = vi.fn();
const startJobRun = vi.fn();
const finishJobRun = vi.fn();
const recordSkippedRun = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries/jobs", () => ({
  getJobFlags: () => getJobFlags(),
  startJobRun: (...a: unknown[]) => startJobRun(...a),
  finishJobRun: (...a: unknown[]) => finishJobRun(...a),
  recordSkippedRun: (...a: unknown[]) => recordSkippedRun(...a),
}));

let historyRows: { started_at: string; counts: unknown }[] = [];
let historyError: { message: string } | null = null;
let purgeLast: {
  status: string;
  started_at: string;
  finished_at: string;
} | null;
const rpc = vi.fn();
function chain(select: string) {
  const builder: Record<string, unknown> = {};
  for (const op of ["eq", "in", "gte", "order", "limit", "not"]) {
    builder[op] = () => builder;
  }
  builder.maybeSingle = () => Promise.resolve({ data: purgeLast, error: null });
  builder.then = (resolve: (r: unknown) => unknown) =>
    Promise.resolve(
      select.includes("counts")
        ? { data: historyError ? null : historyRows, error: historyError }
        : { data: [], error: null },
    ).then(resolve);
  return builder;
}
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ select: (s: string) => chain(s) }),
    rpc: (...a: unknown[]) => rpc(...a),
  }),
}));

const readResendDay = vi.fn();
vi.mock("@/lib/jobs/spend-watch-resend", () => ({
  readResendDay: (...a: unknown[]) => readResendDay(...a),
}));
const readSwitches = vi.fn();
const pauseSwitch = vi.fn();
vi.mock("@/lib/jobs/spend-watch-switches", () => ({
  readSwitches: () => readSwitches(),
  pauseSwitch: (...a: unknown[]) => pauseSwitch(...a),
}));
const sendOnce = vi.fn();
vi.mock("@/lib/email/send", () => ({
  sendOnce: (...a: unknown[]) => sendOnce(...a),
}));
const captureError = vi.fn();
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captureError(...a),
  captureWarning: (...a: unknown[]) => captureWarning(...a),
}));
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/auth/admin-host", () => ({ ADMIN_HOST: "admin.partyreel.com" }));

// The plan limits ride the run; their own rules are tested in limits-watch-run.test.ts, so here they are an edge.
const runLimitsWatch = vi.fn();
vi.mock("@/lib/jobs/limits-watch-run", () => ({
  runLimitsWatch: (...a: unknown[]) => runLimitsWatch(...a),
  adminJobsUrl: (anchor: string) =>
    `https://admin.partyreel.com/admin/jobs#${anchor}`,
}));

// The change-plan configuration rides the run too (billing-orphans); its own rules are tested in
// change-plan-watch-run.test.ts, so here it is an edge.
const runChangePlanWatch = vi.fn();
vi.mock("@/lib/jobs/change-plan-watch-run", () => ({
  runChangePlanWatch: (...a: unknown[]) => runChangePlanWatch(...a),
}));
const wholeChangePlan = {
  stored: { state: "whole", configuration_id: "bpc_test", sold: 6 },
  attention: false,
  failed: false,
  note: null,
};

const { runSpendWatch } = await import("@/lib/jobs/spend-watch-run");

// ── fixtures ───────────────────────────────────────────────────────────────────────────────────────
const LEDGER_THEN = { "2026-10": [1_000_000_000, 800] };
const quietDb = {
  ledger: { "2026-10": [1_200_000_000, 830] },
  album: 1_500,
  lifecycle_mail: 1,
  sign_ins: 2,
  downloads: 3,
  purge_runs: 1,
  drive_bytes: 0,
  errors: {},
};

/** A past run of the watch, as `runCounts` would have written it. */
function pastRun(
  agoMs: number,
  readings: Record<string, StoredReading>,
  extra: Record<string, unknown> = {},
) {
  const at = new Date(NOW.getTime() - agoMs).toISOString();
  return {
    started_at: at,
    counts: {
      tripped: 0,
      missing: 0,
      paused: 0,
      window: { from: null, to: at },
      readings,
      snap: { ledger: LEDGER_THEN, album: 1_400 },
      paused_at: {},
      ...extra,
    },
  };
}

const allOn = {
  uploads_enabled: { enabled: true, updatedAtMs: null },
  lifecycle_mail_enabled: { enabled: true, updatedAtMs: null },
  export_enabled: { enabled: true, updatedAtMs: NOW.getTime() - 9 * DAY },
  purge_cron_enabled: { enabled: true, updatedAtMs: NOW.getTime() - 9 * DAY },
};

function finished() {
  expect(finishJobRun).toHaveBeenCalledTimes(1);
  return finishJobRun.mock.calls[0][1] as {
    status: string;
    counts: Record<string, unknown>;
    note?: string;
  };
}

/** What the plan limits' step answers on a quiet night: a record, nothing past a threshold, nothing failed. */
const quietLimits = {
  stored: { at: NOW.toISOString(), meters: {} },
  warn: [],
  critical: [],
  failed: [],
  gaps: [],
  mailed: [],
  problem: false,
  notes: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  runLimitsWatch.mockResolvedValue(quietLimits);
  runChangePlanWatch.mockResolvedValue(wholeChangePlan);
  getJobFlags.mockResolvedValue({ spend_watch: true, purge_cron: true });
  startJobRun.mockResolvedValue({
    runId: "run-1",
    startedAtMs: NOW.getTime(),
    heartbeatError: null,
  });
  finishJobRun.mockResolvedValue({ heartbeatError: null });
  recordSkippedRun.mockResolvedValue({ heartbeatError: null });
  historyRows = [pastRun(DAY, { downloads: { state: "ok", value: 5 } })];
  historyError = null;
  purgeLast = {
    status: "ok",
    started_at: new Date(NOW.getTime() - 25 * HOUR).toISOString(),
    finished_at: new Date(NOW.getTime() - 25 * HOUR).toISOString(),
  };
  rpc.mockResolvedValue({ data: quietDb, error: null });
  readResendDay.mockResolvedValue({ ok: true, count: 6, atLeast: false });
  readSwitches.mockResolvedValue(allOn);
  pauseSwitch.mockImplementation(async (_key: string, at: Date) =>
    at.toISOString(),
  );
  sendOnce.mockResolvedValue(true);
});

describe("a quiet night", () => {
  it("closes ok, carries no breaker flag, pauses nothing and tells nobody", async () => {
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome).toMatchObject({
      status: "ok",
      tripped: [],
      missing: [],
      paused: [],
    });
    const run = finished();
    expect(run.status).toBe("ok");
    expect(run.counts).not.toHaveProperty("breaker_tripped");
    // The counters measured the day since the last reading: 30 uploads over 24 hours.
    expect(run.counts.readings).toMatchObject({
      uploads: { state: "ok", value: 1.25 },
      downloads: { state: "ok", value: 3, peak: 5 },
    });
    expect(rpc).toHaveBeenCalledWith("spend_watch_readings", {
      p_now: NOW.toISOString(),
      p_lifecycle_kinds: expect.arrayContaining([
        "inactivity_warning",
        "over_cap_reduced",
      ]),
    });
    expect(pauseSwitch).not.toHaveBeenCalled();
    expect(sendOnce).not.toHaveBeenCalled();
    expect(captureError).not.toHaveBeenCalled();
  });

  it("logs a skipped run while it is paused, and reads nothing", async () => {
    getJobFlags.mockResolvedValue({ spend_watch: false, purge_cron: true });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.status).toBe("skipped");
    expect(recordSkippedRun).toHaveBeenCalledWith(
      "spend_watch",
      "schedule",
      "Paused from /admin/jobs.",
    );
    expect(startJobRun).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(runLimitsWatch).not.toHaveBeenCalled();
  });
});

describe("the plan limits that ride the run", () => {
  it("keeps their record in the run's counts, beside the readings, and reads them once", async () => {
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(runLimitsWatch).toHaveBeenCalledTimes(1);
    expect(runLimitsWatch).toHaveBeenCalledWith({
      admin: expect.anything(),
      now: NOW,
    });
    const run = finished();
    expect(run.counts.limits).toEqual(quietLimits.stored);
    expect(run.counts).toHaveProperty("readings");
    expect(outcome.limits).toEqual({ warn: [], critical: [], failed: [] });
    expect(run.status).toBe("ok");
    expect(run.counts).not.toHaveProperty("breaker_tripped");
  });

  it("★ holds the run at attention (the bell) for a critical meter, though nothing tripped and nothing failed", async () => {
    runLimitsWatch.mockResolvedValue({
      ...quietLimits,
      critical: ["vercel_active_cpu"],
      warn: ["vercel_cdn_requests"],
      mailed: ["vercel_active_cpu", "vercel_cdn_requests"],
      notes: [
        "Plan limits critical: Vercel Active CPU.",
        "Plan limits warning: Vercel CDN requests.",
      ],
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    const run = finished();
    expect(run.status).toBe("ok");
    expect(run.counts).toMatchObject({ breaker_tripped: true, tripped: 0 });
    expect(run.note).toBe(
      "Plan limits critical: Vercel Active CPU. Plan limits warning: Vercel CDN requests.",
    );
    expect(outcome.limits?.critical).toEqual(["vercel_active_cpu"]);
    // A warning alone is the card and the mail, never the bell.
    runLimitsWatch.mockResolvedValue({
      ...quietLimits,
      warn: ["vercel_cdn_requests"],
      notes: ["Plan limits warning: Vercel CDN requests."],
    });
    vi.mocked(finishJobRun).mockClear();
    await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(finished().counts).not.toHaveProperty("breaker_tripped");
  });

  it("★ fails the run, with the words, when a read of a meter failed, and when the step itself had a problem", async () => {
    runLimitsWatch.mockResolvedValue({
      ...quietLimits,
      failed: ["vercel_invocations"],
      notes: ["No plan-limits reading: Vercel Function invocations."],
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.status).toBe("error");
    expect(finished().note).toBe(
      "No plan-limits reading: Vercel Function invocations.",
    );

    vi.mocked(finishJobRun).mockClear();
    runLimitsWatch.mockResolvedValue({
      ...quietLimits,
      problem: true,
      stored: null,
      notes: [
        "The plan limits' mail could not be sent: it is tried again next run.",
      ],
    });
    const second = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(second.status).toBe("error");
    // A step that kept no record leaves the run's own readings whole.
    expect(finished().counts).not.toHaveProperty("limits");
    expect(finished().counts).toHaveProperty("readings");
  });

  it("is never a reason to skip the spend watch's own trips: a trip is judged and paused beside it", async () => {
    runLimitsWatch.mockResolvedValue({
      ...quietLimits,
      failed: ["resend_month"],
      problem: true,
    });
    rpc.mockResolvedValue({
      data: { ...quietDb, downloads: 900 },
      error: null,
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.tripped).toEqual(["downloads"]);
    expect(pauseSwitch).toHaveBeenCalledWith("export_enabled", NOW);
  });
});

describe("the change-plan configuration that rides the run (billing-orphans)", () => {
  it("keeps its record beside the readings, quiet when it lists every Pro price", async () => {
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(runChangePlanWatch).toHaveBeenCalledWith({ now: NOW });
    const run = finished();
    expect(run.counts.change_plan).toEqual(wholeChangePlan.stored);
    expect(run.status).toBe("ok");
    expect(run.counts).not.toHaveProperty("breaker_tripped");
    expect(outcome.changePlan).toBe("whole");
  });

  it("★ a price missing holds the run at attention (the bell) and its note names the price", async () => {
    const note =
      "Change plan in Stripe: the tagged configuration (bpc_test) lacks Pro 50 GB, $90/yr (price_50y), so Stripe refuses a switch to it.";
    runChangePlanWatch.mockResolvedValue({
      stored: {
        state: "missing",
        configuration_id: "bpc_test",
        sold: 6,
        missing: [
          {
            plan_id: "pro_50_yr",
            label: "Pro 50 GB, $90/yr",
            price_id: "price_50y",
          },
        ],
      },
      attention: true,
      failed: false,
      note,
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    const run = finished();
    expect(run.status).toBe("ok");
    expect(run.counts).toMatchObject({ breaker_tripped: true, tripped: 0 });
    expect(run.note).toBe(note);
    expect(outcome.changePlan).toBe("missing");
  });

  it("★ a check that could not run fails the run, with its words", async () => {
    runChangePlanWatch.mockResolvedValue({
      stored: { state: "unread", message: "Stripe timed out" },
      attention: false,
      failed: true,
      note: "Change plan in Stripe: no reading (Stripe timed out).",
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.status).toBe("error");
    expect(finished().note).toBe(
      "Change plan in Stripe: no reading (Stripe timed out).",
    );
    expect(finished().counts).not.toHaveProperty("breaker_tripped");
  });

  it("is never read while the watch is paused", async () => {
    getJobFlags.mockResolvedValue({ spend_watch: false, purge_cron: true });
    await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(runChangePlanWatch).not.toHaveBeenCalled();
  });
});

describe("a trip", () => {
  it("★ pauses downloads on a new trip, alerts once (Sentry and the ops mail), and reads attention", async () => {
    rpc.mockResolvedValue({
      data: { ...quietDb, downloads: 900 },
      error: null,
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome).toMatchObject({
      tripped: ["downloads"],
      paused: ["export_enabled"],
    });
    expect(pauseSwitch).toHaveBeenCalledWith("export_enabled", NOW);
    expect(captureError).toHaveBeenCalledWith(
      "cron",
      expect.objectContaining({ message: "spend watch tripped: downloads" }),
      expect.objectContaining({ paused: ["export_enabled"] }),
    );
    expect(sendOnce).toHaveBeenCalledTimes(1);
    const mail = sendOnce.mock.calls[0][0] as {
      kind: string;
      dedupeKey: string;
      subject: string;
      text: string;
    };
    expect(mail.kind).toBe("spend_watch");
    expect(mail.dedupeKey).toBe("downloads:2026-10-03");
    expect(mail.subject).toBe(
      "[Partyreel] Spend watch: download all past the ceiling",
    );
    expect(mail.text).toContain(
      "Download all: 900 a day (ceiling 100, its floor)",
    );
    expect(mail.text).toContain("Paused on its own: Download all.");
    expect(mail.text).toContain(
      "https://admin.partyreel.com/admin/jobs#job-spend_watch",
    );
    const run = finished();
    expect(run.status).toBe("ok");
    expect(run.counts).toMatchObject({
      tripped: 1,
      paused: 1,
      breaker_tripped: true,
      paused_at: { export_enabled: NOW.toISOString() },
    });
    expect(run.note).toBe(
      "Past the ceiling: Download all. Paused: Download all.",
    );
  });

  it("★ never pauses guest uploads: it alerts and leaves the switch for a person", async () => {
    rpc.mockResolvedValue({
      data: {
        ...quietDb,
        ledger: { "2026-10": [1_000_000_000 + 300 * 1024 ** 3, 800 + 48_000] },
      },
      error: null,
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.tripped).toEqual(["uploads", "upload_bytes"]);
    expect(outcome.paused).toEqual([]);
    expect(outcome.offered).toEqual(["uploads_enabled"]);
    expect(pauseSwitch).not.toHaveBeenCalled();
    const mail = sendOnce.mock.calls[0][0] as { text: string };
    expect(mail.text).toContain("Left for you: Guest uploads.");
    expect(finished().counts).toMatchObject({
      breaker_tripped: true,
      paused: 0,
    });
  });

  it("does not pause again while the same trip goes on (an operator's resume wins)", async () => {
    historyRows = [
      pastRun(HOUR * 2, { downloads: { state: "tripped", value: 800 } }),
      pastRun(DAY, { downloads: { state: "ok", value: 5 } }),
    ];
    rpc.mockResolvedValue({
      data: { ...quietDb, downloads: 900 },
      error: null,
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.tripped).toEqual(["downloads"]);
    expect(pauseSwitch).not.toHaveBeenCalled();
    // Still told: the mail's claim keeps it to one a day.
    expect(sendOnce).toHaveBeenCalledTimes(1);
  });

  it("alerts without pausing anything when its own switch cannot be read", async () => {
    getJobFlags.mockRejectedValue(new Error("ops_flags: connection reset"));
    rpc.mockResolvedValue({
      data: { ...quietDb, purge_runs: 40 },
      error: null,
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.tripped).toEqual(["purge_runs"]);
    expect(pauseSwitch).not.toHaveBeenCalled();
    expect(outcome.offered).toEqual(["purge_cron_enabled"]);
    expect(finished().note).toContain(
      "Its switch could not be read, so it paused nothing.",
    );
  });

  it("fails the run when a pause could not be written, and says which", async () => {
    rpc.mockResolvedValue({
      data: { ...quietDb, lifecycle_mail: 400 },
      error: null,
    });
    pauseSwitch.mockRejectedValue(
      new Error("pause lifecycle_mail_enabled: deadlock"),
    );
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.status).toBe("error");
    const mail = sendOnce.mock.calls[0][0] as { text: string };
    expect(mail.text).toContain(
      "Could not pause: Lifecycle mail. Pause it by hand.",
    );
    expect(finished().note).toContain("Could not pause: Lifecycle mail.");
  });

  it("keeps a pause of its own on the card until a person touches the switch", async () => {
    const pausedAt = "2026-10-02T05:00:00.000Z";
    historyRows = [
      pastRun(
        DAY,
        { downloads: { state: "tripped", value: 900 } },
        { paused_at: { export_enabled: pausedAt } },
      ),
    ];
    readSwitches.mockResolvedValue({
      ...allOn,
      export_enabled: { enabled: false, updatedAtMs: Date.parse(pausedAt) },
    });
    await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(finished().counts).toMatchObject({
      tripped: 0,
      paused: 1,
      breaker_tripped: true,
      paused_at: { export_enabled: pausedAt },
    });
  });
});

describe("guest uploads off", () => {
  it("★ keeps ringing while a person's pause of guest uploads stands, and says so", async () => {
    readSwitches.mockResolvedValue({
      ...allOn,
      uploads_enabled: { enabled: false, updatedAtMs: NOW.getTime() - 3 * DAY },
    });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.status).toBe("ok");
    const run = finished();
    expect(run.counts).toMatchObject({
      uploads_paused: true,
      breaker_tripped: true,
    });
    expect(run.note).toBe(
      "Guest uploads are paused: every guest is refused until a person turns them back on.",
    );
  });
});

describe("a reading it could not take", () => {
  it("★ fails the run and never passes the readings as zero when the reading RPC is missing", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: "Could not find the function public.spend_watch_readings",
      },
    });
    const outcome = await runSpendWatch({ trigger: "manual", now: NOW });
    expect(outcome.status).toBe("error");
    expect(outcome.missing).toEqual([
      "uploads",
      "upload_bytes",
      "album_changes",
      "lifecycle_mail",
      "sign_ins",
      "downloads",
      "purge_runs",
      "drive_bytes",
    ]);
    expect(outcome.tripped).toEqual([]);
    const run = finished();
    expect(run.status).toBe("error");
    expect(run.counts.readings).toMatchObject({
      downloads: {
        state: "missing",
        value: null,
        why: "Could not find the function public.spend_watch_readings",
      },
      resend_mail: { state: "ok", value: 6 },
    });
    expect(run.note).toContain(
      "No reading: Uploads, Bytes uploaded, Album changes",
    );
    // No baseline is written for a counter it did not read.
    expect(run.counts.snap).toEqual({});
  });

  it("fails the run when its own week could not be read, and judges against the floors", async () => {
    historyError = { message: "statement timeout" };
    rpc.mockResolvedValue({ data: { ...quietDb, downloads: 99 }, error: null });
    const outcome = await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(outcome.status).toBe("error");
    expect(outcome.tripped).toEqual([]);
    expect(finished().counts.readings).toMatchObject({
      downloads: { state: "ok", value: 99, ceiling: 100, basis: "floor" },
      uploads: { state: "warming" },
    });
  });
});

describe("who watches the watchman", () => {
  it("★ raises the purge cron's missed run, in the purge scan's own words", async () => {
    purgeLast = {
      status: "ok",
      started_at: new Date(NOW.getTime() - 3 * DAY).toISOString(),
      finished_at: new Date(NOW.getTime() - 3 * DAY).toISOString(),
    };
    await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(captureWarning).toHaveBeenCalledWith(
      "cron",
      "job_missed_run",
      expect.objectContaining({ job: "purge_cron", seen_by: "spend_watch" }),
    );
  });

  it("stays quiet about a purge that ran last night, or one paused on purpose", async () => {
    await runSpendWatch({ trigger: "schedule", now: NOW });
    getJobFlags.mockResolvedValue({ spend_watch: true, purge_cron: false });
    purgeLast = {
      status: "skipped",
      started_at: new Date(NOW.getTime() - 9 * DAY).toISOString(),
      finished_at: new Date(NOW.getTime() - 9 * DAY).toISOString(),
    };
    await runSpendWatch({ trigger: "schedule", now: NOW });
    expect(captureWarning).not.toHaveBeenCalledWith(
      "cron",
      "job_missed_run",
      expect.anything(),
    );
  });
});
