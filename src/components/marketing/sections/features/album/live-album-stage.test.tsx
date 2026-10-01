import { act, render } from "@testing-library/react";
import { useContext, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import {
  AlbumStreamTarget,
  type StreamTarget,
} from "@/components/shared/album-stream/album-stream";
import { marketingImage } from "@/lib/constants/marketing-media";
import {
  DEFAULT_ROW_STEP,
  layoutRows,
  perRowFor,
  reflowRows,
} from "@/lib/shared/album-rows";
import { ARRIVAL_GLOW_MS } from "@/lib/shared/arrival";

import { setReducedMotion } from "../../../../../../vitest.setup";

import {
  LiveAlbum,
  LiveAlbumStage,
  READY_AHEAD,
  stageBox,
  stillSizes,
  TILE_GAP,
} from "./live-album-stage";

/**
 * THE ALBUM THE STREAM FALLS INTO, as promises rather than a look.
 *
 *  1  IT IS THE TWELVE, NONE TWICE, whatever arrives and for however long: an
 *     arrival is taken from the album's own tail and put at its head, so the
 *     album never grows and never shows a still twice.
 *  2  IT TELLS THE STREAM WHAT COMES NEXT: its tail first, then the one above
 *     it, so the photograph that dissolves at the edge is the one whose row
 *     opens.
 *  3  AN ARRIVAL IS A GUEST'S ARRIVAL: at the head, lit by the grammar's own
 *     glow for its own two seconds, and let go.
 *  4  A TURN OF THE RING IS A PUSH, NOT A RE-LAY: at every width the stage is
 *     drawn at, the rows lay one arrival and one tail leaving as a local
 *     reflow, which is the only change they push rather than jump.
 *  5  IT IS A PICTURE: inert, hidden from assistive tech, nothing to press.
 *  6  EACH STILL IS SERVED AT ITS TILE'S SIZE (mkt-polish): the optimizer's
 *     widths and a `sizes` the rows' own tile bears out, where the stage
 *     decoded every whole source file into a third of its width.
 *
 * Function, never look: no class, size or colour is pinned here.
 */

/** jsdom has no IntersectionObserver; the halo's sampler and the album's
 *  in-view marks each want one to exist. */
class TestIO {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", TestIO);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The still a tile shows, read back off its photograph's address. */
const FILE_TO_STILL = new Map(
  STREAM_FRAMES.map((key, i) => [marketingImage(key).src, i]),
);
function tiles(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>("[data-media-id]")].map(
    (t) => ({
      id: t.getAttribute("data-media-id")!,
      arrived: t.hasAttribute("data-arrived"),
    }),
  );
}
/** The album's stills in order, off the stream's own end of it. */
function ring(target: StreamTarget) {
  return Array.from({ length: STREAM_FRAMES.length }, (_, k) =>
    target.upcoming(STREAM_FRAMES.length - 1 - k),
  );
}

/** Hands the test the stream's end of the album, as the stream reads it. */
function Grab({ onTarget }: { onTarget: (t: StreamTarget | null) => void }) {
  const target = useContext(AlbumStreamTarget);
  useEffect(() => {
    onTarget(target);
  }, [target, onTarget]);
  return null;
}

function mount() {
  let target: StreamTarget | null = null;
  const view = render(
    <LiveAlbum>
      <Grab onTarget={(t) => (target = t)} />
      <LiveAlbumStage />
    </LiveAlbum>,
  );
  if (!target) throw new Error("the album handed the stream nothing");
  return { ...view, target: target as StreamTarget };
}

describe("it is the twelve, none twice", () => {
  it("opens on the twelve stills, in order", () => {
    const { container, target } = mount();
    expect(tiles(container)).toHaveLength(STREAM_FRAMES.length);
    expect(ring(target)).toEqual(STREAM_FRAMES.map((_, i) => i));
    // And the photographs drawn are those twelve, none twice.
    const drawn = [...container.querySelectorAll("[data-media-id] img")].map(
      (img) => FILE_TO_STILL.get(img.getAttribute("src") ?? ""),
    );
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every((s) => s !== undefined)).toBe(true);
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  it("stands still, as it opens, with no album around it", () => {
    const { container } = render(<LiveAlbumStage />);
    expect(tiles(container)).toHaveLength(STREAM_FRAMES.length);
    expect(tiles(container).some((t) => t.arrived)).toBe(false);
  });

  it("takes each arrival at its head, from its tail, for as long as they come", () => {
    const { container, target } = mount();
    for (let k = 0; k < STREAM_FRAMES.length * 2 + 3; k++) {
      const tail = target.upcoming(0);
      act(() => target.arrive(tail));
      const now = ring(target);
      expect(now[0], `arrival ${k} is not at the head`).toBe(tail);
      expect(new Set(now).size).toBe(STREAM_FRAMES.length);
      expect(tiles(container)).toHaveLength(STREAM_FRAMES.length);
      expect(tiles(container)[0].id).toMatch(/arrival/);
    }
  });

  it("lets a stray still leave its own copy rather than show twice", () => {
    const { container, target } = mount();
    // Not the tail: what an interrupted stream could hand over.
    act(() => target.arrive(3));
    const now = ring(target);
    expect(now[0]).toBe(3);
    expect(new Set(now).size).toBe(STREAM_FRAMES.length);
    expect(tiles(container)).toHaveLength(STREAM_FRAMES.length);
  });
});

describe("it tells the stream what comes next", () => {
  it("answers with its tail first, then the one above it", () => {
    const { target } = mount();
    const last = STREAM_FRAMES.length - 1;
    expect(target.upcoming(0)).toBe(last);
    expect(target.upcoming(1)).toBe(last - 1);
    // Behind the next arrival is the album's head: what arrived last.
    expect(target.upcoming(-1)).toBe(0);
    act(() => target.arrive(last));
    expect(target.upcoming(0)).toBe(last - 1);
    expect(target.upcoming(-1)).toBe(last);
  });
});

describe("an arrival is a guest's arrival", () => {
  it("glows at the head for the grammar's own two seconds, and lets go", () => {
    vi.useFakeTimers();
    const { container, target } = mount();
    act(() => target.arrive(target.upcoming(0)));
    expect(tiles(container)[0].arrived).toBe(true);
    // Only the arrival glows: the album it joined does not.
    expect(tiles(container).filter((t) => t.arrived)).toHaveLength(1);
    act(() => vi.advanceTimersByTime(ARRIVAL_GLOW_MS + 10));
    expect(tiles(container).some((t) => t.arrived)).toBe(false);
  });

  it("rides the glow's life on the album's box, as a guest's album does", () => {
    const { container } = mount();
    const stage = container.querySelector<HTMLElement>(".alb-stage")!;
    expect(stage.style.getPropertyValue("--arrival-glow-ms")).toBe(
      `${ARRIVAL_GLOW_MS}ms`,
    );
  });
});

describe("each photograph is ready before its row opens", () => {
  /** Every still the album fetched into the document ahead of its arrival. */
  function readied() {
    const made = vi.spyOn(window, "Image");
    return () =>
      made.mock.results.map(({ value }) =>
        FILE_TO_STILL.get(
          (value as HTMLImageElement).getAttribute("src") ?? "",
        ),
      );
  }

  it("fetches the stills it takes next, and each new one as the tail moves", () => {
    const got = readied();
    const { target } = mount();
    const last = STREAM_FRAMES.length - 1;
    // Its tail first: the photographs the next arrivals will open rows for.
    expect(got()).toEqual(
      Array.from({ length: READY_AHEAD }, (_, k) => last - k),
    );
    act(() => target.arrive(target.upcoming(0)));
    // One arrival later, the one newly that far from the tail, and no other.
    expect(got()).toHaveLength(READY_AHEAD + 1);
    expect(got().at(-1)).toBe(last - READY_AHEAD);
  });

  it("fetches nothing ahead for a reader who asked for less motion", () => {
    setReducedMotion(true);
    try {
      const got = readied();
      mount();
      expect(got()).toEqual([]);
    } finally {
      setReducedMotion(false);
    }
  });
});

describe("a turn of the ring is a push, not a re-lay", () => {
  it.each([
    [320, 2],
    [600, 3],
    [870, 3],
  ])(
    "lays an arrival and the tail leaving as one local reflow at %i px",
    (width, perRow) => {
      const still = (i: number) => {
        const img = marketingImage(STREAM_FRAMES[i]);
        return img.width / img.height;
      };
      let album = STREAM_FRAMES.map((_, i) => ({ id: `s${i}`, photo: i }));
      const items = () =>
        album.map((s) => ({ id: s.id, ratio: still(s.photo) }));
      let layout = reflowRows(null, items(), { width, gap: 8, perRow }).layout;
      for (let n = 0; n < STREAM_FRAMES.length + 2; n++) {
        const tail = album[album.length - 1];
        album = [{ id: `a${n}`, photo: tail.photo }, ...album.slice(0, -1)];
        const r = reflowRows(layout, items(), { width, gap: 8, perRow });
        expect(r.kind, `arrival ${n} at ${width} re-laid the album`).toBe(
          "local",
        );
        layout = r.layout;
      }
    },
  );
});

describe("it is a picture", () => {
  it("is inert and hidden from assistive technology", () => {
    const { container } = mount();
    const stage = container.querySelector(".alb-stage")!;
    expect(stage.hasAttribute("inert")).toBe(true);
    expect(stage.getAttribute("aria-hidden")).toBe("true");
  });
});

/** What a `sizes` list says at a viewport, for the shapes `stillSizes` writes: a px or a calc on the viewport. */
function sizeAt(sizes: string, viewport: number): number {
  for (const entry of sizes.split(/,\s*(?=\(|calc|\d)/)) {
    const m = /^(?:\(min-width: (\d+)px\) )?(.+)$/.exec(entry.trim())!;
    if (m[1] && viewport < Number(m[1])) continue;
    const value = m[2];
    const px = /^(\d+)px$/.exec(value);
    if (px) return Number(px[1]);
    const calc = /^calc\(\(100vw - (\d+)px\) \* ([\d.]+)\)$/.exec(value);
    if (calc) return (viewport - Number(calc[1])) * Number(calc[2]);
    throw new Error(`unread sizes entry: ${entry}`);
  }
  throw new Error(`no sizes entry answers ${viewport}`);
}

describe("each still is served at its tile's size", () => {
  it("draws every tile from the optimizer's widths of its own still, picked by its slot", () => {
    const { container } = mount();
    const imgs = [...container.querySelectorAll("[data-media-id] img")];
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) {
      const src = img.getAttribute("src") ?? "";
      const srcset = img.getAttribute("srcset") ?? "";
      // Sized derivatives of this very still, several widths of it.
      expect(srcset, src).toContain(`url=${encodeURIComponent(src)}`);
      expect(srcset.split(", ").length, src).toBeGreaterThan(4);
      expect(img.getAttribute("sizes"), src).toBeTruthy();
    }
  });

  it("matches the box the page lays the stage in (measured at 375, 640, 900 and 1440)", () => {
    expect(stageBox(375)).toBe(317);
    expect(stageBox(640)).toBe(566);
    expect(stageBox(900)).toBe(826);
    expect(stageBox(1440)).toBe(870);
  });

  it.each([375, 414, 480, 560, 640, 768, 900, 1024, 1440])(
    "says, at %i px, the width the rows really lay each still at",
    (viewport) => {
      const box = stageBox(viewport);
      const ratioOf = (i: number) => {
        const img = marketingImage(STREAM_FRAMES[i]);
        return img.width / img.height;
      };
      const layout = layoutRows(
        STREAM_FRAMES.map((_, i) => ({ id: String(i), ratio: ratioOf(i) })),
        { width: box, gap: TILE_GAP, perRow: perRowFor(box, DEFAULT_ROW_STEP) },
      );
      for (const row of layout.rows) {
        row.ids.forEach((id, k) => {
          const laid = row.widths[k];
          const said = sizeAt(stillSizes(ratioOf(Number(id))), viewport);
          // A row stretched off its target lays a tile a little off its share; the optimizer's
          // widths are coarser than that. Never a slot twice the size it says, or half of it.
          expect(laid / said, `still ${id} at ${viewport}`).toBeGreaterThan(
            0.7,
          );
          expect(laid / said, `still ${id} at ${viewport}`).toBeLessThan(1.35);
        });
      }
    },
  );
});
