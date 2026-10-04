/**
 * THE PLAN LIMITS' RUN over its edges (the history, the readers, the mail and Sentry stubbed; the rules real). Red
 * first for each direction: a quiet night is silent and keeps a record of every meter; a first run that finds CPU
 * critical and CDN requests warning mails ONE message naming both and is told; a meter already told is never mailed
 * again; a history it could not read holds the mail and says so; a mail that failed is tried again next run; a read
 * that FAILED fails the run while a gap (a token not provisioned, a migration not applied) does not; and nothing it
 * meets ever throws out of the spend watch's run.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  dayKey,
  parseStoredLimits,
  storedLimits,
  assessAll,
} from "@/lib/jobs/limits-watch";
import type { MeterTaken } from "@/lib/jobs/limits-watch";
import { METERS, type MeterId } from "@/lib/jobs/limits-watch-limits";

const NOW = new Date("2026-10-04T05:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: {
    VERCEL_USAGE_TOKEN: "tok_test",
    CONTACT_NOTIFY_EMAIL: "ops@example.com",
  },
}));
vi.mock("@/lib/auth/admin-host", () => ({ ADMIN_HOST: "admin.partyreel.com" }));
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
// The console's read builds its own client: it is handed the same fake as the run's.
const adminRef = vi.hoisted(() => ({ current: {} as unknown }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminRef.current,
}));
const readVercelUsage = vi.fn();
vi.mock("@/lib/jobs/limits-watch-vercel", () => ({
  readVercelUsage: (...a: unknown[]) => readVercelUsage(...a),
}));
const readResendMeters = vi.fn();
vi.mock("@/lib/jobs/limits-watch-resend", () => ({
  readResendMeters: (...a: unknown[]) => readResendMeters(...a),
}));

const { runLimitsWatch, readLimitsHistory, readLatestLimits, adminJobsUrl } =
  await import("@/lib/jobs/limits-watch-run");

// ── fixtures ───────────────────────────────────────────────────────────────────────────────────────

/** Thirty-one ascending UTC days ending at NOW's, each the same amount. */
function days(value: number): MeterTaken {
  return {
    kind: "days",
    days: Array.from({ length: 31 }, (_, i) => ({
      day: dayKey(NOW.getTime() - (30 - i) * DAY),
      value,
    })),
  };
}

/** A quiet team: every Vercel meter well under its limit and steady. */
function quietVercel(over: Record<string, MeterTaken> = {}) {
  return {
    vercel_active_cpu: days(1_000 * 0.044), // 1,364 s of 14,400: 9%
    vercel_invocations: days(1_000),
    vercel_fast_data: days(0.2e9),
    vercel_cdn_requests: days(5_000),
    ...over,
  };
}

const quietResend = { resend_month: days(2), resend_day: days(2) };

let historyRows:
  | { started_at: string; status?: string; limits: unknown }[]
  | { message: string };
const rpcCalls: [string, unknown][] = [];
let readingsAnswer: {
  data: unknown;
  error: { message: string; code?: string } | null;
};
let signInsAnswer: { data: unknown; error: { message: string } | null };

function chain() {
  const b: Record<string, unknown> = {};
  for (const op of ["select", "eq", "in", "gte", "order", "limit"])
    b[op] = () => b;
  b.then = (resolve: (r: unknown) => unknown) =>
    Promise.resolve(
      "message" in (historyRows as object) && !Array.isArray(historyRows)
        ? { data: null, error: historyRows }
        : { data: historyRows, error: null },
    ).then(resolve);
  return b;
}
const admin = {
  from: () => chain(),
  rpc: (name: string, args?: unknown) => {
    rpcCalls.push([name, args]);
    return Promise.resolve(
      name === "spend_watch_sign_ins" ? signInsAnswer : readingsAnswer,
    );
  },
} as never;
adminRef.current = admin;

