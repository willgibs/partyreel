/**
 * WHAT LANDED OUT OF SIGHT, SAID (`album-window-news.tsx` over `album-window.tsx`), the edge cases album-order was
 * cut to pin: a batch landing above while she reads deep (the anchoring holds, the pill counts it and points up), a
 * late approval landing below, the end of an album in order, the turn under a reader (the pill says where the news now
 * lies), a late upload taken at the party landing mid-album by its capture time, a lens that reveals, an arrival held
 * at the door, the album's head, the press (smooth, at once under reduced motion, with focus from a keyboard), and a
 * layer over the album.
 *
 * ★ jsdom has no layout: as in `album-window.test.tsx`, every element measures 800px wide at the page's top and
 * resolves no gap, so the rows are real engine rows at 800 with a gap of 0, and "scrolling" is the album's own rect and
 * the window's `scrollY`, set by hand. jsdom has no hit-testing either, so no bar is found (0): the guest's page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { rowsInView } from "@/components/shared/album-window";
import {
  AlbumNewsContext,
  barBottom,
  landingsOf,
  pillFor,
  rowInView,
  type AlbumNews,
} from "@/components/shared/album-window-news";
import { isPhoto } from "@/components/shared/album-window-plan";
import { MasonryColumns } from "@/components/shared/masonry";
import { rowRatio } from "@/lib/media/tile-aspect";
import { inOrder } from "@/lib/shared/album-order";
import {
  layoutRows,
  perRowFor,
  reflowRows,
  type RowAnchor,
  type RowItem,
  type RowsLayout,
} from "@/lib/shared/album-rows";
import { anchorShift, rowTops, topAnchor } from "@/lib/shared/album-window";
import { setReducedMotion } from "../../../vitest.setup";

vi.mock("@/components/shared/media-lightbox.lazy", () => ({
  MediaLightboxLazy: () => null,
  preloadMediaLightbox: () => {},
}));

const shapes = [
  [3, 4],
  [4, 3],
  [3, 4],
  [9, 16],
  [1, 1],
  [3, 2],
];
const photo = (i: number, prefix = "a"): GridMedia => ({
  id: `${prefix}${i}`,
  type: "photo",
  url: `/${prefix}${i}.jpg`,
  width: shapes[i % shapes.length][0] * 100,
  height: shapes[i % shapes.length][1] * 100,
});
/** Newest first, the wire's order: a0 is the newest. */
const album = Array.from({ length: 400 }, (_, i) => photo(i));

const itemsOf = (list: GridMedia[]): RowItem[] =>
  list.map((m) => ({ id: m.id, ratio: rowRatio(m) }));
const params = (anchor: RowAnchor = "end") => ({
  width: 800,
  gap: 0,
  perRow: perRowFor(800, 1),
  anchor,
});
const rowTopOf = (layout: RowsLayout, id: string) => {
  let y = 0;
  for (const row of layout.rows) {
    if (row.ids.includes(id)) return y;
    y += row.height;
  }
  return NaN;
};

/**
 * WHAT THE BOX DOES FOR A CHANGE while she reads at `viewTop`, mirrored with the engine's own functions: the reflow
 * with the rows in view held (none on a change of parameters, which lays the album whole), and the scroll that keeps
 * the photograph at the view's top on its pixel.
 */
function boxChange(
  prev: RowsLayout,
  next: GridMedia[],
  p: ReturnType<typeof params>,
  viewTop: number,
) {
  const tops = rowTops(prev.rows, 0);
  const held = rowsInView(tops, 0, {
    top: viewTop,
    height: window.innerHeight,
  });
  const laid = reflowRows(prev, itemsOf(next), p, held).layout;
  const anchors = topAnchor(prev.rows, tops, 0, viewTop, isPhoto);
  const shift =
    anchorShift(
      anchors,
      { rows: prev.rows, tops },
      { rows: laid.rows, tops: rowTops(laid.rows, 0) },
    ) ?? 0;
  return { laid, shift };
}

let scrollY = 0;
const scrollBy = vi.fn((opts: ScrollToOptions) => {
  scrollY += opts.top ?? 0;
});

async function scrollTo(y: number) {
  scrollY = y;
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 40));
  });
}

const pill = () =>
  document.body.querySelector<HTMLButtonElement>("[data-album-news-pill]");

