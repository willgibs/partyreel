/**
 * THE REVIEW PEEK BEHAVES AS THE MODAL IT IS (the ROADMAP's Host line: it "promises an Escape in a
 * comment and never listens for it").
 *
 * Pinned by behaviour: a tap in browse mode opens the peek as a dialog, focus moves onto its close
 * button, Escape closes it, and focus goes back to the tile that opened it. In select mode a tap
 * toggles and never peeks.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";

import { SelectableMediaGrid } from "./selectable-media-grid";

const items: GridMedia[] = [
  { id: "m1", type: "photo", url: "signed:m1", status: "pending" },
  { id: "m2", type: "photo", url: "signed:m2", status: "pending" },
];

function grid(selectMode: boolean, onToggle = vi.fn()) {
  render(
    <SelectableMediaGrid
      items={items}
      selectMode={selectMode}
      selected={new Set()}
      exiting={new Set()}
      onToggle={onToggle}
      enablePreview
      layout="uniform"
    />,
  );
  return onToggle;
}

describe("the Review peek", () => {
  it("opens as a dialog with focus on its close button, and Escape closes it back to the tile", () => {
    grid(false);
    const tile = screen.getAllByRole("button", { name: "Preview" })[0];
    tile.focus();
    fireEvent.click(tile);

    expect(screen.getByRole("dialog", { name: /photo preview/i })).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /close preview/i }),
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(tile);
  });

  it("ignores every other key", () => {
    grid(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Preview" })[0]);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("never peeks in select mode: a tap toggles", () => {
    const onToggle = grid(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Select" })[0]);
    expect(onToggle).toHaveBeenCalledWith("m1");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
