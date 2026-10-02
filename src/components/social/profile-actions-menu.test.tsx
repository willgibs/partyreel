import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileActionsMenu } from "./profile-actions-menu";

const block = vi.fn();
const unblock = vi.fn();
const media = vi.hoisted(() => ({ wide: true }));
vi.mock("@/lib/use-media-query", () => ({ useMediaQuery: () => media.wide }));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  blockProfileAction: (...args: unknown[]) => block(...args),
  unblockProfileAction: (...args: unknown[]) => unblock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  media.wide = true;
  block.mockResolvedValue({ ok: true });
  unblock.mockResolvedValue({ ok: true });
});

/**
 * THE PROFILE MENU'S CONTRACT (the profile wiring, 2026-09-19).
 *
 * Two functions are pinned and both are privacy, not styling:
 *   1. REPORT AND BLOCK ARE BOTH REACHABLE. A menu that offered only blocking
 *      told every user that a complaint about a person had nowhere to go.
 *   2. THE MENU DOES NOT CHANGE SHAPE UNDER A BLOCK. When I have blocked
 *      someone the block row becomes Unblock and everything else stands; a menu
 *      that emptied or vanished would leak the block to the other side, which
 *      is the one thing a block promises it will not do.
 * Words, icons and the dialogs' copy are precedent, not contract.
 */
function open(blocked: boolean) {
  render(
    <ProfileActionsMenu profileId="p1" displayName="Maya" blocked={blocked} />,
  );
  reopen();
}

function reopen() {
  fireEvent.pointerDown(screen.getByRole("button", { name: /more options/i }), {
    ctrlKey: false,
    button: 0,
  });
}

describe("ProfileActionsMenu", () => {
  it("offers reporting the person AND blocking them", () => {
    open(false);
    expect(screen.getByRole("menuitem", { name: /report/i })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /^block$/i })).toBeVisible();
  });

  it("keeps both rows when I already block them (report stays, block becomes unblock)", () => {
    open(true);
    expect(screen.getByRole("menuitem", { name: /report/i })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /unblock/i })).toBeVisible();
  });

  it("explains the block before doing it (the confirm is its own step)", () => {
    open(false);
    fireEvent.click(screen.getByRole("menuitem", { name: /^block$/i }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      /won.t be notified/i,
    );
    expect(block).not.toHaveBeenCalled();
  });

  // crumbs-44: the row is a face of the one relation control, so the ask's Block writes through the
  // same contract as every other face and the row says Unblock the moment it lands.
  it("blocks on the ask's own Block, and the row becomes Unblock", async () => {
    open(false);
    fireEvent.click(screen.getByRole("menuitem", { name: /^block$/i }));
    const ask = screen.getByRole("alertdialog");
    fireEvent.click(
      [...ask.querySelectorAll("button")].find(
        (b) => b.textContent === "Block",
      )!,
    );
    await waitFor(() => expect(block).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    reopen();
    expect(
      await screen.findByRole("menuitem", { name: /unblock/i }),
    ).toBeVisible();
  });

  it("unblocks at once from the row, with no ask", async () => {
    open(true);
    fireEvent.click(screen.getByRole("menuitem", { name: /unblock/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(unblock).toHaveBeenCalledWith("p1"));
  });

  it("takes a reason for a report, and reporting is not blocking", () => {
    open(false);
    fireEvent.click(screen.getByRole("menuitem", { name: /report/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/doesn.t block them/i);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  // crumbs-44: at a phone the actions sit on a row of their own from its left, so an end-aligned
  // panel hung off the screen and Radix pushed it to the glass's edge, under Follow rather than its
  // own trigger. It hangs from the trigger's own side, and keeps the floating layer's 8px off the edge.
  it("hangs from its trigger's start at a phone, and from its end beside the name", () => {
    media.wide = false;
    const { unmount } = render(
      <ProfileActionsMenu profileId="p1" displayName="Maya" blocked={false} />,
    );
    reopen();
    expect(screen.getByRole("menu")).toHaveAttribute("data-align", "start");
    unmount();

    media.wide = true;
    open(false);
    expect(screen.getByRole("menu")).toHaveAttribute("data-align", "end");
  });
});
