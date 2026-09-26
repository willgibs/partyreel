/**
 * THE WINDOWED ROWS, AS A BOX (the album-window lane). The arithmetic is
 * `album-window.test.ts`'s; these pin the box that runs it: only the rows
 * around the view are mounted and the window follows the scroll, the
 * keyboard's row stays mounted, a deep link mounts its tile and hands it back,
 * what is mounted is reported and numbered for a screen reader, a head arrival
 * while the reader is deep is paid for with exactly the scroll that keeps them
 * on their pixel (and nothing at the top), a hide just above the view re-lays
 * none of the rows in it, a touch change waits out a flick, and a pinch asks
 * for the next step.
 *
 * ★ jsdom has no layout: every element measures 800px wide at the top of the
 * page (vitest.setup.ts) and resolves no gap, so the rows are real engine rows
 * at 800 with a gap of 0, and "scrolling" is the album's own rect and the
 * window's `scrollY`, set by hand.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { createRef } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { rowsInView } from "@/components/shared/album-window";
import { rowItemsFor } from "@/components/shared/album-window-plan";
import { MasonryColumns, type AlbumHandle } from "@/components/shared/masonry";
import {
  layoutRows,
  perRowFor,
  reflowRows,
  type RowItem,
} from "@/lib/shared/album-rows";
import { rowTops } from "@/lib/shared/album-window";
import { rowRatio } from "@/lib/media/tile-aspect";

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
const album = Array.from({ length: 400 }, (_, i) => photo(i));

/** The engine's own rows for a list at jsdom's 800px, the way the box lays them. */
const itemsOf = (list: GridMedia[]): RowItem[] =>
  list.map((m) => ({ id: m.id, ratio: rowRatio(m) }));
const PARAMS = { width: 800, gap: 0, perRow: perRowFor(800, 1) };

const ROW_TOP = (layout: ReturnType<typeof layoutRows>, id: string) => {
  let y = 0;
  for (const row of layout.rows) {
    if (row.ids.includes(id)) return y;
    y += row.height;
  }
  return NaN;
};

let scrollY = 0;
const scrollBy = vi.fn((opts: ScrollToOptions) => {
  scrollY += opts.top ?? 0;
});

/** Scroll the page: the album's rect moves up by as much, and the window hears it. */
async function scrollTo(y: number) {
  scrollY = y;
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 40));
  });
}

const tiles = (c: HTMLElement) =>
  [...c.querySelectorAll<HTMLElement>("[data-media-tile][data-media-id]")].map(
    (t) => t.dataset.mediaId!,
  );
const grid = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-album-grid][data-album-layout="rows"]')!;

beforeEach(() => {
  scrollY = 0;
  scrollBy.mockClear();
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => scrollY,
  });
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
  // The album sits at the page's top; scrolling moves its rect up.
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
  window.history.replaceState(null, "", "/");
});

describe("only the rows around the view are mounted", () => {
  it("mounts a few screens of a long album, a spacer standing for the rest", () => {
    const { container } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    const mounted = tiles(container);
    expect(mounted.length).toBeGreaterThan(8);
    expect(mounted.length).toBeLessThan(album.length / 4);
    expect(mounted[0]).toBe("a0");
    const spacers = grid(container).querySelectorAll("[data-rows-spacer]");
    expect(spacers).toHaveLength(1);
    expect(
      parseFloat((spacers[0] as HTMLElement).style.height),
    ).toBeGreaterThan(10_000);
  });

  it("follows the scroll: the rows behind give way, the rows ahead arrive", async () => {
    const { container } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    await scrollTo(30_000);
    const mounted = tiles(container);
    expect(mounted).not.toContain("a0");
    const first = Number(mounted[0].slice(1));
    expect(first).toBeGreaterThan(50);
    const spacers = [
      ...grid(container).querySelectorAll<HTMLElement>("[data-rows-spacer]"),
    ];
    expect(spacers).toHaveLength(2);
    // Every mounted row sits at its prefix-sum top: the spacer before is the
    // exact height of the rows it stands for.
    const layout = layoutRows(itemsOf(album), PARAMS);
    expect(parseFloat(spacers[0].style.height)).toBe(
      ROW_TOP(layout, mounted[0]),
    );
    // And the tile keeps its node wherever the window goes.
    const node = container.querySelector(`[data-media-id="${mounted[3]}"]`);
    await scrollTo(30_050);
    expect(container.querySelector(`[data-media-id="${mounted[3]}"]`)).toBe(
      node,
    );
  });

  it("keeps the keyboard's row mounted wherever the reader scrolls", async () => {
    const { container } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    const open = container.querySelector<HTMLElement>(
      '[data-media-id="a2"] [data-tile-open]',
    )!;
    act(() => open.focus());
    await scrollTo(15_000);
    expect(tiles(container)).toContain("a2");
    expect(document.activeElement).toBe(open);
    // Two ranges now: the focused row, a spacer, then the view's rows.
    const kids = [...grid(container).children] as HTMLElement[];
    const pinned = kids.findIndex((k) => k.dataset.mediaId === "a2");
    const gapAfter = kids.findIndex(
      (k, i) => i > pinned && k.hasAttribute("data-rows-spacer"),
    );
    expect(gapAfter).toBeGreaterThan(pinned);
    expect(kids.slice(gapAfter + 1).some((k) => k.dataset.mediaId)).toBe(true);
    act(() => open.blur());
    await scrollTo(15_010);
    expect(tiles(container)).not.toContain("a2");
  });
});

