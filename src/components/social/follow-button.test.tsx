import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FollowButton } from "./follow-button";

/**
 * THE FOLLOW FACE of the one relation control (`relation-toggle.tsx`). Pinned: a follow that landed
 * stays followed even where nothing re-reads the server's answer (the moment card, a claimed event's
 * row), a failed one springs back and says why, the server's answer still wins when it changes, and
 * the quieter Follow (`quiet`) is the small ghost button that names whom it follows where nothing
 * beside it does.
 *
 * ★ RESHAPED ON PURPOSE (crumbs-44; the scar kept: a landed follow stays the button's own). The
 * first case also pinned a `router.refresh()` after the follow; the Server Function's revalidation
 * re-renders the page in its own response now, so the hand-called refresh (a second render of the
 * page) went, and the write takes the person alone (`relation-toggle.test.tsx` holds the contract).
 */

const follow = vi.fn();
const unfollow = vi.fn();
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: (...args: unknown[]) => follow(...args),
  unfollowProfileAction: (...args: unknown[]) => unfollow(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  follow.mockResolvedValue({ ok: true });
  unfollow.mockResolvedValue({ ok: true });
});

describe("FollowButton", () => {
  it("★ a follow that landed stays followed, though the page never re-reads it", async () => {
    render(
      <FollowButton profileId="host-1" slug="maya" initialFollowing={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(follow).toHaveBeenCalledWith("host-1"));
    const button = await screen.findByRole("button", { name: "Following" });
    await waitFor(() => expect(button).not.toHaveAttribute("aria-busy"));
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("a failed follow springs back and says why", async () => {
    follow.mockResolvedValue({
      ok: false,
      message: "Couldn't follow right now.",
    });
    render(
      <FollowButton profileId="host-1" slug="maya" initialFollowing={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't follow right now."),
    );
    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("takes the server's answer when it changes", () => {
    const { rerender } = render(
      <FollowButton profileId="host-1" slug="maya" initialFollowing={false} />,
    );
    rerender(<FollowButton profileId="host-1" slug="maya" initialFollowing />);
    expect(
      screen.getByRole("button", { name: "Following" }),
    ).toBeInTheDocument();
  });

  it("the quieter Follow is the small ghost one, and names whom it follows", async () => {
    render(
      <FollowButton
        profileId="host-1"
        slug="tom"
        initialFollowing={false}
        quiet
        size="xs"
        name="Tom"
      />,
    );
    const button = screen.getByRole("button", { name: "Follow Tom" });
    expect(button).toHaveAttribute("data-variant", "ghost");
    expect(button).toHaveAttribute("data-size", "xs");
    fireEvent.click(button);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Following Tom" }),
      ).toBeInTheDocument(),
    );
  });

  it("the page's own Follow stays the filled one", () => {
    render(
      <FollowButton profileId="host-1" slug="maya" initialFollowing={false} />,
    );
    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute(
      "data-variant",
      "default",
    );
  });
});
