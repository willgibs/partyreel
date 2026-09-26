/**
 * THE ATTACH DOOR, on the rename door's pattern.
 *
 * `set_guest_pending_email` is service-role-only, so this route is not a thin wrapper over a public
 * RPC: it IS the gate for the things SQL cannot do (the shape refusal a guest can read, the rate
 * limiter) and it must never widen what the capability reaches. The cases below hold four lines:
 *
 *   ★ WHETHER, NEVER WHAT. The response carries `email_attached` and never the address. A host's own
 *     browser calls the guest routes, and an unproved stranger's address has no business on a body
 *     anyone but its owner can read.
 *   ★ NULL IS THE DETACH, AND IT IS NOT AN ERROR. "Clear it" and "set it to nothing" are one intent.
 *   ★ THE TOKEN COMES FROM THE BODY. A write route that read the session cookie as identity would be
 *     CSRF-able by any page that can make the browser POST.
 *   ★ THE WRITE PATH INHERITS THE READ GATE, AND IT COMES FIRST: a private event refuses before the
 *     row is ever touched.
 */
import { readFileSync } from "node:fs";
import { join as joinPath } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const setGuestPendingEmail = vi.fn();
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
  setGuestPendingEmail: (...args: unknown[]) => setGuestPendingEmail(...args),
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
// The door's session COOKIE is `server-only` and reads `next/headers`; neither exists in the unit
// world, so the module's two real dependencies are stubbed and the route's own use of it is
// asserted on the response instead.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
// Whose ticket is this: the rule itself is pinned in lib/guest/session-owner.test.ts against the
// real clients; here it is the route's gate.
const checkSessionOwner = vi.fn();
vi.mock("@/lib/guest/session-owner.server", () => ({
  checkSessionOwner: (...args: unknown[]) => checkSessionOwner(...args),
}));

const { POST } = await import("@/app/api/guests/email/route");

const TOKEN = "qr-token-1234";
const SESSION = "a".repeat(64);
const ADDRESS = "maya@example.com";

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/email", {
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
  setGuestPendingEmail.mockResolvedValue({
    ok: true,
    data: { guest_id: "g1", email_attached: true },
  });
  checkSessionOwner.mockResolvedValue({ ok: true });
});

describe("an account's row takes an address only from that account", () => {
  it("★ 403 session_other_account for a ticket whose row is someone else's: no write, no cookie", async () => {
    checkSessionOwner.mockResolvedValue({
      ok: false,
      code: "session_other_account",
      message:
        "Someone else added photos from this device. Try again to add yours.",
    });
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("session_other_account");
    expect(JSON.stringify(body)).not.toContain(ADDRESS);
    expect(setGuestPendingEmail).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("a typo is still answered under the field first, before anyone's ticket is asked about", async () => {
    await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: "not-an-address",
    });
    expect(checkSessionOwner).not.toHaveBeenCalled();
    await post({ qr_token: TOKEN, session_token: SESSION, email: ADDRESS });
    expect(checkSessionOwner).toHaveBeenCalledWith(SESSION);
  });
});

describe("the body it will accept", () => {
  it("400s a body that is not JSON at all", async () => {
    const res = await POST(
      new Request("https://partyreel.com/api/guests/email", {
        method: "POST",
        body: "{",
      }),
    );
    expect(res.status).toBe(400);
    expect(setGuestPendingEmail).not.toHaveBeenCalled();
  });

  it("★ 400s a body with NO session token: the capability is the whole authorization", async () => {
    expect(await refusal({ qr_token: TOKEN, email: ADDRESS })).toEqual({
      status: 400,
      code: "bad_request",
    });
    expect(setGuestPendingEmail).not.toHaveBeenCalled();
  });

  it("400s a body with no qr_token (it scopes the limiter and the visibility gate)", async () => {
    expect(await refusal({ session_token: SESSION, email: ADDRESS })).toEqual({
      status: 400,
      code: "bad_request",
    });
  });

  it("★ 400s a body with the email key MISSING: a detach has to be said out loud", async () => {
    expect(await refusal({ qr_token: TOKEN, session_token: SESSION })).toEqual({
      status: 400,
      code: "bad_request",
    });
    expect(setGuestPendingEmail).not.toHaveBeenCalled();
  });

  it("ignores a forged guest_id: the session token is the only thing that points at a row", async () => {
    await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
      guest_id: "someone-elses-guest-row",
    });
    expect(setGuestPendingEmail).toHaveBeenCalledWith({
      sessionToken: SESSION,
      email: ADDRESS,
    });
  });
});

