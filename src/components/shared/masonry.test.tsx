import { Download, EyeOff } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  columnsFor,
  distributeColumns,
  MasonryColumns,
  ROWS_FIRST_PAINT,
  steadyWidth,
  type TileAction,
} from "@/components/shared/masonry";
import { ROW_CLASSES } from "@/lib/shared/album-rows";

// The lazy wrapper is next/dynamic, which resolves after the pin is over; the
// address pins need the real viewer, so it mounts synchronously here (closed, it
// renders nothing, so every other pin in this file sees the grid it always saw).
vi.mock("@/components/shared/media-lightbox.lazy", async () => {
  const { MediaLightbox } = await import("@/components/shared/media-lightbox");
  return { MediaLightboxLazy: MediaLightbox, preloadMediaLightbox: () => {} };
});

// The rows' glide is `runFlip`'s own contract (use-flip.test.tsx); here only
// WHEN the grid asks for one is pinned, so the pass itself is a spy.
const runFlipSpy = vi.hoisted(() => vi.fn());
vi.mock("@/lib/shared/use-flip", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/shared/use-flip")>()),
  runFlip: runFlipSpy,
}));

/**
 * THE ONE ALBUM TILE'S CONTRACT (Will, `tiles`, 2026-09-20, in his own words:
 * "Having icons visible on every image card on mobile is going to get way too
 * crowded and overwhelming immediately. Aside from an active like icon..., a
 * video play icon..., or a like count..., let's handle all actions and controls
 * (like, download, etc) in the lightbox controls.").
 *
 * FUNCTION ONLY. Nothing here reads a colour, a blur or a position: what is held
 * is WHAT A TILE MAY CARRY (marks, and on the desk one declared action set) and
 * the structural invariants a control depends on. The look is Will's.
 *
 * ★ jsdom has no layout, so `clientWidth` is 0 and the grid stays in its
 * pre-measure paint: one flat box, every tile in it. That is the right thing to
 * test — the column ASSIGNMENT is an arrangement, and every rule below is about
 * what a tile CONTAINS, which is identical in both.
 */
const items: GridMedia[] = [
  { id: "a", type: "photo", url: "/a.jpg", width: 800, height: 1200 },
  { id: "b", type: "video", url: "/b.mp4", width: 1920, height: 1080 },
];

const withCount: GridMedia[] = [
  { ...items[0], likeCount: 4 },
  { ...items[1], likeCount: 0 },
];

const hostRow = (item: GridMedia): readonly TileAction[] => [
  { id: "save", label: "Save", icon: Download, tone: "save", href: "/d.jpg" },
  {
    id: "hide",
    label: "Hide",
    icon: EyeOff,
    tone: "warning",
    onSelect: () => {},
  },
  ...(item.id === "a"
    ? []
    : [{ id: "extra", label: "Extra", icon: Download } as TileAction]),
];

describe("a tile carries MARKS, and a phone carries nothing else", () => {
  it("renders no control at all when the surface declares no actions", () => {
    render(<MasonryColumns items={items} />);
    // Two open-the-lightbox buttons, and not one more control on either tile.
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(document.querySelector("[data-tile-actions]")).toBeNull();
  });

  it("gives a video its play mark and a photograph none", () => {
    const { container } = render(<MasonryColumns items={items} />);
    const tiles = container.querySelectorAll("[data-media-tile]");
    expect(tiles).toHaveLength(2);
    expect(tiles[0].querySelector("svg.lucide-play")).toBeNull();
    expect(tiles[1].querySelector("svg.lucide-play")).not.toBeNull();
  });

  it("shows the like mark for a count, and nothing at zero", () => {
    const { container } = render(<MasonryColumns items={withCount} />);
    const marks = container.querySelectorAll('[data-tile-mark="like"]');
    // The 4-like tile wears the mark; the 0-like tile stays clean.
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toContain("4");
  });

  it("suppresses the like mark where every tile is liked (the Likes feed)", () => {
    const { container } = render(
      <LikesProvider
        mediaIds={items.map((m) => m.id)}
        initialLikedIds={items.map((m) => m.id)}
      >
        <MasonryColumns items={items} hideLikeMark />
      </LikesProvider>,
    );
    expect(container.querySelectorAll('[data-tile-mark="like"]')).toHaveLength(
      0,
    );
  });
});

