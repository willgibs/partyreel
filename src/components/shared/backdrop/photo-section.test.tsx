// @contract-for: src/components/shared/backdrop/photo-section.tsx

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoSection } from "./photo-section";
import { bandIndex, stepIndex } from "./backdrop-engine";
import { ROOM_FRAMES, SCROLL_STEPS } from "./room-frames";

/**
 * THE PHOTOGRAPH SECTION, as a set of promises rather than a look.
 *
 * What this guards is what may never break whichever photographs the Higgsfield
 * month puts in the pool and however the plate is retuned:
 *
 *  1  it is PURE ATMOSPHERE. A screen reader hears the copy and never six
 *     photographs from other people's events; a keyboard walks straight past
 *     the backdrop; the section adds no door of its own.
 *  2  it SAYS SOMETHING WHEN NOTHING CAN MOVE. Every photograph is in the first
 *     paint and the sheet stands the section on the first of them, so a reader
 *     with scripting off, a reader who asked for less motion and a crawler all
 *     get a room rather than a black box (bible 5).
 *  3  it COSTS NOTHING WHEN NOBODY IS MOVING. No frame loop off screen, none
 *     under reduced motion, and none once a photograph has landed and the
 *     reader has stopped: the case Will asked the phone rule for, where someone
 *     stops scrolling to read.
 *  4  THE TWO READERS GET THE TWO RULES. A cursor scrubs the whole pool by
 *     position and lights the rail; a reader without one passes the ruled
 *     number of photographs at scroll steps, with no tap anywhere and not one
 *     layout read.
 *
 * Function, never look: no class name, no copy, no duration, no alpha and no
 * photograph is pinned here.
 */

/* ── the machinery jsdom does not have ─────────────────────────────────── */

type Entry = Partial<IntersectionObserverEntry> & { target: Element };

class TestIO {
  static instances: TestIO[] = [];
  cb: IntersectionObserverCallback;
  options: IntersectionObserverInit;
  targets: Element[] = [];
  constructor(
    cb: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.cb = cb;
    this.options = options;
    TestIO.instances.push(this);
  }
  observe = (el: Element) => {
    this.targets.push(el);
  };
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  fire(entries: Entry[]) {
    act(() => {
      this.cb(
        entries as IntersectionObserverEntry[],
        this as unknown as IntersectionObserver,
      );
    });
  }
}

/** The screen gate observes the room itself; the trip wires do not. */
const screenGate = () =>
  TestIO.instances.find((o) => o.options.rootMargin === "120px");
/** The wire observer squeezes its root to a band across the middle of the
 *  screen; the screen gate is the only other observer, and it grows its root. */
const wireGate = () =>
  TestIO.instances.find((o) => o.options.rootMargin?.startsWith("-"));

/**
 * One wire passing through the reading band, the way a scroll delivers it: the
 * wire reports in, and whatever was in the band reports out. The rect is what
 * the observer reads to break a tie, so it comes with the entry.
 */
const crossing = (c: HTMLElement, k: number, top = 380) => [
  ...[...c.querySelectorAll("[data-bkd-wire]")]
    .filter((w) => w !== wireOf(c, k))
    .map((target) => ({ target, isIntersecting: false })),
  {
    target: wireOf(c, k),
    isIntersecting: true,
    boundingClientRect: { top } as DOMRectReadOnly,
  },
];

let queue: FrameRequestCallback[] = [];
let clock = 0;
let asked = 0;

/** Run every pending frame, `ms` later. Returns how many were pending. */
function flush(ms = 1000 / 60) {
  clock += ms;
  const pending = queue;
  queue = [];
  act(() => {
    for (const cb of pending) cb(clock);
  });
  return pending.length;
}

/** Run frames until the section stops asking for them (or give up). */
function settle(limit = 200) {
  let frames = 0;
  for (let i = 0; i < limit && queue.length; i++) frames += flush();
  return frames;
}

let finePointer = false;
let reducedMotion = false;

/** The two capability queries the component asks, both answerable per test. */
function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion")
        ? reducedMotion
        : query.includes("hover")
          ? finePointer
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

