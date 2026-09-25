/**
 * THE EMAIL CHANGE'S SERVER FUNCTIONS REFUSE IN WORDS, AND NEVER TAKE AN ADDRESS TO CHECK A CODE
 * AGAINST (lp/identity-email).
 *
 *   ★ getUser(), never getSession(): no user, no call to Supabase Auth at all.
 *   ★ An address that already has an account is answered EXACTLY like a sent one (no oracle).
 *   ★ A code is verified against the address that received it, read off the caller's own auth user
 *     (`email` for the current side, `new_email` for the new one), never one the request names.
 *   ★ The first confirmation is `half`; only the second completes, revalidates the page and hands
 *     the Stripe customer's copy to after().
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type AuthError = { code?: string; status?: number; message: string };

const state = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    email?: string;
    new_email?: string;
  },
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  syncBillingEmail: vi.fn(async () => ({ status: "updated" })),
  afterCallbacks: [] as (() => unknown)[],
  revalidatePath: vi.fn(),
  headers: new Map<string, string>(),
}));

vi.mock("next/cache", () => ({ revalidatePath: state.revalidatePath }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => state.headers.get(k) ?? null }),
}));
vi.mock("next/server", () => ({
  after: (cb: () => unknown) => {
    state.afterCallbacks.push(cb);
  },
}));
vi.mock("@/lib/stripe/customer-email", () => ({
  syncBillingEmail: state.syncBillingEmail,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: state.getUser,
      getSession: state.getSession,
      updateUser: state.updateUser,
      verifyOtp: state.verifyOtp,
    },
  }),
}));

const { confirmEmailChangeAction, requestEmailChangeAction } =
  await import("./email-actions");

const ME = { id: "user-1", email: "old@example.com" };

beforeEach(() => {
  state.user = { ...ME };
  state.getUser.mockReset();
  state.getUser.mockImplementation(async () => ({
    data: { user: state.user },
    error: null,
  }));
  state.getSession.mockReset();
  state.updateUser.mockReset();
  state.updateUser.mockResolvedValue({ data: { user: ME }, error: null });
  state.verifyOtp.mockReset();
  state.syncBillingEmail.mockClear();
  state.afterCallbacks = [];
  state.revalidatePath.mockClear();
  state.headers = new Map([
    ["host", "partyreel.com"],
    ["x-forwarded-proto", "https"],
  ]);
});

function authError(err: AuthError) {
  return { data: { user: null, session: null }, error: err };
}

describe("requestEmailChangeAction", () => {
  it("asks Supabase Auth for the change, with the link coming back to this host's callback", async () => {
    await expect(
      requestEmailChangeAction("  New@Example.com "),
    ).resolves.toEqual({
      ok: true,
      pending: "new@example.com",
    });
    expect(state.updateUser).toHaveBeenCalledWith(
      { email: "new@example.com" },
      {
        emailRedirectTo:
          "https://partyreel.com/auth/callback?next=/account&flow=email_change",
      },
    );
    expect(state.getSession).not.toHaveBeenCalled();
  });

  it("returns the link to the host the request came in on (the alias, localhost), never the apex", async () => {
    state.headers = new Map([["host", "localhost:3135"]]);
    await requestEmailChangeAction("new@example.com");
    expect(state.updateUser.mock.calls[0][1]).toEqual({
      emailRedirectTo:
        "http://localhost:3135/auth/callback?next=/account&flow=email_change",
    });
  });

  it("refuses without a signed-in user, before Supabase Auth hears anything", async () => {
    state.user = null;
    await expect(
      requestEmailChangeAction("new@example.com"),
    ).resolves.toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(state.updateUser).not.toHaveBeenCalled();
  });

  it("refuses what is not an address, in words", async () => {
    await expect(requestEmailChangeAction("not-an-address")).resolves.toEqual({
      ok: false,
      code: "validation",
      message: "Enter a valid email address.",
    });
    expect(state.updateUser).not.toHaveBeenCalled();
  });

  it("refuses the address the account already has, whatever its case", async () => {
    await expect(requestEmailChangeAction("OLD@example.com")).resolves.toEqual({
      ok: false,
      code: "same",
      message: "That's already your email.",
    });
    expect(state.updateUser).not.toHaveBeenCalled();
  });

  it("★ answers an address that already has an account exactly like a sent one", async () => {
    state.updateUser.mockResolvedValue(
      authError({
        code: "email_exists",
        status: 422,
        message: "A user with this email address has already been registered",
      }),
    );
    const taken = await requestEmailChangeAction("taken@example.com");
    state.updateUser.mockResolvedValue({ data: { user: ME }, error: null });
    const free = await requestEmailChangeAction("free@example.com");
    expect(taken).toEqual({ ok: true, pending: "taken@example.com" });
    expect(Object.keys(taken).sort()).toEqual(Object.keys(free).sort());
  });

  it("names the wait when the email limiter fires, with GoTrue's own seconds", async () => {
    state.updateUser.mockResolvedValue(
      authError({
        code: "over_email_send_rate_limit",
        status: 429,
        message:
          "For security purposes, you can only request this after 41 seconds.",
      }),
    );
    await expect(requestEmailChangeAction("new@example.com")).resolves.toEqual({
      ok: false,
      code: "rate_limited",
      message: "Too many tries for now. Try again in 41 seconds.",
      seconds: 41,
    });
  });

  it("maps an address GoTrue will not take to a validation line, and anything else to a retry", async () => {
    state.updateUser.mockResolvedValue(
      authError({ code: "email_address_invalid", status: 400, message: "x" }),
    );
    await expect(
      requestEmailChangeAction("new@example.com"),
    ).resolves.toMatchObject({
      ok: false,
      code: "validation",
    });
    state.updateUser.mockResolvedValue(
      authError({ code: "unexpected_failure", status: 500, message: "boom" }),
    );
    await expect(requestEmailChangeAction("new@example.com")).resolves.toEqual({
      ok: false,
      code: "error",
      message: "We couldn't send the codes. Try again in a minute.",
    });
  });
});

describe("confirmEmailChangeAction", () => {
  beforeEach(() => {
    state.user = { ...ME, new_email: "new@example.com" };
  });

  it("★ checks the current side against the account's OWN address", async () => {
    state.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    await expect(
      confirmEmailChangeAction("current", "123456"),
    ).resolves.toEqual({
      ok: true,
      state: "half",
      confirmed: "current",
    });
    expect(state.verifyOtp).toHaveBeenCalledWith({
      type: "email_change",
      email: "old@example.com",
      token: "123456",
    });
  });

  it("★ checks the new side against the account's OWN pending address", async () => {
    state.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    await confirmEmailChangeAction("new", "654321");
    expect(state.verifyOtp).toHaveBeenCalledWith({
      type: "email_change",
      email: "new@example.com",
      token: "654321",
    });
  });

  it("★ a side that is not one of the two is refused, so no address can ride in its place", async () => {
    const result = await confirmEmailChangeAction(
      "attacker@example.com" as never,
      "123456",
    );
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(state.verifyOtp).not.toHaveBeenCalled();
  });

  it("the first confirmation is half: no revalidation, no Stripe", async () => {
    state.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    await confirmEmailChangeAction("new", "654321");
    expect(state.revalidatePath).not.toHaveBeenCalled();
    expect(state.afterCallbacks).toHaveLength(0);
  });

  it("the second completes: revalidates the page and hands the Stripe copy to after()", async () => {
    state.verifyOtp.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "new@example.com" },
        session: { access_token: "a", refresh_token: "r" },
      },
      error: null,
    });
    await expect(
      confirmEmailChangeAction("current", "123456"),
    ).resolves.toEqual({
      ok: true,
      state: "done",
      email: "new@example.com",
    });
    expect(state.revalidatePath).toHaveBeenCalledWith("/account");
    // Scheduled, not awaited: the response never waits on Stripe.
    expect(state.syncBillingEmail).not.toHaveBeenCalled();
    expect(state.afterCallbacks).toHaveLength(1);
    await state.afterCallbacks[0]();
    expect(state.syncBillingEmail).toHaveBeenCalledWith(
      "user-1",
      "new@example.com",
    );
  });

  it("refuses a malformed code before Supabase Auth hears it", async () => {
    for (const code of ["", "12345", "1234567", "12a456", " 12 34 "]) {
      await expect(
        confirmEmailChangeAction("new", code),
      ).resolves.toMatchObject({
        ok: false,
        code: "validation",
      });
    }
    expect(state.verifyOtp).not.toHaveBeenCalled();
  });

  it("refuses without a signed-in user", async () => {
    state.user = null;
    await expect(
      confirmEmailChangeAction("new", "123456"),
    ).resolves.toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(state.verifyOtp).not.toHaveBeenCalled();
  });

  it("says so when no change is waiting (finished elsewhere, or replaced)", async () => {
    state.user = { ...ME };
    await expect(
      confirmEmailChangeAction("current", "123456"),
    ).resolves.toMatchObject({
      ok: false,
      code: "no_change",
    });
    expect(state.verifyOtp).not.toHaveBeenCalled();
  });

  it("a wrong or expired code (GoTrue's one otp_expired) reads as one line with both ways out", async () => {
    state.verifyOtp.mockResolvedValue(
      authError({
        code: "otp_expired",
        status: 403,
        message: "Token has expired or is invalid",
      }),
    );
    await expect(confirmEmailChangeAction("new", "123456")).resolves.toEqual({
      ok: false,
      code: "wrong_code",
      message:
        "That code didn't work. Check the newest email to this address, or send new codes.",
    });
  });

  it("names the wait when the verification limiter fires", async () => {
    state.verifyOtp.mockResolvedValue(
      authError({
        code: "over_request_rate_limit",
        status: 429,
        message: "Request rate limit reached",
      }),
    );
    await expect(
      confirmEmailChangeAction("new", "123456"),
    ).resolves.toMatchObject({
      ok: false,
      code: "rate_limited",
    });
  });
});