/** The album a surface draws, telling its rows what arrived. */
function Album({
  items,
  news,
  anchor = "end",
}: {
  items: GridMedia[];
  news?: AlbumNews;
  anchor?: RowAnchor;
}): ReactNode {
  const grid = (
    <MasonryColumns items={items} layout="rows" rowAnchor={anchor} />
  );
  return news ? <AlbumNewsContext value={news}>{grid}</AlbumNewsContext> : grid;
}

beforeEach(() => {
  scrollY = 0;
  scrollBy.mockClear();
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => scrollY,
  });
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const top = this.hasAttribute("data-album-grid") ? -scrollY : 0;
      return {
        x: 0,
        y: top,
        width: 800,
        height: 600,
        top,
        left: 0,
        bottom: top + 600,
        right: 800,
        toJSON: () => ({}),
      } as DOMRect;
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  setReducedMotion(false);
  window.history.replaceState(null, "", "/");
});

describe("under the bar", () => {
  /**
   * The hub's chrome as a hit test meets it: the app's header stuck at the top (56px), its cards band stuck under it
   * (to 110px) inside a footprint that takes no pointer below its cards (so the album answers there), then the album.
   */
  it("finds the bottom of the chrome stuck to the screen, and never counts the album or itself", () => {
    const header = document.createElement("header");
    header.style.position = "sticky";
    const footprint = document.createElement("div");
    footprint.style.position = "sticky";
    const band = document.createElement("div");
    footprint.appendChild(band);
    const album = document.createElement("div");
    document.body.append(header, footprint, album);
    const at = vi.fn((_x: number, y: number) =>
      y < 56 ? header : y < 110 ? band : album,
    );
    const doc = {
      elementFromPoint: at,
      defaultView: window,
    } as unknown as Document;
    try {
      // Read to four pixels: the first step past the band.
      expect(barBottom(doc, 400)).toBe(112);
      // A guest's page scrolls its header away: nothing is stuck, and the pill stands 12px from the top.
      at.mockImplementation(() => album);
      expect(barBottom(doc, 400)).toBe(0);
    } finally {
      header.remove();
      footprint.remove();
      album.remove();
    }
  });

  it("an engine with no hit-testing finds no bar", () => {
    const doc = { defaultView: window } as unknown as Document;
    expect(barBottom(doc, 400)).toBe(0);
  });
});

describe("the arithmetic", () => {
  // Rows 100 tall, no gap: row r spans [100r, 100r + 100).
  const tops = rowTops(
    Array.from({ length: 50 }, () => ({ height: 100 })),
    0,
  );

  it("groups unseen arrivals into landings: adjacent rows are one, a gap makes two", () => {
    const landings = landingsOf(
      new Map([
        ["a", 0],
        ["b", 1],
        ["c", 1],
        ["d", 30],
      ]),
    );
    expect(landings.map((l) => [l.first, l.last, l.ids.length])).toEqual([
      [0, 1, 3],
      [30, 30, 1],
    ]);
  });

  it("calls a row seen only when a third of it is in view (a peek over the foot is not)", () => {
    const band = { top: 1000, bottom: 1768 };
    expect(rowInView(tops, 0, 10, band)).toBe(true);
    expect(rowInView(tops, 0, 17, band)).toBe(true); // 1700 to 1800: 68 of 100 in view
    expect(rowInView(tops, 0, 9, { top: 980, bottom: 1768 })).toBe(false); // 20 of 100
    expect(rowInView(tops, 0, 20, band)).toBe(false);
  });

  it("counts every unseen arrival and points to the nearest landing", () => {
    const band = { top: 2000, bottom: 2768 };
    const landings = landingsOf(
      new Map([
        ["head1", 0],
        ["head2", 0],
        ["near", 35],
      ]),
    );
    const p = pillFor(landings, tops, 0, band)!;
    expect(p.count).toBe(3);
    expect(p.dir).toBe("down");
    expect(p.to.first).toBe(35);
    const fromDeep = pillFor(landings, tops, 0, { top: 4000, bottom: 4768 })!;
    expect(fromDeep.dir).toBe("up");
    expect(fromDeep.to.first).toBe(35);
  });
});

