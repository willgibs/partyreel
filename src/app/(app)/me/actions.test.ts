import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE INVITATION'S LIGHT, ASKED FOR BY THE PLATE (`account-moments` r2, `invite=plate`). Pinned: it hands over what the read
 * found, takes no argument (there is no identity to point it at), and a read that fails answers null and is recorded, so the
 * plate stands lit in the house's ember instead of the failure reaching her page.
 */

vi.mock("server-only", () => ({}));

const getInviteLight = vi.fn();
const captureError = vi.fn();
vi.mock("@/lib/db/queries/invite-light", () => ({
  getInviteLight: () => getInviteLight(),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

const { readInviteLightAction } = await import("./actions");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readInviteLightAction", () => {
  it("hands over her photographs' previews and her seed", async () => {
    getInviteLight.mockResolvedValue({ photos: ["a"], seed: "s" });
    expect(await readInviteLightAction()).toEqual({ photos: ["a"], seed: "s" });
  });

  it("takes no argument: there is no identity to point it at", () => {
    expect(readInviteLightAction.length).toBe(0);
  });

  it("★ answers null for nobody signed in", async () => {
    getInviteLight.mockResolvedValue(null);
    expect(await readInviteLightAction()).toBeNull();
  });

  it("★ takes a failed read as nothing to light from, and records it", async () => {
    const boom = new Error("boom");
    getInviteLight.mockRejectedValue(boom);
    expect(await readInviteLightAction()).toBeNull();
    expect(captureError).toHaveBeenCalledWith("media", boom, {
      seam: "invite_light_read",
    });
  });
});
