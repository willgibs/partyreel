import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Download, Heart, Trash2 } from "lucide-react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BulkBar,
  HAND_TARGET,
  HAND_TARGET_BORDERED,
  type BulkBarAction,
} from "@/components/app/event-feed/bulk-bar";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";

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
    expect(
      screen.getByRole("button", { name: "Cancel selection" }),
    ).toBeTruthy();
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
    expect(screen.getByRole("alertdialog")).toBeTruthy();
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
    expect(
      screen.getByRole("button", { name: "Cancel selection" }),
    ).toBeDisabled();
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

  it("gates the rich sliding tooltip behind the hydrated flag, so the server draws the plain bar", () => {
    // architecture.md: SSR'd radix Tooltips on gallery actions silently broke prod hydration once already.
    // The fix is structural: no Tooltip primitive mounts until the render after hydration. The flag is
    // `useHydrated` (false to the server and to the hydrating render, `use-hydrated.test.tsx`), so what
    // the server sends is each icon with the browser's own `title` and no tooltip, and a client render
    // swaps the title for the sliding tooltip.
    const bar = (
      <BulkBar
        count={2}
        allSelected={false}
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={actions(() => {})}
      />
    );
    const server = renderToString(bar);
    expect(server).toContain('title="Like"');
    expect(server).toContain('title="Cancel selection"');

    const { container } = render(bar);
    expect(container.querySelector('button[aria-label="Like"]')).not.toBeNull();
    expect(container.querySelector("button[title]")).toBeNull();

    // And the flag stays the shared read, never an effect plus a setState (a cascading render the
    // react-hooks/set-state-in-effect rule refuses).
    const src = read("src/components/app/event-feed/bulk-bar.tsx");
    expect(src).toMatch(/useHydrated\(\)/);
    expect(src).not.toMatch(/useEffect\(/);
    expect(
      src,
      "the plain pre-hydration path never imports TooltipSlide",
    ).toMatch(/interactive \? \(/);
  });
});

/**
 * ★ IN A HAND, A THUMB'S FULL TARGET, AND THE DESTRUCTIVE VERB APART (crumbs-32, build 15's red-team: the bars' icon
 * buttons were 28 by 28 in a hand and Download sat 32px from Remove to Deleted, AA but under the 44px the peek's
 * verdicts use). jsdom lays nothing out, so what is pinned here is that every control wears the bar's one hand rule
 * (`HAND_TARGET`, read from the bar, never a copy of its classes) and that the hairline stands before the destructive
 * verb and nowhere else; the 44 itself is measured in a browser at 375 (the Handoff's numbers).
 */
describe("BulkBar in a hand", () => {
  const verbs = (): BulkBarAction[] => [
    { id: "like", label: "Like", icon: Heart, color: "like", onRun: () => {} },
    {
      id: "download",
      label: "Download",
      icon: Download,
      color: "save",
      onRun: () => {},
    },
    {
      id: "remove",
      label: "Remove to Deleted",
      icon: Trash2,
      color: "destructive",
      onRun: () => {},
    },
  ];
  const bar = () =>
    render(
      <BulkBar
        count={3}
        allSelected={false}
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={verbs()}
      />,
    );
  const wears = (el: HTMLElement, rule: string) =>
    rule.split(" ").every((c) => el.classList.contains(c));

  it("★ every control, All and Cancel too, wears the hand's 44px target", () => {
    bar();
    const glyphs = [
      screen.getByRole("button", { name: "Like" }),
      screen.getByRole("button", { name: "Download" }),
      screen.getByRole("button", { name: "Remove to Deleted" }),
      screen.getByRole("button", { name: "Cancel selection" }),
    ];
    for (const glyph of glyphs) expect(wears(glyph, HAND_TARGET)).toBe(true);
    // All / Clear is the bordered `<Button>`: the same rule, its reach measured past its border.
    expect(
      wears(screen.getByText("All").closest("button")!, HAND_TARGET_BORDERED),
    ).toBe(true);
    // The rule is 44 wide in a hand and reaches past the box to 44 tall, at a desk nothing.
    expect(HAND_TARGET).toMatch(/max-sm:min-w-11/);
    expect(HAND_TARGET).toMatch(/max-sm:before:-inset-y-2/);
    expect(HAND_TARGET_BORDERED).toMatch(/max-sm:before:-inset-y-\[9px\]/);
  });

  it("★ sets the destructive verb apart from the one beside it, and nothing else", () => {
    const { container } = bar();
    const apart = container.querySelectorAll("[data-bulk-apart]");
    expect(apart).toHaveLength(1);
    expect(apart[0].getAttribute("aria-hidden")).toBe("true");
    expect(apart[0].previousElementSibling?.getAttribute("aria-label")).toBe(
      "Download",
    );
    expect(apart[0].nextElementSibling?.getAttribute("aria-label")).toBe(
      "Remove to Deleted",
    );
  });

  it("a bar whose first verb is the destructive one draws no hairline before it", () => {
    const { container } = render(
      <BulkBar
        count={1}
        allSelected={false}
        onSelectAll={() => {}}
        onCancel={() => {}}
        actions={verbs().slice(2)}
      />,
    );
    expect(container.querySelector("[data-bulk-apart]")).toBeNull();
  });

  it("the album's header gives the bar its row in a hand while selecting, the label kept for a reader", () => {
    const { rerender } = render(
      <FeedSectionHeader label="Album" count={1234} action={<span />} />,
    );
    const heading = screen.getByRole("heading", { name: /album/i });
    expect(heading.className).not.toMatch(/sr-only/);
    rerender(
      <FeedSectionHeader
        label="Album"
        count={1234}
        action={<span />}
        actionFills
      />,
    );
    expect(heading.className).toMatch(/max-sm:sr-only/);
    expect(heading.parentElement?.className).toMatch(/max-sm:justify-end/);
  });
});

