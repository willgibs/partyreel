/**
 * THE REVIEW PEEK BEHAVES AS THE MODAL IT IS (the ROADMAP's Host line: it "promises an Escape in a
 * comment and never listens for it").
 *
 * Pinned by behaviour: a tap in browse mode opens the peek as a dialog, focus moves onto its close
 * button, Escape closes it, and focus goes back to the tile that opened it. In select mode a tap
 * toggles and never peeks.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";
import { TooltipProvider } from "@/components/ui/tooltip";

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

/**
 * THE PEEK HOLDS FOCUS WHILE IT IS UP (crumbs-28, from `curation-wiring`). It says `aria-modal`, and a screen reader
 * takes that at its word, but nothing held Tab: from its last control the next Tab walked out behind the look, onto the
 * tiles it covers. It traps now (Radix's FocusScope, the one every Dialog here wears), coming round from its last control
 * to its first and back, while its own focus rules stand: onto the look where it carries the verdict, and back to the
 * tile once it closes.
 */
describe("the Review peek's focus", () => {
  function peekWithVerdict() {
    render(
      <TooltipProvider>
        <SelectableMediaGrid
          items={items}
          selectMode={false}
          selected={new Set()}
          exiting={new Set()}
          onToggle={vi.fn()}
          enablePreview
          layout="uniform"
          verdict={{ onApprove: vi.fn(), onReject: vi.fn() }}
        />
      </TooltipProvider>,
    );
  }
  const inPeek = () =>
    screen.getByRole("dialog").contains(document.activeElement);

  it("★ never lets Tab walk out behind it: round from its last control to its first, and back", async () => {
    const user = userEvent.setup();
    grid(false);
    await user.click(screen.getAllByRole("button", { name: "Preview" })[0]);
    const close = screen.getByRole("button", { name: /close preview/i });
    expect(document.activeElement).toBe(close);

    await user.tab();
    expect(inPeek()).toBe(true);
    await user.tab({ shift: true });
    expect(inPeek()).toBe(true);
  });

  it("★ with the verdict, Tab walks Reject, Approve and Close, then comes round to Reject", async () => {
    const user = userEvent.setup();
    peekWithVerdict();
    await user.click(screen.getAllByRole("button", { name: "Preview" })[0]);
    // Focus lands on the look itself, so Enter and Backspace are the verdict's.
    expect(document.activeElement).toBe(screen.getByRole("dialog"));

    const reject = screen.getByRole("button", { name: "Reject" });
    const approve = screen.getByRole("button", { name: "Approve" });
    const close = screen.getByRole("button", { name: /close preview/i });
    await user.tab();
    expect(document.activeElement).toBe(reject);
    await user.tab();
    expect(document.activeElement).toBe(approve);
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab();
    expect(document.activeElement).toBe(reject);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(close);
  });

  it("lets go when it closes: focus goes back to the tile it opened from", async () => {
    const user = userEvent.setup();
    grid(false);
    const tile = screen.getAllByRole("button", { name: "Preview" })[1];
    await user.click(tile);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(tile);
    // And the page's own order is the page's again.
    await user.tab();
    expect(document.activeElement).not.toBe(tile);
  });
});
