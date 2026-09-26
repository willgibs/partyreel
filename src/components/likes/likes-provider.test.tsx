/**
 * BEHAVIOR PINS for LikesProvider (program Phase 2, slice 1; the seed re-pinned in the 1,000-row
 * round, M12). These freeze the contract: sign-in resolution, the seed, the localStorage
 * pending-intent replay, optimistic toggle + revert, the busy guard, and the remove-mode callback.
 * Pins assert behavior (storage keys, RPC payloads, toasts, context output) - never styles.
 *
 * ★ THE SEED RIDES A POST BODY NOW (M12). It was `.from("media_likes").select().in("media_id",
 * <every visible id>)`: about 37 bytes of URL an id, so an album read whole (C7) outgrew the URL,
 * and the error was swallowed, so the hearts just started empty. It is `my_liked_media_ids(uuid[])`
 * with the ids in the body and ONE uuid[] back, its error reported, and only the ids not yet
 * answered are asked as the grid grows.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  makeMockSupabase,
  type MockSupabase,
} from "@/lib/test-utils/mock-supabase";
import { createClient } from "@/lib/supabase/client";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import { captureError } from "@/lib/observability/sentry";

import {
  LikesProvider,
  LocalLikesProvider,
  useIsLiked,
  useLikes,
} from "./likes-provider";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));
// The dialog's sign-in form is out of scope here; a stub exposes onVerified so
// the in-page OTP completion path stays pinnable.
vi.mock("@/components/auth/email-sign-in", () => ({
  EmailSignIn: ({ onVerified }: { onVerified: () => void }) => (
    <button onClick={onVerified}>mock-verify</button>
  ),
}));

const PENDING_PREFIX = "pr_pending_like_";
const IDS = ["m1", "m2", "m3"];

type RpcAnswer = { data: unknown; error: unknown };

/**
 * Answer each RPC by NAME, the way the real client routes them: the seed's `my_liked_media_ids`
 * with the viewer's own likes among the ids it was sent (or `seedError`), and `like_media` with
 * `like` (a confirmed like unless a test says otherwise).
 */
function programRpc(
  supa: MockSupabase,
  {
    liked = [] as string[],
    seedError = null as unknown,
    like = { data: { ok: true }, error: null } as
      | RpcAnswer
      | (() => Promise<RpcAnswer>),
  } = {},
) {
  supa.rpc.mockImplementation(
    (fn: string, args: { p_media_ids?: string[] }) => {
      if (fn === "my_liked_media_ids") {
        return Promise.resolve(
          seedError
            ? { data: null, error: seedError }
            : {
                data: (args.p_media_ids ?? []).filter((id) =>
                  liked.includes(id),
                ),
                error: null,
              },
        );
      }
      return typeof like === "function" ? like() : Promise.resolve(like);
    },
  );
}

/** The seed calls, in order: the ids each one carried in its POST body. */
function seedCalls(supa: MockSupabase): string[][] {
  return supa.rpc.mock.calls
    .filter(([fn]) => fn === "my_liked_media_ids")
    .map(([, args]) => (args as { p_media_ids: string[] }).p_media_ids);
}

function likeCalls(supa: MockSupabase) {
  return supa.rpc.mock.calls.filter(([fn]) => fn === "like_media");
}

/**
 * Context probe: renders one id's liked state, SUBSCRIBED to that id the way
 * every mark reads it (`useIsLiked`), plus a toggle trigger.
 *
 * ★ THE STATE IS "liked" OR "not liked", NEVER "unliked". These pins used to
 * assert `toHaveTextContent(/^liked$/)` against a probe printing "liked" or
 * "unliked", and the substring matched both, so every "it is liked now" here
 * passed whether or not it was (found when the liked set became a per-id store
 * and this probe stopped re-rendering, with every pin still green).
 */
function Probe({ id }: { id: string }) {
  const likes = useLikes();
  const liked = useIsLiked(id);
  if (!likes) return <div>no-context</div>;
  return (
    <div>
      <button onClick={() => likes.toggle(id)}>toggle-{id}</button>
      <span data-testid={`liked-${id}`}>{liked ? "liked" : "not liked"}</span>
    </div>
  );
}

