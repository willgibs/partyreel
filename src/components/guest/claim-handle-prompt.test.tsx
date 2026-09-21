// @contract-for: src/components/guest/claim-handle-prompt.tsx
// @contract-for: src/components/guest/follow-moment-card.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/client";

import { ClaimHandlePrompt } from "./claim-handle-prompt";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
// The follow moment reaches the router, the profile's server actions and the
// account action; none of the three exists in jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));
const updateDisplayName = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: (name: string) => updateDisplayName(name),
}));

const mockCreateClient = vi.mocked(createClient);

/** A supabase double: a session or none, and the profile row's own two fields. */
function stub({
  signedIn,
  slug,
  displayName = "Sam",
}: {
  signedIn: boolean;
  slug: string | null;
  displayName?: string | null;
}) {
  mockCreateClient.mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: signedIn ? { user: { id: "u1" } } : null },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: { slug, display_name: displayName } }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>);
}

const HOST = {
  id: "host-1",
  slug: "maya",
  displayName: "Maya",
  avatarUrl: null,
};

function mount(
  doneCount = 3,
  props: Partial<React.ComponentProps<typeof ClaimHandlePrompt>> = {},
) {
  return render(
    <ClaimHandlePrompt
      doneCount={doneCount}
      qrToken="tok-1"
      savePrompt={<div data-testid="save-account-prompt" />}
      {...props}
    />,
  );
}

/**
 * THE POST-UPLOAD SLOT'S CONTRACT (the profile wiring, 2026-09-19).
 *
 * The pinned function is the SEQUENCE, because the whole point of Will's
 * `claim=after` pick is that the offer arrives without getting in the way: one
 * card stands at a time, chosen by what the person actually needs next. Signed
 * out means there is no account to hang a page on, so the save prompt goes
 * first; signed in without a handle is the one state this card is for; somebody
 * who already has a page is offered nothing at all. Copy and layout are
 * precedent.
 */
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("ClaimHandlePrompt", () => {
  it("signed out: the save-account prompt stands, and no handle is mentioned", async () => {
    stub({ signedIn: false, slug: null });
    mount();
    await screen.findByTestId("save-account-prompt");
    expect(screen.queryByRole("link", { name: /claim/i })).toBeNull();
  });

  it("signed in without a handle: the claim offer, with a door to the account", async () => {
    stub({ signedIn: true, slug: null });
    mount();
    const door = await screen.findByRole("link", { name: /claim/i });
    expect(door).toHaveAttribute("href", "/account#public-profile");
    expect(screen.queryByTestId("save-account-prompt")).toBeNull();
  });

  it("signed in with a handle: nothing at all", async () => {
    stub({ signedIn: true, slug: "maya" });
    const { container } = mount();
    await waitFor(() =>
      expect(mockCreateClient).toHaveBeenCalledTimes(1),
    );
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("counts the photographs that landed", async () => {
    stub({ signedIn: true, slug: null });
    mount(1);
    expect(await screen.findByText(/your photo is on this album/i)).toBeVisible();
  });
});

/**
 * THE CAPTURE FLOW'S PINS (the identity reshape, 2026-09-21). The marker is what
 * makes the in-page code and a magic-link round trip land the same beat, so what
 * is pinned is that it is CONSUMED (once), what stands in its place, and that the
 * typed name reaches a profile that has none.
 */
describe("ClaimHandlePrompt: the moment after confirming", () => {
  it("consumes the pending-offer marker and stands the follow moment up, once", async () => {
    stub({ signedIn: true, slug: null });
    localStorage.setItem("pr_pending_offer_tok-1", "1");
    const { unmount } = mount(3, { host: HOST });

    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    // The marker is spent: a second mount is the ordinary ladder again.
    expect(localStorage.getItem("pr_pending_offer_tok-1")).toBeNull();
    unmount();

    mount(3, { host: HOST });
    expect(await screen.findByRole("link", { name: /claim/i })).toBeVisible();
    expect(screen.queryByText(/your photos are safe/i)).toBeNull();
  });

  it("with no host card resolved there is no host row, and the handle line still stands", async () => {
    stub({ signedIn: true, slug: null });
    localStorage.setItem("pr_pending_offer_tok-1", "1");
    mount(2);
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    expect(screen.getByRole("link", { name: /claim/i })).toBeInTheDocument();
  });

  it("a profile that already has a handle gets no second line", async () => {
    stub({ signedIn: true, slug: "sam" });
    localStorage.setItem("pr_pending_offer_tok-1", "1");
    mount(2, { host: HOST });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(screen.queryByRole("link", { name: /claim/i })).toBeNull();
  });

  it("names a nameless profile from the name this device typed, and never overwrites one", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    localStorage.setItem("pr_pending_offer_tok-1", "1");
    stub({ signedIn: true, slug: null, displayName: null });
    mount(2, { host: HOST });
    await waitFor(() => expect(updateDisplayName).toHaveBeenCalledWith("Sam"));

    updateDisplayName.mockClear();
    localStorage.setItem("pr_pending_offer_tok-1", "1");
    stub({ signedIn: true, slug: null, displayName: "Already Named" });
    mount(2, { host: HOST });
    await screen.findAllByText(/your photos are safe/i);
    expect(updateDisplayName).not.toHaveBeenCalled();
  });
});
