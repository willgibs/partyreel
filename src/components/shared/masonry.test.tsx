import { Download, EyeOff } from "lucide-react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { HostCreditLookProvider } from "@/components/app/event-blocks/credit-look";
import type { GridMedia } from "@/components/app/media-grid";
import { LikesProvider } from "@/components/likes/likes-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CLASS_BREAKS,
  ROWS_FIRST_PAINT,
  steadyWidth,
} from "@/components/shared/album-window";
import {
  abortUnfinishedImages,
  columnsFor,
  distributeColumns,
  MasonryColumns,
  placeColumns,
  type TileAction,
} from "@/components/shared/masonry";
import { rowRatio } from "@/lib/media/tile-aspect";
import { layoutRows, perRowFor, ROW_CLASSES } from "@/lib/shared/album-rows";
import {
  installNextHistory,
  NextRouterStandIn,
} from "@/lib/test-utils/next-history";

import { setViewportWidth } from "../../../vitest.setup";

// The look's Follow is the real FollowButton, which reaches the profile's server actions (server-only); jsdom has
// none, and the host's look never draws a Follow (guest-list.test.tsx's own stand-in).
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn().mockResolvedValue({ ok: true }),
  unfollowProfileAction: vi.fn().mockResolvedValue({ ok: true }),
}));

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

  // THE MARK THAT LEFT (`mine=none`, Will 2026-09-27, media-viewer r3): a guest's
  // own tiles rode a glass dot, then a ring, then nothing — View's Showing
  // (Everyone's / Yours, `buildGuestViewGroups` in live-gallery.tsx) is the one
  // door to them now. The grid carries no id set and no tap for it any more, so
  // this stays a plain regression guard rather than a feature's contract.
  it("never wears a mine mark: no id set, no tap, nothing to render it with", () => {
    const { container } = render(<MasonryColumns items={items} />);
    expect(container.querySelectorAll('[data-tile-mark="mine"]')).toHaveLength(
      0,
    );
    expect(
      container.querySelectorAll("[data-media-tile][data-mine]"),
    ).toHaveLength(0);
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
 *
 * ★ RESHAPED ON PURPOSE (crumbs-43): the address rode `replaceState`, so a
 * close cleared it at once; it rides an entry of its own now, which the phone's
 * Back closes, and a close goes Back over it, so these wait for that Back's
 * popstate. The scar kept: the address sits beside the page's other params, a
 * walk writes it once when it rests, and a close leaves none behind; the
 * expired reason dropped: that a close writes the address in the same tick.
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

  /** A tap whose close goes Back over the viewer's entry: its popstate lands a beat after (bounded). */
  const pressAndLand = (name: string) =>
    act(async () => {
      const landed = new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => resolve(), { once: true });
      });
      fireEvent.click(screen.getByRole("button", { name }));
      await Promise.race([landed, new Promise((r) => setTimeout(r, 400))]);
      await new Promise((r) => setTimeout(r, 0));
    });

  it("writes ?photo= beside the page's other params on open, and clears it on close", async () => {
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    fireEvent.click(screen.getByLabelText("View photo"));
    expect(here()).toBe("/e/tok?reel&photo=a");
    await frame();
    await pressAndLand("Close");
    expect(here()).toBe("/e/tok?reel");
  });

  // A beat past the quiet a step waits for (`ADDRESS_STEP_QUIET_MS`).
  const quiet = () =>
    act(async () => {
      await new Promise((r) => setTimeout(r, 360));
    });

  it("follows the viewer once a step rests, so a refresh returns to where it is", async () => {
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    fireEvent.click(screen.getByLabelText("View photo"));
    await frame();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // A step waits for a beat of quiet (the browsers' caps on the history API).
    expect(here()).toBe("/e/tok?reel&photo=a");
    await quiet();
    expect(here()).toBe("/e/tok?reel&photo=b");
  });

  it("writes a walk's address once, when it rests, and a close straight after a walk clears it", async () => {
    const walk: GridMedia[] = Array.from({ length: 40 }, (_, i) => ({
      id: `p${i}`,
      type: "photo" as const,
      url: `/p${i}.jpg`,
      width: 800,
      height: 600,
    }));
    const replace = vi.spyOn(window.history, "replaceState");
    try {
      const { unmount } = render(<MasonryColumns items={walk} />, {
        wrapper: TooltipWrap,
      });
      fireEvent.click(screen.getAllByLabelText("View photo")[0]);
      await frame();
      expect(here()).toBe("/e/tok?reel&photo=p0");
      // A held arrow key: thirty steps, and not one write among them.
      replace.mockClear();
      for (let i = 0; i < 30; i++)
        fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(
        screen.getByRole("dialog", { name: "Photo 31 of 40" }),
      ).toBeTruthy();
      expect(replace).not.toHaveBeenCalled();
      await quiet();
      expect(replace).toHaveBeenCalledTimes(1);
      expect(here()).toBe("/e/tok?reel&photo=p30");
      // Straight on and straight out: the close takes the address with its entry, and the step still
      // waiting never lands.
      fireEvent.keyDown(window, { key: "ArrowRight" });
      await pressAndLand("Close");
      expect(here()).toBe("/e/tok?reel");
      await quiet();
      expect(here()).toBe("/e/tok?reel");
      unmount();
    } finally {
      replace.mockRestore();
    }
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
 * ★ THE PHONE'S BACK CLOSES THE PHOTOGRAPH (crumbs-43; ROADMAP: "the phone's Back closes the open photograph
 * (pushState and popstate) instead of leaving the album; `?photo=` rides replaceState today"). The viewer joins the
 * one rule the hub's sheets, a phone's popups and the reel share for which history entry is ours
 * (`lib/history-entry.ts`): a tap pushes ONE entry at the photograph's address, a walk moves inside it, every close
 * goes Back over it, the phone's own Back closes the viewer, Forward opens it again, and a photograph opened from its
 * address (a shared link, a reload) has no entry of ours beneath it, so its close clears the address in place and
 * lands in the album.
 */
describe("the phone's Back closes the photograph", () => {
  const TooltipWrap = ({ children }: { children: React.ReactNode }) => (
    <TooltipProvider>{children}</TooltipProvider>
  );
  const frame = () =>
    act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
  const here = () => `${window.location.pathname}${window.location.search}`;
  /** A traversal (the phone's Back or Forward, or a close going Back), and its popstate landing (bounded). */
  const traverse = (go: () => void) =>
    act(async () => {
      const landed = new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => resolve(), { once: true });
      });
      go();
      await Promise.race([landed, new Promise((r) => setTimeout(r, 400))]);
      await new Promise((r) => setTimeout(r, 0));
    });
  const viewer = () => screen.queryByRole("dialog");
  const marker = () =>
    (window.history.state as Record<string, unknown> | null)?.prPhoto;

  beforeEach(() => window.history.pushState(null, "", "/e/tok"));
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("★ a tap pushes ONE entry, and the phone's Back closes the viewer onto the album", async () => {
    render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
    const before = window.history.length;
    fireEvent.click(screen.getByLabelText("View photo"));
    expect(window.history.length).toBe(before + 1);
    expect(marker()).toBeDefined();
    expect(here()).toBe("/e/tok?photo=a");
    await frame();
    expect(viewer()).toBeTruthy();

    await traverse(() => window.history.back());
    expect(viewer()).toBeNull();
    expect(here()).toBe("/e/tok");
    expect(marker()).toBeUndefined();
  });

  it("the X goes Back over the entry it pushed, a walk stays inside it, and Forward opens the photograph again", async () => {
    const back = vi.spyOn(window.history, "back");
    try {
      render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
      const before = window.history.length;
      fireEvent.click(screen.getByLabelText("View photo"));
      await frame();
      fireEvent.keyDown(window, { key: "ArrowRight" });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 360));
      });
      expect(here()).toBe("/e/tok?photo=b");
      expect(window.history.length).toBe(before + 1);

      await traverse(() =>
        fireEvent.click(screen.getByRole("button", { name: "Close" })),
      );
      expect(back).toHaveBeenCalledTimes(1);
      expect(viewer()).toBeNull();
      expect(here()).toBe("/e/tok");

      // Forward lands on the viewer's entry again, at the photograph the walk rested on.
      await traverse(() => window.history.forward());
      expect(here()).toBe("/e/tok?photo=b");
      await frame();
      expect(screen.getByRole("dialog", { name: "Video 2 of 2" })).toBeTruthy();
    } finally {
      back.mockRestore();
    }
  });

  it("a shared link's photograph closes in place, onto the album, never off the page", async () => {
    window.history.replaceState(null, "", "/e/tok?photo=b");
    const back = vi.spyOn(window.history, "back");
    try {
      render(<MasonryColumns items={items} />, { wrapper: TooltipWrap });
      await frame();
      expect(screen.getByRole("dialog", { name: "Video 2 of 2" })).toBeTruthy();
      const before = window.history.length;
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await frame();
      expect(back).not.toHaveBeenCalled();
      expect(viewer()).toBeNull();
      expect(here()).toBe("/e/tok");
      expect(window.history.length).toBe(before);
    } finally {
      back.mockRestore();
    }
  });

  /* Under Next's own patch (`@/lib/test-utils/next-history`): the router hears the photograph's address (the host's
     album mints the open photograph's links off `useSearchParams`), a router refresh that took the marker cannot
     leave a dead entry (`keep` gives it back after the render), and no traversal is a reload. */
  it("under Next's patch: the router hears the address, a refresh leaves no dead entry, and nothing reloads", async () => {
    window.history.replaceState(null, "", "/");
    const next = installNextHistory();
    try {
      next.land("/e/tok");
      const tree = () => (
        <NextRouterStandIn>
          <TooltipProvider>
            <MasonryColumns items={items} />
          </TooltipProvider>
        </NextRouterStandIn>
      );
      const { rerender } = render(tree());
      await frame();
      const before = window.history.length;
      fireEvent.click(screen.getByLabelText("View photo"));
      expect(next.href).toBe("/e/tok?photo=a");
      await frame();

      // A poll's router refresh writes the entry again with Next's state alone; the page re-renders.
      next.refresh();
      expect(marker()).toBeUndefined();
      rerender(tree());
      expect(marker()).toBeDefined();

      const back = vi.spyOn(window.history, "back");
      await traverse(() =>
        fireEvent.click(screen.getByRole("button", { name: "Close" })),
      );
      expect(back).toHaveBeenCalledTimes(1);
      back.mockRestore();
      expect(viewer()).toBeNull();
      expect(next.href).toBe("/e/tok");
      expect(window.history.length).toBe(before + 1);
      expect(next.reloads).toBe(0);
    } finally {
      next.uninstall();
    }
  });

  it("a grid that is not the page's subject touches no history at all", async () => {
    render(<MasonryColumns items={items} photoAddress={false} />, {
      wrapper: TooltipWrap,
    });
    const before = window.history.length;
    fireEvent.click(screen.getByLabelText("View photo"));
    await frame();
    expect(window.history.length).toBe(before);
    expect(here()).toBe("/e/tok");
  });
});

