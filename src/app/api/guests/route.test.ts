/**
 * THE DOOR. Every join carries an identity, and which one is the host's switch: ON, a confirmed
 * email and nothing else; OFF, a typed name.
 *
 * Two things here are load-bearing beyond the happy path:
 *   ★ VERIFIED KEYS ON `email_confirmed_at`, NEVER ON A USER ID. An unconfirmed sign-up carries a
 *     perfectly real `user.id`, and a `user !== null` test would wave it through the very gate the
 *     ON switch exists to hold.
 *   ★ THE NAME REQUIREMENT IS THIS ROUTE'S. The database deliberately accepts a NAMELESS mint, so
 *     production survives a migration that lands hours ahead of the route; if this route stops
 *     asking, nothing else does.
 *
 * The door also carries an OPTIONAL address:
 *   ★ WHETHER, NEVER WHAT. The response says `email_attached` and must never carry the address
 *     itself — a host's own browser calls this route.
 *   ★ THE MINT SETTLES IT, NOT THE REQUEST. `email_attached` comes back from create_guest, which
 *     nulls a typed address beside a confirmed account and on a Require-verified-emails event.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const createGuest = vi.fn();
const getEventByQrToken = vi.fn();
const mayUploadPastLock = vi.fn().mockResolvedValue(true);
const getUser = vi.fn();

vi.mock("@/lib/db/mutations/guest", () => ({
  createGuest: (...args: unknown[]) => createGuest(...args),
}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));
vi.mock("@/lib/events/upload-lock", () => ({
  mayUploadPastLock: (...args: unknown[]) => mayUploadPastLock(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({ auth: { getUser } }),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: () => Promise.resolve({ allowed: true, retryAfterSec: 0 }),
  recordAbuseEvent: () => Promise.resolve(undefined),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: vi.fn() }));
// The door's session COOKIE is `server-only` and reads `next/headers`; neither exists in the unit
// world, so the module's two real dependencies are stubbed and the route's own use of it is
// asserted on the response instead.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const { POST } = await import("@/app/api/guests/route");

const TOKEN = "qr-token-1234";

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests", {
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

/** The event the door is standing at. */
function event(requireVerifiedEmail: boolean, visibility = "open") {
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: {
      id: "event-1",
      visibility,
      require_verified_email: requireVerifiedEmail,
    },
  });
}