describe("a batch landing above while she reads deep", () => {
  it("★ holds her photograph on its pixel and says how many landed, pointing up; a press takes her to them and reaching them clears it", async () => {
    const news: AlbumNews = { arrivals: [] };
    const { rerender } = render(<Album items={album} news={news} />);
    await scrollTo(20_000);
    expect(pill()).toBeNull();

    const before = layoutRows(itemsOf(album), params());
    const batch = Array.from({ length: 200 }, (_, i) => photo(i, "new"));
    const next = [...batch, ...album];
    rerender(
      <Album items={next} news={{ arrivals: batch.map((m) => m.id) }} />,
    );
    // The anchoring holds: one scroll, exactly as far as her photograph moved.
    const { shift } = boxChange(before, next, params(), 20_000);
    expect(shift).toBeGreaterThan(5_000);
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy.mock.calls[0][0]).toMatchObject({ behavior: "instant" });
    expect(scrollBy.mock.calls[0][0].top).toBe(shift);
    // And the pill says it, up, under the bar (none here: the guest's page).
    expect(pill()).not.toBeNull();
    expect(pill()!.dataset.albumNewsPill).toBe("up");
    expect(pill()!.textContent).toContain("200 new");
    expect(pill()!.closest("[data-album-news]")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    // The press: to the top of the landing (the album's head), 8px under the bar, smoothly.
    scrollBy.mockClear();
    const from = scrollY;
    fireEvent.click(pill()!, { detail: 1 });
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy.mock.calls[0][0]).toMatchObject({ behavior: "smooth" });
    expect(scrollBy.mock.calls[0][0].top).toBe(0 - 8 - from);
    // The scroll arrives: the landing is reached, and the pill is gone.
    await scrollTo(scrollY);
    expect(pill()).toBeNull();
  });

  it("a reader at the head watches an arrival land: no pill", () => {
    const { rerender } = render(
      <Album items={album} news={{ arrivals: [] }} />,
    );
    rerender(
      <Album
        items={[photo(0, "new"), ...album]}
        news={{ arrivals: ["new0"] }}
      />,
    );
    expect(scrollBy).not.toHaveBeenCalled();
    expect(pill()).toBeNull();
  });

  it("clears whole as her own scroll reaches the landing, however many rows it spans", async () => {
    const { rerender } = render(
      <Album items={album} news={{ arrivals: [] }} />,
    );
    await scrollTo(30_000);
    const batch = Array.from({ length: 60 }, (_, i) => photo(i, "new"));
    rerender(
      <Album
        items={[...batch, ...album]}
        news={{ arrivals: batch.map((m) => m.id) }}
      />,
    );
    expect(pill()!.textContent).toContain("60 new");
    // She scrolls back up on her own, into the bottom of the landing.
    const { laid } = boxChange(
      layoutRows(itemsOf(album), params()),
      [...batch, ...album],
      params(),
      30_000,
    );
    const lastOfBatch = rowTopOf(laid, "new59");
    await scrollTo(lastOfBatch - 200);
    expect(pill()).toBeNull();
  });

  it("★ a batch of 200 above and a late approval just below count together; the arrow points to the nearer, then to the rest", async () => {
    const { rerender } = render(
      <Album items={album} news={{ arrivals: [] }} />,
    );
    await scrollTo(10_000);
    const batch = Array.from({ length: 200 }, (_, i) => photo(i, "new"));
    // The late approval lands a few rows below what she reads.
    const at = album.findIndex((m) => m.id === "a150");
    const late = photo(0, "late");
    const next = [...batch, ...album.slice(0, at), late, ...album.slice(at)];
    rerender(
      <Album
        items={next}
        news={{ arrivals: [...batch.map((m) => m.id), late.id] }}
      />,
    );
    expect(pill()!.textContent).toContain("201 new");
    expect(pill()!.dataset.albumNewsPill).toBe("down");
    // The press goes to the nearer landing; reaching it leaves the batch above, said.
    fireEvent.click(pill()!, { detail: 1 });
    await scrollTo(scrollY);
    expect(pill()!.textContent).toContain("200 new");
    expect(pill()!.dataset.albumNewsPill).toBe("up");
  });
});

