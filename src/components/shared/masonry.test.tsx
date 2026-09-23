// @contract-for: src/components/shared/masonry.tsx
import { Download, EyeOff } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import {
  columnsFor,
  distributeColumns,
  MasonryColumns,
  type TileAction,
} from "@/components/shared/masonry";

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
    // `row=bar` (Will, 2026-09-20): the row is ONE blurred region, so the bar
    // wears the material and the glyphs inside it carry no surface of their own.
    for (const bar of bars) {
      expect(bar).toHaveClass("glass");
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
