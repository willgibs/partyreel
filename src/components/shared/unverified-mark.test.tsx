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
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UNVERIFIED_LABEL, UnverifiedMark } from "./unverified-mark";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

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