describe("the desk's hover set is ONE pane, declared per surface", () => {
  it("draws every action of the set inside a single bar", () => {
    const { container } = render(
      <MasonryColumns items={items} tileActions={hostRow} />,
    );
    const bars = container.querySelectorAll("[data-tile-actions]");
    expect(bars).toHaveLength(2);
    // The glyphs inside the bar carry no material of their own: a backdrop
    // filter per glyph would stack one blur per action under every scroll.
    for (const bar of bars) {
      expect(bar.className).toContain("md:flex");
      // Never below `md`: a phone tile is marks only.
      expect(bar.className).toContain("hidden");
      for (const glyph of bar.children)
        expect(glyph.className).not.toContain("glass");
    }
    // The set is per ITEM, not per grid: tile "b" declared one more verb.
    expect(bars[0].children).toHaveLength(2);
    expect(bars[1].children).toHaveLength(3);
  });

  it("keeps a control's tap off the lightbox", () => {
    // Structural, because jsdom cannot hit-test paint order: the bar is a
    // SIBLING of the open button, never a child of it, and each control stops
    // the click. Both halves together are what make a tap land on the control.
    const { container } = render(
      <MasonryColumns items={items} tileActions={hostRow} />,
    );
    const open = screen.getAllByLabelText("View photo")[0];
    const bar = container.querySelector("[data-tile-actions]")!;
    expect(open.contains(bar)).toBe(false);
    expect(open.parentElement).toBe(bar.parentElement);
  });
});

describe("renderOverlay stays the per-surface chrome slot", () => {
  it("renders one overlay per tile, as a sibling of the open-lightbox button", () => {
    render(
      <MasonryColumns
        items={items}
        viewerIsHost
        clampAspect
        renderOverlay={(item) => (
          <button type="button" data-testid={`ov-${item.id}`}>
            control
          </button>
        )}
      />,
    );

    expect(screen.getByTestId("ov-a")).toBeInTheDocument();
    expect(screen.getByTestId("ov-b")).toBeInTheDocument();

    const openBtn = screen.getByLabelText("View photo");
    expect(openBtn).toBeInTheDocument();
    expect(screen.getByLabelText("Play video")).toBeInTheDocument();

    const overlay = screen.getByTestId("ov-a");
    expect(openBtn.contains(overlay)).toBe(false);
    expect(openBtn.parentElement).toBe(overlay.parentElement);
  });

  it("renderOverlay is optional — a tile renders without it and still opens", () => {
    render(<MasonryColumns items={items} />);
    expect(screen.getByLabelText("View photo")).toBeInTheDocument();
    expect(screen.queryByTestId("ov-a")).not.toBeInTheDocument();
  });

  it("seats the prefix before the first tile (the pending uploads' slot)", () => {
    const { container } = render(
      <MasonryColumns
        items={items}
        prefix={<div data-testid="pending">in flight</div>}
      />,
    );
    const box = container.querySelector("[data-album-grid]")!;
    expect(box.firstElementChild).toBe(screen.getByTestId("pending"));
  });
});

/**
 * THE FOURTH MARK (`theirs=mark`, Will 2026-09-20: "A subtle mark rides the ten
 * tiles that are theirs... a tap on the mark is the same filter as the chip").
 * Held here because it is the one mark a surface can make TAPPABLE, and a mark
 * that is sometimes a control has to be honest about which it is.
 */
