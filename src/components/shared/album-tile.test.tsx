/**
 * THE MEMOIZED TILE'S CONTRACT (the album-window lane). What is held is WORK,
 * counted through the grid's own render probe (`setAlbumRenderProbe`, the one
 * the scale page reads on a production build): a like re-renders one
 * photograph's marks and no tile, a progress tick and a quiet poll re-render
 * nothing, a real change re-renders exactly its tile. And the one delegated
 * click and long-press that make it possible still answer every control, with
 * the latest props, and never a stale closure.
 *
 * The look is not held here; two stylesheet contracts are, because a rule that
 * lives only in CSS (the desk row not drawn at rest, the shimmer only in view,
 * the push keyed on the rows' own attribute) is invisible to jsdom otherwise.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Download, EyeOff, Heart } from "lucide-react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { GridMedia } from "@/components/app/media-grid";
import { useLikeAction } from "@/components/likes/like-button";
import {
  LocalLikesProvider,
  useLikes,
} from "@/components/likes/likes-provider";
import { setAlbumRenderProbe } from "@/components/shared/album-tile-probe";
import { MasonryColumns, type TileAction } from "@/components/shared/masonry";

vi.mock("@/components/shared/media-lightbox.lazy", () => ({
  MediaLightboxLazy: ({ index }: { index: number | null }) =>
    index === null ? null : <div data-testid="viewer">open {index}</div>,
  preloadMediaLightbox: () => {},
}));

const album: GridMedia[] = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i}`,
  type: i === 4 ? "video" : "photo",
  url: `/p${i}.jpg?sig=a`,
  previewUrl: `/p${i}.webp?sig=a`,
  downloadUrl: `/p${i}.jpg?dl=1`,
  width: [3, 4, 3, 16, 1][i % 5] * 100,
  height: [4, 3, 2, 9, 1][i % 5] * 100,
}));

/** Every render the probe sees, by kind and photograph. */
function counting() {
  const seen: { kind: string; id: string }[] = [];
  setAlbumRenderProbe((kind, id) => seen.push({ kind, id }));
  return {
    reset: () => seen.splice(0),
    tiles: () => seen.filter((s) => s.kind === "tile").length,
    marks: () => seen.filter((s) => s.kind === "mark").length,
    ids: () => new Set(seen.map((s) => s.id)),
  };
}

afterEach(() => {
  setAlbumRenderProbe(null);
  // Opening a photograph writes `?photo=` into the address, and a grid reads it
  // on mount: a pin must not open the next pin's viewer.
  window.history.replaceState(null, "", "/");
});

/** The guest album's shape, rebuilt every render the way a surface does: a new row function, a new prefix. */
function Surface({
  items,
  layout,
  tick = 0,
  onLike,
}: {
  items: GridMedia[];
  layout: "masonry" | "rows";
  tick?: number;
  onLike?: (toggle: (id: string) => void) => void;
}) {
  const likeAction = useLikeAction();
  const likes = useLikes();
  onLike?.((id) => likes?.toggle(id));
  return (
    <MasonryColumns
      items={items}
      layout={layout}
      stagger
      photoAddress={false}
      tileActions={(item) => {
        const out: TileAction[] = [];
        const like = likeAction(item);
        if (like) out.push(like);
        out.push({
          id: "save",
          label: "Save",
          icon: Download,
          tone: "save",
          href: item.downloadUrl,
        });
        return out;
      }}
      prefix={
        <div data-testid="in-flight" data-progress={tick}>
          {tick}%
        </div>
      }
    />
  );
}

