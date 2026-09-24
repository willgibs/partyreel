// @contract-for: src/components/shared/album-stream/album-stream.tsx

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AlbumStream } from "./album-stream";
import { STAGE, STREAMS, VARIANTS } from "./stream-engine";

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
 *     empty hero. Will ruled that on the album hero's round three
 *     (`no-script=settled`), and it only holds because the engine is pure and
 *     the rest state is server HTML (bible 5).
 *  2  IT IS PURE ATMOSPHERE. A screen reader hears the page's words, never two
 *     dozen photographs from other people's events; a keyboard walks straight
 *     past it; it adds no door of its own.
 *  3  THE WIDTH IS NEVER READ. Both compositions are in the markup and a media
 *     query shows one, so the server and the browser render the same tree and
 *     no layout is measured anywhere: not on mount, not on resize, not in a
 *     frame.
 *  4  THE ALBUM'S EDGE IS THE ENGINE'S NUMBER. The layer anchors itself on
 *     `STAGE`, the same table the stage draws the album from, so the
 *     photographs land on the edge that is really there.
 *  5  REDUCED MOTION STARTS NO LOOP AT ALL.
 *
 * Function, never look: no class name that carries a look, no duration, no
 * alpha and no photograph is pinned here.
 */

let queue: FrameRequestCallback[] = [];
let reduced = false;

/** jsdom has no IntersectionObserver; `useAmbientPause` needs one to exist. */
class TestIO {
  constructor(
    public cb: IntersectionObserverCallback,
    public options: IntersectionObserverInit = {},
  ) {}
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reduced : false,
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

describe("the variations", () => {
  it("draws each one, and each one differently", () => {
    const seen = new Set<string>();
    for (const variant of VARIANTS) {
      const { container } = render(<AlbumStream variant={variant} />);
      const first = container
        .querySelector(".als-at-lg .als-card")
        ?.getAttribute("style");
      expect(first).toBeTruthy();
      expect(seen.has(first!)).toBe(false);
      seen.add(first!);
    }
  });

  it("puts as many nodes on the page as the engine solved", () => {
    for (const variant of VARIANTS) {
      const { container } = render(<AlbumStream variant={variant} />);
      expect(container.querySelectorAll(".als-at-lg .als-card").length).toBe(
        STREAMS[variant].lg.cards.length,
      );
    }
  });
});
