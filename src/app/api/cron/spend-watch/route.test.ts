/**
 * THE SPEND WATCH'S CRON ROUTE: the purge's own door (the cron secret in constant time, closed with none set), the
 * app surface's alone (the admin deployment answers and reads nothing), Run now told from the schedule, and a run
 * that somehow threw is a 500, never a quiet 200. The run itself is `spend-watch-run.test.ts`'s.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const runSpendWatch = vi.fn();
const captureError = vi.fn();
let secret: string | null = "cron-secret";
let app = true;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  assertCronEnv: () => {
    if (!secret) throw new Error("CRON_SECRET is not set");
    return { CRON_SECRET: secret };
  },
}));
vi.mock("@/lib/surface", () => ({ servesApp: () => app }));
vi.mock("@/lib/jobs/spend-watch-run", () => ({
  runSpendWatch: (...a: unknown[]) => runSpendWatch(...a),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captureError(...a),
}));

const { GET } = await import("@/app/api/cron/spend-watch/route");

function call(headers: Record<string, string> = {}) {
  return GET(
    new Request("https://partyreel.com/api/cron/spend-watch", { headers }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  secret = "cron-secret";
  app = true;
  runSpendWatch.mockResolvedValue({
    status: "ok",
    tripped: [],
    missing: [],
    paused: [],
    offered: [],
    note: null,
  });
});

describe("the door", () => {
  it("runs nothing without a cron secret configured", async () => {
    secret = null;
    const res = await call({ authorization: "Bearer anything" });
    expect(res.status).toBe(500);
    expect(runSpendWatch).not.toHaveBeenCalled();
  });

  it("runs nothing for a wrong or missing bearer", async () => {
    expect((await call({ authorization: "Bearer nope" })).status).toBe(401);
    expect((await call()).status).toBe(401);
    expect(runSpendWatch).not.toHaveBeenCalled();
  });

  it("★ answers on the admin deployment without reading anything (vercel.json registers it on both projects)", async () => {
    app = false;
    const res = await call({ authorization: "Bearer cron-secret" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ok: true,
      skipped: true,
      reason: "not_this_surface",
    });
    expect(runSpendWatch).not.toHaveBeenCalled();
  });
});

describe("a run", () => {
  it("runs on the schedule, and tells Run now apart", async () => {
    const res = await call({ authorization: "Bearer cron-secret" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: "ok" });
    expect(runSpendWatch).toHaveBeenCalledWith({ trigger: "schedule" });
    await call({
      authorization: "Bearer cron-secret",
      "x-job-trigger": "manual",
    });
    expect(runSpendWatch).toHaveBeenLastCalledWith({ trigger: "manual" });
  });

  it("is a 500 and a Sentry error if the run ever throws, never a quiet 200", async () => {
    runSpendWatch.mockRejectedValue(new Error("boom"));
    const res = await call({ authorization: "Bearer cron-secret" });
    expect(res.status).toBe(500);
    expect(captureError).toHaveBeenCalledWith("cron", expect.any(Error), {
      job: "spend_watch",
    });
  });
});
