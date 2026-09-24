import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { EntryShell } from "@/components/guest/entry-shell";
import { setViewportWidth } from "../../../vitest.setup";

/**
 * THE DOOR'S TWO POSTURES. Anchored to an edge rather than centred as a modal,
 * the door leaves far more of the album waiting behind it in view, blurred.
 *
 * ★ WHAT IS PINNED IS THE POSTURE AND THE ENGINE, NEVER THE LOOK. `sheet.tsx`
 * owns the classes of a responsive panel and writes `data-side="responsive"`
 * when it is wearing them, so THAT attribute is the contract here: it is the
 * difference between a panel anchored to an edge (the album visible above or
 * beside it, which is the whole reason to anchor it) and a centred float. A
 * class string copied into an assertion would pin the primitive's private
 * spelling and rot the first time it is retuned.
 *
 * ★ AND VAUL IS STILL THE PHONE, which is not a style question either: the
 * password and account gates type into this surface, and `repositionInputs` is
 * the only reason a focused field is not under the keyboard. A Radix panel at
 * both widths would be simpler code and a worse door.
 */
afterEach(() => setViewportWidth(1024));

const shell = (
  props: Partial<React.ComponentProps<typeof EntryShell>> = {},
) => (
  <EntryShell
    open
    dismissMode="free"
    onDismiss={() => {}}
    title="Welcome"
    description="Join this event"
    {...props}
  >
    <p>the welcome</p>
  </EntryShell>
);

describe("from 640 up: the one product Sheet, from the right edge", () => {
  it("wears the responsive posture rather than a centred float", () => {
    render(shell());
    const panel = document.querySelector("[data-entry-sheet]")!;
    expect(panel).not.toBeNull();
    expect(panel.getAttribute("data-slot")).toBe("sheet-content");
    // The primitive's own marker for "a bottom sheet in a hand, a side panel at
    // a desk" — never one of the four fixed sides.
    expect(panel.getAttribute("data-side")).toBe("responsive");
    expect(screen.getByText("the welcome")).toBeInTheDocument();
  });

  it("keeps the honest-affordance table: free shows the X, held shows none", () => {
    const { rerender, unmount } = render(shell());
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeNull();
    rerender(shell({ dismissMode: "held" }));
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    unmount();
  });
});

describe("below 640: the vaul drawer, at the Sheet's own ceiling", () => {
  it("renders the drawer engine, not a Radix panel", () => {
    setViewportWidth(375);
    render(shell());
    const drawer = document.querySelector("[data-entry-drawer]")!;
    expect(drawer).not.toBeNull();
    // vaul stamps its own attribute on the content it drives; losing it would
    // mean losing the drag physics and the keyboard lift with it.
    expect(drawer.hasAttribute("data-vaul-drawer")).toBe(true);
    expect(document.querySelector("[data-entry-sheet]")).toBeNull();
  });

  it("stops short of the top edge, so the album still shows above it", () => {
    setViewportWidth(375);
    render(shell());
    // The one posture number the drawer shares with the Sheet. vaul owns this
    // element's transform and inset outright, so the two agree by this class
    // rather than by handing vaul the primitive's whole position string.
    const drawer = document.querySelector("[data-entry-drawer]")!;
    expect(drawer.className).toContain("max-h-[85svh]");
  });
});
