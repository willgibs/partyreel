/**
 * THE JOBS CONSOLE'S WRITES (the spend watch's two): its switches are its own two alone, behind admin + AAL2, so a
 * forged key flips nothing; and Run now calls the route vercel.json schedules for the job asked, never another. The
 * backup restore's Restore now asks its Worker's door with the shared bearer, and says every answer in words.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const setJobEnabled = vi.fn();
const stampPruneHoldRelease = vi.fn();
const fetchMock = vi.fn();
let authorized = true;
const envState = vi.hoisted(() => ({
  serverEnv: {} as Record<string, string | undefined>,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdminAction: async () =>
    authorized
      ? { ok: true, ctx: {} }
      : {
          ok: false,
          result: { ok: false, code: "unauthorized", message: "Not allowed." },
        },
}));
vi.mock("@/lib/db/queries/jobs", () => ({
  setJobEnabled: (...a: unknown[]) => setJobEnabled(...a),
}));
vi.mock("@/app/admin/jobs/prune-hold", () => ({
  stampPruneHoldRelease: (...a: unknown[]) => stampPruneHoldRelease(...a),
}));
vi.mock("@/lib/env", () => ({
  assertCronEnv: () => ({ CRON_SECRET: "cron-secret" }),
  serverEnv: envState.serverEnv,
}));
const sentry = vi.hoisted(() => ({ captureError: vi.fn() }));
vi.mock("@/lib/observability/sentry", () => sentry);
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.com",
}));

const {
  releasePruneHoldAction,
  restoreNowAction,
  runJobNowAction,
  toggleWatchSwitchAction,
} = await import("@/app/admin/jobs/actions");

beforeEach(() => {
  vi.clearAllMocks();
  authorized = true;
  envState.serverEnv.BACKUP_WORKER_URL =
    "https://partyreel-backup.example.workers.dev";
  envState.serverEnv.PRUNE_API_SECRET = "prune-secret";
  setJobEnabled.mockResolvedValue({ error: null });
  stampPruneHoldRelease.mockResolvedValue({ error: null });
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

describe("the watch's two switches", () => {
  it("writes guest uploads and lifecycle mail, and nothing else", async () => {
    expect(await toggleWatchSwitchAction("uploads_enabled", false)).toEqual({
      ok: true,
    });
    expect(
      await toggleWatchSwitchAction("lifecycle_mail_enabled", true),
    ).toEqual({ ok: true });
    expect(setJobEnabled.mock.calls).toEqual([
      ["uploads_enabled", false],
      ["lifecycle_mail_enabled", true],
    ]);
  });

  it("★ refuses a forged key: the purge's and the exports' switches live on their own cards", async () => {
    for (const key of ["purge_cron_enabled", "export_enabled", "is_admin"]) {
      const res = await toggleWatchSwitchAction(key, false);
      expect(res).toMatchObject({ ok: false, message: "Unknown switch." });
    }
    expect(setJobEnabled).not.toHaveBeenCalled();
  });

  it("writes nothing without an admin at AAL2", async () => {
    authorized = false;
    expect(
      await toggleWatchSwitchAction("uploads_enabled", false),
    ).toMatchObject({ ok: false });
    expect(setJobEnabled).not.toHaveBeenCalled();
  });
});

describe("Run now", () => {
  it("calls each startable job's own scheduled route, as a manual run", async () => {
    await runJobNowAction("spend_watch");
    await runJobNowAction("purge_cron");
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "https://partyreel.com/api/cron/spend-watch",
      "https://partyreel.com/api/cron/purge",
    ]);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "Bearer cron-secret",
        "x-job-trigger": "manual",
      },
    });
  });

  it("starts nothing the app cannot start", async () => {
    const res = await runJobNowAction("backup_prune");
    expect(res).toMatchObject({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Release the hold (the backup prune's)", () => {
  it("stamps one release, behind admin + AAL2, and touches no switch", async () => {
    expect(await releasePruneHoldAction()).toEqual({ ok: true });
    expect(stampPruneHoldRelease).toHaveBeenCalledTimes(1);
    expect(setJobEnabled).not.toHaveBeenCalled();
  });

  it("stamps nothing without an admin at AAL2", async () => {
    authorized = false;
    expect(await releasePruneHoldAction()).toMatchObject({ ok: false });
    expect(stampPruneHoldRelease).not.toHaveBeenCalled();
  });

  it("says so when the stamp cannot be written: the hold stands", async () => {
    stampPruneHoldRelease.mockResolvedValue({ error: "ops_flags unreachable" });
    expect(await releasePruneHoldAction()).toMatchObject({
      ok: false,
      message: expect.stringMatching(/still held/i),
    });
  });
});

describe("Restore now (the backup restore)", () => {
  const answer = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status });

  it("★ asks the backup Worker's door with the shared bearer, behind admin + AAL2", async () => {
    fetchMock.mockResolvedValue(
      answer(202, { started: true, state: "started" }),
    );
    expect(await restoreNowAction()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://partyreel-backup.example.workers.dev/restore",
    );
    expect(init).toMatchObject({
      method: "POST",
      headers: { authorization: "Bearer prune-secret" },
    });
  });

  it("counts a press that joins a pass in flight as begun: another follows it", async () => {
    fetchMock.mockResolvedValue(
      answer(202, { started: true, state: "running" }),
    );
    expect(await restoreNowAction()).toEqual({ ok: true });
  });

  it("asks nothing without admin + AAL2", async () => {
    authorized = false;
    expect(await restoreNowAction()).toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says the restore is off in words, and raises nothing: a state, not a fault", async () => {
    fetchMock.mockResolvedValue(answer(409, { started: false, reason: "off" }));
    expect(await restoreNowAction()).toEqual({
      ok: false,
      code: "unknown",
      message:
        "The restore is off on its Worker (RESTORE_MODE), so there is nothing to run.",
    });
    expect(sentry.captureError).not.toHaveBeenCalled();
  });

  it("names a refused bearer and an unreachable Worker, each a Sentry event", async () => {
    fetchMock.mockResolvedValue(new Response("Unauthorized", { status: 401 }));
    expect(await restoreNowAction()).toMatchObject({
      ok: false,
      message: expect.stringMatching(
        /PRUNE_API_SECRET differs between the two/,
      ),
    });
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await restoreNowAction()).toMatchObject({
      ok: false,
      message: expect.stringMatching(/^Couldn't reach the backup Worker/),
    });
    fetchMock.mockResolvedValue(
      answer(503, { started: false, reason: "unbound" }),
    );
    expect(await restoreNowAction()).toMatchObject({
      ok: false,
      message: "The backup Worker did not start a pass (HTTP 503).",
    });
    expect(sentry.captureError).toHaveBeenCalledTimes(3);
  });

  it("says it is not wired, asking nothing, while BACKUP_WORKER_URL is unset", async () => {
    envState.serverEnv.BACKUP_WORKER_URL = undefined;
    expect(await restoreNowAction()).toMatchObject({
      ok: false,
      message: expect.stringMatching(/^Restore now is not wired here/),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
