import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { screenOf, trailSpec } from "./trail-engine";
import { Trail } from "./trail";

/**
 * THE TRAIL LAYER'S CONTRACT.
 *
 * Everything here is a property a reader, a screen reader or a battery can feel,
 * and none of it can be checked by looking at a stage: a loop that keeps asking
 * for frames while a hand rests is invisible and expensive, a
 * `getBoundingClientRect` inside a pointer handler forces a layout on every
 * mouse move and looks identical on screen, and a trail that keeps running while
 * scrolled away costs a phone its battery to draw nothing.
 *
 * Function, never look: nothing here pins a duration, a curve, an alpha, a
 * density or which photograph is which. Retune the whole ruled look, change the
 * walk, swap the pool and every test still passes; start reading layout in the
 * loop, forget to stop at rest, keep running off screen, make the trail
 * focusable or let it eat pointer events and they do not.
 */

type Entry = Partial<IntersectionObserverEntry> & { target: Element };

class TestIO {
  static instances: TestIO[] = [];
  targets: Element[] = [];
  constructor(public cb: IntersectionObserverCallback) {
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

let queue: FrameRequestCallback[] = [];
let clock = 0;
let asked = 0;

/** Run every pending frame, 16 ms later. Returns how many were pending. */
function flush(ms = 16) {
  clock += ms;
  const pending = queue;
  queue = [];
  act(() => {
    for (const cb of pending) cb(clock);
  });
  return pending.length;
}

/** Run frames until the trail stops asking for them (or give up). */
function settle(limit = 600) {
  let frames = 0;
  for (let i = 0; i < limit && queue.length; i++) frames += flush();
  return frames;
}

let reducedMotion = false;

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
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

/** The stage the setup's mocked layout hands every element: 800 by 600. */
const BOX = { w: 800, h: 600 };

const stageOf = (c: HTMLElement) => c.firstElementChild as HTMLElement;
const layerOf = (c: HTMLElement) => c.querySelector<HTMLElement>(".trl-layer")!;
const cardsOf = (c: HTMLElement) => [
  ...c.querySelectorAll<HTMLElement>(".trl-card"),
];

/** A hand at a point inside the stage, the way a browser delivers it. */
function move(c: HTMLElement, x: number, y: number) {
  act(() => {
    stageOf(c).dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: x,
        clientY: y,
        bubbles: true,
      }),
    );
  });
}

describe("it is weather, not content", () => {
  it("hides every photograph from assistive tech and leaves nothing to focus", () => {
    const { container } = render(
      <Trail>
        <h1>We lost this page</h1>
      </Trail>,
    );
    expect(layerOf(container).getAttribute("aria-hidden")).toBe("true");
    for (const img of container.querySelectorAll("img")) {
      expect(img.getAttribute("alt")).toBe("");
    }
    expect(
      layerOf(container).querySelectorAll("a, button, [tabindex]").length,
    ).toBe(0);
  });

  it("keeps the words in the tree and in front of the photographs", () => {
    const { container, getByRole } = render(
      <Trail>
        <h1>We lost this page</h1>
      </Trail>,
    );
    expect(getByRole("heading")).toBeInTheDocument();
    // The layer paints first, the words after it: a document order the page
    // does not have to fight with a z-index.
    const kids = [...stageOf(container).children];
    expect(kids[0]).toBe(layerOf(container));
    expect(kids[1]).toContainElement(getByRole("heading"));
  });

  it("asks for each photograph at the size it draws it, never at a vw", () => {
    // The card is a fixed pixel box, so a vw would over-fetch on a wide screen
    // and under-fetch on a narrow one.
    const { container } = render(<Trail />);
    const spec = trailSpec(BOX);
    for (const img of container.querySelectorAll("img")) {
      expect(img.getAttribute("sizes")).toBe(`${spec.size}px`);
    }
  });
});

describe("the pool", () => {
  it("draws exactly the ring the measured box asks for, and no more", () => {
    const { container } = render(<Trail />);
    expect(cardsOf(container).length).toBe(trailSpec(BOX).pool);
  });

  it("draws nothing at all until a box has been measured", () => {
    // A composition cannot be solved without the box a birth's travel is
    // measured in, so a layout-less render draws no photographs rather than
    // solving one in a zero box.
    rect.mockReturnValueOnce({ width: 0, height: 0 } as DOMRect);
    const { container } = render(<Trail />);
    expect(container.querySelector(".trl-layer")).toBeNull();
    // ...and the words still stand, which is the whole page's guarantee.
    expect(stageOf(container)).toBeInTheDocument();
  });

  it("recycles rather than growing: the node count never moves once running", () => {
    const { container } = render(<Trail />);
    const before = cardsOf(container).length;
    for (let i = 0; i < 40; i++) {
      move(container, 100 + i * 12, 200 + (i % 7) * 9);
      flush();
    }
    expect(cardsOf(container).length).toBe(before);
  });
});

