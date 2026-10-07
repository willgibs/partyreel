import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProfileCardItem } from "@/lib/social/cards";

import { GuestPeek } from "./guest-peek";

/**
 * THE LOOK'S FOLLOW (`account-moments` r1, `tidy=stays`: a name in Connections opens this look, where Follow after
 * an Unblock is one press). The look's own face, its door, its own Follow and its host-only Block are the guest
 * list's contract (`guest-list.test.tsx`); pinned here is what Connections asked of it: that a surface which keeps the
 * relation itself hands the look its own Follow, and that `canFollow` still decides whether any is offered.
 */

// The look's own Follow is the real FollowButton, which reaches the profile's server actions (server-only).
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const ray: ProfileCardItem = {
  id: "ray",
  displayName: "Ray Moss",
  slug: "raym",
  avatarMarker: null,
  avatarUrl: null,
  seed: "seed-ray",
};

function look(props: Partial<React.ComponentProps<typeof GuestPeek>> = {}) {
  return (
    <GuestPeek item={ray} canFollow {...props}>
      <button type="button">Ray Moss</button>
    </GuestPeek>
  );
}

const open = () =>
  fireEvent.click(screen.getByRole("button", { name: "Ray Moss" }));

describe("the look's Follow", () => {
  it("offers the surface's own Follow in place of its own, and keeps the door", () => {
    render(look({ follow: <button type="button">Surface follow</button> }));
    open();
    expect(
      screen.getByRole("button", { name: "Surface follow" }),
    ).toBeInTheDocument();
    // One Follow, never two: the look's own would be a second control for the one relation.
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toHaveAttribute("href", "/u/raym");
  });

  it("★ offers none where the surface says she cannot, its own or the look's, and still opens the door", () => {
    render(
      look({
        canFollow: false,
        follow: <button type="button">Surface follow</button>,
      }),
    );
    open();
    expect(screen.queryByRole("button", { name: /follow/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: /open full profile/i }),
    ).toBeInTheDocument();
  });

  it("is still the look's own Follow wherever the surface hands none (every guest list)", () => {
    render(look());
    open();
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  });
});
