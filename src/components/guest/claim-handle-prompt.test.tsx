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
// The server's count of other events waiting under her email (the dashboard banner's list).
const countWaiting = vi.fn<(qrToken: unknown) => Promise<number>>();
vi.mock("@/lib/guest/confirm-beat-action", () => ({
  countWaitingEventsAction: (qrToken: unknown) => countWaiting(qrToken),
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
    <ClaimHandlePrompt doneCount={doneCount} qrToken="tok-1" {...props} />,
  );
}

/**
 * THE POST-UPLOAD SLOT'S CONTRACT.
 *
 * The pinned function is the SEQUENCE, because the whole point of offering the
 * claim after the upload is that it arrives without getting in the way: one
 * card stands at a time, chosen by what the person actually needs next. Signed
 * out, the slot is empty: the ask to keep what she added is the door's own last
 * screen now (`guest-capture` r1), never a card under the album; signed in
 * without a handle is the one state this card is for; somebody who already has
 * a page is offered nothing at all. Copy and layout are precedent.
 */
beforeEach(() => {
  vi.clearAllMocks();
  countWaiting.mockResolvedValue(0);
  localStorage.clear();
});

describe("ClaimHandlePrompt", () => {
  it("signed out: nothing at all (the keep is the door's last screen, never a card here)", async () => {
    stub({ signedIn: false, slug: null });
    const { container } = mount();
    await waitFor(() => expect(mockCreateClient).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText(/keep (this|these) photo/i)).toBeNull();
  });

  it("signed in without a handle: the claim offer, with a door to the page's own setup", async () => {
    stub({ signedIn: true, slug: null });
    mount();
    const door = await screen.findByRole("link", { name: /claim/i });
    expect(door).toHaveAttribute("href", "/account/profile");
  });

  it("signed in with a handle: nothing at all", async () => {
    stub({ signedIn: true, slug: "maya" });
    const { container } = mount();
    await waitFor(() => expect(mockCreateClient).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("counts the photographs that landed", async () => {
    stub({ signedIn: true, slug: null });
    mount(1);
    expect(
      await screen.findByText(/your photo is on this album/i),
    ).toBeVisible();
  });
});

/**
 * THE CAPTURE FLOW'S PINS. The album page decides that a confirmation from this
 * album just claimed its uploads (lib/guest/use-confirm-return.ts, its own
 * contract) and hands the slot `moment`; what is pinned here is what stands when
 * it does, that it stands with nothing uploaded this visit (a Google or
 * magic-link return), and that the typed name reaches a profile that has none.
 */
describe("ClaimHandlePrompt: the moment after confirming", () => {
  it("stands the follow moment up when the album says a confirmation landed", async () => {
    stub({ signedIn: true, slug: null });
    mount(3, { host: HOST, moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  });

  it("without the album's word it is the ordinary ladder, whatever storage holds", async () => {
    stub({ signedIn: true, slug: null });
    // The marker is the album page's to read, never this card's.
    localStorage.setItem("pr_pending_offer_tok-1", "1");
    mount(3, { host: HOST });
    expect(await screen.findByRole("link", { name: /claim/i })).toBeVisible();
    expect(screen.queryByText(/your photos are safe/i)).toBeNull();
    expect(localStorage.getItem("pr_pending_offer_tok-1")).toBe("1");
  });

  it("plays on a return with nothing uploaded this visit, and says no number it does not have", async () => {
    stub({ signedIn: true, slug: null });
    mount(0, { host: HOST, moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(
      screen.getByText(
        "They are in your account now, and this event came with them.",
      ),
    ).toBeVisible();
  });

  it("the moment arrives AFTER an in-page confirmation, and the card re-resolves for it", async () => {
    stub({ signedIn: false, slug: null });
    const view = mount(3, { host: HOST });
    await waitFor(() => expect(mockCreateClient).toHaveBeenCalled());
    // The confirmation lands: a session exists now, and the album hands the word down.
    stub({ signedIn: true, slug: null });
    view.rerender(
      <ClaimHandlePrompt doneCount={3} qrToken="tok-1" host={HOST} moment />,
    );
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
  });

  // crumbs-28, from `claims-wiring`: the moment's Follow started on Follow even for a guest who already follows the
  // host, because nothing handed it a follow state. The page reads it beside `getHostCard`, on the host card.
  it("★ hands the moment the host's follow state: a guest who already follows meets Following", async () => {
    stub({ signedIn: true, slug: null });
    mount(3, { host: { ...HOST, following: true }, moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Following" })).toBeVisible();
  });

  it("confirmed in place: the page's refresh reads it under her session, and the Follow follows", async () => {
    // The keep's code typed in place refreshes the page (`handleKeepVerified`), whose render now knows who she is.
    stub({ signedIn: true, slug: null });
    const view = mount(3, {
      host: { ...HOST, following: false },
      moment: true,
    });
    expect(await screen.findByRole("button", { name: "Follow" })).toBeVisible();
    view.rerender(
      <ClaimHandlePrompt
        doneCount={3}
        qrToken="tok-1"
        host={{ ...HOST, following: true }}
        moment
      />,
    );
    expect(
      await screen.findByRole("button", { name: "Following" }),
    ).toBeVisible();
  });

  it("is never hidden behind the handle card's dismissal", async () => {
    stub({ signedIn: true, slug: null });
    localStorage.setItem("pr_claim_prompt_tok-1", "1");
    mount(2, { host: HOST, moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
  });

  it("with no host card resolved there is no host row, and the handle line still stands", async () => {
    stub({ signedIn: true, slug: null });
    mount(2, { moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    // The row points at the page's own setup (profile-setup's PROFILE_SETUP_PATH).
    expect(screen.getByRole("link", { name: /claim/i })).toHaveAttribute(
      "href",
      "/account/profile",
    );
  });

  it("a profile that already has a handle gets no second line", async () => {
    stub({ signedIn: true, slug: "sam" });
    mount(2, { host: HOST, moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(screen.queryByRole("link", { name: /claim/i })).toBeNull();
  });

  it("names a nameless profile from the name this device typed, and never overwrites one", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Sam");
    stub({ signedIn: true, slug: null, displayName: null });
    mount(2, { host: HOST, moment: true });
    await waitFor(() => expect(updateDisplayName).toHaveBeenCalledWith("Sam"));

    updateDisplayName.mockClear();
    stub({ signedIn: true, slug: null, displayName: "Already Named" });
    mount(2, { host: HOST, moment: true });
    await screen.findAllByText(/your photos are safe/i);
    expect(updateDisplayName).not.toHaveBeenCalled();
  });
});

/**
 * THE ONE BEAT (`guest-capture` r1: `follow=card` within any multi-claim handling, `name=told`).
 * The moment card says everything a confirmation has to say: the other events once, and the name
 * her photographs now carry, whenever she typed one here, whichever name won.
 */
describe("ClaimHandlePrompt: the moment is the confirmation's one beat", () => {
  it("tells the name she is on as when she typed one here, the account's own name winning", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Priya");
    stub({ signedIn: true, slug: null, displayName: "Priya Shah" });
    mount(2, { host: HOST, moment: true });
    expect(await screen.findByText(/You're on as Priya Shah\./)).toBeVisible();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
  });

  it("tells the typed name once it became the account's name", async () => {
    localStorage.setItem("pr_guest_name_tok-1", "Priya");
    stub({ signedIn: true, slug: null, displayName: null });
    mount(2, { host: HOST, moment: true });
    expect(await screen.findByText(/You're on as Priya\./)).toBeVisible();
  });

  it("tells no name when none was typed on this album", async () => {
    stub({ signedIn: true, slug: null, displayName: "Priya Shah" });
    mount(2, { host: HOST, moment: true });
    await screen.findByText(/your photos are safe/i);
    expect(screen.queryByText(/You're on as/)).toBeNull();
  });

  it("says the other events once, inside the card", async () => {
    stub({ signedIn: true, slug: null });
    mount(2, { host: HOST, moment: true, elsewhere: 2 });
    expect(
      await screen.findByText(
        /Your uploads from other events are in your account too\./,
      ),
    ).toBeVisible();
  });
});

/**
 * THE EVENTS WAITING UNDER HER EMAIL (`identity-claims` r3, Will's `pointer=line`: "Simply
 * acknowledging the existence of other events and allowing that to be handled back on the
 * dashboard later is enough. Don't want too many complications around this, especially prior to
 * upload"). The moment asks the server for the count (the dashboard banner's own list, never this
 * album) and says it in its one line; nothing else in the slot ever asks.
 */
describe("ClaimHandlePrompt: the events waiting under her email", () => {
  it("the moment asks the server for them, for this album, and says them in its one line", async () => {
    countWaiting.mockResolvedValue(3);
    stub({ signedIn: true, slug: null });
    const { container } = mount(2, { host: HOST, moment: true });
    expect(
      await screen.findByText(
        "3 more events have photos waiting on your dashboard, whenever you like.",
      ),
    ).toBeVisible();
    expect(countWaiting).toHaveBeenCalledWith("tok-1");
    // Drawn once, whole: the card never stood without its line.
    expect(
      container.querySelectorAll("[data-follow-moment-others]"),
    ).toHaveLength(1);
  });

  it("both at once: her uploads elsewhere and the waiting events are one line", async () => {
    countWaiting.mockResolvedValue(2);
    stub({ signedIn: true, slug: null });
    const { container } = mount(2, { host: HOST, moment: true, elsewhere: 1 });
    expect(
      await screen.findByText(
        "Your uploads from other events are in your account too, and 2 more events have photos waiting on your dashboard, whenever you like.",
      ),
    ).toBeVisible();
    expect(container.textContent?.match(/other events/g)).toHaveLength(1);
  });

  it("★ confirmed before her first upload here: no moment, so her first photo's card asks nothing", async () => {
    // A confirmation from her name menu or the door before any upload claims nothing of this album,
    // so the album never hands the slot `moment` (use-confirm-return's own pin: a claim that moved
    // nothing here plays nothing). When her first photo lands she is already signed in, and the
    // slot stands its ordinary rung; the waiting events stay with her dashboard's banner.
    countWaiting.mockResolvedValue(4);
    stub({ signedIn: true, slug: null });
    const { container } = mount(1, { host: HOST });
    expect(
      await screen.findByText(/your photo is on this album/i),
    ).toBeVisible();
    expect(countWaiting).not.toHaveBeenCalled();
    expect(container.textContent).not.toMatch(/dashboard|more events/);
  });

  it("signed out, the slot asks nothing either", async () => {
    stub({ signedIn: false, slug: null });
    const { container } = mount(2, { host: HOST, moment: true });
    await waitFor(() => expect(mockCreateClient).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(countWaiting).not.toHaveBeenCalled();
  });

  it("a count that cannot be read is not said, and the moment still plays", async () => {
    countWaiting.mockRejectedValue(new Error("offline"));
    stub({ signedIn: true, slug: null });
    const { container } = mount(2, { host: HOST, moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(container.querySelector("[data-follow-moment-others]")).toBeNull();
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  });

  it("nothing waiting says nothing", async () => {
    stub({ signedIn: true, slug: null });
    const { container } = mount(2, { host: HOST, moment: true });
    expect(await screen.findByText(/your photos are safe/i)).toBeVisible();
    expect(countWaiting).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[data-follow-moment-others]")).toBeNull();
  });
});
