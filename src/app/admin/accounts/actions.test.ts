/**
 * THE OPERATOR'S ACCOUNT ACTIONS ANSWER ONLY AN ADMIN AT AAL2 (lp/account-exit). A Server Function
 * is a public endpoint, so the portal's layout gate is no guard for these: each asks
 * `requireAdminAction()` itself, before it reads or writes anything. Pinned through the REAL seam
 * (its reads stubbed beneath it, as admin-context.test.ts does): signed out, a signed-in
 * non-admin and an admin who has not stepped up to her second factor are refused, and the
 * cancellation never runs; an admin at AAL2 gets through, and the act leaves its audit line.
 *
 * ★ AND THE RETRY OF A STUCK PASS-TO-PRO CREDIT (credit-watch): the same seam first; then the claim must be this
 * account's and the session Stripe holds must carry this account's credit, read through the webhook's own parse, before
 * the webhook's own path runs; each outcome is said in words, and the act is audited.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  isAdmin: false,
  aal: "aal1" as "aal1" | "aal2",
  cancelAccountDeletion: vi.fn(),
  requestAccountDeletion: vi.fn(),
  captureWarning: vi.fn(),
  captureError: vi.fn(),
  /** The claim the Retry reads by its checkout (null: none). */
  claim: null as { stripe_session_id: string; profile_id: string } | null,
  /** The checkout session Stripe answers, or the error it throws. */
  session: null as unknown,
  retrieved: [] as string[],
  honor: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/surface", () => ({ servesAdmin: () => true }));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: state.captureError,
  captureWarning: state.captureWarning,
}));
vi.mock("@/lib/db/queries/pass-credits", () => ({
  readPassCredit: async (sessionId: string) =>
    state.claim?.stripe_session_id === sessionId ? state.claim : null,
}));
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: async (id: string) => {
          state.retrieved.push(id);
          if (state.session instanceof Error) throw state.session;
          return state.session;
        },
      },
    },
  }),
}));
// The webhook's own credit path, run by the Retry: its parse is the real one, its honouring a stand-in whose outcome
// each case names (the path itself is the webhook's tests').
vi.mock("@/app/api/stripe/webhook/pass-credit", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/app/api/stripe/webhook/pass-credit")
  >()),
  honorPassCredit: (...args: unknown[]) => state.honor(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({
          data: { currentLevel: state.aal, nextLevel: "aal2" },
        }),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: state.user ? { is_admin: state.isAdmin } : null,
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/db/mutations/account", () => ({
  cancelAccountDeletion: (...args: unknown[]) =>
    state.cancelAccountDeletion(...args),
  requestAccountDeletion: (...args: unknown[]) =>
    state.requestAccountDeletion(...args),
}));
vi.mock("@/lib/db/queries/accounts", () => ({
  getAccountDetail: async () => ({
    profile: { id: "target", email: "target@example.com" },
  }),
}));

const {
  cancelAccountDeletionAsOperatorAction,
  deleteAccountAsOperatorAction,
  retryPassCreditAsOperatorAction,
} = await import("@/app/admin/accounts/actions");

const TARGET = "7d0c1f3e-2b4a-4c5d-8e6f-708192a3b4c5";

beforeEach(() => {
  state.user = null;
  state.isAdmin = false;
  state.aal = "aal1";
  state.cancelAccountDeletion.mockReset().mockResolvedValue({ ok: true });
  state.requestAccountDeletion.mockReset().mockResolvedValue({ ok: true });
  state.captureWarning.mockReset();
  state.captureError.mockReset();
  state.claim = null;
  state.session = null;
  state.retrieved = [];
  state.honor.mockReset().mockResolvedValue("converted");
});

