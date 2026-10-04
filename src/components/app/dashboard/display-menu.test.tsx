import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { DisplayMenu } from "./display-menu";
import { DISPLAY_DEFAULT, type Display } from "@/lib/dashboard/display";

/**
 * THE DISPLAY MENU'S OWN FUNCTION (the choices themselves are `events-section.test.tsx`'s): what a Reset leaves
 * behind. It shows only while something is set, so pressing it removes the button that held the focus.
 */

const COUNTS = { all: 3, hosting: 3, guest: 0, deleted: 0 };

function Menu({ initial }: { initial: Display }) {
  const [display, setDisplay] = useState(initial);
  return (
    <DisplayMenu
      display={display}
      onChange={setDisplay}
      counts={COUNTS}
      years={["2026"]}
    />
  );
}

describe("the Display menu's Reset", () => {
  // ★ RED-TEAM 53's NIT (crumbs-65): a real click on Reset unmounted it, and the focus fell to the page's <body> while
  // the menu stayed open, so a keyboard user who pressed it was thrown out of the menu she was shaping.
  it("★ keeps the focus on the menu when it goes, never dropping it to the page", () => {
    render(<Menu initial={{ ...DISPLAY_DEFAULT, layout: "table" }} />);
    fireEvent.click(screen.getByRole("button", { name: /^display/i }));
    const panel = screen.getByRole("dialog");
    const reset = within(panel).getByRole("button", { name: "Reset" });
    reset.focus();
    expect(document.activeElement).toBe(reset);

    fireEvent.click(reset);

    // Everything is reset (so Reset has nothing left to undo and leaves)...
    expect(within(panel).queryByRole("button", { name: "Reset" })).toBeNull();
    expect(
      within(panel).getByRole("radio", { name: /gallery/i }),
    ).toBeChecked();
    // ...and the focus did not leave with it.
    expect(document.activeElement).not.toBe(document.body);
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it("is there only while something is set", () => {
    render(<Menu initial={DISPLAY_DEFAULT} />);
    fireEvent.click(screen.getByRole("button", { name: /^display/i }));
    expect(
      within(screen.getByRole("dialog")).queryByRole("button", {
        name: "Reset",
      }),
    ).toBeNull();
  });
});
