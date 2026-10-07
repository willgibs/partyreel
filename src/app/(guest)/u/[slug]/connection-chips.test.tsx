import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProfileCardItem } from "@/lib/social/cards";

import { ConnectionChips } from "./connection-chips";

// The look carries a Follow it never offers here; its Server Functions are the data layer's, which a component test never loads.
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn(),
  unfollowProfileAction: vi.fn(),
  blockProfileAction: vi.fn(),
  unblockProfileAction: vi.fn(),
}));

/**
 * THE PEOPLE SHE FOLLOWS, ON HER OWN PAGE (`/me` and `/u/<handle>`'s owner mode). Before this a chip with a page was a link
 * that left her page, and a chip without one did nothing (a ROADMAP line since `account-moments-wiring`); every chip opens
 * the look every name in the product opens now. Pinned: each chip is a button, never a link away; the look carries the
 * handle and the way to the page where there is one, and the face and name alone where there is not; and it offers no
 * Follow, since she follows every one of them already.
 */

const person = (id: string, displayName: string | null, slug: string | null) =>
  ({
    id,
    displayName,
    slug,
    avatarMarker: null,
    avatarUrl: null,
    seed: `seed-${id}`,
  }) satisfies ProfileCardItem;

const sam = person("sam", "Sam Okafor", "samo");
const lena = person("lena", "Lena Wu", null);
const nameless = person("x", null, "xx");

describe("the Connections chips", () => {
  it("★ are buttons that open the look, never links that leave her page", () => {
    render(<ConnectionChips items={[sam, lena]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Sam Okafor" })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("★ open a look with the handle and the way to the page, and no Follow", () => {
    render(<ConnectionChips items={[sam]} />);
    fireEvent.click(screen.getByRole("button", { name: "Sam Okafor" }));
    // ★ RESHAPED BY guests-room r1 (`card=standing`): the card's door is its quiet pair's "Their page", where it was the
    // look's "Open full profile"; that it opens their page is the scar kept.
    expect(screen.getByRole("link", { name: /their page/i })).toHaveAttribute(
      "href",
      "/u/samo",
    );
    expect(screen.getByText("@samo")).toBeInTheDocument();
    // Every chip is someone she already follows: the look has nothing to offer her to follow.
    expect(screen.queryByRole("button", { name: /follow/i })).toBeNull();
  });

  it("open for a person with no page too: the face and name, and no door that is not there", () => {
    render(<ConnectionChips items={[lena]} />);
    fireEvent.click(screen.getByRole("button", { name: "Lena Wu" }));
    expect(screen.getByText("Confirmed their email")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("calls a nameless person Someone, as the chips always have", () => {
    render(<ConnectionChips items={[nameless]} />);
    expect(screen.getByRole("button", { name: "Someone" })).toBeInTheDocument();
  });

  it("keeps the face out of the name a screen reader reads", () => {
    const { container } = render(<ConnectionChips items={[sam]} />);
    expect(
      container.querySelector("button [aria-hidden='true']"),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Sam Okafor" }),
    ).toBeInTheDocument();
  });
});