describe("the yours mark rides only a viewer's own tiles", () => {
  const marks = () => document.querySelectorAll('[data-tile-mark="mine"]');

  it("marks exactly the ids the surface names, and no tile without them", () => {
    const { container, rerender } = render(
      <MasonryColumns items={items} mineIds={new Set(["a"])} />,
    );
    expect(marks()).toHaveLength(1);
    const tiles = container.querySelectorAll("[data-media-tile]");
    expect(tiles[0].hasAttribute("data-mine")).toBe(true);
    expect(tiles[1].hasAttribute("data-mine")).toBe(false);

    // Omitted = the grid every other surface draws: no mark, no attribute.
    rerender(<MasonryColumns items={items} />);
    expect(marks()).toHaveLength(0);
    expect(
      container.querySelectorAll("[data-media-tile][data-mine]"),
    ).toHaveLength(0);
  });

  it("is a MARKER with no tap, and a button only where a filter exists", () => {
    const { rerender } = render(
      <MasonryColumns items={items} mineIds={new Set(["a"])} />,
    );
    // Two open-the-lightbox buttons and not a third: a surface that cannot
    // filter must not hand a keyboard a control that does nothing.
    expect(screen.getAllByRole("button")).toHaveLength(2);

    rerender(
      <MasonryColumns
        items={items}
        mineIds={new Set(["a"])}
        onSelectMine={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Show only your photos/ }),
    ).toBeInTheDocument();
  });

  it("fires the filter without opening the lightbox underneath it", () => {
    const onSelectMine = vi.fn();
    const { container } = render(
      <MasonryColumns
        items={items}
        mineIds={new Set(["a"])}
        onSelectMine={onSelectMine}
      />,
    );
    const mark = container.querySelector('[data-tile-mark="mine"]')!;
    // A sibling of the open button, never a child of it, and it stops the
    // click — both halves are what make the tap land on the mark.
    const open = screen.getByLabelText("View photo");
    expect(open.contains(mark)).toBe(false);
    expect(open.parentElement).toBe(mark.parentElement);
    fireEvent.click(mark);
    expect(onSelectMine).toHaveBeenCalledTimes(1);
  });

  it("carries the filter's state, so the mark is never a one-way door", () => {
    const { rerender } = render(
      <MasonryColumns
        items={items}
        mineIds={new Set(["a"])}
        onSelectMine={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Show only your photos/ }),
    ).toHaveAttribute("aria-pressed", "false");

    rerender(
      <MasonryColumns
        items={items}
        mineIds={new Set(["a"])}
        onSelectMine={() => {}}
        mineSelected
      />,
    );
    expect(
      screen.getByRole("button", { name: /Show the whole album/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("leaves the other three marks exactly as they were", () => {
    const { container } = render(
      <MasonryColumns items={withCount} mineIds={new Set(["a", "b"])} />,
    );
    const tiles = container.querySelectorAll("[data-media-tile]");
    // The play mark still belongs to the video alone...
    expect(tiles[0].querySelector("svg.lucide-play")).toBeNull();
    expect(tiles[1].querySelector("svg.lucide-play")).not.toBeNull();
    // ...and the like mark still to the tile with a count on it.
    expect(container.querySelectorAll('[data-tile-mark="like"]')).toHaveLength(
      1,
    );
  });
});

/**
 * THE ARRIVAL GRAMMAR, ON THE ONE GRID (`landing=sweep`, Will 2026-09-21: "This
 * should be consistent across guest and host arrival experiences. Would feel
 * weird for it to be handled differently on either.").
 *
 * Two attributes, written from two sets the surface hands down — which is the
 * whole of what a grid may know about an arrival. WHICH ids belong in which set
 * is `lib/shared/arrival.ts`'s contract, and the light itself is
 * `shared/arrival.css`; neither is pinned here, because a contract guards
 * function and both of those are a look and a rule.
 */
describe("the arrival marks ride the tile box", () => {
  it("writes data-arrived on exactly the ids the surface names", () => {
    const { container } = render(
      <MasonryColumns items={items} arrivedIds={new Set(["b"])} />,
    );
    const tiles = container.querySelectorAll("[data-media-tile]");
    expect(tiles[0].hasAttribute("data-arrived")).toBe(false);
    expect(tiles[1].hasAttribute("data-arrived")).toBe(true);
  });

  it("writes data-landed on exactly the ids the surface names", () => {
    const { container } = render(
      <MasonryColumns items={items} landedIds={new Set(["a"])} />,
    );
    const tiles = container.querySelectorAll("[data-media-tile]");
    expect(tiles[0].hasAttribute("data-landed")).toBe(true);
    expect(tiles[1].hasAttribute("data-landed")).toBe(false);
  });

  it("draws neither when a surface names neither", () => {
    const { container } = render(<MasonryColumns items={items} />);
    expect(container.querySelector("[data-arrived]")).toBeNull();
    expect(container.querySelector("[data-landed]")).toBeNull();
  });
});

/**
 * ★ THE ARRIVAL IS LOCAL, AND THAT IS A PROPERTY OF THE ASSIGNMENT (`live=land`,
 * Will 2026-09-20: "a new photograph grows into its column... the album re-flows
 * around it, nothing else moves"). jsdom cannot lay out columns, so the pin is
 * on the pure function that decides them: prepend a photograph and every tile
 * already on screen must keep the column it had. A `columns-*` box failed this
 * by construction, which is why the album left one.
 */
describe("distributeColumns keeps an album still when one lands", () => {
  const album: GridMedia[] = Array.from({ length: 23 }, (_, i) => ({
    id: `m${i}`,
    type: "photo",
    url: `/${i}.jpg`,
    width: 100,
    // A real spread of shapes: portraits, squares and landscapes.
    height: [60, 100, 150, 133, 75][i % 5],
  }));
  const columnOf = (cols: GridMedia[][]) => {
    const at = new Map<string, number>();
    cols.forEach((col, c) => col.forEach((m) => at.set(m.id, c)));
    return at;
  };

  it("leaves every existing tile where it was when a newer one is prepended", () => {
    for (const n of [2, 3, 5, 6, 8]) {
      const before = columnOf(distributeColumns(album, n, false));
      const arrival: GridMedia = {
        id: "new",
        type: "photo",
        url: "/new.jpg",
        width: 100,
        height: 120,
      };
      const after = columnOf(distributeColumns([arrival, ...album], n, false));
      for (const m of album)
        expect(after.get(m.id), `${n} columns, ${m.id} moved`).toBe(
          before.get(m.id),
        );
      expect(after.has("new")).toBe(true);
    }
  });

  it("balances: no column runs away from the shortest", () => {
    const cols = distributeColumns(album, 5, false);
    const heights = cols.map((col) =>
      col.reduce((h, m) => h + (m.height ?? 1) / (m.width ?? 1), 0),
    );
    // One tile's worth of slack is the most a greedy fill can leave.
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1.6);
  });

  it("puts a newly landed photograph at the HEAD of the column it joins", () => {
    const arrival: GridMedia = {
      id: "new",
      type: "photo",
      url: "/new.jpg",
      width: 100,
      height: 120,
    };
    const cols = distributeColumns([arrival, ...album], 4, false);
    const home = cols.find((col) => col.some((m) => m.id === "new"))!;
    expect(home[0].id).toBe("new");
  });
});

/**
 * THE MEASURED COUNT IS THE RULE'S COUNT, so the album never jumps a column as
 * it hydrates. The rule's gap is `--gap-gallery`, a `max()`, and a custom
 * property computes to its text: read that way the gap was NaN, counted as
 * none, and a window just past a boundary got one column more than the CSS box
 * it replaced. jsdom has no layout, so the box's width and computed style are
 * stubbed with what Chrome reports for the album box.
 */
describe("columnsFor counts on the gap the box resolves", () => {
  const boxAt = (width: number) => {
    const el = document.createElement("div");
    Object.defineProperty(el, "clientWidth", { value: width });
    return el;
  };
  const albumBoxStyle = {
    getPropertyValue: (name: string) =>
      name === "--album-column"
        ? "240px"
        : name === "--gap-gallery"
          ? "max(3px, 4px)"
          : "",
    columnGap: "4px",
  } as unknown as CSSStyleDeclaration;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lays the rule's count, just past a boundary too", () => {
    vi.stubGlobal("getComputedStyle", () => albumBoxStyle);
    // A 1490 window's album is 1450 wide: five 240px columns fit with their
    // gaps, and six only if the gap is lost.
    expect(columnsFor(boxAt(1450))).toBe(5);
    expect(columnsFor(boxAt(1400))).toBe(5);
    expect(columnsFor(boxAt(1880))).toBe(7);
  });

  it("keeps a phone at two, and an unmeasured box unknown", () => {
    vi.stubGlobal("getComputedStyle", () => albumBoxStyle);
    expect(columnsFor(boxAt(335))).toBe(2);
    expect(columnsFor(boxAt(0))).toBe(0);
  });
});