describe("the album answers for what it mounts", () => {
  it("reports the mounted photographs whenever they change", async () => {
    const onWindowChange = vi.fn();
    render(
      <MasonryColumns
        items={album}
        layout="rows"
        onWindowChange={onWindowChange}
      />,
    );
    expect(onWindowChange).toHaveBeenCalledTimes(1);
    const first = onWindowChange.mock.calls[0][0] as string[];
    expect(first[0]).toBe("a0");
    await scrollTo(30_000);
    const last = onWindowChange.mock.calls.at(-1)![0] as string[];
    expect(last).not.toContain("a0");
    // Nothing changed, nothing reported.
    const calls = onWindowChange.mock.calls.length;
    await scrollTo(30_001);
    expect(onWindowChange.mock.calls.length).toBe(calls);
  });

  it("tells a screen reader the whole album's size and each photograph's place", async () => {
    const { container } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    const g = grid(container);
    expect(g).toHaveAttribute("role", "list");
    await scrollTo(30_000);
    const items = [...g.querySelectorAll<HTMLElement>("[role='listitem']")];
    expect(items.length).toBeGreaterThan(0);
    for (const el of items) {
      expect(el).toHaveAttribute("aria-setsize", String(album.length));
      const index = album.findIndex((m) => m.id === el.dataset.mediaId);
      expect(el).toHaveAttribute("aria-posinset", String(index + 1));
    }
  });

  it("mounts a deep-linked photograph and hands its tile back", () => {
    const ref = createRef<AlbumHandle>();
    const { container } = render(
      <MasonryColumns items={album} layout="rows" albumRef={ref} />,
    );
    expect(tiles(container)).not.toContain("a300");
    let el: HTMLElement | null = null;
    act(() => {
      el = ref.current!.scrollToId("a300");
    });
    expect(el).not.toBeNull();
    expect(el!.dataset.mediaId).toBe("a300");
    expect(scrollBy).toHaveBeenCalledTimes(1);
    // Centred: the row's top less half of what the view has to spare.
    const layout = layoutRows(itemsOf(album), PARAMS);
    const row = layout.rows.find((r) => r.ids.includes("a300"))!;
    expect(scrollBy.mock.calls[0][0].top).toBeCloseTo(
      ROW_TOP(layout, "a300") - (window.innerHeight - row.height) / 2,
      3,
    );
    expect(ref.current!.scrollToId("nobody")).toBeNull();
  });
});

