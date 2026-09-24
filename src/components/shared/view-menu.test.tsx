import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ViewMenu, type ViewMenuGroup } from "./view-menu";

/**
 * THE APP'S ONE VIEW MENU'S CONTRACT (`app-vocabulary` r2,
 * `controls-home=view-menu`, 2026-09-20): "Tile size, Sort and Filter move
 * behind one button." What is pinned is FUNCTION, never a look or a word:
 * every group in `groups` renders as an accessibly-named radio group, picking
 * an option calls THAT group's own handler with the picked value and no other
 * group's, a `disabled` group never fires at all, and the menu closes once a
 * real choice lands — the whole point of folding several controls behind one
 * button is that using one of them does not leave the panel sitting open.
 */

function openMenu(name: string | RegExp = "View") {
  // Radix's dropdown trigger opens on pointerdown, not click (the house
  // technique, `events-section.test.tsx`'s own `openMenu`).
  fireEvent.pointerDown(screen.getByRole("button", { name }), {
    ctrlKey: false,
    button: 0,
  });
}

function makeGroups() {
  const onTileSize = vi.fn();
  const onSort = vi.fn();
  const groups: ViewMenuGroup[] = [
    {
      id: "tile-size",
      label: "Tile size",
      value: "240",
      onChange: onTileSize,
      options: [
        { value: "180", label: "Small" },
        { value: "240", label: "Medium" },
        { value: "300", label: "Large" },
      ],
    },
    {
      id: "sort",
      label: "Sort",
      hint: "Coming soon",
      disabled: true,
      value: "newest",
      onChange: onSort,
      options: [
        { value: "newest", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
      ],
    },
  ];
  return { groups, onTileSize, onSort };
}

describe("ViewMenu", () => {
  it("renders every group as a radio group named after its own label", () => {
    render(<ViewMenu groups={makeGroups().groups} />);
    openMenu();
    expect(screen.getByRole("group", { name: "Tile size" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Sort" })).toBeTruthy();
  });

  it("calls the picked group's own handler with the chosen value, and no other group's", () => {
    const { groups, onTileSize, onSort } = makeGroups();
    render(<ViewMenu groups={groups} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Large" }));
    expect(onTileSize).toHaveBeenCalledWith("300");
    expect(onSort).not.toHaveBeenCalled();
  });

  it("never fires a disabled group's handler, and says the row is reserved", () => {
    const { groups, onSort } = makeGroups();
    render(<ViewMenu groups={groups} />);
    openMenu();
    expect(screen.getByText("Coming soon")).toBeTruthy();
    const oldest = screen.getByRole("menuitemradio", { name: "Oldest first" });
    expect(oldest.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(oldest);
    expect(onSort).not.toHaveBeenCalled();
  });

  it("closes once a real choice lands", () => {
    render(<ViewMenu groups={makeGroups().groups} />);
    openMenu();
    expect(screen.getByRole("group", { name: "Tile size" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Small" }));
    expect(screen.queryByRole("group", { name: "Tile size" })).toBeNull();
  });

  it("names the trigger with the caller's own word", () => {
    render(<ViewMenu groups={makeGroups().groups} trigger="Controls" />);
    expect(screen.getByRole("button", { name: "Controls" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "View" })).toBeNull();
  });
});
