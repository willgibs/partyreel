/**
 * THE JOBS CONSOLE'S WRITES (the spend watch's two): its switches are its own two alone, behind admin + AAL2, so a
 * forged key flips nothing; and Run now calls the route vercel.json schedules for the job asked, never another.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const setJobEnabled = vi.fn();
const fetchMock = vi.fn();
let authorized = true;

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
vi.mock("@/lib/env", () => ({
  assertCronEnv: () => ({ CRON_SECRET: "cron-secret" }),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.com",
}));

const { runJobNowAction, toggleWatchSwitchAction } =
  await import("@/app/admin/jobs/actions");

beforeEach(() => {
  vi.clearAllMocks();
  authorized = true;
  setJobEnabled.mockResolvedValue({ error: null });
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
