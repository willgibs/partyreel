import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { Database } from "@/lib/db/types";

/**
 * THE CLAIM SAYS WHERE IT CARRIED UPLOADS. On an album page the claim is two calls, the album's own
 * token first, so the album can tell its own uploads moving (the follow moment) from other events'
 * (the toast). What is pinned is that split, the silence the album asks for, and that every
 * caller's claim reaches whoever listens.
 *
 * ★ AND A SHARED PHONE IS ASKED BEFORE ANYTHING TYPED UNDER ANOTHER NAME MOVES (shared-claims). The
 * silent claim takes only what the server calls hers; then the phone asks which of its tickets were
 * typed under another name, leaving out every album this account already answered, and queues one
 * question a name. Her yes claims exactly those tickets, for the account that was asked, and says where
 * it carried them as the claim does (crumbs-24: a yes that moved this album's own uploads plays its
 * follow moment). The same read says where a ticket typed under ANOTHER ADDRESS waits.
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
    // ★ RESHAPED ON PURPOSE (crumbs-24; scar kept: a failed read asks nothing): its reason was the
    // function not yet applied, which it now is; any failure reads as nothing to ask.
    rpc.mockResolvedValueOnce({ data: null, error: { code: "57014" } });
    await expect(claimAnonymousUploads({ silent: true })).resolves.toEqual({
      album: null,
      here: 0,
      elsewhere: 1,
    });
    await Promise.resolve();
    expect(currentClaimAsks()).toEqual([]);
  });

  it("her yes claims exactly the ask's tickets, for the account that was asked", async () => {
    // ★ RESHAPED ON PURPOSE (crumbs-24; scar kept: exactly the ask's tickets, for the account asked): it
    // answered a bare count; it answers where the yes carried them, as the claim does.
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
    ).resolves.toEqual({ album: null, here: 0, elsewhere: 3, asked: true });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("claim_asked_uploads", {
      p_session_tokens: ["tok-2", "tok-1"],
    });
  });

  it("★ on an album, her yes claims its own tickets first and the rest after, and whoever listens hears it as an answer", async () => {
    const { claimAskedUploads, holdAlbum, onClaimed } = await load();
    const release = holdAlbum("album-1");
    const heard = vi.fn();
    const stop = onClaimed(heard);
    rpc.mockResolvedValueOnce({ data: 1, error: null });
    rpc.mockResolvedValueOnce({ data: 2, error: null });
    const result = await claimAskedUploads({
      account: "u1",
      name: "Dana",
      uploads: 3,
      tickets: [
        { album: "album-2", token: "tok-2" },
        { album: "album-1", token: "tok-1" },
      ],
    });
    expect(rpc).toHaveBeenNthCalledWith(1, "claim_asked_uploads", {
      p_session_tokens: ["tok-1"],
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "claim_asked_uploads", {
      p_session_tokens: ["tok-2"],
    });
    expect(result).toEqual({
      album: "album-1",
      here: 1,
      elsewhere: 2,
      asked: true,
    });
    expect(heard).toHaveBeenCalledWith(result);
    stop();
    release();
  });

  it("a yes whose own album's call fails moves nothing it can report, and whoever listens hears nothing", async () => {
    const { claimAskedUploads, holdAlbum, onClaimed } = await load();
    const release = holdAlbum("album-1");
    const heard = vi.fn();
    onClaimed(heard);
    rpc.mockResolvedValueOnce({ data: null, error: { code: "57014" } });
    await expect(
      claimAskedUploads({
        account: "u1",
        name: "Dana",
        uploads: 1,
        tickets: [{ album: "album-1", token: "tok-1" }],
      }),
    ).resolves.toBeNull();
    expect(heard).not.toHaveBeenCalled();
    release();
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

describe("a ticket typed under another address (crumbs-24): the album says where its photos wait", () => {
  it("★ reads the ask's answer for tickets left for another address, per album, and never queues one as a question", async () => {
    const {
      claimAnonymousUploads,
      claimLeftForAnotherAddress,
      currentClaimAsks,
      holdAlbum,
    } = await load();
    const release = holdAlbum("album-1");
    localStorage.setItem("pr_session_album-1", "tok-1");
    localStorage.setItem("pr_session_album-2", "tok-2");
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    rpc.mockResolvedValueOnce({
      data: [
        { name: "Mike", uploads: 1, tokens: ["tok-2"] },
        { kind: "address", uploads: 2, tokens: ["tok-1"] },
      ],
      error: null,
    });
    await claimAnonymousUploads({ silent: true });
    await expect(claimLeftForAnotherAddress("album-1")).resolves.toBe(2);
    await expect(claimLeftForAnotherAddress("album-2")).resolves.toBe(0);
    expect(currentClaimAsks().map((ask) => ask.name)).toEqual(["Mike"]);
    release();
  });

  it("a kind this build does not know is nobody's question, and a failed read says nothing", async () => {
    const {
      claimAnonymousUploads,
      claimLeftForAnotherAddress,
      currentClaimAsks,
    } = await load();
    localStorage.setItem("pr_session_album-1", "tok-1");
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    rpc.mockResolvedValueOnce({
      data: [{ kind: "later", name: "Mike", uploads: 1, tokens: ["tok-1"] }],
      error: null,
    });
    await claimAnonymousUploads({ silent: true });
    await expect(claimLeftForAnotherAddress("album-1")).resolves.toBe(0);
    expect(currentClaimAsks()).toEqual([]);

    const again = await load();
    localStorage.setItem("pr_session_album-1", "tok-1");
    rpc.mockResolvedValueOnce({ data: 0, error: null });
    rpc.mockResolvedValueOnce({ data: null, error: { code: "57014" } });
    await again.claimAnonymousUploads({ silent: true });
    await expect(again.claimLeftForAnotherAddress("album-1")).resolves.toBe(0);
  });

  it("before any claim has run, nothing waits anywhere", async () => {
    const { claimLeftForAnotherAddress } = await load();
    await expect(claimLeftForAnotherAddress("album-1")).resolves.toBe(0);
  });
});

describe("the claim's calls ride the typed client (crumbs-24)", () => {
  it("★ reaches every claim by its generated signature, with no cast of the client", () => {
    // shared-claims reached its two new calls by name until types.ts regenerated; it has, so a renamed
    // argument now fails the typecheck where it is made instead of every call at runtime.
    expectTypeOf<
      Database["public"]["Functions"]["claim_ticket_asks"]["Args"]
    >().toEqualTypeOf<{ p_session_tokens: string[] }>();
    expectTypeOf<
      Database["public"]["Functions"]["claim_asked_uploads"]["Args"]
    >().toEqualTypeOf<{ p_session_tokens: string[] }>();
    const source = readFileSync(
      join(process.cwd(), "src/lib/guest/claim-uploads.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/as unknown as/);
    expect(source).toContain('supabase.rpc("claim_ticket_asks", {');
    expect(source).toContain('supabase.rpc("claim_asked_uploads", {');
  });
});