describe.each(["masonry", "rows"] as const)(
  "the memoized tile, in %s",
  (layout) => {
    // The rows are windowed: a view tall enough to mount every row of the album.
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

    it("renders every tile once to mount it", () => {
      const probe = counting();
      render(
        <LocalLikesProvider>
          <Surface items={album} layout={layout} />
        </LocalLikesProvider>,
      );
      expect(probe.tiles()).toBeGreaterThanOrEqual(album.length);
    });

    it("re-renders one photograph's marks for a like, and no tile at all", () => {
      let toggle: (id: string) => void = () => {};
      render(
        <LocalLikesProvider>
          <Surface items={album} layout={layout} onLike={(t) => (toggle = t)} />
        </LocalLikesProvider>,
      );
      const probe = counting();
      act(() => toggle("p3"));
      expect(probe.tiles()).toBe(0);
      // The heart mark and the like glyph of that one photograph.
      expect(probe.marks()).toBeGreaterThan(0);
      expect([...probe.ids()]).toEqual(["p3"]);
      expect(
        document.querySelector('[data-media-id="p3"] [data-tile-mark="like"]'),
      ).not.toBeNull();
    });

    it("re-renders no tile for a progress tick of the in-flight tile", () => {
      const { rerender } = render(
        <LocalLikesProvider>
          <Surface items={album} layout={layout} tick={1} />
        </LocalLikesProvider>,
      );
      const probe = counting();
      for (let t = 2; t < 6; t++)
        rerender(
          <LocalLikesProvider>
            <Surface items={album} layout={layout} tick={t} />
          </LocalLikesProvider>,
        );
      expect(screen.getByTestId("in-flight")).toHaveAttribute(
        "data-progress",
        "5",
      );
      expect(probe.tiles()).toBe(0);
      expect(probe.marks()).toBe(0);
    });

    it("re-renders no tile for a poll that changed nothing: equal photographs, new objects", () => {
      const { rerender } = render(
        <LocalLikesProvider>
          <Surface items={album} layout={layout} />
        </LocalLikesProvider>,
      );
      const probe = counting();
      rerender(
        <LocalLikesProvider>
          <Surface items={album.map((m) => ({ ...m }))} layout={layout} />
        </LocalLikesProvider>,
      );
      expect(probe.tiles()).toBe(0);
    });

    it("re-renders exactly the tile whose photograph changed", () => {
      const { rerender } = render(
        <LocalLikesProvider>
          <Surface items={album} layout={layout} />
        </LocalLikesProvider>,
      );
      const probe = counting();
      rerender(
        <LocalLikesProvider>
          <Surface
            items={album.map((m) =>
              m.id === "p7" ? { ...m, likeCount: 3 } : m,
            )}
            layout={layout}
          />
        </LocalLikesProvider>,
      );
      expect(probe.tiles()).toBe(1);
      expect([...probe.ids()]).toEqual(["p7"]);
    });

    it("keeps a mounted photograph's src across a link rollover, and takes the new link on an error", () => {
      const { rerender, container } = render(
        <LocalLikesProvider>
          <Surface items={album} layout={layout} />
        </LocalLikesProvider>,
      );
      const img = () =>
        container.querySelector<HTMLImageElement>('[data-media-id="p2"] img')!;
      const node = img();
      expect(node.getAttribute("src")).toBe("/p2.webp?sig=a");
      const rolled = album.map((m) => ({
        ...m,
        url: m.url.replace("sig=a", "sig=b"),
        previewUrl: m.previewUrl!.replace("sig=a", "sig=b"),
      }));
      rerender(
        <LocalLikesProvider>
          <Surface items={rolled} layout={layout} />
        </LocalLikesProvider>,
      );
      // The same element, the same photograph, not fetched again.
      expect(img()).toBe(node);
      expect(img().getAttribute("src")).toBe("/p2.webp?sig=a");
      // The old signature expires: the fresh link, for the same photograph.
      fireEvent.error(img());
      expect(img().getAttribute("src")).toBe("/p2.webp?sig=b");
      // The preview itself broken: the original.
      fireEvent.error(img());
      expect(img().getAttribute("src")).toBe("/p2.jpg?sig=b");
    });

    it("fetches the first row first, and decodes every photograph off the main thread", () => {
      const { container } = render(
        <LocalLikesProvider>
          <Surface items={album} layout={layout} />
        </LocalLikesProvider>,
      );
      const imgs = [
        ...container.querySelectorAll<HTMLImageElement>(
          "[data-media-tile][data-media-id] img",
        ),
      ];
      const eager = imgs.filter((i) => i.getAttribute("loading") === "eager");
      expect(eager.length).toBeGreaterThan(0);
      expect(eager.length).toBeLessThan(imgs.length);
      for (const i of eager)
        expect(i.getAttribute("fetchpriority")).toBe("high");
      for (const i of imgs) expect(i.getAttribute("decoding")).toBe("async");
      // The first photograph of the album is always among them.
      expect(
        container
          .querySelector('[data-media-id="p0"] img')!
          .getAttribute("loading"),
      ).toBe("eager");
    });
  },
);

