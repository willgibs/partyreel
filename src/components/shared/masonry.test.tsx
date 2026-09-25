import { Download, EyeOff } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CLASS_BREAKS,
  ROWS_FIRST_PAINT,
  steadyWidth,
} from "@/components/shared/album-window";
import {
  columnsFor,
  distributeColumns,
  MasonryColumns,
  placeColumns,
  type TileAction,
} from "@/components/shared/masonry";
import { rowRatio } from "@/lib/media/tile-aspect";
import { layoutRows, perRowFor, ROW_CLASSES } from "@/lib/shared/album-rows";

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
    // (Never below `md`, and not drawn at all at rest: that is the sheet's,
    // pinned by "the desk's row is not drawn at rest" below, since the bar
    // carries no display utility of its own any more.)
    for (const bar of bars) {
      expect(bar.className).not.toMatch(/(^|\s)(md:)?(flex|hidden)(\s|$)/);
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
    // The head's own box comes first (a `contents` box in the flow, the first
    // column's head once measured), holding the in-flight tiles.
    const head = box.firstElementChild!;
    expect(head.hasAttribute("data-album-head")).toBe(true);
    expect(head.contains(screen.getByTestId("pending"))).toBe(true);
    expect(box.querySelector("[data-media-tile]")!.previousElementSibling).toBe(
      head,
    );
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
/**
 * ★ THE MEASURED COLUMNS ARE THE SAME BOX, RESTYLED (the album-window lane).
 * The columns used to be one wrapper each, so the first measure (and every
 * filter) moved every tile to a new parent, and React remounts a node that
 * changes parent: a second entrance and every photograph decoded again. Now
 * the one box flows in columns and each tile's column is its `order`, counted
 * from the column's oldest end, so an arrival restyles no tile already there.
 */
describe("the measured columns place tiles in the one box", () => {
  const album: GridMedia[] = Array.from({ length: 11 }, (_, i) => ({
    id: `c${i}`,
    type: "photo",
    url: `/${i}.jpg`,
    width: 100,
    height: [150, 100, 75][i % 3],
  }));

  it("flows each column by order, counted from its oldest end, under the head", () => {
    const box = { cols: 3, width: 908, gap: 4 };
    const placed = placeColumns(album, box, false, 50);
    expect(placed.colWidth).toBe(300);
    const cols = distributeColumns(album, 3, false);
    let tallest = 0;
    cols.forEach((col, c) => {
      let y = c === 0 ? 50 : 0;
      col.forEach((item, k) => {
        const at = placed.box.get(item.id)!;
        expect(at.width).toBe(300);
        expect(at.marginLeft).toBe(c > 0 ? 4 : 0);
        // The column's stride, the oldest at its end.
        expect(at.order).toBe((c + 1) * 100_000 - (col.length - k));
        y += (300 * (item.height ?? 1)) / (item.width ?? 1) + 4;
      });
      tallest = Math.max(tallest, y);
    });
    // Each column ends at a break; the head leads the first column.
    expect(placed.breaks).toEqual([100_000, 200_000]);
    expect(placed.headOrder).toBeLessThan(
      Math.min(...cols[0].map((m) => placed.box.get(m.id)!.order as number)),
    );
    // The first row: each column's head.
    expect([...placed.first].sort()).toEqual(
      cols.map((col) => col[0].id).sort(),
    );
    // The box stands as tall as its tallest column, and a little more (the
    // browser rounds each tile; a box a hair short would wrap a column).
    expect(placed.height).toBeGreaterThan(tallest);
    expect(placed.height).toBeLessThan(tallest + 4);
  });

  it("restyles no tile already there when one lands at a column's head", () => {
    const box = { cols: 3, width: 908, gap: 4 };
    const before = placeColumns(album, box, false);
    const arrival: GridMedia = {
      id: "new",
      type: "photo",
      url: "/n.jpg",
      width: 100,
      height: 120,
    };
    const after = placeColumns([arrival, ...album], box, false);
    for (const m of album)
      expect(after.box.get(m.id), `${m.id} restyled`).toEqual(
        before.box.get(m.id),
      );
    expect(after.box.has("new")).toBe(true);
  });

  it("balances a clamped host album on its real shapes, not as squares", () => {
    // The clamped spelling is one number ("1.5"), which the balance once read
    // as a square: every tile counted 1, whatever its shape. Newest first: two
    // wide photographs, then a tall one (clamped to 0.66, 1.5 widths tall).
    const shot = (id: string, w: number, h: number): GridMedia => ({
      id,
      type: "photo",
      url: `/${id}.jpg`,
      width: w,
      height: h,
    });
    const album = [
      shot("a", 300, 100),
      shot("b", 300, 100),
      shot("tall", 100, 300),
    ];
    const cols = distributeColumns(album, 2, true);
    // On the real shapes the tall one stands alone and the two wide share a
    // column (1.5 against 0.67 + 0.67); read as squares, "a" joined the tall one.
    expect(cols.map((c) => c.map((m) => m.id))).toEqual([["tall"], ["a", "b"]]);
  });

  it("measures without remounting a single tile, and filters without remounting either", () => {
    // jsdom measures every box at 0 wide, which keeps the pre-measure paint;
    // here the box reports a desk's width once a ResizeObserver asks again.
    let width = 0;
    const width$ = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockImplementation(() => width);
    const observers: (() => void)[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          observers.push(cb);
        }
        observe() {}
        disconnect() {}
      },
    );
    try {
      const { container, rerender } = render(<MasonryColumns items={album} />);
      const box = container.querySelector<HTMLElement>("[data-album-grid]")!;
      expect(box.className).toContain("columns-2");
      const nodes = new Map(
        [...box.querySelectorAll<HTMLElement>("[data-media-tile]")].map((t) => [
          t.dataset.mediaId,
          t,
        ]),
      );
      width = 1200;
      act(() => observers.forEach((o) => o()));
      expect(box.className).not.toContain("columns-2");
      expect(parseFloat(box.style.height)).toBeGreaterThan(0);
      for (const [id, node] of nodes) {
        const now = box.querySelector(`[data-media-id="${id}"]`);
        expect(now, `${id} was remounted by the measure`).toBe(node);
        expect(now!.getAttribute("style")).toMatch(/order: \d+/);
      }
      // The Yours filter keeps what it keeps, node for node.
      rerender(<MasonryColumns items={album.filter((_, i) => i % 2 === 0)} />);
      for (const [id, node] of nodes) {
        const now = box.querySelector(`[data-media-id="${id}"]`);
        if (Number(id!.slice(1)) % 2 === 0)
          expect(now, `${id} was remounted by the filter`).toBe(node);
        else expect(now).toBeNull();
      }
    } finally {
      width$.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});

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
 *
 * ★ AND IN A VIEW TALL ENOUGH TO HOLD EVERY ROW. The rows are windowed (one
 * viewport behind, two ahead; `album-window.test.ts` and the window's own pins
 * below), and jsdom's window is 768px tall with the album at its top: these pins
 * are about the rows themselves, so they stand in a view that mounts them all.
 */
describe('layout="rows": the justified album on the one grid', () => {
  const tall = Object.getOwnPropertyDescriptor(window, "innerHeight");
  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 100_000,
    });
  });
  afterEach(() => {
    if (tall) Object.defineProperty(window, "innerHeight", tall);
  });

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
    rerender(<MasonryColumns items={album} layout="rows" rowStep={2} />);
    const dense = rowsOf(gridOf(container)).length;
    // 800px is the tablet class: 2 a row at the largest, 4 at the densest.
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
      <MasonryColumns items={[arrival, ...album]} layout="rows" rowStep={2} />,
    );
    expect(runFlipSpy).toHaveBeenCalledTimes(2);
    // An equal list in a new array lays nothing and glides nothing.
    rerender(
      <MasonryColumns
        items={[arrival, ...album].map((m) => ({ ...m }))}
        layout="rows"
        rowStep={2}
      />,
    );
    expect(runFlipSpy).toHaveBeenCalledTimes(2);
  });

  it("centres an album too small to fill a row", () => {
    const { container } = render(
      <MasonryColumns items={album.slice(0, 1)} layout="rows" rowStep={2} />,
    );
    const grid = gridOf(container);
    expect(grid.className).toContain("justify-center");
    const tile = grid.querySelector<HTMLElement>("[data-media-tile]")!;
    expect(tile.style.flex).toMatch(/^0 0 \d+px$/);
  });

  it("keeps the first paint's width classes on the engine's own breakpoints", () => {
    const queried = [
      ...ROWS_FIRST_PAINT.matchAll(
        /@min-\[(\d+)px\]:\[--rows-fill:var\(--rows-fill(\d)\)\]/g,
      ),
    ].map((m) => [Number(m[2]), Number(m[1])]);
    expect(queried).toEqual(ROW_CLASSES.slice(1).map((c, i) => [i + 1, c.min]));
    expect(ROWS_FIRST_PAINT).toContain("[--rows-fill:var(--rows-fill0)]");
    expect(ROW_CLASSES[0].min).toBe(0);
    // The rest's height follows the same classes.
    const rests = [
      ...ROWS_FIRST_PAINT.matchAll(
        /@min-\[(\d+)px\]:\[--rows-rest:var\(--rows-rest(\d)\)\]/g,
      ),
    ].map((m) => [Number(m[2]), Number(m[1])]);
    expect(rests).toEqual(queried);
    // And each class's breaks show inside exactly its own range.
    const bounds = [...ROW_CLASSES.map((c) => c.min), Infinity];
    CLASS_BREAKS.forEach((cls, i) => {
      const min = cls.match(/@min-\[(\d+)px\]/);
      const max = cls.match(/@max-\[(\d+)px\]/);
      expect(min ? Number(min[1]) : 0).toBe(bounds[i]);
      expect(max ? Number(max[1]) : Infinity).toBe(bounds[i + 1]);
    });
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

  it("paints the engine's own rows, per width class, before the box is measured", () => {
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
    // Greedy wrapping re-broke every row on screen once measured (a layout
    // shift of 0.76 on a throttled phone): the first paint is the engine's
    // rows at each class's nominal width, each class's breaks shown only there.
    const breaks = [
      ...grid.querySelectorAll<HTMLElement>(":scope > [data-row-break]"),
    ];
    expect(breaks.length).toBeGreaterThan(0);
    for (const b of breaks) {
      expect(b.className).toContain("hidden");
      expect(CLASS_BREAKS.some((c) => b.className.includes(c))).toBe(true);
    }
    // The desk's breaks fall exactly after the desk's rows.
    const desk = layoutRows(
      album.map((m) => ({ id: m.id, ratio: rowRatio(m) })),
      { width: 1400, gap: 4, perRow: perRowFor(1400, 1) },
    );
    const deskBreaks = breaks
      .filter((b) => b.className.includes(CLASS_BREAKS[3]))
      .map((b) => (b.previousElementSibling as HTMLElement).dataset.mediaId);
    let end = 0;
    const deskRowEnds: string[] = [];
    for (const row of desk.rows) {
      end += row.ids.length;
      if (end > album.length) break;
      deskRowEnds.push(row.ids[row.ids.length - 1]);
    }
    expect(deskBreaks).toEqual(deskRowEnds);
    // Each line justified by its shapes: a zero basis (so only a drawn break
    // ends a line), a width in proportion to its ratio, the line's height.
    const tile = grid.querySelector<HTMLElement>("[data-media-tile]")!;
    expect(tile.style.flexBasis).toMatch(/^0(px)?$/);
    expect(Number(tile.style.flexGrow)).toBeGreaterThan(0);
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