describe("Cancel deletion's guard", () => {
  it("★ refuses the signed-out", async () => {
    await expect(
      cancelAccountDeletionAsOperatorAction(TARGET),
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });
    expect(state.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("★ refuses a signed-in account that is not an admin", async () => {
    state.user = { id: "someone", email: "someone@example.com" };
    state.aal = "aal2";
    await expect(
      cancelAccountDeletionAsOperatorAction(TARGET),
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });
    expect(state.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("★ refuses an admin without her second factor (AAL1), saying so", async () => {
    state.user = { id: "operator-1", email: "op@example.com" };
    state.isAdmin = true;
    const result = await cancelAccountDeletionAsOperatorAction(TARGET);
    expect(result).toMatchObject({ ok: false, code: "unauthorized" });
    expect(!result.ok && result.message).toMatch(/second factor/);
    expect(state.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("★ runs for an admin at AAL2, and leaves the audit line naming who and whom", async () => {
    state.user = { id: "operator-1", email: "op@example.com" };
    state.isAdmin = true;
    state.aal = "aal2";
    await expect(
      cancelAccountDeletionAsOperatorAction(TARGET),
    ).resolves.toEqual({ ok: true });
    expect(state.cancelAccountDeletion).toHaveBeenCalledWith(TARGET);
    expect(state.captureWarning).toHaveBeenCalledWith(
      "admin",
      "operator_cancelled_account_deletion",
      { user_id: TARGET, operator_id: "operator-1" },
    );
  });

  it("reads no account for an id that is not one", async () => {
    state.user = { id: "operator-1", email: "op@example.com" };
    state.isAdmin = true;
    state.aal = "aal2";
    await expect(
      cancelAccountDeletionAsOperatorAction("not-a-uuid'); drop table"),
    ).resolves.toMatchObject({ ok: false, message: "No such account." });
    expect(state.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("passes on what the cancellation refused, and audits nothing", async () => {
    state.user = { id: "operator-1", email: "op@example.com" };
    state.isAdmin = true;
    state.aal = "aal2";
    state.cancelAccountDeletion.mockResolvedValue({
      ok: false,
      code: "purge_running",
      message:
        "The nightly purge is running right now. Nothing changed: try again in a few minutes.",
    });
    await expect(
      cancelAccountDeletionAsOperatorAction(TARGET),
    ).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining("purge is running"),
    });
    expect(state.captureWarning).not.toHaveBeenCalled();
  });
});

describe("Delete account's guard, the same seam", () => {
  it("refuses an admin without her second factor", async () => {
    state.user = { id: "operator-1", email: "op@example.com" };
    state.isAdmin = true;
    await expect(
      deleteAccountAsOperatorAction(TARGET, "target@example.com"),
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });
    expect(state.requestAccountDeletion).not.toHaveBeenCalled();
  });
});

describe("the Retry of a stuck pass-to-Pro credit (credit-watch)", () => {
  const SESSION = "cs_test_a1B2c3D4";
  const PASS_A = "00000000-0000-4000-8000-00000000000a";
  const PASS_B = "00000000-0000-4000-8000-00000000000b";

  function atAal2() {
    state.user = { id: "operator-1", email: "op@example.com" };
    state.isAdmin = true;
    state.aal = "aal2";
  }

  /** Her claim, and the credited Pro checkout Stripe holds for it. */
  function stuckCredit(over: Record<string, unknown> = {}) {
    state.claim = { stripe_session_id: SESSION, profile_id: TARGET };
    state.session = {
      id: SESSION,
      object: "checkout.session",
      mode: "subscription",
      client_reference_id: TARGET,
      customer: "cus_target",
      created: 1_790_000_000,
      metadata: {
        plan_id: "pro_200",
        pass_credit_cents: "1850",
        credited_pass_count: "2",
        credited_pass_ids: `${PASS_A},${PASS_B}`,
      },
      ...over,
    };
  }

  it("★ refuses an admin without her second factor, reading nothing and running nothing", async () => {
    state.user = { id: "operator-1", email: "op@example.com" };
    state.isAdmin = true;
    stuckCredit();
    await expect(
      retryPassCreditAsOperatorAction(TARGET, SESSION),
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });
    expect(state.retrieved).toEqual([]);
    expect(state.honor).not.toHaveBeenCalled();
  });

  it("★ runs the webhook's own path with the session Stripe holds, read as the webhook reads it, and audits who, whom and what came of it", async () => {
    atAal2();
    stuckCredit();
    await expect(
      retryPassCreditAsOperatorAction(TARGET, SESSION),
    ).resolves.toEqual({ ok: true });
    expect(state.retrieved).toEqual([SESSION]);
    expect(state.honor).toHaveBeenCalledWith({
      userId: TARGET,
      customerId: "cus_target",
      sessionId: SESSION,
      creditCents: 1850,
      passIds: [PASS_A, PASS_B],
      sessionCreated: 1_790_000_000,
    });
    expect(state.captureWarning).toHaveBeenCalledWith(
      "admin",
      "operator_retried_pass_credit",
      {
        user_id: TARGET,
        session_id: SESSION,
        outcome: "converted",
        operator_id: "operator-1",
      },
    );
  });

  it("a claim another checkout's credit overtook is settled, which is done too", async () => {
    atAal2();
    stuckCredit();
    state.honor.mockResolvedValue("overlap");
    await expect(
      retryPassCreditAsOperatorAction(TARGET, SESSION),
    ).resolves.toEqual({ ok: true });
  });

  it("★ a lease held right now is said in words, never a success", async () => {
    atAal2();
    stuckCredit();
    state.honor.mockResolvedValue("busy_this_checkout");
    const mine = await retryPassCreditAsOperatorAction(TARGET, SESSION);
    expect(mine).toMatchObject({ ok: false });
    expect(!mine.ok && mine.message).toMatch(/delivery of this checkout holds/);
    state.honor.mockResolvedValue("busy_another_checkout");
    const theirs = await retryPassCreditAsOperatorAction(TARGET, SESSION);
    expect(!theirs.ok && theirs.message).toMatch(
      /Another checkout's credit holds/,
    );
  });

  it("★ never runs for a claim that is not this account's, nor reads Stripe for one", async () => {
    atAal2();
    stuckCredit();
    state.claim = { stripe_session_id: SESSION, profile_id: "someone-else" };
    const result = await retryPassCreditAsOperatorAction(TARGET, SESSION);
    expect(result).toMatchObject({ ok: false });
    expect(!result.ok && result.message).toMatch(/holds no credit/);
    expect(state.retrieved).toEqual([]);
    expect(state.honor).not.toHaveBeenCalled();
  });

  it("★ never runs when Stripe's session carries no credit, names no pass, or is another account's", async () => {
    atAal2();
    stuckCredit({ metadata: { plan_id: "pro_200" } });
    const none = await retryPassCreditAsOperatorAction(TARGET, SESSION);
    expect(!none.ok && none.message).toMatch(/no pass credit/);
    stuckCredit({
      metadata: { plan_id: "pro_200", pass_credit_cents: "1850" },
    });
    const unnamed = await retryPassCreditAsOperatorAction(TARGET, SESSION);
    expect(!unnamed.ok && unnamed.message).toMatch(/names no pass/);
    stuckCredit({
      client_reference_id: "6d0c1f3e-2b4a-4c5d-8e6f-708192a3b4c5",
    });
    const theirs = await retryPassCreditAsOperatorAction(TARGET, SESSION);
    expect(!theirs.ok && theirs.message).toMatch(/another account's/);
    expect(state.honor).not.toHaveBeenCalled();
  });

  it("reads nothing for an id or a session that is not one", async () => {
    atAal2();
    stuckCredit();
    for (const [user, session] of [
      ["not-a-uuid", SESSION],
      [TARGET, "pi_123"],
      [TARGET, "cs_test_x/../../v1/customers"],
      [TARGET, ""],
    ]) {
      await expect(
        retryPassCreditAsOperatorAction(user, session),
      ).resolves.toMatchObject({ ok: false, message: "No such credit." });
    }
    expect(state.retrieved).toEqual([]);
  });

  it("a failure anywhere is said, captured, and audits nothing", async () => {
    atAal2();
    stuckCredit();
    state.session = new Error("Stripe is unreachable");
    const result = await retryPassCreditAsOperatorAction(TARGET, SESSION);
    expect(!result.ok && result.message).toMatch(/retry failed/);
    expect(state.captureError).toHaveBeenCalledTimes(1);
    expect(state.captureWarning).not.toHaveBeenCalled();
  });
});