/**
 * THE PHOTOGRAPH'S OWN ADDRESS (media-viewer r1: `?photo=<id>`). Opening writes
 * it beside the page's other params (a refresh comes back), the grid reads it
 * once on mount, and ACCESS STAYS EXACTLY AS IT WAS: it opens only an item this
 * viewer already holds, so an unknown, held or hidden id opens the album
 * plainly with no error and no sign the item exists.
 */
describe("the open photograph rides the address", () => {
  const TooltipWrap = ({ children }: { children: React.ReactNode }) => (
    <TooltipProvider>{children}</TooltipProvider>
  );
  const frame = () =>
    act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
  const here = () => `${window.location.pathname}${window.location.search}`;

  beforeEach(() => window.history.replaceState(null, "", "/e/tok?reel"));
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("carries each photograph's id on its tile, for the way back", () => {
    const { container } = render(<MasonryColumns items={items} />);
    const tiles = container.querySelectorAll("[data-media-tile]");
    expect(tiles[0].getAttribute("data-media-id")).toBe("a");
    expect(tiles[1].getAttribute("data-media-id")).toBe("b");
  });

  it("writes ?photo= beside the page's other params on open, and clears it on close", async () => {
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    fireEvent.click(screen.getByLabelText("View photo"));
    expect(here()).toBe("/e/tok?reel&photo=a");
    await frame();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(here()).toBe("/e/tok?reel");
  });

  it("follows the viewer as it steps, so a refresh returns to where it is", async () => {
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    fireEvent.click(screen.getByLabelText("View photo"));
    await frame();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(here()).toBe("/e/tok?reel&photo=b");
  });

  it("opens the photograph a refresh lands on", async () => {
    window.history.replaceState(null, "", "/e/tok?photo=b");
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    await frame();
    expect(screen.getByRole("dialog", { name: "Video 2 of 2" })).toBeTruthy();
  });

  it("opens the album plainly on an id this viewer does not hold: no viewer, no error, no trace", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState(null, "", "/e/tok?photo=held-or-hidden");
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    await frame();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it("is claimed by one grid when two could open it", async () => {
    window.history.replaceState(null, "", "/e/tok?photo=a");
    render(
      <>
        <MasonryColumns items={items} />
        <MasonryColumns items={items} />
      </>,
      { wrapper: TooltipWrap },
    );
    await frame();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("waits behind a door that is already open, then opens", async () => {
    window.history.replaceState(null, "", "/e/tok?photo=a");
    const door = document.createElement("div");
    door.setAttribute("role", "dialog");
    document.body.appendChild(door);
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    await frame();
    expect(document.querySelector("[data-lightbox-content]")).toBeNull();
    await act(async () => {
      door.remove();
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(screen.getByRole("dialog", { name: "Photo 1 of 2" })).toBeTruthy();
  });

  it("leaves the address alone on a grid that is not the page's subject", () => {
    render(<MasonryColumns items={items} photoAddress={false} />, {
      wrapper: TooltipWrap,
    });
    fireEvent.click(screen.getByLabelText("View photo"));
    expect(here()).toBe("/e/tok?reel");
  });
});

/**
 * THE JUSTIFIED ALBUM ON THE ONE GRID (`album-columns`, Will's
 * `layout=justified`). The engine's rules are `album-rows.test.ts`; these pin
 * the BOX: the rows fill it, a tile keeps everything a tile carries, the head
 * slots seat the in-flight tiles, and a reflow moves breaks, never tiles.
 *
 * ★ jsdom measures every element at 800px (vitest.setup.ts) and resolves no
 * gap, so the rows here are real engine rows at 800 with a gap of 0.
 */
describe('layout="rows": the justified album on the one grid', () => {
  const album: GridMedia[] = Array.from({ length: 23 }, (_, i) => ({
    id: `r${i}`,
    type: i === 3 ? "video" : "photo",
    url: `/${i}.jpg`,
    width: [300, 400, 400, 1600, 100][i % 5],
    height: [400, 300, 500, 900, 100][i % 5],
    likeCount: i === 2 ? 5 : 0,
  }));

  /** The tiles, row by row, as the breaks divide them. */
  const rowsOf = (grid: Element) => {
    const rows: HTMLElement[][] = [[]];
    for (const el of Array.from(grid.children) as HTMLElement[]) {
      if (el.hasAttribute("data-row-break")) rows.push([]);
      else if (el.hasAttribute("data-rows-key")) rows[rows.length - 1].push(el);
    }
    return rows;
  };
  const gridOf = (container: HTMLElement) =>
    container.querySelector('[data-album-grid][data-album-layout="rows"]')!;

  beforeEach(() => runFlipSpy.mockClear());

  it("leaves masonry the default", () => {
    const { container } = render(<MasonryColumns items={album} />);
    expect(container.querySelector("[data-album-layout]")).toBeNull();
  });

  it("lays every photograph in rows that fill the box, one height a row", () => {
    const { container } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    const rows = rowsOf(gridOf(container));
    expect(rows.length).toBeGreaterThan(2);
    expect(rows.flat().map((t) => t.getAttribute("data-media-id"))).toEqual(
      album.map((m) => m.id),
    );
    for (const row of rows) {
      // Whole pixels summing to the box (800, no gap): no gap at the edge.
      const widths = row.map((t) => Number(t.style.flexGrow));
      expect(widths.every(Number.isInteger)).toBe(true);
      expect(widths.reduce((a, b) => a + b, 0)).toBe(800);
      expect(new Set(row.map((t) => t.style.height)).size).toBe(1);
    }
  });

  it("keeps everything a tile carries: marks, the viewer's hooks, the arrival marks", () => {
    const { container } = render(
      <MasonryColumns
        items={album}
        layout="rows"
        mineIds={new Set(["r1"])}
        arrivedIds={new Set(["r0"])}
        landedIds={new Set(["r1"])}
      />,
    );
    const tile = (id: string) =>
      container.querySelector<HTMLElement>(
        `[data-media-tile][data-media-id="${id}"]`,
      )!;
    expect(tile("r3").querySelector("svg.lucide-play")).not.toBeNull();
    expect(tile("r2").querySelector('[data-tile-mark="like"]')).not.toBeNull();
    expect(tile("r1").querySelector('[data-tile-mark="mine"]')).not.toBeNull();
    expect(tile("r0").hasAttribute("data-arrived")).toBe(true);
    expect(tile("r1").hasAttribute("data-landed")).toBe(true);
    expect(tile("r4").hasAttribute("data-lit")).toBe(true);
  });

  it("takes the step as photographs per row, never pixels", () => {
    const { container, rerender } = render(
      <MasonryColumns items={album} layout="rows" rowStep={0} />,
    );
    const sparse = rowsOf(gridOf(container)).length;
    rerender(<MasonryColumns items={album} layout="rows" rowStep={4} />);
    const dense = rowsOf(gridOf(container)).length;
    // 800px is the tablet class: about 2 a row at the largest, 5 at the densest.
    expect(sparse).toBeGreaterThan(dense * 2 - 1);
  });

  it("seats each head tile in a slot of its own before the first photograph", () => {
    const { container, rerender } = render(
      <MasonryColumns
        items={album}
        layout="rows"
        prefix={
          <>
            {false}
            <div data-testid="stack">in flight</div>
            {[
              <div key="held" data-testid="held">
                waiting
              </div>,
            ]}
          </>
        }
      />,
    );
    const grid = gridOf(container);
    const first = rowsOf(grid)[0];
    expect(first[0].hasAttribute("data-rows-head")).toBe(true);
    expect(first[1].hasAttribute("data-rows-head")).toBe(true);
    expect(first[0].contains(screen.getByTestId("stack"))).toBe(true);
    expect(first[1].contains(screen.getByTestId("held"))).toBe(true);
    // The masonry's bottom margin gives way to the row: the slot is the box.
    expect(first[0].className).toContain("[&>*]:!mb-0");
    // An empty head is no slot at all (the guest's head is a fragment always).
    rerender(
      <MasonryColumns items={album} layout="rows" prefix={<>{false}</>} />,
    );
    expect(grid.querySelector("[data-rows-head]")).toBeNull();
  });

  it("moves breaks, never tiles: an arrival keeps every tile's node", () => {
    const { container, rerender } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    const before = new Map(
      Array.from(
        container.querySelectorAll<HTMLElement>("[data-media-tile]"),
      ).map((t) => [t.getAttribute("data-media-id"), t]),
    );
    const arrival: GridMedia = {
      id: "new",
      type: "photo",
      url: "/n.jpg",
      width: 400,
      height: 300,
    };
    rerender(<MasonryColumns items={[arrival, ...album]} layout="rows" />);
    for (const [id, node] of before)
      expect(
        container.querySelector(`[data-media-tile][data-media-id="${id}"]`),
        `${id} was remounted`,
      ).toBe(node);
    expect(container.querySelector('[data-media-id="new"]')).not.toBeNull();
  });

  it("glides an arrival and a step change, and nothing on the first layout", () => {
    const { rerender } = render(<MasonryColumns items={album} layout="rows" />);
    expect(runFlipSpy).not.toHaveBeenCalled();
    const arrival: GridMedia = {
      id: "new",
      type: "photo",
      url: "/n.jpg",
      width: 400,
      height: 300,
    };
    rerender(<MasonryColumns items={[arrival, ...album]} layout="rows" />);
    expect(runFlipSpy).toHaveBeenCalledTimes(1);
    const [nodes, was, options] = runFlipSpy.mock.calls[0];
    // Every photograph already on screen was snapshotted; the newcomer was not.
    expect((was as Map<string, DOMRect>).has("r0")).toBe(true);
    expect((was as Map<string, DOMRect>).has("new")).toBe(false);
    expect((nodes as Map<string, HTMLElement>).has("new")).toBe(true);
    expect(options).toMatchObject({ scale: true, visibleOnly: true });
    rerender(
      <MasonryColumns items={[arrival, ...album]} layout="rows" rowStep={4} />,
    );
    expect(runFlipSpy).toHaveBeenCalledTimes(2);
    // An equal list in a new array lays nothing and glides nothing.
    rerender(
      <MasonryColumns
        items={[arrival, ...album].map((m) => ({ ...m }))}
        layout="rows"
        rowStep={4}
      />,
    );
    expect(runFlipSpy).toHaveBeenCalledTimes(2);
  });

  it("centres an album too small to fill a row", () => {
    const { container } = render(
      <MasonryColumns items={album.slice(0, 1)} layout="rows" rowStep={4} />,
    );
    const grid = gridOf(container);
    expect(grid.className).toContain("justify-center");
    const tile = grid.querySelector<HTMLElement>("[data-media-tile]")!;
    expect(tile.style.flex).toMatch(/^0 0 \d+px$/);
  });

  it("keeps the first paint's width classes on the engine's own breakpoints", () => {
    const queried = [
      ...ROWS_FIRST_PAINT.matchAll(
        /@min-\[(\d+)px\]:\[--rows-n:var\(--rows-n(\d)\)\]/g,
      ),
    ].map((m) => [Number(m[2]), Number(m[1])]);
    expect(queried).toEqual(ROW_CLASSES.slice(1).map((c, i) => [i + 1, c.min]));
    expect(ROWS_FIRST_PAINT).toContain("[--rows-n:var(--rows-n0)]");
    expect(ROW_CLASSES[0].min).toBe(0);
  });

  it("holds the narrower width when the rows summon and dismiss their own scrollbar", () => {
    // 1385 with no scrollbar, 1370 with one, back to 1385 a frame later: the loop.
    expect(
      steadyWidth([
        { width: 1385, at: 0 },
        { width: 1370, at: 16 },
        { width: 1385, at: 33 },
      ]),
    ).toBe(1370);
    // A person resizing is not a loop: too slow, too far, or not back where it was.
    expect(
      steadyWidth([
        { width: 1385, at: 0 },
        { width: 1370, at: 400 },
        { width: 1385, at: 800 },
      ]),
    ).toBe(1385);
    expect(
      steadyWidth([
        { width: 1400, at: 0 },
        { width: 1100, at: 16 },
        { width: 1400, at: 33 },
      ]),
    ).toBe(1400);
    expect(
      steadyWidth([
        { width: 1385, at: 0 },
        { width: 1370, at: 16 },
        { width: 1360, at: 33 },
      ]),
    ).toBe(1360);
    expect(steadyWidth([{ width: 800, at: 0 }])).toBe(800);
  });

  it("paints greedy CSS rows before the box is measured", () => {
    const rect = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);
    const { container } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    const grid = gridOf(container);
    expect(grid.querySelector("[data-row-break]")).toBeNull();
    const tile = grid.querySelector<HTMLElement>("[data-media-tile]")!;
    expect(tile.style.flexBasis).toContain("var(--rows-unit)");
    expect(tile.style.aspectRatio).not.toBe("");
    rect.mockRestore();
  });
});

/**
 * THE HIDDEN MARK (host-app: a hidden photograph dims to 30% in the host's own
 * album). The dim was glued onto `active:scale-[0.98]` with no space between,
 * one class nobody emits, so a hidden photograph sat at full brightness.
 */
describe("dimItem dims the media", () => {
  it("writes opacity-30 as a class of its own on a dimmed tile, and only there", () => {
    render(<MasonryColumns items={items} dimItem={(m) => m.id === "a"} />);
    const dimmed = screen.getByLabelText("View photo");
    const plain = screen.getByLabelText("Play video");
    expect(dimmed.classList.contains("opacity-30")).toBe(true);
    expect(dimmed.classList.contains("active:scale-[0.98]")).toBe(true);
    expect(plain.classList.contains("opacity-30")).toBe(false);
  });
});
