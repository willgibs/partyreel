/**
 * THE RENAME DOOR (the identity reshape, 2026-09-21), on the `mine` route's pattern.
 *
 * `set_guest_display_name` is service-role-only, so this route is not a thin wrapper over a public
 * RPC: it IS the gate for the two things SQL cannot do (the profanity list and the rate limiter),
 * and it must never widen what the capability reaches. The cases below hold that line: a name is
 * checked before it is stored, a refusal reads as a refusal a guest can act on, and nothing in the
 * body can point the write at somebody else's row.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const setGuestDisplayName = vi.fn();
const getEventByQrToken = vi.fn();
const recordAbuseEvent = vi.fn().mockResolvedValue(undefined);
const checkAbuseRate = vi
  .fn()
  .mockResolvedValue({ allowed: true, retryAfterSec: 0 });
const abuseHashes = vi.fn(
  (_ip: string | null, _kind: string, _scope: string) => ({
    ipHash: "ip",
    scopeHash: "scope",
  }),
);

vi.mock("@/lib/db/mutations/guest", () => ({
  setGuestDisplayName: (...args: unknown[]) => setGuestDisplayName(...args),
}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: (ip: string | null, kind: string, scope: string) =>
    abuseHashes(ip, kind, scope),
  checkAbuseRate: (...args: unknown[]) => checkAbuseRate(...args),
  recordAbuseEvent: (...args: unknown[]) => recordAbuseEvent(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: vi.fn() }));
// The door's session COOKIE (the door as three steps, 2026-09-21) is `server-only` and reads
// `next/headers`; neither exists in the unit world, so the module's two real dependencies are
// stubbed and the route's own use of it is asserted on the response instead.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const { POST } = await import("@/app/api/guests/name/route");

const TOKEN = "qr-token-1234";
const SESSION = "a-session-token-of-real-length";

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function refusal(body: unknown) {
  const res = await post(body);
  const parsed = (await res.json()) as { code?: string };
  return { status: res.status, code: parsed.code };
}

beforeEach(() => {
  vi.clearAllMocks();
  abuseHashes.mockReturnValue({ ipHash: "ip", scopeHash: "scope" });
  checkAbuseRate.mockResolvedValue({ allowed: true, retryAfterSec: 0 });
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: { id: "event-1", visibility: "open" },
  });
  setGuestDisplayName.mockResolvedValue({
    ok: true,
    data: { guest_id: "g1", display_name: "Sam" },
  });
});

describe("the happy path", () => {
  it("stores the TRIMMED name for the posted session and answers with it", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "  Sam  ",
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      display_name: "Sam",
    });
    expect(setGuestDisplayName).toHaveBeenCalledWith({
      sessionToken: SESSION,
      displayName: "Sam",
    });
  });

  it("records the rename against its OWN limiter kind, never join's", async () => {
    await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "Sam",
    });
    expect(abuseHashes).toHaveBeenCalledWith(
      expect.anything(),
      "rename",
      TOKEN,
    );
    expect(checkAbuseRate).toHaveBeenCalledWith("rename", "ip", "scope");
    expect(recordAbuseEvent).toHaveBeenCalledWith("rename", "ip", "scope");
  });

  it("is never cached — the answer belongs to one session token", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "Sam",
    });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("the name is checked BEFORE it is stored", () => {
  it("422 name_required for a blank, and writes nothing", async () => {
    for (const display_name of [undefined, "", "   "]) {
      expect(
        await refusal({
          qr_token: TOKEN,
          session_token: SESSION,
          display_name,
        }),
      ).toEqual({ status: 422, code: "name_required" });
    }
    expect(setGuestDisplayName).not.toHaveBeenCalled();
  });

  it("422 name_invalid past 60 characters and for a reserved name", async () => {
    for (const display_name of ["x".repeat(61), "admin"]) {
      expect(
        await refusal({
          qr_token: TOKEN,
          session_token: SESSION,
          display_name,
        }),
      ).toEqual({ status: 422, code: "name_invalid" });
    }
    expect(setGuestDisplayName).not.toHaveBeenCalled();
  });

  it("★ 422 name_invalid on profanity — the gate SQL cannot hold, so the route holds it", async () => {
    const res = await refusal({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "fuckface",
    });
    expect(res).toEqual({ status: 422, code: "name_invalid" });
    expect(setGuestDisplayName).not.toHaveBeenCalled();
  });

  it("the refusal never repeats the rejected name back", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "fuckface",
    });
    expect(JSON.stringify(await res.json())).not.toContain("fuckface");
  });
});

describe("what the capability reaches, and what it does not", () => {
  it("400s a body missing either token, before the limiter or any read", async () => {
    for (const body of [
      {},
      { qr_token: TOKEN },
      { session_token: SESSION, display_name: "Sam" },
    ]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(setGuestDisplayName).not.toHaveBeenCalled();
    expect(getEventByQrToken).not.toHaveBeenCalled();
  });

  it("★ a posted guest_id cannot aim the write: only the session token is passed on", async () => {
    await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "Sam",
      guest_id: "someone-elses-guest-row",
      user_id: "someone-elses-account",
    });
    expect(setGuestDisplayName).toHaveBeenCalledWith({
      sessionToken: SESSION,
      displayName: "Sam",
    });
  });

  it("404s a dead link and 403s a private event, writing nothing", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false, code: "not_found" });
    expect(
      await refusal({
        qr_token: TOKEN,
        session_token: SESSION,
        display_name: "Sam",
      }),
    ).toEqual({ status: 404, code: "not_found" });

    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    expect(
      await refusal({
        qr_token: TOKEN,
        session_token: SESSION,
        display_name: "Sam",
      }),
    ).toEqual({ status: 403, code: "unauthorized" });
    expect(setGuestDisplayName).not.toHaveBeenCalled();
  });

  it("a PASSWORD event is not re-gated: the session token was minted past that lock", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "password" },
    });
    expect(
      (
        await post({
          qr_token: TOKEN,
          session_token: SESSION,
          display_name: "Sam",
        })
      ).status,
    ).toBe(200);
  });
});

describe("the RPC's own refusals reach the guest with a usable status", () => {
  it.each([
    ["invalid_session", 401],
    ["unauthorized", 403], // a verified guest's name is their profile's
    ["name_invalid", 422],
    ["unknown", 500],
  ])("maps %s to %i", async (code, status) => {
    setGuestDisplayName.mockResolvedValue({
      ok: false,
      code,
      message: "nope",
    });
    expect(
      await refusal({
        qr_token: TOKEN,
        session_token: SESSION,
        display_name: "Sam",
      }),
    ).toEqual({ status, code });
  });

  it("does not count a failed rename against the limiter", async () => {
    setGuestDisplayName.mockResolvedValue({
      ok: false,
      code: "invalid_session",
      message: "nope",
    });
    await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "Sam",
    });
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });
});

describe("the limiter", () => {
  it("429s a tripped one before reading or writing anything", async () => {
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 900 });
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "Sam",
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
    expect(getEventByQrToken).not.toHaveBeenCalled();
    expect(setGuestDisplayName).not.toHaveBeenCalled();
  });

  it("fails OPEN: a broken limiter never blocks a guest naming themselves", async () => {
    checkAbuseRate.mockRejectedValue(new Error("counter store down"));
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      display_name: "Sam",
    });
    expect(res.status).toBe(200);
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });
});