describe("one delegated click answers every control, from the latest props", () => {
  it("runs a verb's LATEST onSelect, never the closure it mounted with", () => {
    const calls: string[] = [];
    const row =
      (tag: string) =>
      (item: GridMedia): readonly TileAction[] => [
        {
          id: "hide",
          label: "Hide",
          icon: EyeOff,
          onSelect: () => calls.push(`${tag}:${item.id}`),
        },
      ];
    const { rerender, container } = render(
      <MasonryColumns items={album} tileActions={row("first")} />,
    );
    rerender(<MasonryColumns items={album} tileActions={row("second")} />);
    fireEvent.click(
      container.querySelector(
        '[data-media-id="p1"] [data-tile-action="hide"]',
      )!,
    );
    expect(calls).toEqual(["second:p1"]);
    // A verb never opens the viewer under it.
    expect(screen.queryByTestId("viewer")).toBeNull();
  });

  it("lets a link verb save by itself, without opening the viewer", () => {
    const { container } = render(
      <MasonryColumns
        items={album}
        tileActions={(item) => [
          {
            id: "save",
            label: "Save",
            icon: Download,
            href: item.downloadUrl,
          },
        ]}
      />,
    );
    const link = container.querySelector<HTMLAnchorElement>(
      '[data-media-id="p0"] a[data-tile-action="save"]',
    )!;
    expect(link).toHaveAttribute("download");
    fireEvent.click(link);
    expect(screen.queryByTestId("viewer")).toBeNull();
  });

  it("toggles the like from the glyph, and the glyph shows it", () => {
    function Row() {
      const like = useLikeAction();
      return (
        <MasonryColumns items={album} tileActions={(item) => [like(item)!]} />
      );
    }
    const { container } = render(
      <LocalLikesProvider>
        <Row />
      </LocalLikesProvider>,
    );
    const glyph = () =>
      container.querySelector<HTMLButtonElement>(
        '[data-media-id="p5"] [data-tile-action="like"]',
      )!;
    expect(glyph()).toHaveAttribute("aria-label", "Like");
    fireEvent.click(glyph());
    expect(glyph()).toHaveAttribute("aria-label", "Unlike");
    expect(glyph().querySelector("svg.lucide-heart")).not.toBeNull();
    expect(
      container.querySelector('[data-media-id="p5"] [data-tile-mark="like"]'),
    ).not.toBeNull();
  });

  it("opens the viewer on the tile's photograph", () => {
    render(<MasonryColumns items={album} />);
    fireEvent.click(screen.getAllByLabelText("View photo")[2]);
    expect(screen.getByTestId("viewer")).toHaveTextContent("open 2");
  });

  it("holds a press to enter select mode, and swallows the click that follows", () => {
    vi.useFakeTimers();
    try {
      const onLong = vi.fn();
      render(<MasonryColumns items={album} onTileLongPress={onLong} />);
      const open = screen.getAllByLabelText("View photo")[1];
      fireEvent.pointerDown(open, { pointerType: "touch", button: 0 });
      act(() => vi.advanceTimersByTime(500));
      fireEvent.pointerUp(open);
      fireEvent.click(open);
      expect(onLong).toHaveBeenCalledWith("p1");
      expect(screen.queryByTestId("viewer")).toBeNull();
      // A plain tap still opens.
      fireEvent.click(open);
      expect(screen.getByTestId("viewer")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("select mode runs on the one grid", () => {
  function Selecting() {
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
    return (
      <MasonryColumns
        items={album}
        tileActions={() => [{ id: "save", label: "Save", icon: Heart }]}
        selection={{
          selected,
          onToggle: (id) =>
            setSelected((s) => {
              const next = new Set(s);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            }),
          exiting: new Set(["p9"]),
        }}
      />
    );
  }

  it("makes every tile a toggle wearing the selection's marks, never the viewer", () => {
    const { container } = render(<Selecting />);
    // No desk row and no viewer while selecting: the tile is the control.
    expect(container.querySelector("[data-tile-actions]")).toBeNull();
    const tile = () =>
      container.querySelector<HTMLElement>('[data-media-id="p3"]')!;
    const toggle = () =>
      tile().querySelector<HTMLButtonElement>("[data-tile-open]")!;
    expect(toggle()).toHaveAttribute("aria-label", "Select");
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-label", "Deselect");
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(tile().hasAttribute("data-selected")).toBe(true);
    expect(tile().querySelector("[data-check-pop]")).not.toBeNull();
    expect(screen.queryByTestId("viewer")).toBeNull();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    // The removal beat rides the tile.
    expect(
      container
        .querySelector('[data-media-id="p9"]')!
        .hasAttribute("data-exiting"),
    ).toBe(true);
  });
});

describe("the shimmer runs only where someone can see it", () => {
  it("writes data-inview from one observer, and nothing re-renders to learn it", () => {
    const observed: Element[] = [];
    let fire: ((entries: IntersectionObserverEntry[]) => void) | null = null;
    class IO {
      constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
        fire = cb;
      }
      observe = (el: Element) => observed.push(el);
      unobserve = () => {};
      disconnect = () => {};
    }
    vi.stubGlobal("IntersectionObserver", IO);
    try {
      const probe = counting();
      const { container } = render(<MasonryColumns items={album} />);
      expect(observed).toHaveLength(album.length);
      probe.reset();
      const tile = container.querySelector('[data-media-id="p0"]')!;
      act(() =>
        fire!([
          { target: tile, isIntersecting: true } as IntersectionObserverEntry,
        ]),
      );
      expect(tile.hasAttribute("data-inview")).toBe(true);
      act(() =>
        fire!([
          { target: tile, isIntersecting: false } as IntersectionObserverEntry,
        ]),
      );
      expect(tile.hasAttribute("data-inview")).toBe(false);
      expect(probe.tiles()).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("the sheets say what jsdom cannot see", () => {
  const sheet = (name: string) =>
    readFileSync(join(__dirname, name), "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );

  it("does not draw the desk row at rest, and never below md", () => {
    const css = sheet("album-tile.css");
    // At rest: not drawn at all (a zero width still composited one blur a tile).
    expect(css).toMatch(/\[data-tile-actions\]\s*\{[^}]*display:\s*none/);
    // It shows only inside the md query, on hover or the keyboard's focus.
    const shows = [
      ...css.matchAll(/@media \(min-width: 768px\)\s*\{([\s\S]*?)\n\}/g),
    ];
    expect(shows.some((m) => /display:\s*flex/.test(m[1]))).toBe(true);
    expect(css).toMatch(/\[data-media-tile\]:hover \[data-tile-actions\]/);
    expect(css).toMatch(/\[data-kbd-focus\] \[data-tile-actions\]/);
    // Nothing outside a query ever displays it.
    const outside = css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, "");
    expect(outside).not.toMatch(/display:\s*flex/);
    // Still slides open, and holds for its exit.
    expect(css).toMatch(/@starting-style/);
    expect(css).toMatch(/display 220ms allow-discrete/);
  });

  it("runs the tiles' shimmer only in view, after a beat, and never with reduced motion", () => {
    const css = sheet("album-tile.css");
    expect(css).toMatch(
      /\[data-media-tile\]\[data-media-id\] \[data-slot="skeleton"\]\s*\{\s*animation-name:\s*none/,
    );
    const on = css.match(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\[data-media-tile\]\[data-media-id\]\[data-inview\] \[data-slot="skeleton"\]\s*\{([^}]*)\}/,
    );
    expect(on).not.toBeNull();
    expect(on![1]).toMatch(/animation-name:\s*shimmer/);
    expect(on![1]).toMatch(/animation-delay:\s*\d+ms/);
  });

  it("keys the push on the rows' own attribute, and only with motion allowed", () => {
    const css = sheet("arrival.css");
    const push = css.match(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\[data-album-layout="rows"\] \[data-media-tile\]\[data-entering\]\s*\{([^}]*)\}/,
    );
    expect(push).not.toBeNull();
    expect(push![1]).toMatch(/transition:\s*none/);
    expect(push![1]).toMatch(
      /animation:\s*pr-arrival-push var\(--arrival-glide-ms/,
    );
    expect(css).toMatch(
      /@keyframes pr-arrival-push[\s\S]*clip-path:\s*inset\(0 100% 0 0\)/,
    );
  });
});