describe("a head arrival while the reader is deep moves nothing they can see", () => {
  it("scrolls by exactly how far the photograph at the top moved", async () => {
    const { container, rerender } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    await scrollTo(20_000);
    const before = layoutRows(itemsOf(album), PARAMS);
    // The photograph at the view's top, and where its row sits.
    let y = 0;
    let anchorId = "";
    for (const row of before.rows) {
      if (y + row.height > 20_000) {
        anchorId = row.ids[0];
        break;
      }
      y += row.height;
    }
    const arrivals = [photo(0, "new"), photo(1, "new")];
    const next = [...arrivals, ...album];
    rerender(<MasonryColumns items={next} layout="rows" />);
    const after = reflowRows(before, itemsOf(next), PARAMS).layout;
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy.mock.calls[0][0]).toMatchObject({ behavior: "instant" });
    expect(scrollBy.mock.calls[0][0].top).toBe(
      ROW_TOP(after, anchorId) - ROW_TOP(before, anchorId),
    );
    // The new photographs are at the head, out of view, and not mounted.
    expect(tiles(container)).not.toContain("new0");
  });

  it("lets a reader at the head watch it arrive: no scroll, and it pushes in", () => {
    const { container, rerender } = render(
      <MasonryColumns items={album} layout="rows" />,
    );
    rerender(
      <MasonryColumns items={[photo(0, "new"), ...album]} layout="rows" />,
    );
    expect(scrollBy).not.toHaveBeenCalled();
    const tile = container.querySelector('[data-media-id="new0"]')!;
    expect(tile.hasAttribute("data-entering")).toBe(true);
    // Its neighbours were here before: they glide, they do not push.
    expect(
      container
        .querySelector('[data-media-id="a0"]')!
        .hasAttribute("data-entering"),
    ).toBe(false);
  });

  it("stops the push once the glide is over, so a remount never replays it", () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = render(
        <MasonryColumns items={album} layout="rows" />,
      );
      rerender(
        <MasonryColumns items={[photo(0, "new"), ...album]} layout="rows" />,
      );
      const tile = () => container.querySelector('[data-media-id="new0"]')!;
      expect(tile().hasAttribute("data-entering")).toBe(true);
      act(() => vi.advanceTimersByTime(600));
      expect(tile().hasAttribute("data-entering")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("a hide just above the view re-lays none of the rows in it", () => {
  /**
   * ★ THE RED-TEAM'S CASE, FOUND RATHER THAN HAND-BUILT: an album, a visit's seed and a photograph
   * in the row just above the view whose hide, left to the old window (its row and both
   * neighbours), would have re-laid the row at the view's top. The seeds are searched so the pin
   * keeps biting whatever the engine's answers become.
   */
  const VIEW_TOP = 20_000;
  function biting() {
    const perRow = perRowFor(800, 1);
    const params = { ...PARAMS, feature: "double" as const };
    for (let seed = 1; seed < 400; seed++) {
      const list = rowItemsFor(album, false, { seed, perRow }, [], "end");
      const before = layoutRows(list, params);
      const tops = rowTops(before.rows, 0);
      const held = rowsInView(tops, 0, {
        top: VIEW_TOP,
        height: window.innerHeight,
      })!;
      for (const victim of before.rows[held[0] - 1].ids) {
        const next = list.filter((it) => it.id !== victim);
        const free = reflowRows(before, next, params);
        if (free.windows.some(([a, b]) => a <= held[1] && b >= held[0]))
          return { seed, victim, before, held, params };
      }
    }
    throw new Error("no hide above the view reached it: the pin bites nothing");
  }

  it("pays for the rows above with exactly their change, and every tile in view keeps its box", async () => {
    const { seed, victim, before, held, params } = biting();
    const props = {
      layout: "rows" as const,
      rowRhythm: "double" as const,
      rhythmSeed: seed,
    };
    const { container, rerender } = render(
      <MasonryColumns items={album} {...props} />,
    );
    await scrollTo(VIEW_TOP);
    const seen = before.rows.slice(held[0], held[1] + 1).flatMap((r) => r.ids);
    const box = (id: string) => {
      const el = container.querySelector<HTMLElement>(
        `[data-media-id="${id}"]`,
      )!;
      return `${el.style.flexGrow}|${el.style.height}`;
    };
    const was = new Map(seen.map((id) => [id, box(id)] as const));
    rerender(
      <MasonryColumns
        items={album.filter((m) => m.id !== victim)}
        {...props}
      />,
    );
    const next = reflowRows(
      before,
      rowItemsFor(
        album.filter((m) => m.id !== victim),
        false,
        { seed, perRow: params.perRow },
        [],
        "end",
      ),
      params,
      held,
    );
    // Only rows above the view were re-laid...
    expect(next.windows.every(([, b]) => b < held[0])).toBe(true);
    // ...so the scroll is their change, and nothing the reader sees moved.
    const first = before.rows[held[0]].ids[0];
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy.mock.calls[0][0].top).toBe(
      ROW_TOP(next.layout, first) - ROW_TOP(before, first),
    );
    for (const id of seen) expect(box(id)).toBe(was.get(id));
  });

  it("reads the rows in view off the laid tops: the row at the view's top, by a pixel, to the last one showing", () => {
    // Rows 100 tall with no gap: 0-100, 100-200, 200-300, 300-400.
    const tops = rowTops(
      Array.from({ length: 4 }, () => ({ height: 100 })),
      0,
    );
    expect(rowsInView(tops, 0, { top: 150, height: 100 })).toEqual([1, 2]);
    expect(rowsInView(tops, 0, { top: 199, height: 2 })).toEqual([1, 2]);
    // A view whose bottom edge meets a row's top does not see that row.
    expect(rowsInView(tops, 0, { top: 100, height: 100 })).toEqual([1, 1]);
    // Above the album's top it sees the head; past its end, nothing.
    expect(rowsInView(tops, 0, { top: -300, height: 350 })).toEqual([0, 0]);
    expect(rowsInView(tops, 0, { top: 400, height: 100 })).toBeNull();
    expect(rowsInView(tops, 0, { top: -300, height: 300 })).toBeNull();
    // With a gap, a view whose top sits in the gap under a row starts past it.
    const gapped = rowTops(
      Array.from({ length: 3 }, () => ({ height: 100 })),
      4,
    );
    expect(rowsInView(gapped, 4, { top: 102, height: 50 })).toEqual([1, 1]);
  });
});

describe("a touch change never moves a flick", () => {
  it("holds a change that needs a scroll until the scroll has been still for a beat", async () => {
    const real = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      ...real(q),
      matches: q.includes("pointer: coarse") ? true : real(q).matches,
    })) as typeof window.matchMedia;
    try {
      const { container, rerender } = render(
        <MasonryColumns items={album} layout="rows" />,
      );
      await scrollTo(20_000);
      // Still flicking (a scroll this very moment) when two photographs land.
      scrollY = 20_010;
      act(() => window.dispatchEvent(new Event("scroll")));
      rerender(
        <MasonryColumns
          items={[photo(0, "new"), photo(1, "new"), ...album]}
          layout="rows"
        />,
      );
      expect(scrollBy).not.toHaveBeenCalled();
      // The album on screen is the one before the change, whole.
      expect(tiles(container).length).toBeGreaterThan(0);
      // The flick settles: the change lands, with its scroll.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 220));
      });
      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy.mock.calls[0][0].top).not.toBe(0);
    } finally {
      window.matchMedia = real;
    }
  });
});

