/**
 * THE DOOR (the identity reshape, 2026-09-21). Every join now carries an identity, and which one
 * is the host's switch: ON, a confirmed email and nothing else; OFF, a typed name.
 *
 * Two things here are load-bearing beyond the happy path:
 *   ★ VERIFIED KEYS ON `email_confirmed_at`, NEVER ON A USER ID (wave 0's finding). An unconfirmed
 *     sign-up carries a perfectly real `user.id`, and a `user !== null` test would wave it through
 *     the gate this whole reshape exists to build.
 *   ★ THE NAME REQUIREMENT IS THIS ROUTE'S. The database deliberately still accepts a NAMELESS
 *     mint, because production had to survive wave 0's migration by hours; if this route stops
 *     asking, nothing else does.
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
    });
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
    });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      session_token: "s1",
      event_id: "event-1",
      display_name: "Maya J.",
      verified: false,
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
    ["unlock_required", 403],
    ["unauthorized", 403],
    ["unknown", 500],
  ])("maps %s to %i", async (code, status) => {
    createGuest.mockResolvedValue({ ok: false, code, message: "nope" });
    expect(await refusal({ qr_token: TOKEN })).toEqual({ status, code });
  });
});

describe("the read gate the write inherits (QA #18) still comes first", () => {
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