/**
 * ★ BACK PEELS ONE LAYER A PRESS (crumbs-47; build 38's red-team, W3 #1 part 2, LOW: "on a phone, Back over a
 * credit's look closes the look AND the viewer in one press"). The host's viewer opens the sender's look from the
 * credit's name (`HostCreditLookProvider`, the real one, over the real `GuestPeek`), and in a hand the look is the
 * Sheet (kind `peek`), which took no history entry: the viewer's own entry was the only one there to go Back over, so
 * one Back closed the viewer with the look standing on it. The look holds its entry as a screen does, so a Back lands
 * on the viewer's own entry (the same photograph: "a popup over the viewer going Back over its own entry lands on the
 * same photograph and moves nothing") and the next one closes the viewer.
 */
describe("the phone's Back peels the credit's look, then the photograph (crumbs-47)", () => {
  const named: GridMedia[] = [
    {
      id: "a",
      type: "photo",
      url: "/a.jpg",
      width: 800,
      height: 1200,
      uploaderName: "Maya",
      isVerified: true,
      uploaderEmail: "maya@example.com",
    },
    {
      id: "b",
      type: "photo",
      url: "/b.jpg",
      width: 800,
      height: 1200,
      uploaderName: "Tom",
      isVerified: true,
    },
  ];
  const tree = () => (
    <TooltipProvider>
      <HostCreditLookProvider>
        <MasonryColumns items={named} viewerIsHost />
      </HostCreditLookProvider>
    </TooltipProvider>
  );
  const frame = () =>
    act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
  const here = () => `${window.location.pathname}${window.location.search}`;
  const traverse = (go: () => void) =>
    act(async () => {
      const landed = new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => resolve(), { once: true });
      });
      go();
      await Promise.race([landed, new Promise((r) => setTimeout(r, 400))]);
      await new Promise((r) => setTimeout(r, 0));
    });
  // The viewer sits aria-hidden behind a modal look, so it is read off its own mark, never by role.
  const viewerUp = () =>
    document.querySelector("[data-lightbox-content]") !== null;
  const look = () =>
    document.querySelector<HTMLElement>('[data-slot="guest-peek"]');
  const entryOf = (key: "prPhoto" | "prPopup") =>
    (window.history.state as Record<string, unknown> | null)?.[key];

  /** A phone, the viewer open on Maya's photograph and her look opened from the credit's name. */
  async function openLook() {
    setViewportWidth(375);
    render(tree());
    fireEvent.click(screen.getAllByLabelText("View photo")[0]);
    await frame();
    expect(viewerUp()).toBe(true);
    const atViewer = window.history.length;
    fireEvent.click(await screen.findByRole("button", { name: "Maya" }));
    await frame();
    expect(look()).not.toBeNull();
    return { atViewer };
  }

  beforeEach(() => window.history.pushState(null, "", "/e/tok"));
  afterEach(() => {
    setViewportWidth(1024);
    window.history.replaceState(null, "", "/");
  });

  it("★ a Back over the look closes the look alone, and the next one closes the viewer onto the album", async () => {
    const { atViewer } = await openLook();
    // The look stands on an entry of its own, over the viewer's (the same address: the photograph stays).
    expect(window.history.length).toBe(atViewer + 1);
    expect(entryOf("prPopup")).toBeDefined();
    expect(here()).toBe("/e/tok?photo=a");

    await traverse(() => window.history.back());
    expect(look()).toBeNull();
    expect(viewerUp()).toBe(true);
    expect(here()).toBe("/e/tok?photo=a");
    expect(entryOf("prPhoto")).toBeDefined();

    await traverse(() => window.history.back());
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
    expect(entryOf("prPhoto")).toBeUndefined();
  });

  it("the look's own X goes Back over its entry: the viewer stays, and one Back more closes it", async () => {
    await openLook();
    expect(entryOf("prPopup")).toBeDefined();
    fireEvent.click(
      within(look() as HTMLElement).getByRole("button", { name: "Close" }),
    );
    await waitFor(() => expect(look()).toBeNull());
    // The entry the look took goes with it (a tick late, on purpose), landing on the viewer's own.
    await waitFor(() => expect(entryOf("prPopup")).toBeUndefined());
    expect(viewerUp()).toBe(true);
    expect(here()).toBe("/e/tok?photo=a");
    expect(entryOf("prPhoto")).toBeDefined();

    await traverse(() => window.history.back());
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
  });

  /* RESHAPED (back-layers): this pin read "stepping the viewer while the look is open (an arrow key behind the
     scrim) takes the look away and keeps the viewer on the next photograph". The key landed inside the look and
     bubbled to the viewer's window listener, which stepped the photograph behind the scrim; the credit re-keyed and
     took the look away with its entry, and crumbs-47 pinned that the Back afterwards still landed right. The scar
     it keeps: one key reaching the layer under the one it was pressed in. Keys now act on the top layer
     (`insideAnotherLayer` in `media-lightbox.tsx`), so the step never happens and the look stays with its entry. */
  it("★ an arrow key inside the look steps nothing behind it: the look keeps its entry, and Back peels it, then the viewer", async () => {
    await openLook();
    fireEvent.keyDown(look() as HTMLElement, { key: "ArrowRight" });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });
    expect(look()).not.toBeNull();
    expect(viewerUp()).toBe(true);
    expect(here()).toBe("/e/tok?photo=a");
    expect(entryOf("prPopup")).toBeDefined();

    await traverse(() => window.history.back());
    expect(look()).toBeNull();
    expect(viewerUp()).toBe(true);
    expect(here()).toBe("/e/tok?photo=a");

    await traverse(() => window.history.back());
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
  });

  // RESHAPED (back-layers) with the pin above: it stepped the viewer from inside the look on a shared link's photograph.
  it("the same over a photograph a shared link opened: the key steps nothing, Back peels the look, and the close leaves the album in place", async () => {
    window.history.replaceState(null, "", "/e/tok?photo=a");
    setViewportWidth(375);
    render(tree());
    await frame();
    expect(viewerUp()).toBe(true);
    fireEvent.click(await screen.findByRole("button", { name: "Maya" }));
    await frame();
    expect(look()).not.toBeNull();

    fireEvent.keyDown(look() as HTMLElement, { key: "ArrowRight" });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });
    expect(look()).not.toBeNull();
    expect(here()).toBe("/e/tok?photo=a");

    await traverse(() => window.history.back());
    expect(look()).toBeNull();
    expect(viewerUp()).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await frame();
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
  });

  it("a Back that really leaves the viewer, pressed while a step's address write is still waiting, still closes it", async () => {
    setViewportWidth(375);
    render(tree());
    fireEvent.click(screen.getAllByLabelText("View photo")[0]);
    await frame();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    // The step's write waits for a beat of quiet: the address still names the first photograph.
    expect(here()).toBe("/e/tok?photo=a");
    await traverse(() => window.history.back());
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
  });

  /* Under Next's own patch: the host's album refreshes the router while a look is open (a decision landing, the
     poll), which writes the top entry again with Next's state alone and takes the look's marker with it
     (`lib/history-entry.ts`). The viewer's `keep` must not read the stripped look as a viewer with no entry and
     mark it as its own, and the Back still has to land on the viewer's entry and peel the look alone. */
  it("a router refresh while the look is open leaves Back peeling the look first, then the viewer, and nothing reloads", async () => {
    window.history.replaceState(null, "", "/");
    const next = installNextHistory();
    try {
      next.land("/e/tok");
      setViewportWidth(375);
      const standIn = () => <NextRouterStandIn>{tree()}</NextRouterStandIn>;
      const { rerender } = render(standIn());
      await frame();
      fireEvent.click(screen.getAllByLabelText("View photo")[0]);
      await frame();
      fireEvent.click(await screen.findByRole("button", { name: "Maya" }));
      await frame();
      expect(look()).not.toBeNull();
      expect(entryOf("prPopup")).toBeDefined();

      next.refresh();
      expect(entryOf("prPopup")).toBeUndefined();
      rerender(standIn());
      await frame();
      expect(look()).not.toBeNull();

      await traverse(() => window.history.back());
      expect(look()).toBeNull();
      expect(viewerUp()).toBe(true);
      expect(next.href).toBe("/e/tok?photo=a");

      await traverse(() => window.history.back());
      expect(viewerUp()).toBe(false);
      expect(next.href).toBe("/e/tok");
      expect(next.reloads).toBe(0);
    } finally {
      next.uninstall();
    }
  });
});