describe("arrivals that land below her", () => {
  it("a late approval landing mid-album below the view points down", async () => {
    const { rerender } = render(
      <Album items={album} news={{ arrivals: [] }} />,
    );
    await scrollTo(10_000);
    const late = photo(0, "late");
    const next = [...album.slice(0, 350), late, ...album.slice(350)];
    rerender(<Album items={next} news={{ arrivals: ["late0"] }} />);
    // Below her: nothing above moved, so nothing scrolled.
    expect(scrollBy).not.toHaveBeenCalled();
    expect(pill()!.dataset.albumNewsPill).toBe("down");
    expect(pill()!.textContent).toContain("1 new");
  });

  it("★ in an album in order an arrival lands at the end: nothing she sees moves, and the pill points down", async () => {
    const night = inOrder(album);
    const { rerender } = render(
      <Album items={night} anchor="start" news={{ arrivals: [] }} />,
    );
    await scrollTo(15_000);
    const fresh = photo(0, "new");
    rerender(
      <Album
        items={[...night, fresh]}
        anchor="start"
        news={{ arrivals: ["new0"] }}
      />,
    );
    expect(scrollBy).not.toHaveBeenCalled();
    expect(pill()!.dataset.albumNewsPill).toBe("down");
  });

  it("never stands over the album's head: at the top of an album in order it waits until she is past the first row", async () => {
    const night = inOrder(album);
    const { rerender } = render(
      <Album items={night} anchor="start" news={{ arrivals: [] }} />,
    );
    rerender(
      <Album
        items={[...night, photo(0, "new")]}
        anchor="start"
        news={{ arrivals: ["new0"] }}
      />,
    );
    expect(pill()).toBeNull();
    await scrollTo(2_000);
    expect(pill()!.dataset.albumNewsPill).toBe("down");
  });
});

describe("the turn under a reader", () => {
  it("★ holds her photograph on its pixel, and the pill now points to where the news lies", async () => {
    const batch = [photo(0, "new"), photo(1, "new")];
    const live = [...batch, ...album];
    const { rerender } = render(
      <Album items={album} news={{ arrivals: [] }} />,
    );
    await scrollTo(20_000);
    rerender(
      <Album items={live} news={{ arrivals: batch.map((m) => m.id) }} />,
    );
    expect(pill()!.dataset.albumNewsPill).toBe("up");
    const { laid: before } = boxChange(
      layoutRows(itemsOf(album), params()),
      live,
      params(),
      20_000,
    );

    // 9 am the morning after: the album turns to the night in order, laid from its start.
    const night = inOrder(live);
    const top = scrollY;
    scrollBy.mockClear();
    rerender(
      <Album
        items={night}
        anchor="start"
        news={{ arrivals: batch.map((m) => m.id) }}
      />,
    );
    // Her photograph keeps its pixel: one scroll, exactly how far it moved in the album turned whole.
    const { shift } = boxChange(before, night, params("start"), top);
    expect(shift).not.toBe(0);
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy.mock.calls[0][0].top).toBe(shift);
    // The two that landed at the head are the night's newest now, at its end: below her.
    expect(pill()!.dataset.albumNewsPill).toBe("down");
    expect(pill()!.textContent).toContain("2 new");
  });
});

describe("a late upload taken at the party, by its capture time", () => {
  it("★ lands mid-album in the night's order: the anchoring holds and the pill points to where it landed", async () => {
    // The album in order by when each was taken (a399 first, a0 last); the late upload arrived last of all but was
    // taken early in the night, between a350 and a349.
    const taken = new Map(album.map((m, i) => [m.id, 1000 - i]));
    const late = photo(5, "late");
    taken.set(late.id, 650.5);
    const order = (list: GridMedia[]) => inOrder(list, (m) => taken.get(m.id));
    const night = order(album);
    const { rerender } = render(
      <Album items={night} anchor="start" news={{ arrivals: [] }} />,
    );
    await scrollTo(25_000);
    const before = layoutRows(itemsOf(night), params("start"));
    const withLate = order([late, ...album]);
    // It lands mid-album, nowhere near the end, and above her (taken early in the night).
    const at = withLate.findIndex((m) => m.id === late.id);
    expect(at).toBeGreaterThan(10);
    expect(at).toBeLessThan(withLate.length - 10);
    rerender(
      <Album items={withLate} anchor="start" news={{ arrivals: [late.id] }} />,
    );
    const { laid, shift } = boxChange(
      before,
      withLate,
      params("start"),
      25_000,
    );
    expect(rowTopOf(laid, late.id)).toBeLessThan(25_000);
    // The rows above her grew (or re-broke), and the scroll paid it exactly: her photograph keeps its pixel.
    if (shift !== 0) {
      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy.mock.calls[0][0].top).toBe(shift);
    } else expect(scrollBy).not.toHaveBeenCalled();
    // And the pill points to where it landed: up.
    expect(pill()!.dataset.albumNewsPill).toBe("up");
    expect(pill()!.textContent).toContain("1 new");
  });

  it("and one taken late in the night lands below her, the pill pointing down", async () => {
    const taken = new Map(album.map((m, i) => [m.id, 1000 - i]));
    const late = photo(7, "late");
    taken.set(late.id, 980.5); // between a20 and a19: late in the night
    const order = (list: GridMedia[]) => inOrder(list, (m) => taken.get(m.id));
    const night = order(album);
    const { rerender } = render(
      <Album items={night} anchor="start" news={{ arrivals: [] }} />,
    );
    await scrollTo(10_000);
    rerender(
      <Album
        items={order([late, ...album])}
        anchor="start"
        news={{ arrivals: [late.id] }}
      />,
    );
    expect(scrollBy).not.toHaveBeenCalled();
    expect(pill()!.dataset.albumNewsPill).toBe("down");
  });
});

