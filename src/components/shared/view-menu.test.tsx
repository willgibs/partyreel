import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ViewMenu,
  type ViewMenuDensityGroup,
  type ViewMenuGroup,
} from "./view-menu";

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

/**
 * THE DENSITY GROUP (`album-columns` r2, `steps=both`): the rows' three steps
 * as a slider inside the same menu, at every width. Its stops are the menu's
 * own radio items (a slider thumb inside a menu is unreachable by keyboard),
 * laid densest first, and a pick keeps the menu open so the album re-lays
 * behind it while the reader tries the next.
 */
describe("ViewMenu: the density group", () => {
  const density = (
    over: Partial<ViewMenuDensityGroup> = {},
  ): ViewMenuDensityGroup => ({
    kind: "density",
    id: "size",
    label: "Size",
    value: 1,
    onChange: vi.fn(),
    perRow: (s) => [3, 5, 8][s],
    ...over,
  });

  it("draws three stops, densest first, each saying its photographs a row", () => {
    render(<ViewMenu groups={[density(), ...makeGroups().groups]} />);
    openMenu();
    expect(screen.getByRole("group", { name: "Size" })).toBeTruthy();
    const stops = screen
      .getAllByRole("menuitemradio")
      .filter((el) => el.closest("[data-density-control]"));
    expect(stops.map((el) => el.getAttribute("aria-label"))).toEqual([
      "8 a row",
      "5 a row",
      "3 a row",
    ]);
    expect(stops[1].getAttribute("aria-checked")).toBe("true");
    // The trailing note reads the current step in the same words.
    expect(screen.getByText("5 a row", { selector: "span" })).toBeTruthy();
  });

  it("hands the picked step back as a step, and stays open", () => {
    const group = density();
    render(<ViewMenu groups={[group]} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "8 a row" }));
    expect(group.onChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole("group", { name: "Size" })).toBeTruthy();
  });

  it("names the stops by size where the width is not known, and never fires disabled", () => {
    const group = density({ perRow: undefined, disabled: true });
    render(<ViewMenu groups={[group]} />);
    openMenu();
    const large = screen.getByRole("menuitemradio", { name: "Large" });
    expect(screen.getByRole("menuitemradio", { name: "Small" })).toBeTruthy();
    expect(large.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(large);
    expect(group.onChange).not.toHaveBeenCalled();
  });
});
