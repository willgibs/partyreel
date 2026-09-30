import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE CLAIM SAYS WHERE IT CARRIED UPLOADS. On an album page the claim is two calls, the album's own
 * token first, so the album can tell its own uploads moving (the follow moment) from other events'
 * (the toast). What is pinned is that split, the silence the album asks for, and that every
 * caller's claim reaches whoever listens.
 *
 * ★ AND A SHARED PHONE IS ASKED BEFORE ANYTHING TYPED UNDER ANOTHER NAME MOVES (shared-claims). The
 * silent claim takes only what the server calls hers; then the phone asks which of its tickets were
 * typed under another name, leaving out every album this account already answered, and queues one
 * question a name. Her yes claims exactly those tickets, for the account that was asked.
 */
const rpc = vi.fn();
const getSession = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession }, rpc }),
}));
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSuccess(m) },
}));

async function load() {
  vi.resetModules();
  const claims = await import("@/lib/guest/claim-uploads");
  const albums = await import("@/lib/guest/album-return");
  const asks = await import("@/lib/guest/claim-ask");
  return { ...claims, ...albums, ...asks };
}

/** The claim's own calls, leaving out the ask that follows it. */
const claimCalls = () =>
  rpc.mock.calls.filter(([fn]) => fn === "claim_anonymous_uploads");

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
    // Counted by name: the ask read follows every claim now (shared-claims), the claim is still one.
    expect(claimCalls()).toHaveLength(1);
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
    // Counted by name, as above: the repeat runs neither the claim nor another ask.
    expect(claimCalls()).toHaveLength(1);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});

describe("a shared phone: the ask after the claim", () => {
  const DANA = { name: "Dana", uploads: 3, tokens: ["tok-2", "tok-1"] };

  it("asks which held tickets were typed under another name, leaving out albums this account said were not hers", async () => {
    const { claimAnonymousUploads, currentClaimAsks, NOT_MINE_PREFIX } =
      await load();
    localStorage.setItem("pr_session_album-1", "tok-1");
    localStorage.setItem("pr_session_album-2", "tok-2");
    localStorage.setItem("pr_session_album-3", "tok-3");
    // This account already answered album-3; another account's answer on album-1 is not hers.
    localStorage.setItem(`${NOT_MINE_PREFIX}album-3`, JSON.stringify(["u1"]));
    localStorage.setItem(`${NOT_MINE_PREFIX}album-1`, JSON.stringify(["u9"]));
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    rpc.mockResolvedValueOnce({ data: [DANA], error: null });

    await claimAnonymousUploads({ silent: true });
    await vi.waitFor(() => expect(currentClaimAsks()).toHaveLength(1));

    const asked = rpc.mock.calls.find(([fn]) => fn === "claim_ticket_asks");
    expect(asked?.[1].p_session_tokens.sort()).toEqual(["tok-1", "tok-2"]);
    expect(currentClaimAsks()[0]).toEqual({
      account: "u1",
      name: "Dana",
      uploads: 3,
      tickets: [
        { album: "album-2", token: "tok-2" },
        { album: "album-1", token: "tok-1" },
      ],
    });
  });

  it("asks nothing when every held ticket was answered, and queues nothing it cannot name", async () => {
    const { claimAnonymousUploads, currentClaimAsks, NOT_MINE_PREFIX } =
      await load();
    localStorage.setItem("pr_session_album-1", "tok-1");
    localStorage.setItem(`${NOT_MINE_PREFIX}album-1`, JSON.stringify(["u1"]));
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    await claimAnonymousUploads({ silent: true });
    expect(rpc.mock.calls.map(([fn]) => fn)).toEqual([
      "claim_anonymous_uploads",
    ]);

    const again = await load();
    localStorage.clear();
    localStorage.setItem("pr_session_album-1", "tok-1");
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    // A token this phone never held, a nameless entry and a malformed one: none is asked about.
    rpc.mockResolvedValueOnce({
      data: [
        { name: "Mike", uploads: 2, tokens: ["tok-elsewhere"] },
        { name: " ", uploads: 1, tokens: ["tok-1"] },
        { uploads: 1, tokens: ["tok-1"] },
      ],
      error: null,
    });
    await again.claimAnonymousUploads({ silent: true });
    await vi.waitFor(() =>
      expect(
        rpc.mock.calls.filter(([fn]) => fn === "claim_ticket_asks"),
      ).toHaveLength(1),
    );
    await Promise.resolve();
    expect(again.currentClaimAsks()).toEqual([]);
    expect(currentClaimAsks()).toEqual([]);
  });

  it("a failed ask asks nothing, and the claim's own result stands", async () => {
    const { claimAnonymousUploads, currentClaimAsks } = await load();
    localStorage.setItem("pr_session_album-1", "tok-1");
    rpc.mockResolvedValueOnce({ data: 1, error: null });
    // The function not yet applied reads as PostgREST's "not found", which asks nothing.
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });
    await expect(claimAnonymousUploads({ silent: true })).resolves.toEqual({
      album: null,
      here: 0,
      elsewhere: 1,
    });
    await Promise.resolve();
    expect(currentClaimAsks()).toEqual([]);
  });

  it("her yes claims exactly the ask's tickets, for the account that was asked", async () => {
    const { claimAskedUploads } = await load();
    rpc.mockResolvedValueOnce({ data: 3, error: null });
    await expect(
      claimAskedUploads({
        account: "u1",
        name: "Dana",
        uploads: 3,
        tickets: [
          { album: "album-2", token: "tok-2" },
          { album: "album-1", token: "tok-1" },
        ],
      }),
    ).resolves.toBe(3);
    expect(rpc).toHaveBeenCalledWith("claim_asked_uploads", {
      p_session_tokens: ["tok-2", "tok-1"],
    });
  });

  it("★ another account signed in since is never answered for, and a failure answers null", async () => {
    const { claimAskedUploads } = await load();
    const asked = {
      account: "u1",
      name: "Dana",
      uploads: 1,
      tickets: [{ album: "album-1", token: "tok-1" }],
    };
    getSession.mockResolvedValueOnce({
      data: { session: { user: { id: "u2" } } },
    });
    await expect(claimAskedUploads(asked)).resolves.toBeNull();
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValueOnce({ data: null, error: { code: "57014" } });
    await expect(claimAskedUploads(asked)).resolves.toBeNull();
  });
});
