import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { EntryShell } from "@/components/guest/entry-shell";
import { setViewportWidth } from "../../../vitest.setup";

/**
 * THE DOOR'S TWO POSTURES, ONE SHEET. Anchored to an edge rather than centred as
 * a modal, the door leaves far more of the album waiting behind it in view,
 * blurred.
 *
 * ★ WHAT IS PINNED IS THE POSTURE AND THE ENGINE, NEVER THE LOOK. `sheet.tsx`
 * owns the classes of a responsive panel and writes `data-side="responsive"`
 * when it is wearing them, so THAT attribute is the contract here: it is the
 * difference between a panel anchored to an edge (the album visible above or
 * beside it, which is the whole reason to anchor it) and a centred float. A
 * class string copied into an assertion would pin the primitive's private
 * spelling and rot the first time it is retuned.
 *
 * ★ AND THE PHONE IS THE SAME SHEET NOW, not vaul (door-flow): the door never
 * drags, and vaul's keyboard lift was the bug. The responsive Sheet's phone half
 * is keyboard-safe for every sheet (its own pins: `src/components/ui/sheet.test.tsx`).
 */
afterEach(async () => {
  // Radix restores focus on unmount from a setTimeout(0); let it run inside the test's document.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  setViewportWidth(1024);
});

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
    <input aria-label="Your name" />
  </EntryShell>
);

const panel = () => document.querySelector<HTMLElement>("[data-entry-sheet]")!;

describe("one product Sheet at both widths, never a centred float", () => {
  it("from 640 up: the responsive posture, a panel from the right edge", () => {
    render(shell());
    expect(panel()).not.toBeNull();
    expect(panel().getAttribute("data-slot")).toBe("sheet-content");
    // The primitive's own marker for "a bottom sheet in a hand, a side panel at
    // a desk" — never one of the four fixed sides.
    expect(panel().getAttribute("data-side")).toBe("responsive");
    expect(screen.getByText("the welcome")).toBeInTheDocument();
  });

  it("below 640: the SAME Sheet, not a vaul drawer", () => {
    setViewportWidth(375);
    render(shell());
    expect(panel().getAttribute("data-side")).toBe("responsive");
    // vaul stamps its own attribute on the content it drives; nothing here may.
    expect(document.querySelector("[data-vaul-drawer]")).toBeNull();
    expect(screen.getByText("the welcome")).toBeInTheDocument();
  });

  it("keeps the honest-affordance table: free shows the X, held shows none", () => {
    const { rerender, unmount } = render(shell());
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeNull();
    rerender(shell({ dismissMode: "held" }));
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    unmount();
  });

  it("wears the door's own scrim", () => {
    render(shell());
    expect(
      document.querySelector('[data-slot="sheet-overlay"]'),
    ).not.toBeNull();
  });
});

describe("no field takes focus when the door opens", () => {
  it("at a phone: the panel holds focus, never the name field", () => {
    setViewportWidth(375);
    render(shell({ dismissMode: "held" }));
    expect(screen.getByLabelText("Your name")).not.toHaveFocus();
    expect(panel()).toHaveFocus();
  });

  it("at a desk too (the door's rule is both widths)", () => {
    render(shell({ dismissMode: "held" }));
    expect(screen.getByLabelText("Your name")).not.toHaveFocus();
    expect(panel()).toHaveFocus();
  });
});
