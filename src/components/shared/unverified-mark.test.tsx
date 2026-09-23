// @contract-for: src/components/shared/unverified-mark.tsx
/**
 * THE ONE WORD, AND THE TWO SENTENCES UNDER IT (Will, 2026-09-22, relitigating
 * the mark himself).
 *
 * What is pinned here is a DISTINCTION, not a look. His objection to the old
 * label was precise: "name not verified... implies that we have verified the
 * names of confirmed accounts. We haven't - names can be anything, only emails
 * verified, very important distinction." So the label and both popover
 * sentences have to talk about a CONFIRMED EMAIL, and never about a verified
 * name. And because the label is a single exported constant every surface reads
 * (the lightbox's credit, the guest list, the host's Guests room, the guest's
 * own menu), pinning it here pins all of them at once.
 *
 * The one thing deliberately NOT pinned: whether the guest typed an address.
 * The public mark says the same thing either way, which is the ruling's whole
 * point — an address nobody has proved is worth nothing publicly, and a mark
 * that changed would announce that one exists.
 *
 * And the way out on a guest's own credit is pinned by what it DOES (the last
 * block): it claims the guest's uploads, as the offer card's door does, and
 * leaves the album's return marker before it opens.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { holdAlbum } from "@/lib/guest/album-return";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";

import { UNVERIFIED_LABEL, UnverifiedMark } from "./unverified-mark";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

/* The door's own machinery is the door's contract (account-door.test.tsx); here
   it is a single "Finish confirming" button that fires `onVerified`, so what is
   pinned is what the MARK does with a confirmation: the claim, then the refresh. */
vi.mock("@/components/auth/account-door", () => ({
  DOOR_WEAR: {
    keep: { heading: "Keep your photos", reason: "Confirm it." },
    signin: { heading: "Sign in", reason: "Sign in." },
  },
  AccountDoor: ({ onVerified }: { onVerified: () => Promise<void> }) => (
    <button type="button" onClick={() => void onVerified()}>
      Finish confirming
    </button>
  ),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn(async () => null),
}));

/**
 * The mark is a tap-to-open Popover (his "tooltip", answered for thumbs as well
 * as pointers), so every pin opens it first. The trigger carries no text of its
 * own — it is a dot — so the wait is on the panel's own heading line.
 */
async function open() {
  const trigger = screen.getByRole("button", { name: UNVERIFIED_LABEL });
  fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
  fireEvent.click(trigger);
  await waitFor(() =>
    expect(screen.getByText(UNVERIFIED_LABEL)).toBeInTheDocument(),
  );
}

describe("the mark's word", () => {
  it('reads "Unverified", never a claim that a name was checked', () => {
    expect(UNVERIFIED_LABEL).toBe("Unverified");
    expect(UNVERIFIED_LABEL.toLowerCase()).not.toContain("name");
  });

  it("names the mark for a screen reader and a pointer alike", () => {
    render(<UnverifiedMark name="Sam" />);
    const trigger = screen.getByRole("button", { name: UNVERIFIED_LABEL });
    expect(trigger).toHaveAttribute("title", UNVERIFIED_LABEL);
  });
});

describe("what the popover says", () => {
  it("about somebody else: anyone can type a name, and they have not confirmed an email", async () => {
    render(<UnverifiedMark name="Sam" />);
    await open();
    expect(
      screen.getByText(
        "Anyone can type a name. Sam has not confirmed an email, so this is not proof of who they are.",
      ),
    ).toBeInTheDocument();
  });

  it("names an unnamed guest without inventing one", async () => {
    render(<UnverifiedMark />);
    await open();
    expect(
      screen.getByText(/^Anyone can type a name\. This guest has not confirmed/),
    ).toBeInTheDocument();
  });

  it("about YOURSELF: what you did, what is missing, and the way out", async () => {
    render(<UnverifiedMark name="Sam" own />);
    await open();
    expect(
      screen.getByText(
        "You added these with a name and no confirmed email, so the album shows you as unverified.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm your email" }),
    ).toBeInTheDocument();
  });

  it("offers no way out on somebody else's credit", async () => {
    render(<UnverifiedMark name="Sam" />);
    await open();
    expect(
      screen.queryByRole("button", { name: "Confirm your email" }),
    ).toBeNull();
  });

  it("tells the HOST about their own switch, and only the host", async () => {
    const { unmount } = render(<UnverifiedMark name="Sam" viewerIsHost />);
    await open();
    expect(screen.getByText(/Require verified emails/)).toBeInTheDocument();
    unmount();

    render(<UnverifiedMark name="Sam" />);
    await open();
    expect(screen.queryByText(/Require verified emails/)).toBeNull();
  });
});

/**
 * THE WAY OUT CLAIMS, AND LEAVES THE WAY BACK (guest by upload, 2026-09-22).
 * Confirming from the mark is the offer card's act in the offer card's words:
 * the uploads claimed, and with them the event (there is no save step any
 * more). The album's return marker is written BEFORE the door opens, because
 * Google and a magic link leave the page, and the album's own claim on the way
 * back is what plays the follow moment. The mark names no album of its own; the
 * album on screen is the one it keeps.
 */
describe("confirming from your own credit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  async function openDoor() {
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Confirm your email" }));
    return screen.findByRole("button", { name: "Finish confirming" });
  }

  it("inside an album: the return marker first, then the claim, then the refresh", async () => {
    const release = holdAlbum("tok-1");
    render(<UnverifiedMark name="Sam" own />);
    const finish = await openDoor();
    expect(localStorage.getItem("pr_pending_offer_tok-1")).toBe("1");
    fireEvent.click(finish);
    await waitFor(() => expect(claimAnonymousUploads).toHaveBeenCalled());
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    release();
  });

  it("outside an album, claims the uploads and leaves no marker it cannot key", async () => {
    render(<UnverifiedMark name="Sam" own />);
    fireEvent.click(await openDoor());
    await waitFor(() => expect(claimAnonymousUploads).toHaveBeenCalled());
    expect(
      Object.keys(localStorage).filter((k) => k.startsWith("pr_pending_offer_")),
    ).toEqual([]);
  });
});
