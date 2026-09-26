import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Heart, Trash2 } from "lucide-react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BulkBar, type BulkBarAction } from "@/components/app/event-feed/bulk-bar";

/**
 * `app-vocabulary` r1, `bulk-toolbar=icon`: the one bulk bar behind
 * `ReviewActions` and `GalleryBulkBar`. What this guards is FUNCTION — every
 * action is an icon with an accessible name, Delete's shape nests a dialog
 * inside its tooltip rather than skipping the confirm, the house press
 * feedback rides every icon button, and the rich tooltip layer is gated
 * behind a hydrated flag that starts false (architecture.md's own incident:
 * ~50 SSR'd tile actions in radix Tooltips silently broke host-page
 * hydration in prod) — never a class, a color or a copy string.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

function actions(onRun: (id: string) => void): BulkBarAction[] {
  return [
    {
      id: "like",
      label: "Like",
      icon: Heart,
      color: "like",
      onRun: () => onRun("like"),
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      color: "destructive",
      onRun: () => onRun("delete"),
      confirm: {
        title: "Remove 2 items?",
        description: "Gone right away, purged after a grace period.",
        confirmLabel: "Remove",
      },
    },
  ];
}

describe("BulkBar", () => {
  it("names every action with an accessible label, plus All/Clear and Cancel", () => {
    render(
      <BulkBar
        count={2}
        allSelected={false}
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={actions(() => {})}
      />,
    );
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Like" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel selection" })).toBeTruthy();
  });

  it("reads Clear once every item is selected", () => {
    render(
      <BulkBar
        count={2}
        allSelected
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={actions(() => {})}
      />,
    );
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.queryByText("All")).toBeNull();
  });

  it("runs a plain action at once", () => {
    const onRun = vi.fn();
    render(
      <BulkBar
        count={2}
        allSelected={false}
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={actions(onRun)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(onRun).toHaveBeenCalledWith("like");
  });

  it("nests Delete's confirm dialog inside its tooltip trigger, and runs only on confirm", () => {
    const onRun = vi.fn();
    render(
      <BulkBar
        count={2}
        allSelected={false}
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={actions(onRun)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Remove 2 items?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRun).toHaveBeenCalledWith("delete");
  });

  it("calls onSelectAll and onCancel from their own controls", () => {
    const onSelectAll = vi.fn();
    const onCancel = vi.fn();
    render(
      <BulkBar
        count={2}
        allSelected={false}
        onSelectAll={onSelectAll}
        onCancel={onCancel}
        actions={actions(() => {})}
      />,
    );
    fireEvent.click(screen.getByText("All"));
    expect(onSelectAll).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel selection" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables every action while busy, All/Clear and Cancel included", () => {
    render(
      <BulkBar
        count={2}
        allSelected={false}
        busy
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={actions(() => {}).map((a) => ({ ...a, disabled: true }))}
      />,
    );
    expect(screen.getByText("All").closest("button")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Like" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel selection" })).toBeDisabled();
  });

  it("drops the press scale under reduced motion", () => {
    // The icon buttons ride `!` on their press scale (Button's own active
    // scale out-specifies a plain one), so the reduced-motion reset has to
    // carry `!` too or it loses to the press it exists to cancel.
    const src = read("src/components/app/event-feed/bulk-bar.tsx");
    if (/active:scale-[\w.[\]]+!/.test(src))
      expect(src).toContain("motion-reduce:active:scale-100!");
  });

  it("shows each control's own tooltip when it takes focus", () => {
    // Radix opens a tooltip on focus as well as hover, and jsdom's fireEvent
    // reflects that reliably (unlike a hand-dispatched PointerEvent sequence,
    // which raced Radix's own state machine when checked live in Chrome —
    // documented in the manifest's Handoff rather than fought here).
    render(
      <BulkBar
        count={2}
        allSelected={false}
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={actions(() => {})}
      />,
    );
    const like = screen.getByRole("button", { name: "Like" });
    const del = screen.getByRole("button", { name: "Delete" });
    const cancel = screen.getByRole("button", { name: "Cancel selection" });

    const openTip = () =>
      [...document.querySelectorAll('[data-slot="tooltip-content"]')].find(
        (el) => el.getAttribute("data-state")?.includes("open"),
      );

    fireEvent.focus(like);
    expect(openTip()?.textContent).toContain("Like");

    fireEvent.blur(like);
    fireEvent.focus(del);
    expect(openTip()?.textContent).toContain("Delete");

    fireEvent.blur(del);
    fireEvent.focus(cancel);
    expect(openTip()?.textContent).toContain("Cancel selection");
  });

  it("gates the rich sliding tooltip behind a hydrated flag that starts false", () => {
    // architecture.md: SSR'd radix Tooltips on gallery actions silently broke
    // prod hydration once already. The fix here is structural — no Tooltip
    // primitive mounts until one tick after mount — so this is a source
    // assertion rather than a simulated timing race (testing-verification.md:
    // hydration timing is not reliably observable through jsdom/RTL's
    // act-flushed effects). useSyncExternalStore, not a useEffect + setState:
    // the latter is a cascading render the react-hooks/set-state-in-effect
    // rule refuses, and a subscription read is the correct tool anyway —
    // use-prefers-reduced-motion.ts's own shape for the same problem.
    const src = read("src/components/app/event-feed/bulk-bar.tsx");
    expect(src).toMatch(/useSyncExternalStore\(/);
    expect(src).not.toMatch(/useEffect\(/);
    expect(src, "the plain pre-hydration path never imports TooltipSlide").toMatch(
      /interactive \? \(/,
    );
    expect(src).toMatch(/title=\{interactive \? undefined : label\}/);
  });
});