/** The session the browser arrives with. */
function session(user: Record<string, unknown> | null) {
  getUser.mockResolvedValue({ data: { user } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mayUploadPastLock.mockResolvedValue(true);
  event(true);
  session(null);
  createGuest.mockResolvedValue({
    ok: true,
    data: {
      session_token: "s1",
      guest_id: "g1",
      event_id: "event-1",
      display_name: null,
      verified: true,
      emailAttached: false,
    },
  });
});

describe("Require verified emails ON", () => {
  it("422 verification_required for a signed-out visitor, and never mints", async () => {
    expect(await refusal({ qr_token: TOKEN })).toEqual({
      status: 422,
      code: "verification_required",
    });
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("★ 422 for an UNCONFIRMED account: a user id proves nothing", async () => {
    session({ id: "u1", email: "maya@example.com", email_confirmed_at: null });
    expect(await refusal({ qr_token: TOKEN })).toEqual({
      status: 422,
      code: "verification_required",
    });
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("★ a typed name cannot buy a way past the gate", async () => {
    expect(await refusal({ qr_token: TOKEN, display_name: "Maya J." })).toEqual(
      { status: 422, code: "verification_required" },
    );
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("mints for a confirmed session, passing the trusted user id and no name", async () => {
    session({
      id: "u1",
      email: "alex@example.com",
      email_confirmed_at: "2026-09-21T15:00:00Z",
    });
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(200);
    expect(createGuest).toHaveBeenCalledWith({
      qrToken: TOKEN,
      userId: "u1",
      unlockProven: false,
      displayName: null,
      pendingEmail: null,
    });
  });

  it("★ a typed address cannot buy a way past the gate either, and never reaches the mint", async () => {
    expect(
      await refusal({
        qr_token: TOKEN,
        display_name: "Maya J.",
        email: "maya@example.com",
      }),
    ).toEqual({ status: 422, code: "verification_required" });
    expect(createGuest).not.toHaveBeenCalled();
  });
});

describe("Require verified emails OFF: the name is the identity", () => {
  beforeEach(() => {
    event(false);
    createGuest.mockResolvedValue({
      ok: true,
      data: {
        session_token: "s1",
        guest_id: "g1",
        event_id: "event-1",
        display_name: "Maya J.",
        verified: false,
        emailAttached: false,
      },
    });
  });

  it("422 name_required when nothing was typed, and never mints a nameless row", async () => {
    for (const body of [
      { qr_token: TOKEN },
      { qr_token: TOKEN, display_name: "   " },
    ]) {
      expect(await refusal(body)).toEqual({
        status: 422,
        code: "name_required",
      });
    }
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("422 name_required when the DATABASE refuses a nameless mint (the belt under the route)", async () => {
    // A race the route cannot see, or a caller that reached create_guest without a name: the RPC's
    // own "Add your name to upload." comes back as name_required, never as the email step.
    createGuest.mockResolvedValue({
      ok: false,
      code: "name_required",
      message: "Add your name to upload.",
    });
    expect(await refusal({ qr_token: TOKEN, display_name: "Maya J." })).toEqual(
      { status: 422, code: "name_required" },
    );
  });

  it("422 name_invalid past 60 characters, for a reserved name, and for profanity", async () => {
    for (const display_name of ["x".repeat(61), "admin", "fuckface"]) {
      expect(await refusal({ qr_token: TOKEN, display_name })).toEqual({
        status: 422,
        code: "name_invalid",
      });
    }
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("mints under the TRIMMED name, and answers with the identity the DB settled on", async () => {
    const res = await post({ qr_token: TOKEN, display_name: "  Maya J.  " });
    expect(createGuest).toHaveBeenCalledWith({
      qrToken: TOKEN,
      userId: null,
      unlockProven: false,
      displayName: "Maya J.",
      pendingEmail: null,
    });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      session_token: "s1",
      event_id: "event-1",
      display_name: "Maya J.",
      verified: false,
      email_attached: false,
    });
  });

  it("a CONFIRMED visitor needs no name here either (their profile name is the identity)", async () => {
    session({
      id: "u1",
      email: "alex@example.com",
      email_confirmed_at: "2026-09-21T15:00:00Z",
    });
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(200);
    expect(createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", displayName: null }),
    );
  });

  /* ──────────────────────────────────────────────────────────────────────────
     THE OPTIONAL ADDRESS UNDER THE NAME.
     ────────────────────────────────────────────────────────────────────────── */

  it("★ passes the address to the mint LOWERCASED and trimmed (the claim finds rows by equality)", async () => {
    await post({
      qr_token: TOKEN,
      display_name: "Maya J.",
      email: "  Maya.J@Example.COM  ",
    });
    expect(createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ pendingEmail: "maya.j@example.com" }),
    );
  });

  it("422 email_invalid for a typed address that is not one, and never mints", async () => {
    for (const email of ["not-an-address", "maya@", "@example.com"]) {
      vi.clearAllMocks();
      expect(
        await refusal({ qr_token: TOKEN, display_name: "Maya J.", email }),
      ).toEqual({ status: 422, code: "email_invalid" });
      expect(createGuest).not.toHaveBeenCalled();
    }
  });

  it("a MISSING or BLANK address is not an error: the field is optional", async () => {
    for (const email of [undefined, "", "   "]) {
      vi.clearAllMocks();
      createGuest.mockResolvedValue({
        ok: true,
        data: {
          session_token: "s1",
          guest_id: "g1",
          event_id: "event-1",
          display_name: "Maya J.",
          verified: false,
          emailAttached: false,
        },
      });
      const res = await post({
        qr_token: TOKEN,
        display_name: "Maya J.",
        ...(email === undefined ? {} : { email }),
      });
      expect(res.status).toBe(200);
      expect(createGuest).toHaveBeenCalledWith(
        expect.objectContaining({ pendingEmail: null }),
      );
    }
  });

  it("★ answers WHETHER an address was stored, and NEVER the address itself", async () => {
    createGuest.mockResolvedValue({
      ok: true,
      data: {
        session_token: "s1",
        guest_id: "g1",
        event_id: "event-1",
        display_name: "Maya J.",
        verified: false,
        emailAttached: true,
      },
    });
    const res = await post({
      qr_token: TOKEN,
      display_name: "Maya J.",
      email: "maya@example.com",
    });
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      session_token: "s1",
      event_id: "event-1",
      display_name: "Maya J.",
      verified: false,
      email_attached: true,
    });
    expect(JSON.stringify(body)).not.toContain("maya@example.com");
    expect(JSON.stringify(body)).not.toContain("example.com");
  });

  it("★ a CONFIRMED session's typed address is ignored, and the mint's answer is what is rendered", async () => {
    // create_guest nulls a typed address beside a confirmed account, so the route must report the
    // DATABASE's answer and never echo the request's intent back at the door.
    session({
      id: "u1",
      email: "alex@example.com",
      email_confirmed_at: "2026-09-21T15:00:00Z",
    });
    createGuest.mockResolvedValue({
      ok: true,
      data: {
        session_token: "s1",
        guest_id: "g1",
        event_id: "event-1",
        display_name: null,
        verified: true,
        emailAttached: false,
      },
    });
    const res = await post({ qr_token: TOKEN, email: "someone@else.com" });
    expect(createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ pendingEmail: null, displayName: null }),
    );
    await expect(res.json()).resolves.toMatchObject({
      verified: true,
      email_attached: false,
    });
  });

  it("the guest_id never leaves the server", async () => {
    const res = await post({ qr_token: TOKEN, display_name: "Maya J." });
    expect(JSON.stringify(await res.json())).not.toContain("g1");
  });
});

describe("the mint's own refusals keep their statuses", () => {
  beforeEach(() => {
    session({
      id: "u1",
      email: "alex@example.com",
      email_confirmed_at: "2026-09-21T15:00:00Z",
    });
  });

  it.each([
    ["not_found", 404],
    ["verification_required", 422], // the host flipped the switch mid-join
    ["name_invalid", 422],
    ["email_invalid", 422], // the belt under guests_pending_email_shape
    ["unlock_required", 403],
    ["unauthorized", 403],
    ["unknown", 500],
  ])("maps %s to %i", async (code, status) => {
    createGuest.mockResolvedValue({ ok: false, code, message: "nope" });
    expect(await refusal({ qr_token: TOKEN })).toEqual({ status, code });
  });
});

describe("the read gate the write inherits still comes first", () => {
  it("403s a private event before asking for any identity", async () => {
    event(false, "private");
    expect(await refusal({ qr_token: TOKEN })).toEqual({
      status: 403,
      code: "unauthorized",
    });
  });

  it("403s a password event with no unlock proof, before the name is even read", async () => {
    event(false, "password");
    mayUploadPastLock.mockResolvedValue(false);
    expect(await refusal({ qr_token: TOKEN })).toEqual({
      status: 403,
      code: "unlock_required",
    });
    expect(createGuest).not.toHaveBeenCalled();
  });
});

/* ────────────────────────────────────────────────────────────────────────────
   THE SESSION COOKIE.

   Require an upload to view is resolved in the RSC and in the poll, and neither can read the
   localStorage copy of the session this route is about to hand back. The mint writes the
   server-readable half beside it.
   ──────────────────────────────────────────────────────────────────────────── */
describe("POST /api/guests: the session cookie", () => {
  it("a mint sets pr_guest_<eventId>, HttpOnly and scoped to the whole site", async () => {
    event(false);
    createGuest.mockResolvedValue({
      ok: true,
      data: {
        session_token: "a".repeat(64),
        guest_id: "g1",
        event_id: "event-1",
        display_name: "Priya",
        verified: false,
        emailAttached: false,
      },
    });
    const res = await post({ qr_token: TOKEN, display_name: "Priya" });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`pr_guest_event-1=${"a".repeat(64)}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("writes NOTHING that is not a 64-hex session token", async () => {
    event(false);
    createGuest.mockResolvedValue({
      ok: true,
      data: {
        session_token: "not-a-token",
        guest_id: "g1",
        event_id: "event-1",
        display_name: "Priya",
        verified: false,
        emailAttached: false,
      },
    });
    const res = await post({ qr_token: TOKEN, display_name: "Priya" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("a refused join sets no cookie at all", async () => {
    event(true);
    session(null);
    const res = await post({ qr_token: TOKEN });
    expect(res.status).toBe(422);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
