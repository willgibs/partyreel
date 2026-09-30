import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE WRITE GATE ASKS THE PAGE'S OWN OWNER ANSWER (crumbs-28, from `owner-album`). A password album's three guest write
 * seams (the mint, the presign, the complete) pass its lock for the unlock cookie or the host, and the host was asked
 * inline here, with a client and a `getUser()` of its own, while the page, the album's reads and its routes asked
 * `isRequestOwner`. Pinned: the cookie passes on its own, and without it the answer is `isRequestOwner`'s and nothing
 * else's.
 *
 * The inline route is stood up too, answering "the host" for anyone, so a gate that still asked it would pass a
 * viewer the one owner answer refuses.
 */
vi.mock("server-only", () => ({}));
const isUnlocked = vi.fn();
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: (...a: unknown[]) => isUnlocked(...a),
}));
const isRequestOwner = vi.fn();
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: (...a: unknown[]) => isRequestOwner(...a),
}));
vi.mock("@/lib/events/gallery-access.server", () => ({
  isEventOwner: async () => true,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "someone" } } }) },
  }),
}));

const { mayUploadPastLock } = await import("./upload-lock");

beforeEach(() => {
  vi.clearAllMocks();
  isUnlocked.mockResolvedValue(false);
  isRequestOwner.mockResolvedValue(false);
});

describe("mayUploadPastLock", () => {
  it("passes on the unlock cookie alone, asking nothing more", async () => {
    isUnlocked.mockResolvedValue(true);
    expect(await mayUploadPastLock("evt-1")).toBe(true);
    expect(isRequestOwner).not.toHaveBeenCalled();
  });

  it("★ without the cookie, the host passes by the one owner answer", async () => {
    isRequestOwner.mockResolvedValue(true);
    expect(await mayUploadPastLock("evt-1")).toBe(true);
    expect(isRequestOwner).toHaveBeenCalledWith("evt-1");
  });

  it("★ and anyone that answer refuses is refused, whatever an inline ask would say", async () => {
    expect(await mayUploadPastLock("evt-1")).toBe(false);
    expect(isRequestOwner).toHaveBeenCalledWith("evt-1");
  });
});
