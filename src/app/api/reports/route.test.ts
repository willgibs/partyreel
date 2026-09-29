/**
 * THE REPORT ROUTE (admin-triage r2, 20260929140000): what the album arm hands `create_report`, and what it does
 * at once when a report cannot wait.
 *
 *  - ★ the reporter is the SESSION's (`getUser()`), never the body's: an address rides only beside
 *    `email_confirmed_at`, and a reporter the body names never reaches the RPC;
 *  - the kind is the form's, Something else when a page older than the form sends none;
 *  - a child-abuse report tells the operator AFTER the response (the reporter's toast never waits on an inbox),
 *    whether or not it hid anything; no other kind does;
 *  - the answer says whether the instant hide took the photo down, and nothing else about the report.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
  },
  createReport: vi.fn(),
  createProfileReport: vi.fn(),
  alerts: [] as unknown[],
  afterCallbacks: [] as (() => unknown)[],
  warnings: [] as string[],
  gateAllowed: true,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (cb: () => unknown) => {
    state.afterCallbacks.push(cb);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}));
vi.mock("@/lib/db/mutations/report", () => ({
  createReport: state.createReport,
}));
vi.mock("@/lib/db/mutations/social", () => ({
  createProfileReport: state.createProfileReport,
}));
vi.mock("@/lib/db/queries/reports", () => ({
  readEventName: async () => "Priya & Sam's baby shower",
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (_area: string, message: string) =>
    state.warnings.push(message),
  captureError: () => {},
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: async () => ({
    allowed: state.gateAllowed,
    retryAfterSec: 60,
  }),
  recordAbuseEvent: async () => {},
}));
vi.mock("@/lib/security/unlock-rate-limit", () => ({
  clientIp: () => "203.0.113.9",
}));
// The reporter's reading is the real one (its rules are what this file pins); its alert is recorded.
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: { UNLOCK_COOKIE_SECRET: "test-secret" },
}));
vi.mock("@/lib/email/send", () => ({ sendOnce: vi.fn() }));
vi.mock("@/lib/reports/reporter.server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/reports/reporter.server")>()),
  alertUrgentReport: async (args: unknown) => {
    state.alerts.push(args);
  },
}));

const { POST } = await import("./route");
const { reporterAddressHash } = await import("@/lib/reports/reporter.server");

const MEDIA = "0a8b3c2d-1e4f-4a6b-8c9d-0e1f2a3b4c5d";

function post(body: unknown): Request {
  return new Request("https://partyreel.com/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function runAfter() {
  for (const cb of state.afterCallbacks.splice(0)) await cb();
}

beforeEach(() => {
  state.user = null;
  state.alerts.length = 0;
  state.afterCallbacks.length = 0;
  state.warnings.length = 0;
  state.gateAllowed = true;
  state.createReport.mockReset();
  state.createReport.mockResolvedValue({
    ok: true,
    data: { report_id: "r1", hid: false, event_id: "e1" },
    schemaMissing: false,
  });
  state.createProfileReport.mockReset();
});

describe("who is reporting", () => {
  it("★ files a signed-out report with no reporter at all", async () => {
    const res = await POST(post({ qr_token: "tok", kind: "violence" }));
    expect(res.status).toBe(200);
    expect(state.createReport).toHaveBeenCalledWith({
      qrToken: "tok",
      mediaId: null,
      reason: null,
      kind: "violence",
      reporter: null,
    });
  });

  it("★ carries a CONFIRMED address and its keyed hash, and an unconfirmed one not at all", async () => {
    state.user = {
      id: "u1",
      email: " Mia@Example.com ",
      email_confirmed_at: "2026-09-29T10:00:00Z",
    };
    await POST(post({ qr_token: "tok", kind: "consent" }));
    expect(state.createReport.mock.calls[0][0].reporter).toEqual({
      userId: "u1",
      confirmedEmail: "mia@example.com",
      addressHash: reporterAddressHash("mia@example.com"),
    });

    state.user = {
      id: "u2",
      email: "sam@example.com",
      email_confirmed_at: null,
    };
    await POST(post({ qr_token: "tok", kind: "consent" }));
    expect(state.createReport.mock.calls[1][0].reporter).toEqual({
      userId: "u2",
      confirmedEmail: null,
      addressHash: null,
    });
  });

  it("★ never takes a reporter from the body: the session is the reporter", async () => {
    // The schema drops keys it does not know, so a body's reporter never reaches the RPC; the session's does.
    state.user = null;
    const res = await POST(
      post({
        qr_token: "tok",
        kind: "child",
        media_id: MEDIA,
        reporter_email: "someone@example.com",
        reporter_user_id: "u9",
      }),
    );
    expect(res.status).toBe(200);
    expect(state.createReport.mock.calls[0][0].reporter).toBeNull();
  });
});

describe("the kind", () => {
  it("files an older page's report as Something else", async () => {
    await POST(post({ qr_token: "tok" }));
    expect(state.createReport.mock.calls[0][0].kind).toBe("other");
  });

  it("refuses a kind the form never offers", async () => {
    const res = await POST(post({ qr_token: "tok", kind: "spam" }));
    expect(res.status).toBe(400);
    expect(state.createReport).not.toHaveBeenCalled();
  });
});

describe("a report that cannot wait", () => {
  it("★ answers whether the photo was hidden, then tells the operator after the response", async () => {
    state.user = {
      id: "u1",
      email: "mia@example.com",
      email_confirmed_at: "2026-09-29T10:00:00Z",
    };
    state.createReport.mockResolvedValue({
      ok: true,
      data: { report_id: "r7", hid: true, event_id: "e1" },
      schemaMissing: false,
    });
    const res = await POST(
      post({ qr_token: "tok", kind: "child", media_id: MEDIA }),
    );
    expect(await res.json()).toEqual({ ok: true, hid: true });
    // Nothing was sent before the response went.
    expect(state.alerts).toHaveLength(0);
    await runAfter();
    expect(state.alerts).toEqual([
      {
        reportId: "r7",
        eventId: "e1",
        eventName: "Priya & Sam's baby shower",
        hidden: true,
      },
    ]);
  });

  it("tells the operator of a signed-out child-abuse report too, which hid nothing", async () => {
    const res = await POST(post({ qr_token: "tok", kind: "child" }));
    expect(await res.json()).toEqual({ ok: true, hid: false });
    await runAfter();
    expect(state.alerts).toEqual([
      expect.objectContaining({ reportId: "r1", hidden: false }),
    ]);
  });

  it("never alerts on any other kind", async () => {
    for (const kind of ["sexual", "violence", "private", "consent", "other"]) {
      await POST(post({ qr_token: "tok", kind }));
    }
    expect(state.afterCallbacks).toHaveLength(0);
  });
});

describe("what the route answers", () => {
  it("maps a dead link to 404 and a foreign item to 400", async () => {
    state.createReport.mockResolvedValueOnce({
      ok: false,
      code: "not_found",
      message: "This event link is no longer valid.",
    });
    expect((await POST(post({ qr_token: "old" }))).status).toBe(404);
    state.createReport.mockResolvedValueOnce({
      ok: false,
      code: "invalid_media",
      message: "That item couldn't be found in this event.",
    });
    expect(
      (await POST(post({ qr_token: "tok", media_id: MEDIA }))).status,
    ).toBe(400);
  });

  it("says loudly when the migration is not live yet, and still files", async () => {
    state.createReport.mockResolvedValue({
      ok: true,
      data: { report_id: "r1", hid: false, event_id: null },
      schemaMissing: true,
    });
    const res = await POST(post({ qr_token: "tok", kind: "child" }));
    expect(res.status).toBe(200);
    expect(state.warnings).toContain("reports_schema_missing");
    // Through the seam the answer names no event, so there is nothing to alert about yet.
    expect(state.afterCallbacks).toHaveLength(0);
  });

  it("refuses a burst from one network with a Retry-After", async () => {
    state.gateAllowed = false;
    const res = await POST(post({ qr_token: "tok", kind: "child" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(state.createReport).not.toHaveBeenCalled();
  });

  it("keeps the person arm signed-in only, and it names no kind", async () => {
    const person = "11111111-2222-4333-8444-555555555555";
    expect((await POST(post({ profile_id: person }))).status).toBe(401);
    expect(
      (await POST(post({ profile_id: person, kind: "child" }))).status,
    ).toBe(400);
    expect(state.createProfileReport).not.toHaveBeenCalled();
  });
});
