import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";

import {
  AlbumStream,
  AlbumStreamTarget,
  type StreamTarget,
} from "./album-stream";
import { type Bp, mod, nextArrival, STAGE, STREAM } from "./stream-engine";

/**
 * THE STREAM'S LAYER, as a set of promises rather than a look.
 *
 * What this guards, whatever the Higgsfield month puts in the pool and however
 * the composition is retuned:
 *
 *  1  IT SAYS SOMETHING WHEN NOTHING CAN MOVE. Every frame carries its
 *     elapsed-0 transform and opacity as custom properties the sheet paints, so
 *     a crawler, a throttled tab, a reader with scripting off and a reader who
 *     asked for less motion all get the SETTLED composition rather than an
 *     empty hero. This was set on the album hero's round three
 *     (`no-script=settled`), and it only holds because the engine is pure and
 *     the rest state is server HTML.
 *  2  IT IS PURE ATMOSPHERE. A screen reader hears the page's words, never two
 *     dozen photographs from other people's events; a keyboard walks straight
 *     past it; it adds no door of its own.
 *  3  THE WIDTH IS NEVER READ. Both compositions are in the markup and a media
 *     query shows one, so the server and the browser render the same tree and
 *     no layout is measured anywhere: not on mount, not on resize, not in a
 *     frame.
 *  4  THE ALBUM'S EDGE IS THE ENGINE'S NUMBER. The layer anchors itself on
 *     `STAGE`, the same table the stage draws the album from, so the
 *     photographs dissolve on the edge that is really there.
 *  5  REDUCED MOTION STARTS NO LOOP AT ALL, and so hands nothing over.
 *  6  THE PUSH: each photograph is handed to the album it falls into, once,
 *     by the composition on screen only, and is the still the album said it
 *     would take; a held clock hands over nothing.
 *
 * ★ RESHAPED WITH THE PICK. "The variations" (each one drawn, each one
 * differently) left with the board's four; the node count is the one
 * composition's now, and 6 is new.
 *
 * Function, never look: no class name that carries a look, no duration, no
 * alpha and no photograph is pinned here.
 */

let queue: FrameRequestCallback[] = [];
let reduced = false;
/** `(min-width: 1280px)`: which composition the sheet shows. */
let wide = false;
/** Whether the observer reports the layer in view (the ambient pause). */
let seen = false;

/** jsdom has no IntersectionObserver; `useAmbientPause` needs one to exist,
 *  and this one reports every layer in view when the test says so. */
class TestIO {
  constructor(
    public cb: IntersectionObserverCallback,
    public options: IntersectionObserverInit = {},
  ) {}
  observe = (el: Element) => {
    if (!seen) return;
    queueMicrotask(() =>
      this.cb(
        [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ),
    );
  };
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion")
        ? reduced
        : query.includes("min-width")
          ? wide
          : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  queue = [];
  reduced = false;
  wide = false;
  seen = false;
  stubMatchMedia();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("IntersectionObserver", TestIO);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * THE ALBUM, AS A STAND-IN: the stage's ring of the twelve (tail first, each
 * arrival taken from the tail and put at the head), with every arrival and
 * whether it was the tail it should have been.
 */
function album() {
  let ring = STREAM_FRAMES.map((_, i) => i);
  const got: { photo: number; wasTail: boolean }[] = [];
  const target: StreamTarget = {
    upcoming: (ahead) => ring[mod(ring.length - 1 - ahead, ring.length)],
    arrive: (photo) => {
      got.push({ photo, wasTail: photo === ring[ring.length - 1] });
      ring = [photo, ...ring.filter((p) => p !== photo)];
    },
  };
  return { target, got, ring: () => ring };
}

/** Let the observer report, then run the loop for `ms` at 50 ms a frame. */
async function run(ms: number) {
  await act(async () => {
    await Promise.resolve();
  });
  let now = 1000;
  for (let t = 0; t <= ms; t += 50) {
    const cbs = queue;
    queue = [];
    act(() => {
      for (const cb of cbs) cb(now);
    });
    now += 50;
  }
}

describe("it says something when nothing can move", () => {
  it("renders every frame with its resting transform and opacity", () => {
    const { container } = render(<AlbumStream />);
    const cards = [...container.querySelectorAll(".als-card")];
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      const style = card.getAttribute("style") ?? "";
      expect(style).toContain("--als-rest");
      expect(style).toContain("--als-rest-o");
    }
  });

  it("puts a photograph in the markup for every frame", () => {
    const { container } = render(<AlbumStream />);
    const cards = container.querySelectorAll(".als-card");
    const images = container.querySelectorAll("img");
    expect(images.length).toBe(cards.length);
  });

  it("starts no loop at all under reduced motion", () => {
    reduced = true;
    seen = true;
    render(<AlbumStream />);
    // Not one frame requested: the sheet's rest state is simply left standing.
    expect(queue.length).toBe(0);
  });
});

