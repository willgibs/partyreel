/**
 * A GUEST REMOVES THEIR OWN PHOTOGRAPH, anonymously (Will, `yours`, 2026-09-20:
 * "A guest can delete any photo they've personally uploaded, ever"; final for
 * the host too).
 *
 * What this file guards is the ROUTE's half of that: the shape it accepts, the
 * answers it is allowed to give, and the two it must never confuse. Ownership
 * itself is enforced inside `remove_my_upload_by_session` (SECURITY DEFINER,
 * service-role only) and is verified against the real database, not here — a
 * mocked mutation can only prove the wiring.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const removeMyUploadBySession = vi.fn();
const getEventByQrToken = vi.fn();
const recordAbuseEvent = vi.fn().mockResolvedValue(undefined);
const checkAbuseRate = vi
  .fn()
  .mockResolvedValue({ allowed: true, retryAfterSec: 0 });

vi.mock("@/lib/db/mutations/guest-media", () => ({
  removeMyUploadBySession: (...args: unknown[]) =>
    removeMyUploadBySession(...args),
}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: (...args: unknown[]) => checkAbuseRate(...args),
  recordAbuseEvent: (...args: unknown[]) => recordAbuseEvent(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: vi.fn() }));

const { POST } = await import("@/app/api/guests/remove/route");

const TOKEN = "qr-token-1234";
const SESSION = "a-session-token-of-real-length";
// A real v4 shape: zod v4's z.uuid() checks the version and variant nibbles.
const MEDIA = "11111111-2222-4333-8444-555555555555";

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const openEvent = {
  ok: true as const,
  data: { id: "event-1", visibility: "open" as const },
};

beforeEach(() => {
  vi.clearAllMocks();
  checkAbuseRate.mockResolvedValue({ allowed: true, retryAfterSec: 0 });
  recordAbuseEvent.mockResolvedValue(undefined);
  getEventByQrToken.mockResolvedValue(openEvent);
});

describe("what it accepts", () => {
  it("refuses a body that is not the three fields", async () => {
    for (const body of [
      {},
      { qr_token: TOKEN },
      { qr_token: TOKEN, session_token: SESSION },
      { qr_token: TOKEN, session_token: SESSION, media_id: "not-a-uuid" },
      { qr_token: "", session_token: SESSION, media_id: MEDIA },
    ]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(removeMyUploadBySession).not.toHaveBeenCalled();
  });

  it("passes the token and the media id STRAIGHT to the RPC wrapper, and nothing else", async () => {
    // The route holds no ownership logic of its own on purpose: everything that
    // decides whether this delete is allowed lives inside the function.
    removeMyUploadBySession.mockResolvedValue("removed");
    await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA });
    expect(removeMyUploadBySession).toHaveBeenCalledWith({
      sessionToken: SESSION,
      mediaId: MEDIA,
    });
  });
});

describe("the answers, and the two it must not confuse", () => {
  it("a malformed token is 403 — it is not a token at all", async () => {
    removeMyUploadBySession.mockResolvedValue("unauthorized");
    const res = await post({
      qr_token: TOKEN,
      session_token: "short",
      media_id: MEDIA,
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ code: "unauthorized" });
  });

  it("somebody else's photograph is 404, the same 404 as one that does not exist", async () => {
    // ★ The route may never say "that one is someone else's". A well-formed
    // token that simply does not own this row and a media id that was never
    // real are one answer.
    removeMyUploadBySession.mockResolvedValue("not_found");
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      media_id: MEDIA,
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ ok: false, code: "not_found" });
  });

  it("removing an ALREADY-removed photograph is a 200 (idempotent)", async () => {
    // The RPC folds already-removed into success, so a second tap on a slow
    // phone must read as done, never as a failure.
    removeMyUploadBySession.mockResolvedValue("removed");
    const first = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      media_id: MEDIA,
    });
    const second = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      media_id: MEDIA,
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({ ok: true });
  });

  it("a database refusal that is OURS is a 500, never a 404", async () => {
    removeMyUploadBySession.mockResolvedValue("error");
    expect(
      (await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA }))
        .status,
    ).toBe(500);
  });
});

describe("the write inherits the page's read gate", () => {
  it("an unknown event is 404 and never reaches the RPC", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false });
    expect(
      (await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA }))
        .status,
    ).toBe(404);
    expect(removeMyUploadBySession).not.toHaveBeenCalled();
  });

  it("a PRIVATE event accepts nothing (the master lock)", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    expect(
      (await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA }))
        .status,
    ).toBe(403);
    expect(removeMyUploadBySession).not.toHaveBeenCalled();
  });
});

describe("the limiter", () => {
  it("429s a tripped one, with Retry-After, before touching the database", async () => {
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 42 });
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      media_id: MEDIA,
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(removeMyUploadBySession).not.toHaveBeenCalled();
  });

  it("FAILS OPEN on a limiter outage — the RPC's own check is the real gate", async () => {
    checkAbuseRate.mockRejectedValue(new Error("counters down"));
    removeMyUploadBySession.mockResolvedValue("removed");
    expect(
      (await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA }))
        .status,
    ).toBe(200);
  });

  it("records only a real removal into the breadth signal", async () => {
    removeMyUploadBySession.mockResolvedValue("not_found");
    await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA });
    expect(recordAbuseEvent).not.toHaveBeenCalled();

    removeMyUploadBySession.mockResolvedValue("removed");
    await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA });
    expect(recordAbuseEvent).toHaveBeenCalledOnce();
  });

  it("a failed record never fails the removal", async () => {
    removeMyUploadBySession.mockResolvedValue("removed");
    recordAbuseEvent.mockRejectedValue(new Error("insert down"));
    expect(
      (await post({ qr_token: TOKEN, session_token: SESSION, media_id: MEDIA }))
        .status,
    ).toBe(200);
  });
});