describe("attaching an address", () => {
  it("★ normalises before it stores: trimmed and lowercased, as the column and the claim need", async () => {
    await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: "  Maya.J@Example.COM  ",
    });
    expect(setGuestPendingEmail).toHaveBeenCalledWith({
      sessionToken: SESSION,
      email: "maya.j@example.com",
    });
  });

  it("★ answers WHETHER, and never the address", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, email_attached: true });
    expect(JSON.stringify(body)).not.toContain("example.com");
  });

  it("is never cached: the answer belongs to one session token", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("422 email_invalid for something that is not an address, and never touches the row", async () => {
    for (const email of [
      "not-an-address",
      "maya@",
      "@example.com",
      "a b@c.io",
    ]) {
      vi.clearAllMocks();
      expect(
        await refusal({ qr_token: TOKEN, session_token: SESSION, email }),
      ).toEqual({ status: 422, code: "email_invalid" });
      expect(setGuestPendingEmail).not.toHaveBeenCalled();
    }
  });

  it("the 422 carries a sentence a guest can act on", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: "nope",
    });
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Check that email address.");
    expect(body.message).not.toContain("—"); // the copy policy
  });

  it("records the attempt against the limiter only when it succeeded", async () => {
    await post({ qr_token: TOKEN, session_token: SESSION, email: ADDRESS });
    expect(recordAbuseEvent).toHaveBeenCalledWith(
      "attach_email",
      "ip",
      "scope",
    );
    vi.clearAllMocks();
    setGuestPendingEmail.mockResolvedValue({
      ok: false,
      code: "invalid_session",
      message: "nope",
    });
    await post({ qr_token: TOKEN, session_token: SESSION, email: ADDRESS });
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });
});

describe("the detach", () => {
  beforeEach(() => {
    setGuestPendingEmail.mockResolvedValue({
      ok: true,
      data: { guest_id: "g1", email_attached: false },
    });
  });

  it("★ null detaches, and is a 200 rather than a refusal", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: null,
    });
    expect(res.status).toBe(200);
    expect(setGuestPendingEmail).toHaveBeenCalledWith({
      sessionToken: SESSION,
      email: null,
    });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      email_attached: false,
    });
  });

  it("a blank string is the same intent, never a 422", async () => {
    for (const email of ["", "   "]) {
      vi.clearAllMocks();
      setGuestPendingEmail.mockResolvedValue({
        ok: true,
        data: { guest_id: "g1", email_attached: false },
      });
      const res = await post({
        qr_token: TOKEN,
        session_token: SESSION,
        email,
      });
      expect(res.status).toBe(200);
      expect(setGuestPendingEmail).toHaveBeenCalledWith({
        sessionToken: SESSION,
        email: null,
      });
    }
  });
});

describe("the read gate the write inherits still comes first", () => {
  it("404s a dead link before the row is touched", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false });
    expect(
      await refusal({
        qr_token: TOKEN,
        session_token: SESSION,
        email: ADDRESS,
      }),
    ).toEqual({ status: 404, code: "not_found" });
    expect(setGuestPendingEmail).not.toHaveBeenCalled();
  });

  it("403s a private event", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    expect(
      await refusal({
        qr_token: TOKEN,
        session_token: SESSION,
        email: ADDRESS,
      }),
    ).toEqual({ status: 403, code: "unauthorized" });
    expect(setGuestPendingEmail).not.toHaveBeenCalled();
  });

  it("a PASSWORD event is not re-gated: the token was minted past that lock already", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "password" },
    });
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    expect(res.status).toBe(200);
  });
});

describe("the RPC's own refusals reach the guest with a usable status", () => {
  it.each([
    ["invalid_session", 401],
    ["unauthorized", 403], // a verified guest's address is their account's
    ["email_invalid", 422], // the belt under guests_pending_email_shape
    ["unknown", 500],
  ])("maps %s to %i", async (code, status) => {
    setGuestPendingEmail.mockResolvedValue({
      ok: false,
      code,
      message: "nope",
    });
    expect(
      await refusal({
        qr_token: TOKEN,
        session_token: SESSION,
        email: ADDRESS,
      }),
    ).toEqual({ status, code });
  });
});

describe("the limiter", () => {
  it("uses its OWN kind, scoped to (IP, event)", async () => {
    await post({ qr_token: TOKEN, session_token: SESSION, email: ADDRESS });
    // clientIp falls back to "unknown" when no forwarding header is present.
    expect(abuseHashes).toHaveBeenCalledWith("unknown", "attach_email", TOKEN);
    expect(checkAbuseRate).toHaveBeenCalledWith("attach_email", "ip", "scope");
  });

  it("429s a tripped one before reading or writing anything", async () => {
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 900 });
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
    expect(getEventByQrToken).not.toHaveBeenCalled();
    expect(setGuestPendingEmail).not.toHaveBeenCalled();
  });

  it("fails OPEN: a broken limiter never blocks a guest fixing their own address", async () => {
    checkAbuseRate.mockRejectedValue(new Error("counter store down"));
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    expect(res.status).toBe(200);
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });
});

describe("the session cookie", () => {
  it("heals on the way out, HttpOnly and scoped to the whole site", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`pr_guest_event-1=${SESSION}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("writes NOTHING that is not a 64-hex session token", async () => {
    const res = await post({
      qr_token: TOKEN,
      session_token: "not-a-token-but-long-enough-to-pass-the-schema",
      email: ADDRESS,
    });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("a refused attach sets no cookie at all", async () => {
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "event-1", visibility: "private" },
    });
    const res = await post({
      qr_token: TOKEN,
      session_token: SESSION,
      email: ADDRESS,
    });
    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  /* ★ THE CSRF SURFACE DOES NOT MOVE. `session-cookie.test.ts` keeps the same pin for the other
     write routes; this route's copy lives here. */
  it("★ never READS the session cookie: the token comes from the body and only the body", () => {
    const source = readFileSync(
      joinPath(process.cwd(), "src/app/api/guests/email/route.ts"),
      "utf8",
    );
    expect(source).not.toContain("readGuestSessionCookie");
    expect(source).toContain("guestSessionCookieIfChanged");
  });
});
