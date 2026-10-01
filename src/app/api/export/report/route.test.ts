/**
 * THE WORKER'S WORD, KEPT (`report/route.ts`, `export-ends`): a signed check, start, end or heartbeat lands on
 * the export's row or the `export` job's runs, each write filling only what is empty; a report that is not
 * the Worker's (unsigned, forged, stale, malformed) touches nothing; a failure the Worker saw rings the
 * downloads' signal; and a write the app could not keep is said to the Worker's log.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";
import { signReport, type WorkerReport } from "@/lib/export/report";
import { resetFailureLogThrottle } from "@/lib/jobs/failure-log";

const SECRET = "report-route-secret";
let fake: FakePostgrest;
let secretSet = true;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
vi.mock("@/lib/env", () => ({
  assertExportEnv: () => {
    if (!secretSet) throw new Error("unset");
    return {
      EXPORT_SIGNING_SECRET: SECRET,
      EXPORT_WORKER_URL: "https://export.example",
    };
  },
}));
const captured: { kind: string; what: unknown }[] = [];
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (_area: string, message: string) =>
    captured.push({ kind: "warning", what: message }),
  captureError: (_area: string, error: unknown) =>
    captured.push({ kind: "error", what: String(error) }),
}));

const { POST } = await import("./route");

const JTI = "0123456789abcdef0123456789abcdef";
const OTHER = "fedcba9876543210fedcba9876543210";

function minted(jti: string, over: FakeRow = {}): FakeRow {
  return {
    id: `row-${jti.slice(0, 4)}`,
    jti,
    outcome: "minted",
    item_count: 3,
    checked_at: null,
    check_found: null,
    stream_started_at: null,
    stream_ended_at: null,
    stream_outcome: null,
    stream_files: null,
    stream_missing: null,
    ...over,
  };
}

function send(wire: string) {
  return POST(
    new Request("https://partyreel.test/api/export/report", {
      method: "POST",
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: wire,
    }),
  );
}

const signed = (report: WorkerReport) => send(signReport(SECRET, report));
const row = (jti = JTI) =>
  (fake.tables.export_log ?? []).find((r) => r.jti === jti);

beforeEach(() => {
  secretSet = true;
  captured.length = 0;
  resetFailureLogThrottle();
  fake = createFakePostgrest({
    tables: {
      export_log: [minted(JTI), minted(OTHER)],
      job_runs: [],
      ops_flags: [{ key: "export_enabled", enabled: true }],
    },
  });
});

describe("a check", () => {
  it("lands its count on the export's own row, and no other", async () => {
    const at = Date.now();
    const res = await signed({
      v: 1,
      kind: "check",
      jti: JTI,
      at,
      items: 3,
      found: 2,
    });
    expect(res.status).toBe(204);
    expect(row()).toMatchObject({
      checked_at: new Date(at).toISOString(),
      check_found: 2,
    });
    expect(row(OTHER)?.checked_at).toBeNull();
  });

  it("one the bucket could not answer is kept as checked with no count, and rings the downloads' signal", async () => {
    const res = await signed({
      v: 1,
      kind: "check",
      jti: JTI,
      at: Date.now(),
      items: 3,
      error: "unavailable",
    });
    expect(res.status).toBe(204);
    expect(row()?.checked_at).not.toBeNull();
    expect(row()?.check_found).toBeNull();
    expect(fake.tables.job_runs).toEqual([
      expect.objectContaining({ job: "export_delivery", status: "error" }),
    ]);
  });
});

describe("a stream", () => {
  it("keeps its start once: a late or repeated start never moves it", async () => {
    const first = Date.now() - 1000;
    await signed({ v: 1, kind: "start", jti: JTI, at: first });
    await signed({ v: 1, kind: "start", jti: JTI, at: Date.now() });
    expect(row()?.stream_started_at).toBe(new Date(first).toISOString());
  });

  it("keeps its end once, whole: the first end wins over a replay or a late one", async () => {
    const at = Date.now();
    await signed({
      v: 1,
      kind: "end",
      jti: JTI,
      at,
      outcome: "short",
      files: 2,
      missing: ["66666666-7777-4888-9999-aaaaaaaaaaaa"],
    });
    await signed({
      v: 1,
      kind: "end",
      jti: JTI,
      at: at + 1,
      outcome: "saved",
      files: 3,
      missing: [],
    });
    expect(row()).toMatchObject({
      stream_ended_at: new Date(at).toISOString(),
      stream_outcome: "short",
      stream_files: 2,
      stream_missing: ["66666666-7777-4888-9999-aaaaaaaaaaaa"],
    });
    // A zip cut short by the album changing is the album's doing, not a failure.
    expect(fake.tables.job_runs).toEqual([]);
  });

  it("one an object read broke rings the downloads' signal; one she stopped does not", async () => {
    await signed({
      v: 1,
      kind: "end",
      jti: OTHER,
      at: Date.now(),
      outcome: "stopped",
      files: 1,
      missing: [],
    });
    expect(fake.tables.job_runs).toEqual([]);
    await signed({
      v: 1,
      kind: "end",
      jti: JTI,
      at: Date.now(),
      outcome: "failed",
      files: 1,
      missing: [],
    });
    expect(fake.tables.job_runs).toEqual([
      expect.objectContaining({ job: "export_delivery", status: "error" }),
    ]);
    expect(row()?.stream_outcome).toBe("failed");
  });

  it("a write the app could not keep is said to the Worker's log as a 503", async () => {
    delete fake.tables.export_log;
    const res = await signed({ v: 1, kind: "start", jti: JTI, at: Date.now() });
    expect(res.status).toBe(503);
    expect(captured).toContainEqual({
      kind: "warning",
      what: "export_report_write_failed",
    });
  });
});

describe("a report that is not the Worker's", () => {
  it.each([
    ["unsigned", "eyJ2IjoxfQ", 400],
    [
      "forged",
      signReport("not-the-secret", {
        v: 1,
        kind: "start",
        jti: JTI,
        at: Date.now(),
      }),
      403,
    ],
    [
      "stale",
      signReport(SECRET, {
        v: 1,
        kind: "start",
        jti: JTI,
        at: Date.now() - 10 * 60_000,
      }),
      403,
    ],
    [
      "malformed",
      signReport(SECRET, {
        v: 1,
        kind: "start",
        jti: "nope",
        at: Date.now(),
      } as WorkerReport),
      400,
    ],
  ])("%s: refused, and nothing is read or written", async (_, wire, status) => {
    const res = await send(wire);
    expect(res.status).toBe(status);
    expect(fake.requests).toEqual([]);
    expect(row()?.stream_started_at).toBeNull();
  });

  it("with no secret configured, nothing can be verified, so nothing is kept", async () => {
    secretSet = false;
    const res = await signed({ v: 1, kind: "start", jti: JTI, at: Date.now() });
    expect(res.status).toBe(500);
    expect(fake.requests).toEqual([]);
  });

  it("a body past any report's size is refused unread", async () => {
    const res = await POST(
      new Request("https://partyreel.test/api/export/report", {
        method: "POST",
        headers: { "content-length": String(10 * 1024 * 1024) },
        body: "x",
      }),
    );
    expect(res.status).toBe(413);
    expect(fake.requests).toEqual([]);
  });
});

describe("the Worker's heartbeat", () => {
  const beat = (
    over: Partial<Extract<WorkerReport, { kind: "heartbeat" }>> = {},
  ) =>
    signed({
      v: 1,
      kind: "heartbeat",
      at: Date.now(),
      mode: "on",
      r2: "ok",
      ...over,
    });

  it("is a closed run of the export job, ok", async () => {
    const res = await beat();
    expect(res.status).toBe(204);
    expect(fake.tables.job_runs).toEqual([
      expect.objectContaining({
        job: "export",
        status: "ok",
        triggered_by: "schedule",
        counts: { r2: "ok" },
      }),
    ]);
    expect(fake.tables.job_runs[0].finished_at).not.toBeNull();
  });

  it("is a failed run when the Worker could not read the bucket", async () => {
    await beat({ r2: "error" });
    expect(fake.tables.job_runs).toEqual([
      expect.objectContaining({ job: "export", status: "error" }),
    ]);
    expect(captured).toContainEqual({
      kind: "warning",
      what: "export_worker_bucket_unreadable",
    });
  });

  it("is skipped, never missed, while downloads are paused or the Worker's own switch is off", async () => {
    fake.tables.ops_flags = [{ key: "export_enabled", enabled: false }];
    await beat();
    fake.tables.ops_flags = [{ key: "export_enabled", enabled: true }];
    await beat({ mode: "off" });
    expect(fake.tables.job_runs.map((r) => [r.job, r.status])).toEqual([
      ["export", "skipped"],
      ["export", "skipped"],
    ]);
  });
});