describe("a pinch or ctrl and the wheel over the album asks for the next step", () => {
  it("steps bigger on a spread, smaller on a pinch, and nowhere past the ends", () => {
    const onStep = vi.fn();
    const { container, rerender } = render(
      <MasonryColumns
        items={album}
        layout="rows"
        rowStep={1}
        onRowStepChange={onStep}
      />,
    );
    const g = grid(container);
    // It takes the page's zoom over the album only (and one finger is the page's).
    expect(g.style.touchAction).toBe("pan-y");
    const wheel = (deltaY: number) => {
      const e = new WheelEvent("wheel", {
        deltaY,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });
      g.dispatchEvent(e);
      return e;
    };
    const spread = wheel(-80);
    expect(spread.defaultPrevented).toBe(true);
    expect(onStep).toHaveBeenLastCalledWith(0);
    rerender(
      <MasonryColumns
        items={album}
        layout="rows"
        rowStep={0}
        onRowStepChange={onStep}
      />,
    );
    wheel(-400);
    // Already the largest: nothing further.
    expect(onStep).toHaveBeenCalledTimes(1);
    // A plain wheel is the page's scroll, never the album's zoom.
    const plain = new WheelEvent("wheel", {
      deltaY: 80,
      bubbles: true,
      cancelable: true,
    });
    g.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(false);
  });

  it("asks for nothing when the surface takes no step", () => {
    const { container } = render(
      <MasonryColumns items={album} layout="rows" rowStep={1} />,
    );
    const g = grid(container);
    expect(g.style.touchAction).toBe("");
    const e = new WheelEvent("wheel", {
      deltaY: -80,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    g.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });
});