/** A past run's limits block, as the run would have stored it, `agoMs` before NOW. */
function pastBlock(
  agoMs: number,
  told: Partial<Record<MeterId, "ok" | "warn" | "critical">>,
) {
  const at = NOW.getTime() - agoMs;
  const assessed = assessAll(
    Object.fromEntries(
      METERS.map((m) => [m.id, { kind: "gauge", used: 1 } as MeterTaken]),
    ),
    { nowMs: at },
  );
  // Only the gauge meters accept a gauge: the rest become failed reads, which is fine for a told record.
  return {
    started_at: new Date(at).toISOString(),
    limits: storedLimits({ nowMs: at, assessed, told, toldKnown: true }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  rpcCalls.length = 0;
  historyRows = [];
  readingsAnswer = {
    data: { db_bytes: 25_000_000, media_bytes: 870_000_000, errors: {} },
    error: null,
  };
  signInsAnswer = { data: 3, error: null };
  readVercelUsage.mockResolvedValue(quietVercel());
  readResendMeters.mockResolvedValue(quietResend);
  sendOnce.mockResolvedValue(true);
});

const run = () => runLimitsWatch({ admin, now: NOW });

describe("a quiet night", () => {
  it("is silent, keeps a record of every meter, and calls the Vercel API with the env's token", async () => {
    const out = await run();
    expect(sendOnce).not.toHaveBeenCalled();
    expect(captureError).not.toHaveBeenCalled();
    expect(out).toMatchObject({
      warn: [],
      critical: [],
      failed: [],
      mailed: [],
      problem: false,
      notes: [],
    });
    expect(readVercelUsage).toHaveBeenCalledWith("tok_test", NOW.getTime());
    const block = parseStoredLimits(out.stored);
    expect(Object.keys(block?.meters ?? {}).sort()).toEqual(
      METERS.map((m) => m.id).sort(),
    );
    expect(block?.meters.vercel_invocations).toMatchObject({
      state: "read",
      level: "ok",
      told: "ok",
    });
    // The database meters: the bucket's bytes and the month's accounts are floors.
    expect(block?.meters.supabase_db_size).toMatchObject({
      state: "read",
      used: 25_000_000,
      atLeast: false,
    });
    expect(block?.meters.r2_storage).toMatchObject({
      state: "read",
      used: 870_000_000,
      atLeast: true,
    });
    expect(block?.meters.supabase_mau).toMatchObject({
      state: "read",
      used: 3,
      atLeast: true,
    });
    expect(rpcCalls.map((c) => c[0]).sort()).toEqual([
      "limits_watch_readings",
      "spend_watch_sign_ins",
    ]);
  });

  it("★ leaves the meters nothing can answer as gaps that say why, and does not fail on them", async () => {
    const out = await run();
    expect(out.problem).toBe(false);
    expect(out.failed).toEqual([]);
    expect(out.gaps.sort()).toEqual(
      [
        "vercel_fast_origin",
        "vercel_image_transforms",
        "supabase_egress",
        "supabase_realtime",
        "r2_class_a",
        "r2_class_b",
        "workers_requests",
      ].sort(),
    );
    const block = parseStoredLimits(out.stored);
    expect(block?.meters.supabase_egress).toMatchObject({
      state: "none",
      cause: "needs",
    });
    expect(block?.meters.vercel_fast_origin).toMatchObject({
      state: "none",
      cause: "unavailable",
    });
  });
});

describe("★ a crossing is mailed once", () => {
  const crossed = () =>
    readVercelUsage.mockResolvedValue(
      quietVercel({
        vercel_active_cpu: days(14_110 / 31),
        vercel_cdn_requests: days(741_697 / 31),
      }),
    );

  it("mails ONE message for a first run's two crossings, to the ops inbox, and is told of both", async () => {
    crossed();
    const out = await run();
    expect(sendOnce).toHaveBeenCalledTimes(1);
    const mail = sendOnce.mock.calls[0][0] as Record<string, string>;
    expect(mail.kind).toBe("spend_watch");
    expect(mail.to).toBe("ops@example.com");
    expect(mail.dedupeKey).toBe(
      "limits:2026-10-04:vercel_active_cpu:critical+vercel_cdn_requests:warn",
    );
    expect(mail.subject).toBe(
      "[Partyreel] Plan limits: Vercel Active CPU critical, Vercel CDN requests warning",
    );
    expect(mail.text).toContain(
      "https://admin.partyreel.com/admin/jobs#plan-limits",
    );
    expect(out.mailed.sort()).toEqual([
      "vercel_active_cpu",
      "vercel_cdn_requests",
    ]);
    expect(out.critical).toEqual(["vercel_active_cpu"]);
    expect(out.warn).toEqual(["vercel_cdn_requests"]);
    expect(out.notes[0]).toBe("Plan limits critical: Vercel Active CPU.");
    expect(out.notes).toContain("Plan limits warning: Vercel CDN requests.");
    expect(out.problem).toBe(false);
    const block = parseStoredLimits(out.stored);
    expect(block?.meters.vercel_active_cpu).toMatchObject({
      level: "critical",
      told: "critical",
    });
    expect(block?.meters.vercel_cdn_requests).toMatchObject({
      level: "warn",
      told: "warn",
    });
    expect(captureWarning).toHaveBeenCalledWith(
      "cron",
      "plan_limits_crossed",
      expect.objectContaining({ job: "spend_watch" }),
    );
  });

  it("mails nothing again for a meter the last record says it told, and only the rise of one that grew", async () => {
    crossed();
    historyRows = [
      pastBlock(DAY, {
        vercel_active_cpu: "critical",
        vercel_cdn_requests: "warn",
      }),
    ];
    const out = await run();
    expect(sendOnce).not.toHaveBeenCalled();
    expect(out.mailed).toEqual([]);
    // Still critical and still warning: the card and the bell say so, only the mail is quiet.
    expect(out.critical).toEqual(["vercel_active_cpu"]);

    // CDN requests grew from a warning to critical: that crossing is new.
    readVercelUsage.mockResolvedValue(
      quietVercel({ vercel_cdn_requests: days(30_000) }),
    );
    historyRows = [pastBlock(DAY, { vercel_cdn_requests: "warn" })];
    const rise = await run();
    expect(sendOnce).toHaveBeenCalledTimes(1);
    expect(sendOnce.mock.calls[0][0].dedupeKey).toBe(
      "limits:2026-10-04:vercel_cdn_requests:critical",
    );
    expect(rise.mailed).toEqual(["vercel_cdn_requests"]);
  });

  it("★ holds the mail, and says so, when the history could not be read, and keeps no told in the record", async () => {
    crossed();
    historyRows = { message: "connection reset" };
    const out = await run();
    expect(sendOnce).not.toHaveBeenCalled();
    expect(out.problem).toBe(true);
    expect(out.notes).toContain(
      "The plan limits' history could not be read, so no crossing was mailed.",
    );
    expect(out.notes).toContain(
      "A plan limit is past a threshold, but its mail is held until the history can be read.",
    );
    expect(captureError).toHaveBeenCalledWith("cron", expect.anything(), {
      job: "spend_watch",
      phase: "limits_history",
    });
    expect(
      parseStoredLimits(out.stored)?.meters.vercel_active_cpu?.told,
    ).toBeUndefined();
  });

  it("★ is told only what went: a mail that fails is tried again next run", async () => {
    crossed();
    sendOnce.mockRejectedValueOnce(
      new Error("resend send (spend_watch): rate limited"),
    );
    const out = await run();
    expect(out.problem).toBe(true);
    expect(out.mailed).toEqual([]);
    expect(out.notes).toContain(
      "The plan limits' mail could not be sent: it is tried again next run.",
    );
    expect(captureError).toHaveBeenCalledWith("cron", expect.anything(), {
      job: "spend_watch",
      phase: "limits_mail",
    });
    const block = parseStoredLimits(out.stored);
    expect(block?.meters.vercel_active_cpu).toMatchObject({
      level: "critical",
      told: "ok",
    });

    // The next night reads that record, so the crossing is still new.
    historyRows = [
      {
        started_at: new Date(NOW.getTime() - DAY).toISOString(),
        limits: out.stored,
      },
    ];
    const again = await run();
    expect(sendOnce).toHaveBeenCalledTimes(2);
    expect(again.mailed).toContain("vercel_active_cpu");
  });
});

describe("★ a read that failed fails the run; a gap does not", () => {
  it("lists a failed Vercel read as four failed meters, with a Sentry warning", async () => {
    const failed: MeterTaken = {
      kind: "none",
      cause: "failed",
      why: "Vercel refused the token (HTTP 403): mint a new VERCEL_USAGE_TOKEN",
    };
    readVercelUsage.mockResolvedValue({
      vercel_active_cpu: failed,
      vercel_invocations: failed,
      vercel_fast_data: failed,
      vercel_cdn_requests: failed,
    });
    const out = await run();
    expect(out.failed.sort()).toEqual([
      "vercel_active_cpu",
      "vercel_cdn_requests",
      "vercel_fast_data",
      "vercel_invocations",
    ]);
    expect(out.notes).toContain(
      "No plan-limits reading: Vercel Active CPU, Vercel Function invocations, Vercel Fast Data Transfer, Vercel CDN requests.",
    );
    expect(captureWarning).toHaveBeenCalledWith(
      "cron",
      "plan_limits_read_failed",
      expect.objectContaining({
        meters: expect.objectContaining({
          vercel_active_cpu: expect.stringMatching(/HTTP 403/),
        }),
      }),
    );
    expect(sendOnce).not.toHaveBeenCalled();
  });

  it("is a gap, not a failure, with no Vercel token provisioned or the migration not applied", async () => {
    const needs: MeterTaken = {
      kind: "none",
      cause: "needs",
      why: "Not wired: set VERCEL_USAGE_TOKEN",
    };
    readVercelUsage.mockResolvedValue({
      vercel_active_cpu: needs,
      vercel_invocations: needs,
      vercel_fast_data: needs,
      vercel_cdn_requests: needs,
    });
    readingsAnswer = {
      data: null,
      error: {
        message: "Could not find the function public.limits_watch_readings",
        code: "PGRST202",
      },
    };
    const out = await run();
    expect(out.failed).toEqual([]);
    expect(out.problem).toBe(false);
    expect(out.gaps).toEqual(
      expect.arrayContaining([
        "vercel_active_cpu",
        "supabase_db_size",
        "r2_storage",
      ]),
    );
    const block = parseStoredLimits(out.stored);
    expect(block?.meters.supabase_db_size).toMatchObject({
      state: "none",
      cause: "needs",
    });
    expect(
      block?.meters.supabase_db_size?.state === "none" &&
        block.meters.supabase_db_size.why,
    ).toMatch(/migration is not applied/);
  });

  it("fails one database section alone and answers the other", async () => {
    readingsAnswer = {
      data: {
        db_bytes: 25_000_000,
        errors: { media_bytes: "permission denied for table media" },
      },
      error: null,
    };
    const out = await run();
    expect(out.failed).toEqual(["r2_storage"]);
    const block = parseStoredLimits(out.stored);
    expect(block?.meters.supabase_db_size).toMatchObject({ state: "read" });
    expect(block?.meters.r2_storage).toMatchObject({
      state: "none",
      cause: "failed",
    });
  });

  it("fails the database meters, with the database's own words, on any other error, and the sign-ins alone", async () => {
    readingsAnswer = {
      data: null,
      error: { message: "canceling statement due to statement timeout" },
    };
    signInsAnswer = { data: "many", error: null };
    const out = await run();
    expect(out.failed.sort()).toEqual([
      "r2_storage",
      "supabase_db_size",
      "supabase_mau",
    ]);
    const block = parseStoredLimits(out.stored);
    const why = block?.meters.supabase_db_size;
    expect(why?.state === "none" && why.why).toMatch(/statement timeout/);
  });

  it("is a failed read of both Resend meters when Resend's list is", async () => {
    const failed: MeterTaken = {
      kind: "none",
      cause: "failed",
      why: "Resend's list could not be read: boom",
    };
    readResendMeters.mockResolvedValue({
      resend_month: failed,
      resend_day: failed,
    });
    const out = await run();
    expect(out.failed.sort()).toEqual(["resend_day", "resend_month"]);
  });
});

describe("★ it never throws out of the spend watch's run", () => {
  it("is a problem with its words, and no record, when a reader itself throws", async () => {
    readVercelUsage.mockRejectedValue(new Error("a bug in a reader"));
    const out = await run();
    expect(out.problem).toBe(true);
    expect(out.stored).toBeNull();
    expect(out.notes[0]).toMatch(/could not be read: a bug in a reader/);
    expect(captureError).toHaveBeenCalledWith("cron", expect.anything(), {
      job: "spend_watch",
      phase: "limits",
    });
  });

  it("answers a database that throws as failed meters, never a thrown run", async () => {
    const throwing = {
      from: () => chain(),
      rpc: () => {
        throw new Error("socket closed");
      },
    } as never;
    const out = await runLimitsWatch({ admin: throwing, now: NOW });
    expect(out.problem).toBe(false);
    expect(out.failed).toEqual(
      expect.arrayContaining([
        "supabase_db_size",
        "supabase_mau",
        "r2_storage",
      ]),
    );
  });
});

describe("the record, read back", () => {
  it("reads the history newest first, a block it cannot parse left out, and throws on a failed read", async () => {
    historyRows = [
      pastBlock(DAY, {}),
      { started_at: "2026-10-02T05:00:00Z", limits: { junk: true } },
    ];
    const blocks = await readLimitsHistory(admin, NOW.getTime());
    expect(blocks).toHaveLength(1);
    historyRows = { message: "boom" };
    await expect(readLimitsHistory(admin, NOW.getTime())).rejects.toThrow(
      /plan limits: its own history: boom/,
    );
  });

  it("puts the card's link on the admin host, and the plan limits' anchor", () => {
    expect(adminJobsUrl("plan-limits")).toBe(
      "https://admin.partyreel.com/admin/jobs#plan-limits",
    );
  });
});

describe("the console's read", () => {
  it("gives the newest run that carried a limits block, with its own status, passing over runs from before it", async () => {
    const block = pastBlock(2 * DAY, {});
    historyRows = [
      {
        started_at: new Date(NOW.getTime() - HOUR).toISOString(),
        status: "ok",
        limits: null,
      },
      { ...block, status: "error" },
      { ...pastBlock(3 * DAY, {}), status: "ok" },
    ];
    const latest = await readLatestLimits();
    expect(latest?.startedAt).toBe(block.started_at);
    expect(latest?.status).toBe("error");
    expect(latest?.limits.atMs).toBe(NOW.getTime() - 2 * DAY);
  });

  it("is null when no run carried one yet, and throws, never an empty card, when the read fails", async () => {
    historyRows = [
      { started_at: "2026-10-03T05:00:00Z", status: "ok", limits: null },
    ];
    expect(await readLatestLimits()).toBeNull();
    historyRows = { message: "boom" };
    await expect(readLatestLimits()).rejects.toThrow(
      /the plan limits' last readings: boom/,
    );
  });
});
