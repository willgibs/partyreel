import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileHead } from "./profile-head";

/**
 * THE HEAD A PROFILE WEARS, public or her own before it is (`account-moments` r1). Pinned: the one thing its meta row
 * promised the phone and got wrong: that a long handle's `·` is left at the end of the first line with nothing after
 * it. The dot is part of the item it leads (its slot is clipped when that item starts a line, which only a browser
 * can show: the red-team measures it at 375), so what holds in jsdom is the structure that makes the clip possible.
 */
function head(props: Partial<React.ComponentProps<typeof ProfileHead>> = {}) {
  return (
    <ProfileHead
      seed="seed"
      avatarUrl={null}
      name="Maya Alvarez"
      handle="maya"
      joined="March 2026"
      {...props}
    />
  );
}

describe("the head's meta row", () => {
  it("★ carries each separator inside the item it leads, never as an item of its own", () => {
    render(head());
    const row = screen.getByText("Joined March 2026").closest("p")!;
    const items = [...row.querySelectorAll(":scope > span > span")];
    // Two items, the handle and the date; the dot sits in the second, hidden from a screen reader.
    expect(items.map((i) => i.textContent)).toEqual([
      "@maya",
      "·Joined March 2026",
    ]);
    expect(within(items[0] as HTMLElement).queryByText("·")).toBeNull();
    expect(within(items[1] as HTMLElement).getByText("·")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("draws no separator at all where there is no handle to separate (her page before it is public)", () => {
    render(head({ handle: null }));
    expect(screen.getByText("Joined March 2026")).toBeInTheDocument();
    expect(screen.queryByText("·")).toBeNull();
    expect(screen.queryByText(/^@/)).toBeNull();
  });
});

describe("the head", () => {
  it("names the person in the page's one h1, and the actions and the line under it stay the page's own", () => {
    render(
      head({
        actions: <button type="button">Follow</button>,
        children: <p>Only you can see this page.</p>,
      }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Maya Alvarez" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    expect(screen.getByText("Only you can see this page.")).toBeInTheDocument();
  });
});
