/**
 * A DELETED ACCOUNT KEEPS NO DEVICE SIGNED IN, and a refused deletion signs nobody out.
 *
 * The ban inside `requestAccountDeletion` is what normally ends every session, but it is
 * best-effort (captured, never fatal), so the action's own sign-out is global: when the ban landed
 * GoTrue answers it 403 and auth-js still clears this device's cookies; when the ban failed, it is
 * what revokes the account's other devices (auth-accounts.md, "Signing out"). It runs only after
 * the deletion was accepted, or a plan Stripe would not cancel would cost the person every session
 * for an account that is still there.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  order: [] as string[],
  signOut: vi.fn(),
  verifyCurrentPassword: vi.fn(),
  requestAccountDeletion: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db/mutations/account", () => ({
  removeMyNewsletterSignup: vi.fn(),
  requestAccountDeletion: (...args: unknown[]) => {
    state.order.push("delete");
    return state.requestAccountDeletion(...args);
  },
}));
vi.mock("@/lib/db/mutations/social", () => ({ setNotificationPrefs: vi.fn() }));
vi.mock("@/lib/db/queries/account", () => ({
  verifyCurrentPassword: (password: string) =>
    state.verifyCurrentPassword(password),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: "user-1", email: "maya@example.com" } },
      }),
      verifyOtp: vi.fn(),
      signOut: (options: unknown) => {
        state.order.push("signOut");
        return state.signOut(options);
      },
    },
  }),
}));

const { deleteMyAccountAction } = await import("@/app/(app)/account/actions");

beforeEach(() => {
  state.order.length = 0;
  state.signOut.mockReset();
  state.signOut.mockResolvedValue({ error: null });
  state.verifyCurrentPassword.mockReset();
  state.verifyCurrentPassword.mockResolvedValue(true);
  state.requestAccountDeletion.mockReset();
  state.requestAccountDeletion.mockResolvedValue({
    ok: true,
    alreadyRequested: false,
    eventsBinned: 2,
    newsletterRemoved: 0,
    subscription: { status: "none" },
  });
});

describe("deleteMyAccountAction's sign-out", () => {
  it("★ ends every session the account holds, and only once the deletion was accepted", async () => {
    const result = await deleteMyAccountAction({
      method: "password",
      password: "correct horse",
    });
    expect(result).toEqual({ ok: true });
    expect(state.signOut).toHaveBeenCalledTimes(1);
    expect(state.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(state.order).toEqual(["delete", "signOut"]);
  });

  it("★ signs nobody out when the deletion is refused (a plan Stripe would not cancel)", async () => {
    state.requestAccountDeletion.mockResolvedValue({
      ok: false,
      code: "subscription",
      message: "We couldn't cancel your plan. Nothing was deleted.",
    });
    const result = await deleteMyAccountAction({
      method: "password",
      password: "correct horse",
    });
    expect(result).toMatchObject({ ok: false, code: "subscription" });
    expect(state.signOut).not.toHaveBeenCalled();
  });

  it("signs nobody out when the proof fails", async () => {
    state.verifyCurrentPassword.mockResolvedValue(false);
    const result = await deleteMyAccountAction({
      method: "password",
      password: "wrong",
    });
    expect(result).toMatchObject({ ok: false, code: "verification" });
    expect(state.requestAccountDeletion).not.toHaveBeenCalled();
    expect(state.signOut).not.toHaveBeenCalled();
  });
});
