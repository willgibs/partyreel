import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A FOLLOW SAYS WHETHER IT WAS HER FIRST (`account-moments` r2, `follow=once`, Will 2026-10-07: her first follow ever
 * shows the private line, every follow after is the button alone). Pinned: the answer is read BEFORE the write (after
 * it her list always holds the follow just made, so every follow would read as the second); only a follow that landed
 * carries it; an unfollow, a block and an unblock never do; a read that fails is "not her first" and is recorded, and
 * never fails the follow; and every landed write still revalidates the pages a relation shapes.
 */

vi.mock("server-only", () => ({}));

/** Every call that matters, in the order it happened. */
const trail: string[] = [];
const followsNoOne = vi.fn();
const followUser = vi.fn();
const unfollowUser = vi.fn();
const blockUser = vi.fn();
const unblockUser = vi.fn();
const revalidatePath = vi.fn();
const captureError = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));
vi.mock("@/lib/db/queries/first-follow", () => ({
  followsNoOne: () => followsNoOne(),
}));
vi.mock("@/lib/db/mutations/social", () => ({
  followUser: (...args: unknown[]) => followUser(...args),
  unfollowUser: (...args: unknown[]) => unfollowUser(...args),
  blockUser: (...args: unknown[]) => blockUser(...args),
  unblockUser: (...args: unknown[]) => unblockUser(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

const {
  blockProfileAction,
  followProfileAction,
  unblockProfileAction,
  unfollowProfileAction,
} = await import("./actions");

beforeEach(() => {
  vi.clearAllMocks();
  trail.length = 0;
  followsNoOne.mockImplementation(async () => {
    trail.push("read");
    return true;
  });
  for (const [name, fn] of Object.entries({
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
  })) {
    fn.mockImplementation(async () => {
      trail.push(name);
      return { ok: true, data: { id: "maya" } };
    });
  }
});

describe("a follow", () => {
  it("★ is the first when her list was empty, and says so only once the write landed", async () => {
    expect(await followProfileAction("maya")).toEqual({
      ok: true,
      first: true,
    });
    expect(followUser).toHaveBeenCalledWith("maya");
  });

  it("★ reads her list BEFORE it writes: afterwards the list holds the follow just made", async () => {
    await followProfileAction("maya");
    expect(trail).toEqual(["read", "followUser"]);
  });

  it("is the button alone once she follows anyone: no first on the answer", async () => {
    followsNoOne.mockResolvedValue(false);
    expect(await followProfileAction("maya")).toEqual({ ok: true });
  });

  it("never says first for a follow that did not land, and says what went wrong", async () => {
    followUser.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "Couldn't follow right now. Please try again.",
    });
    expect(await followProfileAction("maya")).toEqual({
      ok: false,
      message: "Couldn't follow right now. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("★ takes a read that fails as not her first, still follows, and records the failure", async () => {
    const boom = new Error("boom");
    followsNoOne.mockRejectedValue(boom);
    expect(await followProfileAction("maya")).toEqual({ ok: true });
    expect(followUser).toHaveBeenCalledWith("maya");
    expect(captureError).toHaveBeenCalledWith("account", boom, {
      seam: "first_follow_read",
    });
  });

  it("revalidates every profile and Account, as every landed write does", async () => {
    await followProfileAction("maya");
    expect(revalidatePath).toHaveBeenCalledWith("/u/[slug]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });
});

describe("the other three writes", () => {
  it.each([
    ["unfollow", unfollowProfileAction],
    ["block", blockProfileAction],
    ["unblock", unblockProfileAction],
  ])(
    "%s never asks whether it was her first, and never says it",
    async (_, act) => {
      expect(await act("maya")).toEqual({ ok: true });
      expect(followsNoOne).not.toHaveBeenCalled();
    },
  );
});