/**
 * ★ THE BAND KEEPS THE HEIGHT ITS TOOLS HAD, WHILE THE BAR FILLS IT (crumbs-35, build 34's red-team). At 375 the
 * album's resting tools wrap to two lines (62px) and the bulk bar is one (28px), so the album beneath moved 34px on
 * Select and back on Cancel; at 320 the tools wrap to three and it moved 68. jsdom has no layout, so the row's
 * height is what the observer is told it measured (`measure`), and what is pinned is what the row does with it:
 * it reads its height while the action does not fill it and keeps that as its minimum while it does. The numbers
 * themselves are measured in a real browser on the hub's own album (`/design/album-scale?surface=host`).
 */
describe("the band keeps its resting height while the action fills it", () => {
  const observers: {
    callback: () => void;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }[] = [];
  let rowHeight = 28;

  beforeEach(() => {
    observers.length = 0;
    rowHeight = 28;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: () => void) {
          observers.push({
            callback,
            observe: this.observe,
            disconnect: this.disconnect,
          });
        }
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ height: rowHeight }) as DOMRect,
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** The tools wrapped (or not): the observer reports the row's new height. */
  function measure(height: number) {
    rowHeight = height;
    act(() => observers.at(-1)!.callback());
  }
  const rowOf = () =>
    screen.getByRole("heading", { name: /album/i }).parentElement!;
  const header = (actionFills: boolean) => (
    <FeedSectionHeader
      label="Album"
      count={14}
      action={<span />}
      actionFills={actionFills}
    />
  );

  it("★ holds the 62px its wrapped tools stood at while the bar fills the row, and lets go on Cancel", () => {
    const { rerender } = render(header(false));
    measure(62);
    expect(rowOf().style.minHeight).toBe("");
    rerender(header(true));
    expect(rowOf().style.minHeight).toBe("62px");
    rerender(header(false));
    expect(rowOf().style.minHeight).toBe("");
  });

  it("★ holds whatever the tools wrapped to: three lines at 320 hold 96px, a single line holds its 28", () => {
    const { rerender } = render(header(false));
    measure(96);
    rerender(header(true));
    expect(rowOf().style.minHeight).toBe("96px");
    rerender(header(false));
    measure(28);
    rerender(header(true));
    expect(rowOf().style.minHeight).toBe("28px");
  });

  it("holds the latest height the tools had, a rotation at rest included", () => {
    const { rerender } = render(header(false));
    measure(62);
    measure(28);
    rerender(header(true));
    expect(rowOf().style.minHeight).toBe("28px");
  });

  it("reads the row only while the tools are there to be read, and stops the moment the bar fills it", () => {
    const { rerender } = render(header(false));
    const resting = observers.at(-1)!;
    expect(resting.observe).toHaveBeenCalledTimes(1);
    rerender(header(true));
    expect(resting.disconnect).toHaveBeenCalled();
    // Nothing observes the bar's own row: its height is the one it was handed, not a new reading of it.
    expect(observers).toHaveLength(1);
  });

  it("a row nobody measured holds nothing, which is the band as it was", () => {
    const { rerender } = render(header(false));
    rerender(header(true));
    expect(rowOf().style.minHeight).toBe("");
  });

  it("a browser with no observer holds nothing and does not fail", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { rerender } = render(header(false));
    rerender(header(true));
    expect(rowOf().style.minHeight).toBe("");
  });
});
