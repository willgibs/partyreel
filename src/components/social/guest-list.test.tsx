// @contract-for: src/components/social/guest-list.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import type { ProfileCardItem } from "@/lib/social/cards";

import { GUEST_LIST_FACES_THRESHOLD, GuestList } from "./guest-list";

// A chip's Follow is the real FollowButton, which reaches the profile's server
// actions (server-only) and the app router; neither exists in jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));

/**
 * THE GUEST LIST'S CONTRACT (the profile wiring, 2026-09-19).
 *
 * What is pinned is FUNCTION: that ONE component serves both surfaces and
 * therefore switches shape on a size rather than on a caller's opinion, that
 * the condensed row is a single control rather than a label with a link beside
 * it, that opening it pages instead of dumping a thousand names, and that a
 * handle-less guest gets no dead link. Nothing here asserts a colour, a radius,
 * a duration or a word: round two replaces how View all opens, and this file
 * must not stand in its way.
 */
function guests(n: number, withSlug = false): ProfileCardItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `u${i}`,
    displayName: `Guest ${i}`,
    slug: withSlug ? `guest-${i}` : null,
    avatarMarker: null,
    avatarUrl: null,
    // A fixture stand-in for withAvatarUrls' seedFor(id): this file's
    // contract is the list's shape, never a colour, so a plain per-index
    // string is enough to satisfy the type.
    seed: `seed-${i}`,
  }));
}

describe("GuestList", () => {
  it("names everyone, in chips, at or under the threshold", () => {
    render(<GuestList items={guests(GUEST_LIST_FACES_THRESHOLD)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(
      GUEST_LIST_FACES_THRESHOLD,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("condenses to ONE button past the threshold, and the button carries the count", () => {
    const items = guests(GUEST_LIST_FACES_THRESHOLD + 1);
    render(<GuestList items={items} />);
    const row = screen.getByRole("button");
    expect(row).toHaveTextContent(`${items.length} guests added photos`);
    // The names are not in the document until it is opened.
    expect(screen.queryByText("Guest 0")).not.toBeInTheDocument();
  });

  it("opens IN PLACE, one page at a time, never the whole list at once", () => {
    // 60 guests: a page, then a page, then the tail.
    render(<GuestList items={guests(60)} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getAllByRole("listitem")).toHaveLength(24);

    fireEvent.click(screen.getByRole("button", { name: /show \d+ more/i }));
    expect(screen.getAllByRole("listitem")).toHaveLength(48);

    fireEvent.click(screen.getByRole("button", { name: /show \d+ more/i }));
    expect(screen.getAllByRole("listitem")).toHaveLength(60);
    // Nothing left to ask for.
    expect(
      screen.queryByRole("button", { name: /show \d+ more/i }),
    ).not.toBeInTheDocument();
  });

  it("links a guest WITH a handle and leaves one without unlinked", () => {
    render(
      <GuestList
        items={[
          { ...guests(1)[0], id: "a", displayName: "Maya", slug: "maya" },
          { ...guests(1)[0], id: "b", displayName: "Priya", slug: null },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /maya/i })).toHaveAttribute(
      "href",
      "/u/maya",
    );
    expect(screen.queryByRole("link", { name: /priya/i })).toBeNull();
  });

  it("says so when the host's key is on and nobody has added a photo yet", () => {
    // [] is "on, empty"; null (the key is OFF) never reaches this component,
    // because both callers gate on it. That distinction is load-bearing.
    render(<GuestList items={[]} />);
    expect(screen.getByText(/nobody has added photos yet/i)).toBeInTheDocument();
  });
});

/**
 * THE IDENTITY RESHAPE'S PINS (2026-09-21, his "Listed, with the mark").
 * Function, not look: that a name nobody proved is NAMED and MARKED and links
 * nowhere, and that the one act a guest list is for is reachable from it.
 */
describe("GuestList: unverified guests", () => {
  const unverified = {
    kind: "unverified" as const,
    id: "g1",
    displayName: "Sam",
  };

  it("names an unverified guest, marks the name, and links nowhere", () => {
    render(<GuestList items={[unverified]} />);
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UNVERIFIED_LABEL }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("offers a Follow on a HANDLED chip for a signed-in viewer, and never on an unverified one", () => {
    render(
      <GuestList
        items={[
          { ...guests(1)[0], id: "a", displayName: "Maya", slug: "maya" },
          unverified,
        ]}
        viewerId="me"
      />,
    );
    expect(screen.getAllByRole("button", { name: "Follow" })).toHaveLength(1);
  });

  it("offers no Follow to a signed-out viewer, to themselves, or to somebody already followed", () => {
    const items = [
      { ...guests(1)[0], id: "a", displayName: "Maya", slug: "maya" },
      { ...guests(1)[0], id: "me", displayName: "Me", slug: "me" },
      { ...guests(1)[0], id: "b", displayName: "Priya", slug: "priya" },
    ];
    const { unmount } = render(<GuestList items={items} />);
    expect(screen.queryByRole("button", { name: "Follow" })).toBeNull();
    unmount();

    render(
      <GuestList
        items={items}
        viewerId="me"
        followingIds={new Set(["b"])}
      />,
    );
    // Only Maya is left: "me" is the viewer, "b" is already followed.
    expect(screen.getAllByRole("button", { name: "Follow" })).toHaveLength(1);
  });
});
