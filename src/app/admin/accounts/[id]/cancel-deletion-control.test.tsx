import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE OPERATOR'S CANCEL DELETION SAYS WHAT COMES BACK AND WHAT DOES NOT, before it acts (Will,
 * 2026-10-03: "say plainly in the control"). Its list is the promise `cancelAccountDeletion`
 * keeps: the sign-in with its address, the events in Deleted on their own 30 days; never the
 * name, photo and handle, the plan, the newsletter, the names on her rows elsewhere, or uploads
 * she took out. Reversible, so it asks for no typing; and nothing is sent until its verb is pressed.
 */

const action = vi.hoisted(() => vi.fn(async () => ({ ok: true })));
vi.mock("@/app/admin/accounts/actions", () => ({
  cancelAccountDeletionAsOperatorAction: action,
  deleteAccountAsOperatorAction: vi.fn(),
}));

const { CancelDeletionControl, cancelDeletionTouches } =
  await import("./delete-account-control");

describe("Cancel deletion", () => {
  it("★ lists what comes back and what stays gone, and asks for no typing", () => {
    render(<CancelDeletionControl userId="u-1" eventCount={1249} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel deletion/i }));
    const dialog = screen.getByRole("alertdialog");
    const touches = [
      ...dialog.querySelectorAll("[data-slot='destructive-touches'] li"),
    ].map((li) => li.textContent?.replace(/^-/, "").trim());
    expect(touches).toEqual([
      "Comes back: the sign-in, with its email address",
      "Comes back: their 1,249 events, in Deleted, each restorable for 30 days from when it was deleted",
      "Stays gone: their name, profile photo and handle (they set a name again at their next sign-in)",
      "Stays gone: their plan, cancelled in Stripe and not refunded, and their newsletter signup",
      "Stays gone: their name and address on their rows in other hosts' albums, and any uploads they took out of those albums",
    ]);
    expect(within(dialog).queryByRole("textbox")).toBeNull();
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep the account" }),
    );
    expect(action).toHaveBeenCalledWith("u-1");
  });

  it("names no events line for an account with none left, and one event as one", () => {
    expect(cancelDeletionTouches(0).some((t) => /event/.test(t))).toBe(false);
    expect(cancelDeletionTouches(1)[1]).toBe(
      "Comes back: their event, in Deleted, restorable for 30 days from when it was deleted",
    );
  });
});
