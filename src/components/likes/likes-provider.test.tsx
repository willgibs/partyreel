/**
 * BEHAVIOR PINS for LikesProvider (program Phase 2, slice 1). These freeze the
 * CURRENT contract before later phases touch the file: sign-in resolution,
 * seed query, the localStorage pending-intent replay, optimistic toggle +
 * revert, the busy guard, and the remove-mode callback. Pins assert behavior
 * (storage keys, RPC payloads, toasts, context output) - never styles.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { makeMockSupabase, type MockSupabase } from "@/lib/test-utils/mock-supabase";
import { createClient } from "@/lib/supabase/client";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

import { LikesProvider, useLikes } from "./likes-provider";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn().mockResolvedValue(undefined),
}));
// The dialog's sign-in form is out of scope here; a stub exposes onVerified so
// the in-page OTP completion path stays pinnable.
vi.mock("@/components/auth/email-sign-in", () => ({
  EmailSignIn: ({ onVerified }: { onVerified: () => void }) => (
    <button onClick={onVerified}>mock-verify</button>
  ),
}));

const PENDING_PREFIX = "pr_pending_like_";
const IDS = ["m1", "m2", "m3"];

/** Context probe: renders liked state + a toggle trigger for one id. */
function Probe({ id }: { id: string }) {
  const likes = useLikes();
  if (!likes) return <div>no-context</div>;
  return (
    <div>
      <button onClick={() => likes.toggle(id)}>toggle-{id}</button>
      <span data-testid={`liked-${id}`}>
        {likes.isLiked(id) ? "liked" : "unliked"}
      </span>
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LikesProvider: session + seed", () => {
  it("resolves the session once on mount", async () => {
    const supa = makeMockSupabase();
    mount(supa);
    await waitFor(() => expect(supa.getSession).toHaveBeenCalledTimes(1));
  });

  it("signed out: never runs the seed query", async () => {
    const supa = makeMockSupabase({ session: null });
    mount(supa);
    await waitFor(() => expect(supa.getSession).toHaveBeenCalled());
    expect(supa.client.from).not.toHaveBeenCalled();
  });

  it("signed in: seeds liked state from the viewer's media_likes rows", async () => {
    const supa = makeMockSupabase({
      session: { user: { id: "u1" } },
      selectRows: [{ media_id: "m2" }],
    });
    mount(supa, undefined, "m2");
    await waitFor(() =>
      expect(screen.getByTestId("liked-m2")).toHaveTextContent("liked"),
    );
    expect(supa.selectIn).toHaveBeenCalledWith("media_id", IDS);
  });

  it("initialLikedIds paints instantly, before any query resolves", () => {
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    mount(supa, { initialLikedIds: ["m1"] });
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked");
  });

  it("useLikes returns null outside a provider", () => {
    render(<Probe id="m1" />);
    expect(screen.getByText("no-context")).toBeDefined();
  });
});

describe("LikesProvider: redirect-queued replay", () => {
  it("replays a pending like on signed-in mount: rpc + cleanup + toast", async () => {
    localStorage.setItem(PENDING_PREFIX + "m3", "1");
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    mount(supa, undefined, "m3");

    await waitFor(() =>
      expect(supa.rpc).toHaveBeenCalledWith("like_media", { p_media_id: "m3" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m3")).toHaveTextContent("liked"),
    );
    expect(localStorage.getItem(PENDING_PREFIX + "m3")).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("Added to your likes");
  });

  it("a failed replay still clears the key and stays unliked, no toast", async () => {
    localStorage.setItem(PENDING_PREFIX + "m3", "1");
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    supa.rpc.mockResolvedValue({ data: { ok: false }, error: null });
    mount(supa, undefined, "m3");

    await waitFor(() =>
      expect(localStorage.getItem(PENDING_PREFIX + "m3")).toBeNull(),
    );
    expect(screen.getByTestId("liked-m3")).toHaveTextContent("unliked");
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
      expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked"),
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
    // Wait until the signed-in state has resolved (seed query ran).
    await waitFor(() => expect(supa.selectIn).toHaveBeenCalled());
    return utils;
  }

  it("like: optimistic flip, then the rpc confirms it", async () => {
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    await mountSignedIn(supa);

    fireEvent.click(screen.getByText("toggle-m1"));
    // Optimistic: liked immediately, before the rpc resolves.
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked");

    await waitFor(() =>
      expect(supa.rpc).toHaveBeenCalledWith("like_media", { p_media_id: "m1" }),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked");
  });

  it("like failure: reverts and toasts", async () => {
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    supa.rpc.mockResolvedValue({ data: null, error: { message: "nope" } });
    await mountSignedIn(supa);

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't save that like."),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("unliked");
  });

  it("unlike: owner delete path; success keeps it unliked", async () => {
    const supa = makeMockSupabase({
      session: { user: { id: "u1" } },
      selectRows: [{ media_id: "m1" }],
    });
    await mountSignedIn(supa);
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked"),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("unliked");
    await waitFor(() =>
      expect(supa.deleteEq).toHaveBeenCalledWith("media_id", "m1"),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("unliked");
    expect(supa.rpc).not.toHaveBeenCalled();
  });

  it("unlike failure: reverts to liked and toasts", async () => {
    const supa = makeMockSupabase({
      session: { user: { id: "u1" } },
      selectRows: [{ media_id: "m1" }],
    });
    supa.deleteEq.mockResolvedValue({ error: { message: "nope" } });
    await mountSignedIn(supa);
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked"),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't remove that like."),
    );
    expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked");
  });

  it("double-tap collapses: the in-flight id ignores a second toggle", async () => {
    const supa = makeMockSupabase({ session: { user: { id: "u1" } } });
    supa.rpc.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { ok: true }, error: null }), 40),
        ),
    );
    await mountSignedIn(supa);

    fireEvent.click(screen.getByText("toggle-m1"));
    fireEvent.click(screen.getByText("toggle-m1"));

    await waitFor(() => expect(supa.rpc).toHaveBeenCalledTimes(1));
  });

  it('mode="remove": a confirmed unlike fires onRemoved', async () => {
    const onRemoved = vi.fn();
    const supa = makeMockSupabase({
      session: { user: { id: "u1" } },
      selectRows: [{ media_id: "m1" }],
    });
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    render(
      <LikesProvider mediaIds={IDS} mode="remove" onRemoved={onRemoved}>
        <Probe id="m1" />
      </LikesProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked"),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() => expect(onRemoved).toHaveBeenCalledWith("m1"));
  });

  it('mode="keep" (default): a confirmed unlike never fires onRemoved', async () => {
    const onRemoved = vi.fn();
    const supa = makeMockSupabase({
      session: { user: { id: "u1" } },
      selectRows: [{ media_id: "m1" }],
    });
    vi.mocked(createClient).mockReturnValue(supa.client as never);
    render(
      <LikesProvider mediaIds={IDS} onRemoved={onRemoved}>
        <Probe id="m1" />
      </LikesProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("liked-m1")).toHaveTextContent("liked"),
    );

    fireEvent.click(screen.getByText("toggle-m1"));
    await waitFor(() => expect(supa.deleteEq).toHaveBeenCalled());
    expect(onRemoved).not.toHaveBeenCalled();
  });
});