function mount(
  supa: MockSupabase,
  props?: Partial<Parameters<typeof LikesProvider>[0]>,
  probeId = "m1",
) {
  vi.mocked(createClient).mockReturnValue(supa.client as never);
  return render(
    <LikesProvider mediaIds={IDS} {...props}>
      <Probe id={probeId} />
    </LikesProvider>,
  );
}

/** A signed-in client whose seed answers `liked`. */
function signedIn(liked: string[] = []) {
  const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
  programRpc(supa, { liked });
  return supa;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("LikesProvider: session + seed", () => {
  it("resolves the session once on mount", async () => {
    const supa = makeMockSupabase();
    mount(supa);
    await waitFor(() => expect(supa.getSession).toHaveBeenCalledTimes(1));
  });

  it("signed out: never runs the seed", async () => {
    const supa = makeMockSupabase({ session: null });
    mount(supa);
    await waitFor(() => expect(supa.getSession).toHaveBeenCalled());
    expect(supa.client.from).not.toHaveBeenCalled();
    expect(seedCalls(supa)).toEqual([]);
  });

  it("signed in: seeds liked state from the viewer's own likes, the ids in the POST body", async () => {
    const supa = signedIn(["m2"]);
    mount(supa, undefined, "m2");
    await waitFor(() =>
      expect(screen.getByTestId("liked-m2")).toHaveTextContent(/^liked$/),
    );
    expect(supa.rpc).toHaveBeenCalledWith("my_liked_media_ids", {
      p_media_ids: IDS,
    });
    // Never a table read: its id list would ride the URL.
    expect(supa.client.from).not.toHaveBeenCalled();
  });

  it("initialLikedIds paints instantly, before any query resolves", () => {
    const supa = signedIn();
    mount(supa, { initialLikedIds: ["m1"] });
    expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/);
  });

  it("useLikes returns null outside a provider", () => {
    render(<Probe id="m1" />);
    expect(screen.getByText("no-context")).toBeDefined();
  });
});

describe("LikesProvider: the seed past a thousand items (M12)", () => {
  it("asks about a 2,500-item album in ONE call, every id in the body, and paints a heart past the 1,000th", async () => {
    const ids = Array.from(
      { length: 2500 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    const late = ids[2210];
    const supa = signedIn([ids[3], late]);
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    render(
      <LikesProvider mediaIds={ids}>
        <Probe id={late} />
      </LikesProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId(`liked-${late}`)).toHaveTextContent(/^liked$/),
    );
    expect(seedCalls(supa)).toEqual([ids]);
    expect(supa.client.from).not.toHaveBeenCalled();
  });

  it("asks only the ids not yet answered when the grid grows (a poll's new photograph)", async () => {
    const supa = signedIn(["m4"]);
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    const { rerender } = render(
      <LikesProvider mediaIds={IDS}>
        <Probe id="m4" />
      </LikesProvider>,
    );
    await waitFor(() => expect(seedCalls(supa)).toHaveLength(1));

    rerender(
      <LikesProvider mediaIds={["m4", ...IDS]}>
        <Probe id="m4" />
      </LikesProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("liked-m4")).toHaveTextContent(/^liked$/),
    );
    expect(seedCalls(supa)).toEqual([IDS, ["m4"]]);
  });

  it("binds a failed seed: reported, hearts left unfilled, no toast, and the ids asked again on the next change", async () => {
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    programRpc(supa, {
      seedError: {
        message: "permission denied",
        code: "42501",
        details: "",
        hint: "",
      },
    });
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    const { rerender } = render(
      <LikesProvider mediaIds={IDS}>
        <Probe id="m1" />
      </LikesProvider>,
    );

    await waitFor(() => expect(captureError).toHaveBeenCalledTimes(1));
    const [area, error, extra] = vi.mocked(captureError).mock.calls[0];
    expect(area).toBe("media");
    expect((error as Error).message).toContain("likes: my_liked_media_ids");
    expect(extra).toEqual({ ids: 3 });
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("not liked");
    expect(toast.error).not.toHaveBeenCalled();

    // Nothing was marked answered, so the next change of the grid asks for all of them again.
    programRpc(supa, { liked: ["m1"] });
    rerender(
      <LikesProvider mediaIds={[...IDS, "m9"]}>
        <Probe id="m1" />
      </LikesProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/),
    );
    expect(seedCalls(supa).at(-1)).toEqual([...IDS, "m9"]);
  });
});

