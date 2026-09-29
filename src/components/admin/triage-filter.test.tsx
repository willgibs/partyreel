import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REPORT_WORDS } from "@/lib/admin/reports";

import { TriageFilter } from "./triage-filter";
import { StatusPicker, TriageStatusControl } from "./triage-status-control";

/**
 * ONE FILTER BAR AND ONE STATUS PICKER, EACH IN ITS INBOX'S OWN WORDS (admin-triage r1, `idiom=shape`,
 * Will 2026-09-28). Support and Applicants read exactly as they did; Reports takes the same two
 * controls and keeps Open, Dismissed and Actioned, landing on its queue.
 */

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const tabs = () =>
  screen
    .getAllByRole("link")
    .map((a) => [
      a.textContent,
      a.getAttribute("href"),
      a.getAttribute("aria-current"),
    ]);

describe("the shared filter bar", () => {
  it("reads as Support's always has: All at the bare path, then its three words", () => {
    render(<TriageFilter basePath="/admin/support" />);
    expect(tabs()).toEqual([
      ["All", "/admin/support", "page"],
      ["New", "/admin/support?status=new", null],
      ["In progress", "/admin/support?status=in_progress", null],
      ["Closed", "/admin/support?status=closed", null],
    ]);
  });

  it("★ gives Reports its own words, landing on the queue with All one tab away", () => {
    render(
      <TriageFilter
        basePath="/admin/reports"
        active="open"
        words={REPORT_WORDS}
        landing="open"
      />,
    );
    expect(tabs()).toEqual([
      ["All", "/admin/reports?status=all", null],
      ["Open", "/admin/reports", "page"],
      ["Dismissed", "/admin/reports?status=dismissed", null],
      ["Actioned", "/admin/reports?status=actioned", null],
    ]);
  });

  it("marks the tab the page shows", () => {
    render(
      <TriageFilter
        basePath="/admin/reports"
        active="all"
        words={REPORT_WORDS}
        landing="open"
      />,
    );
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

function openMenu(name: RegExp) {
  // Radix's dropdown trigger opens on pointerdown, not click (the house technique).
  fireEvent.pointerDown(screen.getByRole("button", { name }), {
    ctrlKey: false,
    button: 0,
  });
}

describe("the shared status picker", () => {
  it("keeps Support's menu: every status, the current one disabled, a pick is the action", async () => {
    const action = vi.fn(async () => ({ ok: true as const }));
    render(<TriageStatusControl id="c1" status="new" action={action} />);
    openMenu(/^Status: New/);
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual([
      "New",
      "In progress",
      "Closed",
    ]);
    expect(items[0]).toHaveAttribute("data-disabled");
    fireEvent.click(screen.getByRole("menuitem", { name: "Closed" }));
    await vi.waitFor(() => expect(action).toHaveBeenCalledWith("c1", "closed"));
  });

  it("offers only the moves it is given, in the surface's words, and only reports the pick", () => {
    const onPick = vi.fn();
    render(
      <StatusPicker
        status="open"
        words={REPORT_WORDS}
        moves={["dismissed", "actioned"]}
        moveLabel={(next) => (next === "actioned" ? "Actioned…" : "Dismissed")}
        onPick={onPick}
      />,
    );
    openMenu(/^Status: Open/);
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "Dismissed",
      "Actioned…",
    ]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Actioned…" }));
    expect(onPick).toHaveBeenCalledWith("actioned");
  });
});