describe("what it costs when nobody is looking", () => {
  it("asks for no frame at all from a reader who asked for less motion", () => {
    reducedMotion = true;
    const { container } = render(<Trail />);
    expect(asked).toBe(0);
    // And the resting composition is still there to look at: the still is
    // written during render, so less motion means no motion, not no picture.
    const placed = cardsOf(container).filter((el) =>
      (el.getAttribute("style") ?? "").includes("--trl-rest: translate3d"),
    );
    expect(placed.length).toBeGreaterThan(3);
  });

  it("stops asking for frames when it is scrolled off screen, and starts again", () => {
    const { container } = render(<Trail />);
    settle(10);
    const io = TestIO.instances.at(-1)!;
    io.fire([{ target: layerOf(container), isIntersecting: false }]);
    flush();
    expect(queue.length).toBe(0);
    io.fire([{ target: layerOf(container), isIntersecting: true }]);
    expect(queue.length).toBeGreaterThan(0);
  });

  it("stops asking for frames on a hidden tab, and starts again", () => {
    const { container } = render(<Trail />);
    settle(10);
    const hidden = vi
      .spyOn(document, "hidden", "get")
      .mockReturnValue(true as never);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    flush();
    expect(queue.length).toBe(0);
    hidden.mockReturnValue(false as never);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(queue.length).toBeGreaterThan(0);
    hidden.mockRestore();
    expect(container).toBeInTheDocument();
  });

  it("STOPS when the hand stops, and wakes when it moves again", () => {
    // The keeper holds one photograph whole while a hand rests, so every frame
    // after that would write the identical transform to the identical node.
    // This is the one thing a conveyor cannot do and the reason the engine
    // exposes a rest state at all.
    const { container } = render(<Trail />);
    move(container, 200, 200);
    const frames = settle();
    expect(frames).toBeGreaterThan(10);
    expect(queue.length).toBe(0);
    // Something is still on the screen: it stopped because nothing is changing,
    // not because the trail went away.
    const lit = cardsOf(container).filter(
      (el) => Number(el.style.opacity || "1") > 0.05,
    );
    expect(lit.length).toBeGreaterThan(0);
    move(container, 340, 260);
    expect(queue.length).toBeGreaterThan(0);
  });

  it("never stops under a walk, because a path never rests", () => {
    // Will's `phone=walks`: "so the screen is alive the moment it is opened and
    // a finger is never asked for".
    render(<Trail source="path" />);
    expect(settle(300)).toBe(300);
    expect(queue.length).toBeGreaterThan(0);
  });
});

describe("the layout it reads", () => {
  it("reads none of it inside the loop", () => {
    render(<Trail />);
    settle(20);
    rect.mockClear();
    settle(60);
    expect(rect).not.toHaveBeenCalled();
  });

  it("reads none of it inside the pointer handler either, once it has the box", () => {
    // A getBoundingClientRect on every pointermove is a forced layout on every
    // mouse event, which is the cheapest way to make a beautiful effect heavy.
    const { container } = render(<Trail />);
    move(container, 120, 120);
    flush();
    rect.mockClear();
    for (let i = 0; i < 30; i++) {
      move(container, 120 + i * 9, 120 + i * 5);
      flush();
    }
    expect(rect).not.toHaveBeenCalled();
  });

  it("reads it again after a scroll, so a moved stage is not drawn on stale px", () => {
    const { container } = render(<Trail />);
    move(container, 120, 120);
    flush();
    rect.mockClear();
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    move(container, 130, 130);
    expect(rect).toHaveBeenCalled();
  });
});

describe("the two sources", () => {
  it("walks on its own before any hand arrives", () => {
    const { container } = render(<Trail />);
    const at = () =>
      cardsOf(container)
        .map((el) => el.style.transform)
        .join("|");
    settle(4);
    const first = at();
    settle(30);
    expect(at()).not.toBe(first);
  });

  it("hands over to a real hand the moment one enters", () => {
    const { container } = render(<Trail />);
    settle(4);
    // A hand parked in one corner stops the walk dead: what moves now is the
    // decay of what the walk left, and then nothing.
    move(container, 40, 40);
    settle();
    expect(queue.length).toBe(0);
  });

  it("below a phone's width, never waits for a finger and never follows one", () => {
    // A drag on a page is a scroll, which is why `touch` lost: the walk is the
    // only source under the breakpoint.
    expect(screenOf({ w: 375, h: 640 }).size).toBeLessThan(
      screenOf({ w: 1440, h: 900 }).size,
    );
    render(<Trail source="path" />);
    const before = asked;
    settle(20);
    expect(asked).toBeGreaterThan(before);
  });
});
