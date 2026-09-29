/**
 * THE DEVICE SIGN-OUT SAYS A REFUSAL (crumbs-14). The account menu's and the admin bar's forms post
 * `signOutHere`, which runs the server action and, when it comes back refused (the session still
 * standing), says so; success has already left for /login and says nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  signOutAction: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/app/(auth)/actions", () => ({
  signOutAction: () => state.signOutAction(),
}));
vi.mock("sonner", () => ({ toast: { error: state.error } }));

const { signOutHere } = await import("./sign-out");

beforeEach(() => {
  state.signOutAction.mockReset();
  state.error.mockReset();
});

describe("signOutHere", () => {
  it("★ says a refusal, in the action's own words", async () => {
    state.signOutAction.mockResolvedValue({
      ok: false,
      message: "Couldn't sign out. Check your connection and try again.",
    });
    await signOutHere();
    expect(state.signOutAction).toHaveBeenCalledTimes(1);
    expect(state.error).toHaveBeenCalledWith(
      "Couldn't sign out. Check your connection and try again.",
    );
  });

  it("says nothing when the action has left for /login", async () => {
    state.signOutAction.mockResolvedValue(undefined);
    await signOutHere();
    expect(state.error).not.toHaveBeenCalled();
  });
});
