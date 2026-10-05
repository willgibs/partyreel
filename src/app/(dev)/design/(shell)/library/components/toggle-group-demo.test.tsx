import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DisplayMenuDemo } from "./toggle-group-demo";

/**
 * THE DISPLAY MENU IS ToggleGroup'S HEAVIEST CALLER, AND THE SPECIMEN IS THE REAL MENU OVER A STATE OF ITS OWN
 * (`toggle-group-demo.tsx`): every press changes the state at once, the badge on the button counts what is set, and Reset
 * undoes it. Nothing is stored.
 */

async function openMenu() {
  render(<DisplayMenuDemo />);
  await userEvent.click(screen.getByRole("button", { name: /display/i }));
}

describe("the real display menu over its own state", () => {
  it("★ a press on a tile takes effect at once: the tile is pressed and the button counts it", async () => {
    await openMenu();
    const table = screen.getByRole("radio", { name: /table/i });
    expect(table).toHaveAttribute("aria-checked", "false");
    await userEvent.click(table);
    expect(table).toHaveAttribute("aria-checked", "true");
    // The first press moved the layout off its default: one thing is set, and the button says so.
    expect(
      screen.getByRole("button", { name: /display, 1 set/i }),
    ).toBeInTheDocument();
  });

  it("★ the pressed one stays pressed: a second press never leaves a group with none", async () => {
    await openMenu();
    const gallery = screen.getByRole("radio", { name: /gallery/i });
    await userEvent.click(gallery);
    expect(gallery).toHaveAttribute("aria-checked", "true");
  });

  it("★ Reset shows only while something is set, and undoes it", async () => {
    await openMenu();
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: /list/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Reset" }));
    expect(screen.getByRole("radio", { name: /gallery/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  });
});
