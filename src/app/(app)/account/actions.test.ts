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
  countMyUploadsElsewhere: vi.fn(),
  user: { id: "user-1", email: "maya@example.com" } as {
    id: string;
    email: string;
  } | null,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db/mutations/account", () => ({
  removeMyNewsletterSignup: vi.fn(),
  requestAccountDeletion: (...args: unknown[]) => {
    state.order.push("delete");
    return state.requestAccountDeletion(...args);
  },
  countMyUploadsElsewhere: () => state.countMyUploadsElsewhere(),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
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
      getUser: async () => ({ data: { user: state.user } }),
      verifyOtp: vi.fn(),
      signOut: (options: unknown) => {
        state.order.push("signOut");
        return state.signOut(options);
      },
    },
  }),
}));

const { deleteMyAccountAction, getDeletionFactsAction } =
  await import("@/app/(app)/account/actions");

const STAMP = "2026-10-02T19:00:00.000Z";

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
    requestedAt: STAMP,
    eventsBinned: 2,
    newsletterRemoved: 0,
    uploadsRemoved: 0,
    subscription: { status: "none" },
  });
  state.countMyUploadsElsewhere.mockReset();
  state.countMyUploadsElsewhere.mockResolvedValue({ photos: 12, videos: 1 });
  state.user = { id: "user-1", email: "maya@example.com" };
});

describe("deleteMyAccountAction's sign-out", () => {
  it("★ ends every session the account holds, and only once the deletion was accepted", async () => {
    const result = await deleteMyAccountAction({
      method: "password",
      password: "correct horse",
    });
    // The purge that finishes it is the first window after the stamp (04:00 to 05:00 UTC).
    expect(result).toEqual({ ok: true, purgeBy: "2026-10-03T05:00:00.000Z" });
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

/**
 * HER CHOICE RIDES BESIDE THE PROOF (lp/account-exit): the removal of her uploads in other people's
 * albums is off unless she turned it on, reaches the request as a plain boolean whatever the client
 * sent, and a removal that left anything behind refuses the deletion and signs nobody out.
 */
describe("deleteMyAccountAction's choices", () => {
  it("is off unless she turned it on", async () => {
    await deleteMyAccountAction({ method: "password", password: "pw" });
    expect(state.requestAccountDeletion).toHaveBeenCalledWith({
      userId: "user-1",
      actor: "self",
      removeUploadsElsewhere: false,
    });
  });

  it("carries her choice as a boolean, never whatever else rode the request", async () => {
    await deleteMyAccountAction(
      { method: "password", password: "pw" },
      { removeUploadsElsewhere: "yes please" as unknown as boolean },
    );
    expect(state.requestAccountDeletion).toHaveBeenLastCalledWith(
      expect.objectContaining({ removeUploadsElsewhere: false }),
    );
    await deleteMyAccountAction(
      { method: "password", password: "pw" },
      { removeUploadsElsewhere: true },
    );
    expect(state.requestAccountDeletion).toHaveBeenLastCalledWith(
      expect.objectContaining({ removeUploadsElsewhere: true }),
    );
  });

  it("a null where the choices go is no choice, never a crash after the proof", async () => {
    await expect(
      deleteMyAccountAction(
        { method: "password", password: "pw" },
        null as unknown as { removeUploadsElsewhere?: boolean },
      ),
    ).resolves.toMatchObject({ ok: true });
    expect(state.requestAccountDeletion).toHaveBeenLastCalledWith(
      expect.objectContaining({ removeUploadsElsewhere: false }),
    );
  });

  it("★ a removal that left anything behind refuses the deletion, and signs nobody out", async () => {
    state.requestAccountDeletion.mockResolvedValue({
      ok: false,
      code: "uploads",
      message:
        "We couldn't take all your photos out. Your account wasn't deleted.",
    });
    const result = await deleteMyAccountAction(
      { method: "password", password: "pw" },
      { removeUploadsElsewhere: true },
    );
    expect(result).toMatchObject({ ok: false, code: "uploads" });
    expect(state.signOut).not.toHaveBeenCalled();
  });
});

describe("getDeletionFactsAction", () => {
  it("answers the count and the purge's time on the server's clock", async () => {
    const result = await getDeletionFactsAction();
    expect(result).toMatchObject({
      ok: true,
      uploadsElsewhere: { photos: 12, videos: 1 },
    });
    if (!result.ok) throw new Error("expected facts");
    // A window's end: on the hour, 05:00 UTC, within 25 hours.
    const end = Date.parse(result.purgeBy);
    expect(new Date(end).toISOString()).toMatch(/T05:00:00\.000Z$/);
    expect(end - Date.now()).toBeGreaterThan(0);
    expect(end - Date.now()).toBeLessThanOrEqual(25 * 3_600_000);
  });

  it("answers nobody signed out, and counts nothing for them", async () => {
    state.user = null;
    await expect(getDeletionFactsAction()).resolves.toMatchObject({
      ok: false,
    });
    expect(state.countMyUploadsElsewhere).not.toHaveBeenCalled();
  });

  it("a count that failed is a failed answer, never a confident zero", async () => {
    state.countMyUploadsElsewhere.mockRejectedValue(new Error("db down"));
    await expect(getDeletionFactsAction()).resolves.toMatchObject({
      ok: false,
    });
  });
});
