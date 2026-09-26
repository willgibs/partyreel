/**
 * THE NEWSLETTER CAPTURE, AND THE CRACK IT CLOSES.
 *
 * `capture_guest_email` writes into `guests.email`, the column whose single invariant is "CONFIRMED,
 * the row's own account's address". Two readers treat it as proof: `upload_forensics.guest_email`,
 * and the uploader resolver, whose verified case the host's credit prints (no client role reads
 * `guests` at all since the guests grant tidy, 20260922213000). This route derives the address
 * from the session rather than the body, which closes the victim-poisoning surface, but a test on
 * `user.email` alone would leave a crack: an UNCONFIRMED sign-up carries a perfectly real
 * `user.email`, so anyone could sign up as someone else's address, decline to confirm it, and walk
 * it into the proved column through here.
 *
 * `email_confirmed_at` is the only thing that means verified anywhere in the identity model, so it
 * is the test here too. An unproved address has its own home (`guests.pending_email`) and reaches
 * `guests.email` only by a claim that proves it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const rpc = vi.fn();
const recordAbuseEvent = vi.fn().mockResolvedValue(undefined);
const checkAbuseRate = vi
  .fn()
  .mockResolvedValue({ allowed: true, retryAfterSec: 0 });

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: (...args: unknown[]) => rpc(...args) }),
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: (...args: unknown[]) => checkAbuseRate(...args),
  recordAbuseEvent: (...args: unknown[]) => recordAbuseEvent(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: vi.fn() }));

const { POST } = await import("@/app/api/guests/capture-email/route");

const SESSION = "a".repeat(64);

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/capture-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  checkAbuseRate.mockResolvedValue({ allowed: true, retryAfterSec: 0 });
  rpc.mockResolvedValue({ error: null });
  getUser.mockResolvedValue({
    data: {
      user: {
        id: "u1",
        email: "alex@example.com",
        email_confirmed_at: "2026-09-21T15:00:00Z",
      },
    },
  });
});

describe("only a CONFIRMED session may write the proved column", () => {
  it("captures for a confirmed account, from the SESSION's address and never the body's", async () => {
    const res = await post({
      session_token: SESSION,
      newsletter_opt_in: true,
      email: "victim@example.com",
    });
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("capture_guest_email", {
      p_session_token: SESSION,
      p_email: "alex@example.com",
      p_newsletter_opt_in: true,
    });
  });

  it("★ 401s an UNCONFIRMED sign-up, and never calls the RPC", async () => {
    // The crack. A real user id, a real `user.email`, and nothing proved.
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "u2",
          email: "someone-elses@example.com",
          email_confirmed_at: null,
        },
      },
    });
    const res = await post({ session_token: SESSION });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      code: "unauthorized",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("401s a signed-out visitor and a session with no address at all", async () => {
    for (const user of [null, { id: "u3", email: null }]) {
      vi.clearAllMocks();
      getUser.mockResolvedValue({ data: { user } });
      const res = await post({ session_token: SESSION });
      expect(res.status).toBe(401);
      expect(rpc).not.toHaveBeenCalled();
    }
  });

  it("the refusal comes BEFORE the body is even read", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u2", email: "x@y.io", email_confirmed_at: null } },
    });
    const res = await POST(
      new Request("https://partyreel.com/api/guests/capture-email", {
        method: "POST",
        body: "{",
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("the capability still has to be there", () => {
  it("400s without a session token, even for a confirmed account", async () => {
    for (const body of [{}, { session_token: "" }, { session_token: 42 }]) {
      vi.clearAllMocks();
      rpc.mockResolvedValue({ error: null });
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(rpc).not.toHaveBeenCalled();
    }
  });
});

describe("best effort, never a visible failure", () => {
  it("a DB error answers 200 (the caller swallows it; a newsletter write is not the guest's problem)", async () => {
    rpc.mockResolvedValue({ error: { message: "nope" } });
    const res = await post({ session_token: SESSION });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: false, code: "failed" });
    expect(recordAbuseEvent).not.toHaveBeenCalled();
  });

  it("429s a tripped limiter before touching the RPC", async () => {
    checkAbuseRate.mockResolvedValue({ allowed: false, retryAfterSec: 3600 });
    const res = await post({ session_token: SESSION });
    expect(res.status).toBe(429);
    expect(rpc).not.toHaveBeenCalled();
  });
});
