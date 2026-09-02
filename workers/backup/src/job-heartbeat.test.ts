import { afterEach, describe, expect, it, vi } from "vitest";

import { jobFinish, jobRunUrlFrom, jobStart } from "./job-heartbeat";

const CONFIGURED = {
  PRUNE_API_URL: "https://partyreel.com/api/internal/backup-prune",
  PRUNE_API_SECRET: "s3cret",
};

function stubFetch(
  impl: (url: string, init: RequestInit) => { status?: number; body?: unknown },
) {
  const spy = vi.fn(async (url: string, init: RequestInit) => {
    const { status = 200, body = {} } = impl(url, init);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("jobRunUrlFrom", () => {
  it("swaps the last path segment of the prune endpoint", () => {
    expect(jobRunUrlFrom(CONFIGURED.PRUNE_API_URL)).toBe(
      "https://partyreel.com/api/internal/job-run",
    );
  });

  it("drops any query or fragment on the configured URL", () => {
    expect(
      jobRunUrlFrom("https://partyreel.com/api/internal/backup-prune?x=1#y"),
    ).toBe("https://partyreel.com/api/internal/job-run");
  });

  it("returns null rather than throwing for anything unusable", () => {
    // A misconfigured var must degrade to "no heartbeat", never throw inside scheduled().
    expect(jobRunUrlFrom(undefined)).toBeNull();
    expect(jobRunUrlFrom("")).toBeNull();
    expect(jobRunUrlFrom("not a url")).toBeNull();
    expect(jobRunUrlFrom("ftp://example.com/a/b")).toBeNull();
  });
});

describe("jobStart", () => {
  it("reports not-ok when the endpoint is not configured, without calling fetch", async () => {
    const spy = stubFetch(() => ({}));
    const res = await jobStart({}, "backup_prune");
    expect(res).toEqual({ ok: false, error: "job endpoint not configured" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports paused with no run handle", async () => {
    stubFetch(() => ({ body: { ok: true, paused: true } }));
    const res = await jobStart(CONFIGURED, "backup_reconcile");
    expect(res).toEqual({ ok: true, paused: true, run: null });
  });

  it("returns the run handle when the job may proceed", async () => {
    stubFetch(() => ({
      body: { ok: true, paused: false, runId: "run-1", startedAtMs: 1000 },
    }));
    const res = await jobStart(CONFIGURED, "backup_reconcile");
    expect(res).toEqual({
      ok: true,
      paused: false,
      run: { runId: "run-1", startedAtMs: 1000 },
    });
  });

  it("reports not-ok on a non-2xx so the caller can pick its own posture", async () => {
    // The reconcile runs anyway on this; the prune refuses. That choice belongs to the caller,
    // which is why this returns an error rather than defaulting either way.
    stubFetch(() => ({ status: 503 }));
    const res = await jobStart(CONFIGURED, "backup_prune");
    expect(res).toEqual({ ok: false, error: "HTTP 503" });
  });

  it("reports not-ok when the request throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const res = await jobStart(CONFIGURED, "backup_prune");
    expect(res.ok).toBe(false);
  });
});

describe("jobFinish", () => {
  it("is a no-op when no row was ever opened", async () => {
    const spy = stubFetch(() => ({}));
    await jobFinish(CONFIGURED, "backup_prune", null, { status: "ok" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("posts the finish phase with the run handle and the tallies", async () => {
    const spy = stubFetch(() => ({ body: { ok: true } }));
    await jobFinish(
      CONFIGURED,
      "backup_prune",
      { runId: "run-1", startedAtMs: 1000 },
      { status: "ok", counts: { scanned: 12 }, note: "Dry run" },
    );
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://partyreel.com/api/internal/job-run");
    expect(JSON.parse(String(init.body))).toEqual({
      phase: "finish",
      job: "backup_prune",
      runId: "run-1",
      startedAtMs: 1000,
      status: "ok",
      counts: { scanned: 12 },
      note: "Dry run",
    });
  });

  it("swallows a failed finish (the work already happened)", async () => {
    stubFetch(() => ({ status: 500 }));
    await expect(
      jobFinish(
        CONFIGURED,
        "backup_reconcile",
        { runId: "run-2", startedAtMs: 1 },
        { status: "ok" },
      ),
    ).resolves.toBeUndefined();
  });
});
