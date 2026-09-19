// @contract-for: src/components/social/guest-list.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProfileCardItem } from "@/lib/social/cards";

import { GUEST_LIST_FACES_THRESHOLD, GuestList } from "./guest-list";

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
    expect(screen.getByText(/no signed-in guests/i)).toBeInTheDocument();
  });
});