describe("it is pure atmosphere", () => {
  it("hides itself from the accessibility tree", () => {
    const { container } = render(<AlbumStream />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("puts nothing focusable on the page", () => {
    const { container } = render(<AlbumStream />);
    expect(
      container.querySelectorAll("a, button, input, [tabindex]").length,
    ).toBe(0);
  });

  it("gives every photograph an empty alt", () => {
    const { container } = render(<AlbumStream />);
    for (const img of container.querySelectorAll("img"))
      expect(img.getAttribute("alt")).toBe("");
  });
});

describe("the width is never read", () => {
  it("renders both compositions and lets the sheet choose", () => {
    const { container } = render(<AlbumStream />);
    expect(container.querySelector(".als-at-lg")).not.toBeNull();
    expect(container.querySelector(".als-at-base")).not.toBeNull();
  });

  it("measures nothing on mount", () => {
    const rect = vi.spyOn(Element.prototype, "getBoundingClientRect");
    render(<AlbumStream />);
    expect(rect).not.toHaveBeenCalled();
    rect.mockRestore();
  });

  it("puts as many nodes on the page as the engine solved", () => {
    const { container } = render(<AlbumStream />);
    for (const at of ["lg", "base"] as const)
      expect(container.querySelectorAll(`.als-at-${at} .als-card`).length).toBe(
        STREAM[at].cards.length,
      );
  });
});

describe("the album's edge is the engine's number", () => {
  it("anchors each layer on the stage's own height and floor", () => {
    const { container } = render(<AlbumStream />);
    for (const at of ["lg", "base"] as const) {
      const layer = container.querySelector(`.als-at-${at}`);
      expect(layer?.getAttribute("style")).toContain(
        `${STAGE[at].h + STAGE[at].floor}px`,
      );
    }
  });
});

describe("the push", () => {
  it.each([
    ["base", false],
    ["lg", true],
  ] as const)(
    "hands the %s composition's photographs to the album, each its tail, from the one on screen",
    async (bp: Bp, isWide) => {
      wide = isWide;
      seen = true;
      const a = album();
      render(
        <AlbumStreamTarget.Provider value={a.target}>
          <AlbumStream />
        </AlbumStreamTarget.Provider>,
      );
      const ms = 8000;
      await run(ms);
      // Exactly the arrivals the engine says fall in that time, from the
      // shown layer alone: the hidden one runs too (the observer here says
      // both are in view) and must hand over nothing.
      const f = STREAM[bp];
      expect(a.got.length).toBe(nextArrival(f, ms) - nextArrival(f, 0));
      expect(a.got.length).toBeGreaterThan(2);
      // Each was the still the album said it would take next.
      expect(a.got.every((g) => g.wasTail)).toBe(true);
      expect(new Set(a.ring()).size).toBe(STREAM_FRAMES.length);
    },
  );

  it("hands nothing over while its clock is held", async () => {
    seen = false;
    const a = album();
    render(
      <AlbumStreamTarget.Provider value={a.target}>
        <AlbumStream />
      </AlbumStreamTarget.Provider>,
    );
    await run(8000);
    expect(a.got).toEqual([]);
  });

  it("hands nothing over under reduced motion", async () => {
    reduced = true;
    seen = true;
    const a = album();
    render(
      <AlbumStreamTarget.Provider value={a.target}>
        <AlbumStream />
      </AlbumStreamTarget.Provider>,
    );
    await run(8000);
    expect(a.got).toEqual([]);
  });

  it("dresses its frames as the album says, and hands over what they wear", async () => {
    seen = true;
    const still = 7;
    const got: number[] = [];
    const target: StreamTarget = {
      upcoming: () => still,
      arrive: (photo) => got.push(photo),
    };
    const { container } = render(
      <AlbumStreamTarget.Provider value={target}>
        <AlbumStream />
      </AlbumStreamTarget.Provider>,
    );
    for (const img of container.querySelectorAll("img"))
      expect(decodeURIComponent(img.getAttribute("src") ?? "")).toContain(
        STREAM_FRAMES[still],
      );
    await run(6000);
    expect(got.length).toBeGreaterThan(0);
    expect(new Set(got)).toEqual(new Set([still]));
  });
});
