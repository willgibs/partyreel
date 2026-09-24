import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProfileActionsMenu } from "./profile-actions-menu";

// The menu refreshes the server tree after a block; jsdom has no app router.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  blockProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unblockProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));

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
    <ProfileActionsMenu
      profileId="p1"
      slug="maya"
      displayName="Maya"
      blocked={blocked}
    />,
  );
  fireEvent.pointerDown(
    screen.getByRole("button", { name: /more options/i }),
    { ctrlKey: false, button: 0 },
  );
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
    expect(screen.getByRole("dialog")).toHaveTextContent(/won.t be notified/i);
  });

  it("takes a reason for a report, and reporting is not blocking", () => {
    open(false);
    fireEvent.click(screen.getByRole("menuitem", { name: /report/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/doesn.t block them/i);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