/**
 * THE SEED FOLLOWS THE WINDOW (album-host-wiring). The paged album mounts only the rows around the
 * viewport, so a windowed surface omits `mediaIds` and calls `seed(ids)` as its window moves: only
 * the ids not yet answered are asked, a tick's calls share one request, and an id in flight is never
 * asked twice.
 */
describe("LikesProvider: the window's seed", () => {
  function Window({ asks }: { asks: string[][] }) {
    const likes = useLikes();
    return (
      <button onClick={() => asks.forEach((ids) => likes!.seed(ids))}>
        scroll
      </button>
    );
  }

  it("asks a window's ids once, a tick's asks in ONE request, and only what is new after", async () => {
    const supa = signedIn(["w2"]);
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    const { rerender } = render(
      <LikesProvider>
        <Window
          asks={[
            ["w1", "w2"],
            ["w2", "w3"],
          ]}
        />
        <Probe id="w2" />
      </LikesProvider>,
    );
    fireEvent.click(screen.getByText("scroll"));
    await waitFor(() =>
      expect(screen.getByTestId("liked-w2")).toHaveTextContent(/^liked$/),
    );
    expect(seedCalls(supa)).toEqual([["w1", "w2", "w3"]]);

    // The window moves on: the ids it already asked about are never asked again.
    rerender(
      <LikesProvider>
        <Window asks={[["w3", "w4"]]} />
        <Probe id="w2" />
      </LikesProvider>,
    );
    fireEvent.click(screen.getByText("scroll"));
    await waitFor(() => expect(seedCalls(supa)).toHaveLength(2));
    expect(seedCalls(supa)[1]).toEqual(["w4"]);
  });

  it("signed out: asks nothing, whatever the window", async () => {
    const supa = makeMockSupabase({ session: null });
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    render(
      <LikesProvider>
        <Window asks={[["w1"]]} />
      </LikesProvider>,
    );
    fireEvent.click(screen.getByText("scroll"));
    await waitFor(() => expect(supa.getSession).toHaveBeenCalled());
    expect(seedCalls(supa)).toEqual([]);
  });
});

/**
 * THE BULK LIKE, ONE CALL A BATCH (album-host-wiring, `like_many`): every not-yet-liked id hearted at
 * once, one `like_many` request, and only the ids it refused reverted. It used to be one
 * `like_media` per id, all at once.
 */
describe("LikesProvider: likeMany through like_many", () => {
  function Bulk({
    ids,
    onDone,
  }: {
    ids: string[];
    onDone: (n: number) => void;
  }) {
    const likes = useLikes();
    return (
      <button onClick={() => void likes!.likeMany(ids).then(onDone)}>
        like-all
      </button>
    );
  }

  it("hearts every id, sends ONE like_many, and reverts exactly the refused ones", async () => {
    const supa = signedIn([]);
    supa.rpc.mockImplementation((fn: string) =>
      Promise.resolve(
        fn === "like_many"
          ? { data: { ok: true, liked: 2, failed: ["m3"] }, error: null }
          : { data: [], error: null },
      ),
    );
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    const done = vi.fn();
    render(
      <LikesProvider mediaIds={IDS}>
        <Bulk ids={IDS} onDone={done} />
        <Probe id="m1" />
        <Probe id="m3" />
      </LikesProvider>,
    );
    await waitFor(() => expect(supa.getSession).toHaveBeenCalled());
    await waitFor(() => expect(seedCalls(supa)).toHaveLength(1));
    fireEvent.click(screen.getByText("like-all"));
    await waitFor(() => expect(done).toHaveBeenCalledWith(2));
    expect(supa.rpc.mock.calls.filter(([fn]) => fn === "like_many")).toEqual([
      ["like_many", { p_media_ids: IDS }],
    ]);
    expect(likeCalls(supa)).toHaveLength(0);
    expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/);
    expect(screen.getByTestId("liked-m3")).toHaveTextContent("not liked");
  });
});

