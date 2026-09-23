// @contract-for: src/lib/guest/claim-uploads.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE CLAIM SAYS WHERE IT CARRIED UPLOADS (guest by upload, 2026-09-22). On an album page the claim
 * is two calls, the album's own token first, so the album can tell its own uploads moving (the
 * follow moment) from other events' (the toast). What is pinned is that split, the silence the
 * album asks for, and that every caller's claim reaches whoever listens.
 */
const rpc = vi.fn();
const getSession = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession }, rpc }),
}));
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastSuccess(m) } }));

async function load() {
  vi.resetModules();
  const claims = await import("@/lib/guest/claim-uploads");
  const albums = await import("@/lib/guest/album-return");
  return { ...claims, ...albums };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
});

describe("claimAnonymousUploads", () => {
  it("on an album: its own token first, the rest after, and the result says which was which", async () => {
    const { claimAnonymousUploads, holdAlbum } = await load();
    localStorage.setItem("pr_session_album-1", "tok-here");
    localStorage.setItem("pr_session_other", "tok-there");
    rpc.mockResolvedValueOnce({ data: 1, error: null });
    rpc.mockResolvedValueOnce({ data: 2, error: null });
    const release = holdAlbum("album-1");

    const result = await claimAnonymousUploads({ silent: true });
    expect(rpc).toHaveBeenNthCalledWith(1, "claim_anonymous_uploads", {
      p_session_tokens: ["tok-here"],
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "claim_anonymous_uploads", {
      p_session_tokens: ["tok-there"],
    });
    expect(result).toEqual({ album: "album-1", here: 1, elsewhere: 2 });
    expect(toastSuccess).not.toHaveBeenCalled();
    release();
  });

  it("off an album: one call, and the loud toast when it carried uploads", async () => {
    const { claimAnonymousUploads, CLAIMED_TOAST } = await load();
    localStorage.setItem("pr_session_a", "tok-a");
    localStorage.setItem("pr_session_b", "tok-b");
    rpc.mockResolvedValueOnce({ data: 2, error: null });

    const result = await claimAnonymousUploads();
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ album: null, here: 0, elsewhere: 2 });
    expect(toastSuccess).toHaveBeenCalledWith(CLAIMED_TOAST);
  });

  it("says nothing when the claim carried nothing (an empty row is not news)", async () => {
    const { claimAnonymousUploads } = await load();
    localStorage.setItem("pr_session_a", "tok-a");
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    await claimAnonymousUploads();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("hands every claim to whoever listens, whichever caller started it", async () => {
    const { claimAnonymousUploads, onClaimed } = await load();
    localStorage.setItem("pr_session_a", "tok-a");
    rpc.mockResolvedValueOnce({ data: 1, error: null });
    const heard = vi.fn();
    const stop = onClaimed(heard);
    await claimAnonymousUploads({ silent: true });
    expect(heard).toHaveBeenCalledWith({ album: null, here: 0, elsewhere: 1 });
    stop();
  });

  it("signed out, or holding nothing: nothing runs and nothing is heard", async () => {
    const { claimAnonymousUploads, onClaimed } = await load();
    const heard = vi.fn();
    onClaimed(heard);
    await expect(claimAnonymousUploads()).resolves.toBeNull();
    localStorage.setItem("pr_session_a", "tok-a");
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(claimAnonymousUploads()).resolves.toBeNull();
    expect(rpc).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
  });

  it("claims once per load: a repeat after a landed claim is a no-op", async () => {
    const { claimAnonymousUploads } = await load();
    localStorage.setItem("pr_session_a", "tok-a");
    rpc.mockResolvedValue({ data: 1, error: null });
    await claimAnonymousUploads({ silent: true });
    await expect(claimAnonymousUploads({ silent: true })).resolves.toBeNull();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