describe("what is not news", () => {
  it("a surface that tells the rows nothing draws no pill", async () => {
    const { rerender } = render(<Album items={album} />);
    await scrollTo(20_000);
    rerender(<Album items={[photo(0, "new"), ...album]} />);
    expect(pill()).toBeNull();
  });

  it("what a new lens reveals was in the album all along", async () => {
    const videos = album.filter((_, i) => i % 3 === 0);
    const { rerender } = render(
      <Album items={videos} news={{ arrivals: [], lens: "videos" }} />,
    );
    await scrollTo(5_000);
    // A photograph arrived while she looked at videos only: no tile, no news yet.
    rerender(
      <Album items={videos} news={{ arrivals: ["new0"], lens: "videos" }} />,
    );
    expect(pill()).toBeNull();
    // Show all: the album whole again, the arrival among it, and still no pill.
    rerender(
      <Album
        items={[photo(0, "new"), ...album]}
        news={{ arrivals: ["new0"], lens: "all" }}
      />,
    );
    expect(pill()).toBeNull();
  });

  it("an arrival held at the door is judged when it stands in the rows", async () => {
    const { rerender } = render(
      <Album items={album} news={{ arrivals: [] }} />,
    );
    await scrollTo(20_000);
    // Named an arrival, but held out of the rows until its photograph decodes.
    rerender(<Album items={album} news={{ arrivals: ["new0"] }} />);
    expect(pill()).toBeNull();
    rerender(
      <Album
        items={[photo(0, "new"), ...album]}
        news={{ arrivals: ["new0"] }}
      />,
    );
    expect(pill()!.textContent).toContain("1 new");
  });
});

describe("the press", () => {
  async function deepWithNews() {
    const { rerender } = render(
      <Album items={album} news={{ arrivals: [] }} />,
    );
    await scrollTo(20_000);
    rerender(
      <Album
        items={[photo(0, "new"), ...album]}
        news={{ arrivals: ["new0"] }}
      />,
    );
    expect(pill()).not.toBeNull();
  }

  it("lands at once under reduced motion, and the pill takes no entrance there", async () => {
    setReducedMotion(true);
    await deepWithNews();
    expect(pill()!.className).toContain("motion-reduce:animate-none");
    scrollBy.mockClear();
    fireEvent.click(pill()!, { detail: 1 });
    expect(scrollBy.mock.calls[0][0]).toMatchObject({ behavior: "instant" });
  });

  it("from a keyboard lands at once, on the landing's first photograph", async () => {
    await deepWithNews();
    scrollBy.mockClear();
    fireEvent.click(pill()!, { detail: 0 });
    expect(scrollBy.mock.calls[0][0]).toMatchObject({ behavior: "instant" });
    expect(
      (document.activeElement as HTMLElement | null)?.closest(
        "[data-media-id]",
      ),
    ).toHaveAttribute("data-media-id", "new0");
  });

  it("stands down while a layer is over the album, and comes back when it goes", async () => {
    await deepWithNews();
    const layer = document.createElement("div");
    layer.setAttribute("role", "dialog");
    await act(async () => {
      document.body.appendChild(layer);
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(pill()).toBeNull();
    await act(async () => {
      layer.remove();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(pill()).not.toBeNull();
  });
});