describe("LikesProvider: redirect-queued replay", () => {
  it("replays a pending like on signed-in mount: rpc + cleanup + toast", async () => {
    localStorage.setItem(PENDING_PREFIX + "m3", "1");
    const supa = signedIn();
    mount(supa, undefined, "m3");

    await waitFor(() =>
      expect(supa.rpc).toHaveBeenCalledWith("like_media", { p_media_id: "m3" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m3")).toHaveTextContent(/^liked$/),
    );
    expect(localStorage.getItem(PENDING_PREFIX + "m3")).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("Added to your likes");
  });

  it("a failed replay still clears the key and stays unliked, no toast", async () => {
    localStorage.setItem(PENDING_PREFIX + "m3", "1");
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    programRpc(supa, { like: { data: { ok: false }, error: null } });
    mount(supa, undefined, "m3");

    await waitFor(() =>
      expect(localStorage.getItem(PENDING_PREFIX + "m3")).toBeNull(),
    );
    expect(screen.getByTestId("liked-m3")).toHaveTextContent("not liked");
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("LikesProvider: signed-out toggle", () => {
  it("stashes the intent + opens the create-account dialog, no rpc", async () => {
    const supa = makeMockSupabase({ session: null });
    mount(supa);
    await waitFor(() => expect(supa.getSession).toHaveBeenCalled());

    fireEvent.click(screen.getByText("toggle-m1"));

    expect(localStorage.getItem(PENDING_PREFIX + "m1")).toBe("1");
    expect(await screen.findByText("Like this")).toBeDefined();
    expect(supa.rpc).not.toHaveBeenCalled();
  });

  it("in-page verify completes the pending like inline", async () => {
    const supa = makeMockSupabase({ session: null });
    mount(supa);
    await waitFor(() => expect(supa.getSession).toHaveBeenCalled());

    fireEvent.click(screen.getByText("toggle-m1"));
    fireEvent.click(await screen.findByText("mock-verify"));

    await waitFor(() =>
      expect(supa.rpc).toHaveBeenCalledWith("like_media", { p_media_id: "m1" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/),
    );
    expect(vi.mocked(claimAnonymousUploads)).toHaveBeenCalledWith({
      silent: true,
    });
    expect(localStorage.getItem(PENDING_PREFIX + "m1")).toBeNull();
  });
});

describe("LikesProvider: signed-in toggle", () => {
  async function mountSignedIn(supa: MockSupabase, probeId = "m1") {
    const utils = mount(supa, undefined, probeId);
    // Wait until the signed-in state has resolved (the seed ran).
    await waitFor(() => expect(seedCalls(supa)).toHaveLength(1));
    return utils;
  }

  it("like: optimistic flip, then the rpc confirms it", async () => {
    const supa = signedIn();
    await mountSignedIn(supa);

    fireEvent.click(screen.getByText("toggle-m1"));
    // Optimistic: liked immediately, before the rpc resolves.
    expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/);

    await waitFor(() =>
      expect(supa.rpc).toHaveBeenCalledWith("like_media", { p_media_id: "m1" }),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/);
  });

  it("like failure: reverts and toasts", async () => {
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    programRpc(supa, { like: { data: null, error: { message: "nope" } } });
    await mountSignedIn(supa);

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't save that like."),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("not liked");
  });

  it("unlike: owner delete path; success keeps it unliked", async () => {
    const supa = signedIn(["m1"]);
    await mountSignedIn(supa);
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("not liked");
    await waitFor(() =>
      expect(supa.deleteEq).toHaveBeenCalledWith("media_id", "m1"),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("not liked");
    expect(likeCalls(supa)).toHaveLength(0);
  });

  it("unlike failure: reverts to liked and toasts", async () => {
    const supa = signedIn(["m1"]);
    supa.deleteEq.mockResolvedValue({ error: { message: "nope" } });
    await mountSignedIn(supa);
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't remove that like."),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/);
  });

  it("double-tap collapses: the in-flight id ignores a second toggle", async () => {
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    programRpc(supa, {
      like: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { ok: true }, error: null }), 40),
        ),
    });
    await mountSignedIn(supa);

    fireEvent.click(screen.getByText("toggle-m1"));
    fireEvent.click(screen.getByText("toggle-m1"));

    await waitFor(() => expect(likeCalls(supa)).toHaveLength(1));
  });

  it('mode="remove": a confirmed unlike fires onRemoved', async () => {
    const onRemoved = vi.fn();
    const supa = signedIn(["m1"]);
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    render(
      <LikesProvider mediaIds={IDS} mode="remove" onRemoved={onRemoved}>
        <Probe id="m1" />
      </LikesProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() => expect(onRemoved).toHaveBeenCalledWith("m1"));
  });

  it('mode="keep" (default): a confirmed unlike never fires onRemoved', async () => {
    const onRemoved = vi.fn();
    const supa = signedIn(["m1"]);
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    render(
      <LikesProvider mediaIds={IDS} onRemoved={onRemoved}>
        <Probe id="m1" />
      </LikesProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() => expect(supa.deleteEq).toHaveBeenCalled());
    expect(onRemoved).not.toHaveBeenCalled();
  });
});

/**
 * ★ A HEART RE-RENDERS ONE MARK (the album-window lane). The liked set is a
 * store read per id, and the context value never changes after mount, so a like
 * notifies exactly the readers of that one id: on a 1,145-photograph album it
 * used to re-render every tile and every mark.
 */
describe("LikesProvider: one id's like notifies that id's readers alone", () => {
  function Counted({ id, seen }: { id: string; seen: string[] }) {
    const liked = useIsLiked(id);
    seen.push(id);
    return <span data-testid={`c-${id}`}>{liked ? "liked" : "not liked"}</span>;
  }

  it("re-renders the liked id's reader and no other, and never the context's consumers", async () => {
    const supa = signedIn();
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    const seen: string[] = [];
    const commits = { context: 0 };
    function Consumer() {
      useLikes();
      useEffect(() => {
        commits.context++;
      });
      return null;
    }
    render(
      <LikesProvider mediaIds={IDS}>
        <Consumer />
        <Probe id="m1" />
        <Counted id="m2" seen={seen} />
        <Counted id="m3" seen={seen} />
      </LikesProvider>,
    );
    await waitFor(() => expect(supa.getSession).toHaveBeenCalled());
    await waitFor(() => expect(seedCalls(supa)).toHaveLength(1));
    const before = { seen: seen.length, context: commits.context };
    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/),
    );
    // Neither m2's nor m3's reader re-rendered, nor the context's consumer.
    expect(seen.length).toBe(before.seen);
    expect(commits.context).toBe(before.context);
  });

  it("reads false with no provider, so a surface without likes draws no heart", () => {
    const seen: string[] = [];
    render(<Counted id="m1" seen={seen} />);
    expect(screen.getByTestId("c-m1")).toHaveTextContent("not liked");
  });
});

describe("LocalLikesProvider: the store with no session and no network", () => {
  it("flips a heart in memory, and likes many at once", async () => {
    const grab: { likeMany?: (ids: string[]) => Promise<number> } = {};
    function Grab() {
      const likes = useLikes();
      useEffect(() => {
        grab.likeMany = likes!.likeMany;
      });
      return null;
    }
    render(
      <LocalLikesProvider initialLikedIds={["m3"]}>
        <Grab />
        <Probe id="m1" />
        <Probe id="m2" />
        <Probe id="m3" />
      </LocalLikesProvider>,
    );
    expect(screen.getByTestId("liked-m3")).toHaveTextContent(/^liked$/);
    fireEvent.click(screen.getByText("toggle-m1"));
    expect(screen.getByTestId("liked-m1")).toHaveTextContent(/^liked$/);
    fireEvent.click(screen.getByText("toggle-m1"));
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("not liked");
    let added = 0;
    await act(async () => {
      added = await grab.likeMany!(["m1", "m2", "m3"]);
    });
    // m3 was liked already, so two were added.
    expect(added).toBe(2);
    expect(screen.getByTestId("liked-m2")).toHaveTextContent(/^liked$/);
  });
});
