/**
 * SIGN OUT EVERYWHERE ASKS FIRST, AND SAYS THIS DEVICE GOES TOO.
 *
 * The card's own button never signs anybody out: it raises a confirm, and only the confirm's
 * press calls the action (its `global` scope pinned in actions.test.ts). The confirm names this
 * device, because this one leaving too is the consequence the name does not tell. The safe answer
 * closes with nothing sent. The device half of every guest ticket is down before the action runs,
 * as the menu's Sign out does it; a refusal comes back as a toast with the confirm still open for
 * another try, never as a silent return to the page.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  signOutEverywhereAction: vi.fn(),
  toastError: vi.fn(),
  seenAtAction: [] as (string | null)[],
}));

vi.mock("@/app/(auth)/actions", () => ({
  signOutEverywhereAction: () => {
    state.seenAtAction.push(localStorage.getItem("pr_session_tok-1"));
    return state.signOutEverywhereAction();
  },
}));
vi.mock("sonner", () => ({ toast: { error: state.toastError } }));

const { SignOutEverywhereCard } =
  await import("@/app/(app)/account/sign-out-everywhere-card");

beforeEach(() => {
  localStorage.clear();
  state.seenAtAction.length = 0;
  state.toastError.mockReset();
  state.signOutEverywhereAction.mockReset();
  // A pending promise stands in for the redirect: success never answers.
  state.signOutEverywhereAction.mockReturnValue(new Promise(() => {}));
});

function openConfirm() {
  fireEvent.click(screen.getByRole("button", { name: /sign out everywhere/i }));
  return screen.getByRole("dialog");
}

describe("SignOutEverywhereCard", () => {
  it("★ its button only asks: the confirm names this device, and nothing is sent yet", () => {
    render(<SignOutEverywhereCard />);
    const dialog = openConfirm();
    expect(dialog).toHaveAccessibleDescription(/this one/i);
    expect(state.signOutEverywhereAction).not.toHaveBeenCalled();
  });

  it("the safe answer closes the confirm with nothing sent", async () => {
    render(<SignOutEverywhereCard />);
    openConfirm();
    fireEvent.click(screen.getByRole("button", { name: /stay signed in/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(state.signOutEverywhereAction).not.toHaveBeenCalled();
  });

  it("★ the confirm's press signs out everywhere, with this device's guest tickets already down", async () => {
    localStorage.setItem("pr_session_tok-1", "s".repeat(64));
    render(<SignOutEverywhereCard />);
    const dialog = openConfirm();
    const press = [...dialog.querySelectorAll("button")].find((b) =>
      /sign out everywhere/i.test(b.textContent ?? ""),
    );
    fireEvent.click(press!);
    await waitFor(() =>
      expect(state.signOutEverywhereAction).toHaveBeenCalledTimes(1),
    );
    expect(state.seenAtAction).toEqual([null]);
  });

  it("★ a refusal says so and keeps the confirm open for another try", async () => {
    state.signOutEverywhereAction.mockResolvedValue({
      ok: false,
      message:
        "Couldn't sign out everywhere. Check your connection and try again.",
    });
    render(<SignOutEverywhereCard />);
    const dialog = openConfirm();
    const press = [...dialog.querySelectorAll("button")].find((b) =>
      /sign out everywhere/i.test(b.textContent ?? ""),
    );
    fireEvent.click(press!);
    await waitFor(() =>
      expect(state.toastError).toHaveBeenCalledWith(
        "Couldn't sign out everywhere. Check your connection and try again.",
      ),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