const rect = vi.spyOn(Element.prototype, "getBoundingClientRect");

beforeEach(() => {
  TestIO.instances = [];
  queue = [];
  clock = 0;
  asked = 0;
  finePointer = false;
  reducedMotion = false;
  stubMatchMedia();
  rect.mockClear();
  vi.stubGlobal("IntersectionObserver", TestIO);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    asked += 1;
    queue.push(cb);
    return queue.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    queue = [];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The room, on screen, with a frame of reference the pointer can be read in. */
function enter(el: Element, width = 1200) {
  screenGate()!.fire([
    {
      target: el,
      isIntersecting: true,
      boundingClientRect: { left: 0, width } as DOMRectReadOnly,
    },
  ]);
}

const room = (c: HTMLElement) => c.firstElementChild as HTMLElement;
/** The photographs, in pool order; the loop writes visibility onto these. */
const framesOf = (c: HTMLElement) => [
  ...c.querySelectorAll<HTMLElement>(".bkd-frame"),
];
/**
 * Which photograph the section is standing on. The loop writes `visibility`
 * onto the layers; until it has run at all, NOTHING is written and the sheet's
 * own rest state (the first photograph) is what stands, which is the same
 * answer expressed one layer down.
 */
const showing = (c: HTMLElement) => {
  const i = framesOf(c).findIndex((f) => f.style.visibility === "visible");
  return i === -1 && framesOf(c).every((f) => !f.getAttribute("style")) ? 0 : i;
};

describe("it is atmosphere, and the copy is the only thing in it", () => {
  it("hides every photograph from assistive tech", () => {
    const { container } = render(
      <PhotoSection>
        <p>The words</p>
      </PhotoSection>,
    );
    const images = [...container.querySelectorAll("img")];
    expect(images).toHaveLength(ROOM_FRAMES.length);
    for (const img of images) {
      expect(img).toHaveAttribute("alt", "");
      expect(img.closest("[aria-hidden]")).not.toBeNull();
    }
    // The copy is NOT hidden: it is the only thing there is to hear.
    expect(container.textContent).toContain("The words");
  });

  it("leaves nothing of its own for a keyboard to land on", () => {
    const { container } = render(<PhotoSection />);
    expect(
      container.querySelectorAll(
        "a, button, input, select, textarea, [tabindex], [contenteditable]",
      ),
    ).toHaveLength(0);
  });

  it("plates the copy, and takes no plate when there is none", () => {
    // The plate is the ruled legibility treatment (Will, `legibility=plate`),
    // so copy is never laid straight onto a photograph; a section used purely
    // to separate two chapters carries no pane at all.
    const withCopy = render(
      <PhotoSection>
        <p>The words</p>
      </PhotoSection>,
    );
    const plate = withCopy.container.querySelector(".bkd-plate");
    expect(plate?.textContent).toBe("The words");
    withCopy.unmount();
    const bare = render(<PhotoSection />);
    expect(bare.container.querySelector(".bkd-plate")).toBeNull();
  });
});

describe("it says something when nothing can move", () => {
  it("paints every photograph into the first render, with the first eager", () => {
    // The pool IS the preload: the next photograph is whichever way the reader
    // moves, so there is nothing to fetch on demand, and the rest state must
    // not wait on a lazy load.
    const { container } = render(<PhotoSection />);
    const images = [...container.querySelectorAll("img")];
    expect(images).toHaveLength(ROOM_FRAMES.length);
    expect(images[0]).not.toHaveAttribute("loading", "lazy");
    for (const img of images)
      expect(img.getAttribute("src")).not.toMatch(/undefined|NaN/);
  });

  it("writes no inline style before the loop has run", () => {
    // ★ The rest state is the SHEET's (every layer hidden, the first shown).
    // An inline style written during render would have to know which one, and
    // a reader with scripting off would get whatever that guess was.
    const { container } = render(<PhotoSection />);
    for (const frame of framesOf(container)) {
      expect(frame.getAttribute("style")).toBeNull();
    }
  });

  it("stands perfectly still for a reader who asked for less motion", () => {
    reducedMotion = true;
    const { container } = render(
      <PhotoSection>
        <p>The words</p>
      </PhotoSection>,
    );
    // No loop, no observer, no listener, nothing written: the sheet's first
    // photograph carries the section on its own (bible 5).
    expect(asked).toBe(0);
    expect(TestIO.instances).toHaveLength(0);
    for (const frame of framesOf(container))
      expect(frame.getAttribute("style")).toBeNull();
  });
});

describe("it costs nothing when nobody is moving", () => {
  it("runs no frame loop until the section is on screen", () => {
    const { container } = render(<PhotoSection />);
    expect(asked).toBe(0);
    enter(room(container));
    // On screen and already where the reader is: still nothing to do.
    expect(asked).toBe(0);
  });

  it("STOPS once the photograph has landed and the reader has stopped", () => {
    // The case Will asked the phone rule for: "it's nice visitors can stop
    // scrolling to read without any motion clash with our scroll version."
    const { container } = render(<PhotoSection />);
    enter(room(container));
    wireGate()!.fire(crossing(container, 2));
    expect(queue.length).toBeGreaterThan(0);
    settle();
    expect(queue).toHaveLength(0);
    // And it stays stopped: no further frame is ever requested on its own.
    const before = asked;
    flush();
    expect(asked).toBe(before);
  });

  it("holds the clock off screen instead of teleporting on the way back", () => {
    const { container } = render(<PhotoSection />);
    enter(room(container));
    wireGate()!.fire(crossing(container, 4));
    flush();
    const midFlight = framesOf(container).filter(
      (f) => f.style.visibility === "visible",
    ).length;
    expect(midFlight).toBeGreaterThan(1);
    // Scrolled away: the loop gives up its frames rather than running on.
    screenGate()!.fire([
      {
        target: room(container),
        isIntersecting: false,
        boundingClientRect: { left: 0, width: 1200 } as DOMRectReadOnly,
      },
    ]);
    flush();
    expect(queue).toHaveLength(0);
    // Back again: it picks the entrance up rather than restarting it.
    enter(room(container));
    expect(queue.length).toBeGreaterThan(0);
    settle();
    expect(showing(container)).toBe(
      stepIndex(4.5 / SCROLL_STEPS, ROOM_FRAMES.length, SCROLL_STEPS),
    );
  });
});

describe("the reader without a cursor: steps, no taps, no measuring", () => {
  it("lays one trip wire per ruled step, and nothing else to tap", () => {
    const { container } = render(<PhotoSection />);
    expect(container.querySelectorAll("[data-bkd-wire]")).toHaveLength(
      SCROLL_STEPS,
    );
    expect(room(container)).toHaveAttribute("data-bkd-source", "scroll");
  });

  it("switches the photograph as each wire crosses the middle of the screen", () => {
    const { container } = render(<PhotoSection />);
    enter(room(container));
    for (const k of [0, 1, 2, 3, 4]) {
      wireGate()!.fire(crossing(container, k));
      settle();
      expect(showing(container)).toBe(
        stepIndex((k + 0.5) / SCROLL_STEPS, ROOM_FRAMES.length, SCROLL_STEPS),
      );
    }
  });

  it("goes BACK when the reader scrolls back up", () => {
    const { container } = render(<PhotoSection />);
    enter(room(container));
    for (const k of [0, 1, 2, 1]) {
      wireGate()!.fire(crossing(container, k));
      settle();
    }
    expect(showing(container)).toBe(
      stepIndex(1.5 / SCROLL_STEPS, ROOM_FRAMES.length, SCROLL_STEPS),
    );
  });

  it("takes the wire NEAREST the middle when two are in the band at once", () => {
    // A short section can put two wires inside the band together, and picking
    // the last entry in the callback would make the step depend on delivery
    // order. The entries carry their own rects, so the tie is arithmetic.
    const { container } = render(<PhotoSection />);
    enter(room(container));
    const middle = window.innerHeight / 2;
    wireGate()!.fire([
      {
        target: wireOf(container, 1),
        isIntersecting: true,
        boundingClientRect: { top: middle - 90 } as DOMRectReadOnly,
      },
      {
        target: wireOf(container, 2),
        isIntersecting: true,
        boundingClientRect: { top: middle + 6 } as DOMRectReadOnly,
      },
    ]);
    settle();
    expect(showing(container)).toBe(
      stepIndex(2.5 / SCROLL_STEPS, ROOM_FRAMES.length, SCROLL_STEPS),
    );
  });

  it("READS NO LAYOUT AT ALL: not on a step, not in a frame", () => {
    // ★ The slide is a percentage of the layer and the steps are trip wires, so
    // a phone never measures anything. A scroll handler would have to read a
    // rect every frame to answer the same question.
    const { container } = render(<PhotoSection />);
    enter(room(container));
    rect.mockClear();
    wireGate()!.fire(crossing(container, 3));
    settle();
    expect(rect).not.toHaveBeenCalled();
  });

  it("draws no rail for a reader with no cursor to track", () => {
    const { container } = render(<PhotoSection />);
    enter(room(container));
    wireGate()!.fire(crossing(container, 1));
    settle();
    // The rail is the CURSOR's position made visible (Will's delight), so the
    // sheet shows it under [data-bkd-source="pointer"][data-bkd-held] only.
    expect(room(container)).not.toHaveAttribute("data-bkd-held");
  });
});

describe("the reader with a cursor: the band, and the rail", () => {
  it("scrubs the pool by position, and comes back to what it left", () => {
    finePointer = true;
    const { container } = render(<PhotoSection />);
    const el = room(container);
    expect(el).toHaveAttribute("data-bkd-source", "pointer");
    enter(el, 1200);
    for (const x of [1100, 600, 1100]) {
      act(() => {
        el.dispatchEvent(
          new MouseEvent("pointermove", { clientX: x, bubbles: true }),
        );
      });
      settle();
      expect(showing(container)).toBe(bandIndex(x / 1200, ROOM_FRAMES.length));
    }
  });

  it("lights the rail while the cursor is in the room and gives it back after", () => {
    finePointer = true;
    const { container } = render(<PhotoSection />);
    const el = room(container);
    enter(el, 1200);
    expect(container.querySelectorAll(".bkd-tick")).toHaveLength(
      ROOM_FRAMES.length,
    );
    act(() => {
      el.dispatchEvent(
        new MouseEvent("pointermove", { clientX: 900, bubbles: true }),
      );
    });
    settle();
    expect(el).toHaveAttribute("data-bkd-held");
    expect(container.querySelectorAll(".bkd-tick[data-on]")).toHaveLength(1);
    act(() => {
      el.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));
    });
    expect(el).not.toHaveAttribute("data-bkd-held");
    // ★ And the section RESTS on the photograph it was left on: leaving a room
    // does not redecorate it.
    expect(showing(container)).toBe(bandIndex(900 / 1200, ROOM_FRAMES.length));
  });

  it("watches no trip wire, so scrolling past never switches under a cursor", () => {
    finePointer = true;
    const { container } = render(<PhotoSection />);
    enter(room(container));
    expect(wireGate()).toBeUndefined();
  });
});

describe("the pool is a prop, so a second placement is a data change", () => {
  it("takes whatever pool it is handed, and steps inside it", () => {
    const frames = ["wedding-golden", "party-dj", "wedding-arch"] as const;
    const { container } = render(<PhotoSection frames={frames} steps={3} />);
    expect(container.querySelectorAll("img")).toHaveLength(3);
    expect(container.querySelectorAll("[data-bkd-wire]")).toHaveLength(3);
    enter(room(container));
    wireGate()!.fire(crossing(container, 2));
    settle();
    expect(showing(container)).toBe(2);
  });
});

/** The k-th trip wire. */
function wireOf(c: HTMLElement, k: number) {
  return c.querySelector(`[data-bkd-wire="${k}"]`)!;
}
