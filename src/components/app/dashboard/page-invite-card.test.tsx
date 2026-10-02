import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { dismissPageInviteAction } from "@/app/(app)/account/profile/actions";

import { PageInviteCard } from "./page-invite-card";

vi.mock("@/app/(app)/account/profile/actions", () => ({
  dismissPageInviteAction: vi.fn(),
}));

/**
 * THE INVITATION (`identity-profile` r1, `prompt=claim`): one door into the setup, and a Not now
 * that answers at once and is remembered (the dashboard decides whether it renders at all).
 */
beforeEach(() => {
  vi.mocked(dismissPageInviteAction).mockReset();
});

describe("the page setup's invitation", () => {
  it("opens the setup", () => {
    render(<PageInviteCard />);
    expect(
      screen.getByRole("link", { name: "Choose what shows" }),
    ).toHaveAttribute("href", "/account/profile");
  });

  // crumbs-44 (from `profile-setup`): the button repeated the card's title, so it said what twice and
  // why never. It carries the reason now, and the title stays the card's alone.
  it("says the setup once: the button carries its reason, never the title again", () => {
    render(<PageInviteCard />);
    expect(screen.getAllByText("Set up your page")).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: "Set up your page" }),
    ).not.toBeInTheDocument();
  });

  // crumbs-46: /me wears the invitation as its head (an account with no handle keeps her uploads, likes and
  // connections there), and the user menu's Your profile has no other door to the setup, so there it stands: a
  // Not now would take the only way on from the page she chose to open, and it would hide the dashboard's too.
  it("stands without a Not now where the page asks it not to be dismissible", () => {
    render(<PageInviteCard dismissible={false} />);
    expect(
      screen.getByRole("link", { name: "Choose what shows" }),
    ).toHaveAttribute("href", "/account/profile");
    expect(
      screen.queryByRole("button", { name: "Not now" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Set up your page")).toHaveLength(1);
  });

  it("is dismissible wherever the page says nothing, as the dashboard's is", () => {
    render(<PageInviteCard />);
    expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
  });

  it("Not now leaves at once and is remembered", async () => {
    vi.mocked(dismissPageInviteAction).mockResolvedValue({ ok: true });
    const { container } = render(<PageInviteCard />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(dismissPageInviteAction).toHaveBeenCalled());
  });

  it("comes back, with a word, when Not now could not be remembered", async () => {
    vi.mocked(dismissPageInviteAction).mockResolvedValue({ ok: false });
    render(<PageInviteCard />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    await screen.findByRole("link", { name: "Choose what shows" });
    expect(toast.error).toHaveBeenCalled();
  });
});
