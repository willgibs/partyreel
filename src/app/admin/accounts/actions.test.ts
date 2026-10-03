/**
 * THE OPERATOR'S ACCOUNT ACTIONS ANSWER ONLY AN ADMIN AT AAL2 (lp/account-exit). A Server Function
 * is a public endpoint, so the portal's layout gate is no guard for these: each asks
 * `requireAdminAction()` itself, before it reads or writes anything. Pinned through the REAL seam
 * (its reads stubbed beneath it, as admin-context.test.ts does): signed out, a signed-in
 * non-admin and an admin who has not stepped up to her second factor are refused, and the
 * cancellation never runs; an admin at AAL2 gets through, and the act leaves its audit line.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  isAdmin: false,
  aal: "aal1" as "aal1" | "aal2",
  cancelAccountDeletion: vi.fn(),
  requestAccountDeletion: vi.fn(),
  captureWarning: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/surface", () => ({ servesAdmin: () => true }));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: state.captureWarning,
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

const { cancelAccountDeletionAsOperatorAction, deleteAccountAsOperatorAction } =
  await import("@/app/admin/accounts/actions");

const TARGET = "7d0c1f3e-2b4a-4c5d-8e6f-708192a3b4c5";

beforeEach(() => {
  state.user = null;
  state.isAdmin = false;
  state.aal = "aal1";
  state.cancelAccountDeletion.mockReset().mockResolvedValue({ ok: true });
  state.requestAccountDeletion.mockReset().mockResolvedValue({ ok: true });
  state.captureWarning.mockReset();
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