/**
 * ★ A QUESTION OVER THE VIEWER HOLDS ITS OWN ENTRY, AND A RELOAD LEAVES NONE DEAD (back-layers; crumbs-47). On a
 * phone, Back over the viewer's Delete or Remove confirm closed the confirm and the viewer in one press, since only a
 * place held an entry; and a reload with a popup open over the viewer left the window on the popup's entry, so one
 * Back closed nothing and the reopened viewer's walk never wrote its address (`standsOnAPopup`).
 */
describe("a question over the viewer, and a reload under a popup (back-layers)", () => {
  const photos: GridMedia[] = [
    { id: "a", type: "photo", url: "/a.jpg", width: 800, height: 1200 },
    { id: "b", type: "photo", url: "/b.jpg", width: 800, height: 1200 },
  ];
  const frame = () =>
    act(async () => {
      await new Promise((r) => setTimeout(r, 40));
    });
  const here = () => `${window.location.pathname}${window.location.search}`;
  const traverse = (go: () => void) =>
    act(async () => {
      const landed = new Promise<void>((resolve) => {
        window.addEventListener("popstate", () => resolve(), { once: true });
      });
      go();
      await Promise.race([landed, new Promise((r) => setTimeout(r, 400))]);
      await new Promise((r) => setTimeout(r, 0));
    });
  const viewerUp = () =>
    document.querySelector("[data-lightbox-content]") !== null;
  const confirm = () =>
    screen.queryByRole("alertdialog", { name: /delete this upload/i });
  const entryOf = (key: "prPhoto" | "prPopup") =>
    (window.history.state as Record<string, unknown> | null)?.[key];

  /** A guest's own photographs: each carries the viewer's Delete. The caller keeps the item when asked to delete it
   *  (no optimistic removal), the case in which a photograph reopened from the address it was still listed at. */
  function tree(onDeleteItem: (id: string) => void = () => {}) {
    return (
      <TooltipProvider>
        <MasonryColumns
          items={photos}
          onDeleteItem={onDeleteItem}
          canDelete={() => true}
        />
      </TooltipProvider>
    );
  }

  async function openDelete() {
    setViewportWidth(375);
    fireEvent.click(screen.getAllByLabelText("View photo")[0]);
    await frame();
    expect(viewerUp()).toBe(true);
    const atViewer = window.history.length;
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await frame();
    expect(confirm()).not.toBeNull();
    return { atViewer };
  }

  beforeEach(async () => {
    // A Back the test before left on its way lands first (`ui/popup-back.ts`: a push waits for it).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    window.history.pushState(null, "", "/e/tok");
  });
  afterEach(() => {
    setViewportWidth(1024);
    window.history.replaceState(null, "", "/");
  });

  it("★ Back over the viewer's Delete confirm closes the confirm alone, and the next Back closes the viewer", async () => {
    render(tree());
    const { atViewer } = await openDelete();
    // The confirm stands on an entry of its own, over the viewer's: the old code held none here.
    expect(window.history.length).toBe(atViewer + 1);
    expect(entryOf("prPopup")).toBeDefined();
    expect(here()).toBe("/e/tok?photo=a");

    await traverse(() => window.history.back());
    expect(confirm()).toBeNull();
    expect(viewerUp()).toBe(true);
    expect(here()).toBe("/e/tok?photo=a");
    expect(entryOf("prPhoto")).toBeDefined();

    await traverse(() => window.history.back());
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
  });

  it("its Cancel takes the confirm's entry back: the viewer stays on its own, and one Back closes it", async () => {
    render(tree());
    await openDelete();
    fireEvent.click(
      within(confirm() as HTMLElement).getByRole("button", { name: "Cancel" }),
    );
    await waitFor(() => expect(entryOf("prPopup")).toBeUndefined());
    expect(confirm()).toBeNull();
    expect(viewerUp()).toBe(true);
    expect(entryOf("prPhoto")).toBeDefined();

    await traverse(() => window.history.back());
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
  });

  it("★ confirming Delete closes both, and the album stands on its own entry: the photograph never reopens", async () => {
    const onDelete = vi.fn();
    render(tree(onDelete));
    await openDelete();
    fireEvent.click(
      within(confirm() as HTMLElement).getByRole("button", { name: "Delete" }),
    );
    // The confirm's entry goes first (a tick late), then the viewer's: a Back the viewer took at once would have
    // popped the confirm's and landed on its own, a photograph's address with no viewer, read as a Forward.
    await frame();
    await frame();
    await frame();
    expect(onDelete).toHaveBeenCalledWith("a");
    expect(confirm()).toBeNull();
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
    expect(entryOf("prPopup")).toBeUndefined();
    expect(entryOf("prPhoto")).toBeUndefined();
  });

  it("★ a reload with a popup open over the viewer: its dead entry is stepped over, the viewer stands on its own, and its walk writes the address", async () => {
    // What a reload leaves when the credit's look stood over the viewer: the viewer's entry (its marker from the page
    // life before) and the look's over it, where the window stands.
    window.history.replaceState(null, "", "/e/tok");
    window.history.pushState(
      { prPhoto: "prPhoto-before-the-reload" },
      "",
      "/e/tok?photo=a",
    );
    window.history.pushState(
      { prPopup: "prPopup-before-the-reload" },
      "",
      "/e/tok?photo=a",
    );
    setViewportWidth(375);
    render(tree());
    await frame();
    await frame();
    expect(viewerUp()).toBe(true);
    // The old code stood on the look's dead entry: one Back landed on the same photograph, and the walk below waited
    // for a popup that was never coming back.
    expect(entryOf("prPopup")).toBeUndefined();
    expect(entryOf("prPhoto")).toBeDefined();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });
    expect(here()).toBe("/e/tok?photo=b");
    expect(entryOf("prPhoto")).toBeDefined();

    await traverse(() => window.history.back());
    expect(viewerUp()).toBe(false);
    expect(here()).toBe("/e/tok");
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

/**
 * A TILE THAT LEAVES TAKES ITS DOWNLOAD WITH IT (`abortUnfinishedImages`). A browser never cancels an
 * image because its element left the page, and R2 answers over HTTP/1.1 (six connections), so the
 * screen a scroll through a big album stopped on waited behind every photograph it passed: 13 to 18 s
 * at the bottom of the scale probe, 0.5 to 0.8 s once a leaving tile clears its `src`.
 */
describe("a tile that leaves takes its unfinished download with it", () => {
  const finished = (img: HTMLImageElement, done: boolean) =>
    Object.defineProperty(img, "complete", {
      configurable: true,
      get: () => done,
    });

  it("clears an unfinished image's source by the attribute (no error to read as an expiry), and keeps a drawn one", () => {
    const box = document.createElement("div");
    const pending = document.createElement("img");
    const drawn = document.createElement("img");
    pending.setAttribute("src", "https://r2.test/p/1.webp");
    pending.setAttribute("srcset", "https://r2.test/p/1.webp 1x");
    drawn.setAttribute("src", "https://r2.test/p/2.webp");
    finished(pending, false);
    finished(drawn, true);
    box.append(pending, drawn);
    const error = vi.fn();
    pending.addEventListener("error", error);
    abortUnfinishedImages(box);
    expect(pending.hasAttribute("src")).toBe(false);
    expect(pending.hasAttribute("srcset")).toBe(false);
    expect(drawn.getAttribute("src")).toBe("https://r2.test/p/2.webp");
    expect(error).not.toHaveBeenCalled();
  });

  // The abort runs a tick after the commit (a microtask), once the tile has left the document: React's
  // Strict Mode rehearses every ref's cleanup with the tile still on the page, and an abort run there left
  // it blank for good in development. So this pin awaits that tick before it reads the leaving tile.
  it("runs as a tile leaves the grid, and never on a tile that stays", async () => {
    // The grid's one observer is what hears a tile leave; jsdom has none of its own.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    try {
      const two: GridMedia[] = [
        { id: "a", type: "photo", url: "/a.jpg", width: 800, height: 1200 },
        { id: "c", type: "photo", url: "/c.jpg", width: 800, height: 600 },
      ];
      const { container, rerender } = render(<MasonryColumns items={two} />);
      const leaving = container.querySelector<HTMLImageElement>(
        '[data-media-id="a"] img',
      )!;
      const staying = container.querySelector<HTMLImageElement>(
        '[data-media-id="c"] img',
      )!;
      finished(leaving, false);
      finished(staying, false);
      rerender(<MasonryColumns items={[two[1]]} />);
      await Promise.resolve();
      expect(leaving.isConnected).toBe(false);
      expect(leaving.hasAttribute("src")).toBe(false);
      expect(staying.getAttribute("src")).toBe("/c.jpg");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps a loading photograph on a tile React only rehearses (Strict Mode, development)", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    // Every image unfinished from its first frame, so the rehearsal's cleanup meets a download in flight.
    const complete = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "complete",
    );
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => false,
    });
    try {
      const two: GridMedia[] = [
        { id: "a", type: "photo", url: "/a.jpg", width: 800, height: 1200 },
        { id: "c", type: "photo", url: "/c.jpg", width: 800, height: 600 },
      ];
      const { container } = render(
        <StrictMode>
          <MasonryColumns items={two} />
        </StrictMode>,
      );
      await Promise.resolve();
      for (const id of ["a", "c"]) {
        const img = container.querySelector<HTMLImageElement>(
          `[data-media-id="${id}"] img`,
        )!;
        expect(img.isConnected).toBe(true);
        expect(img.getAttribute("src")).toBe(`/${id}.jpg`);
      }
    } finally {
      if (complete)
        Object.defineProperty(HTMLImageElement.prototype, "complete", complete);
      else delete (HTMLImageElement.prototype as { complete?: boolean }).complete;
      vi.unstubAllGlobals();
    }
  });
});
