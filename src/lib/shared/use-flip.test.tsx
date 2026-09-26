/**
 * useFlip's contract, pinned when the /blog round generalized it to two axes.
 *
 * The hook is shared: the ADMIN event feed has used it since the /design/event-feed
 * lab, and the blog library joined it. So a change made for a multi-column grid can
 * silently alter how a host's review queue reorders, and nothing here had coverage
 * before this file. The three pins below are the properties that make the shared
 * hook safe to keep sharing.
 *
 * jsdom reports every rect as 0, so each test stubs getBoundingClientRect to script
 * a layout. That is the point: FLIP is pure rect arithmetic, and the arithmetic is
 * what can regress.
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runFlip, useFlip } from "./use-flip";

type Box = { top: number; left: number };

/** Script the rects each key reports, one entry per render pass. */
function stub(el: HTMLElement, boxes: () => Box) {
  el.getBoundingClientRect = () => {
    const { top, left } = boxes();
    return {
      top,
      left,
      right: left,
      bottom: top,
      width: 0,
      height: 0,
      x: left,
      y: top,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

function Harness({
  keys,
  orderKey,
  layout,
  onNode,
}: {
  keys: string[];
  orderKey: string;
  layout: Record<string, Box>;
  onNode: (key: string, el: HTMLElement) => void;
}) {
  const register = useFlip(orderKey);
  return (
    <>
      {keys.map((k) => (
        <div
          key={k}
          data-testid={k}
          ref={(el) => {
            if (el) {
              stub(el, () => layout[k]);
              onNode(k, el);
            }
            register(k)(el);
          }}
        />
      ))}
    </>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("useFlip", () => {
  it("inverts on BOTH axes, so a multi-column grid reorganizes correctly", () => {
    const nodes = new Map<string, HTMLElement>();
    const layout: Record<string, Box> = { a: { top: 0, left: 0 } };
    const { rerender } = render(
      <Harness
        keys={["a"]}
        orderKey="1"
        layout={layout}
        onNode={(k, el) => nodes.set(k, el)}
      />,
    );

    // The card moves right AND down: cell (0,0) -> cell (1,1) of a grid.
    layout.a = { top: 40, left: 300 };
    rerender(
      <Harness
        keys={["a"]}
        orderKey="2"
        layout={layout}
        onNode={(k, el) => nodes.set(k, el)}
      />,
    );

    // Invert = where it WAS minus where it IS: back up and to the left.
    expect(nodes.get("a")!.style.transform).toBe("translate(-300px, -40px)");
  });

  it("leaves a full-width stack on Y only, so the event feed is unchanged", () => {
    // The regression that matters most: the admin feed's sections span the column,
    // so `left` never changes and dx must come out exactly 0.
    const nodes = new Map<string, HTMLElement>();
    const layout: Record<string, Box> = { review: { top: 500, left: 0 } };
    const { rerender } = render(
      <Harness
        keys={["review"]}
        orderKey="1"
        layout={layout}
        onNode={(k, el) => nodes.set(k, el)}
      />,
    );

    layout.review = { top: 120, left: 0 };
    rerender(
      <Harness
        keys={["review"]}
        orderKey="2"
        layout={layout}
        onNode={(k, el) => nodes.set(k, el)}
      />,
    );

    const t = nodes.get("review")!.style.transform;
    expect(t).toBe("translate(0px, 380px)");
    expect(t).not.toContain("-"); // purely vertical: no horizontal drift introduced
  });

  it("★ prunes the rect of an unmounted key, so a returning item does not fly in from nowhere", () => {
    // A card filtered OUT and later filtered back IN must arrive in place. Without the
    // prune it keeps its rect from a different filter and inverts from that stale box.
    const nodes = new Map<string, HTMLElement>();
    const layout: Record<string, Box> = {
      a: { top: 0, left: 0 },
      b: { top: 900, left: 0 },
    };
    const onNode = (k: string, el: HTMLElement) => nodes.set(k, el);

    const { rerender } = render(
      <Harness
        keys={["a", "b"]}
        orderKey="1"
        layout={layout}
        onNode={onNode}
      />,
    );
    // b leaves the set (a tag filter excludes it) — its stale rect must be dropped.
    rerender(
      <Harness keys={["a"]} orderKey="2" layout={layout} onNode={onNode} />,
    );
    // b returns, now sitting near the top rather than at its old y=900.
    layout.b = { top: 60, left: 0 };
    rerender(
      <Harness
        keys={["a", "b"]}
        orderKey="3"
        layout={layout}
        onNode={onNode}
      />,
    );

    // No prev rect => no invert => it simply appears where it belongs.
    expect(nodes.get("b")!.style.transform).toBe("");
  });

  it("skips the invert entirely under reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) =>
        ({
          matches: q.includes("reduce"),
          media: q,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    );
    const nodes = new Map<string, HTMLElement>();
    const layout: Record<string, Box> = { a: { top: 0, left: 0 } };
    const onNode = (k: string, el: HTMLElement) => nodes.set(k, el);

    const { rerender } = render(
      <Harness keys={["a"]} orderKey="1" layout={layout} onNode={onNode} />,
    );
    layout.a = { top: 300, left: 200 };
    rerender(
      <Harness keys={["a"]} orderKey="2" layout={layout} onNode={onNode} />,
    );

    expect(nodes.get("a")!.style.transform).toBe("");
  });
});

describe("runFlip, the one pass the sortable grid shares", () => {
  it("skips a key (no invert, no new baseline) and hands it to onSkip in the same pass", () => {
    // The dragged tile follows the finger; if the pass inverted it or remembered its transformed
    // rect, the next reorder would slide it from a stale box. use-sortable-grid used to carry its
    // own copy of the loop for exactly this; the option is the whole difference.
    const a = document.createElement("div");
    const b = document.createElement("div");
    const layout: Record<string, Box> = {
      a: { top: 0, left: 0 },
      b: { top: 100, left: 0 },
    };
    stub(a, () => layout.a);
    stub(b, () => layout.b);
    const nodes = new Map([
      ["a", a],
      ["b", b],
    ]);
    const prev = new Map<string, DOMRect>();
    runFlip(nodes, prev); // baseline both
    expect(prev.has("b")).toBe(true);
    prev.delete("b"); // the grid clears the dragged tile's baseline when the drag starts
    layout.a = { top: 100, left: 0 };
    layout.b = { top: 0, left: 0 };
    const skipped: string[] = [];
    runFlip(nodes, prev, {
      skip: (k) => k === "b",
      onSkip: (k) => skipped.push(k),
    });
    expect(skipped).toEqual(["b"]);
    expect(a.style.transform).toBe("translate(0px, -100px)");
    expect(b.style.transform).toBe("");
    expect(prev.has("b"), "a skipped key is not re-baselined").toBe(false);
    expect(prev.get("a")!.top).toBe(100);
  });
});

/**
 * THE ROWS' EXTENSIONS (the album-rows lane): a justified album moves a photograph between rows,
 * which changes its SIZE as well as its place, and an arrival shifts hundreds of tiles at once.
 */
describe("runFlip for a justified album", () => {
  type Rect = { top: number; left: number; width: number; height: number };
  function sized(
    el: HTMLElement,
    rect: () => Rect,
    log?: string[],
    key?: string,
  ) {
    el.getBoundingClientRect = () => {
      log?.push(`read:${key}`);
      const { top, left, width, height } = rect();
      return {
        top,
        left,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    };
  }

  it("inverts the size too, about the tile's own centre", () => {
    const el = document.createElement("div");
    let r: Rect = { top: 0, left: 0, width: 200, height: 100 };
    sized(el, () => r);
    const nodes = new Map([["a", el]]);
    const prev = new Map<string, DOMRect>();
    runFlip(nodes, prev, { scale: true });
    // It moves to the next row and shrinks: 200x100 at (0,0) -> 100x50 at (300,120).
    r = { top: 120, left: 300, width: 100, height: 50 };
    runFlip(nodes, prev, { scale: true });
    // Centre (100,50) was, centre (350,145) is: back -250,-95, and twice the size.
    expect(el.style.transform).toBe("translate(-250px, -95px) scale(2, 2)");
  });

  it("does not animate sub-pixel drift", () => {
    const el = document.createElement("div");
    let r: Rect = { top: 0, left: 0, width: 200, height: 100 };
    sized(el, () => r);
    const nodes = new Map([["a", el]]);
    const prev = new Map<string, DOMRect>();
    runFlip(nodes, prev, { scale: true });
    r = { top: 0.1, left: 0.2, width: 200.2, height: 100.1 };
    runFlip(nodes, prev, { scale: true });
    expect(el.style.transform).toBe("");
  });

  it("is instant at a duration of zero", () => {
    const el = document.createElement("div");
    let r: Rect = { top: 0, left: 0, width: 10, height: 10 };
    sized(el, () => r);
    const nodes = new Map([["a", el]]);
    const prev = new Map<string, DOMRect>();
    runFlip(nodes, prev, { duration: 0 });
    r = { top: 500, left: 0, width: 10, height: 10 };
    runFlip(nodes, prev, { duration: 0 });
    expect(el.style.transform).toBe("");
    // ...and still re-baselined, so the next pass starts from where it is.
    expect(prev.get("a")!.top).toBe(500);
  });

  it("leaves a tile that is off screen before and after to simply move", () => {
    const near = document.createElement("div");
    const far = document.createElement("div");
    const rects: Record<string, Rect> = {
      near: { top: 100, left: 0, width: 10, height: 10 },
      far: { top: 9000, left: 0, width: 10, height: 10 },
    };
    sized(near, () => rects.near);
    sized(far, () => rects.far);
    const nodes = new Map([
      ["near", near],
      ["far", far],
    ]);
    const prev = new Map<string, DOMRect>();
    runFlip(nodes, prev, { visibleOnly: true });
    rects.near = { top: 300, left: 0, width: 10, height: 10 };
    rects.far = { top: 9200, left: 0, width: 10, height: 10 };
    runFlip(nodes, prev, { visibleOnly: true });
    expect(near.style.transform).toBe("translate(0px, -200px)");
    expect(far.style.transform).toBe("");
    expect(prev.get("far")!.top).toBe(9200);
  });

  it("reads every rect before it writes a single style", () => {
    const log: string[] = [];
    const nodes = new Map<string, HTMLElement>();
    const rects: Record<string, Rect> = {};
    for (const key of ["a", "b", "c"]) {
      const el = document.createElement("div");
      rects[key] = { top: 0, left: 0, width: 10, height: 10 };
      sized(el, () => rects[key], log, key);
      // Record every transform write, in order with the reads.
      let value = "";
      Object.defineProperty(el.style, "transform", {
        get: () => value,
        set: (v: string) => {
          log.push(`write:${key}`);
          value = v;
        },
      });
      nodes.set(key, el);
    }
    const prev = new Map<string, DOMRect>();
    runFlip(nodes, prev);
    for (const key of ["a", "b", "c"]) rects[key] = { ...rects[key], top: 50 };
    log.length = 0;
    runFlip(nodes, prev);
    const lastRead = log.lastIndexOf(
      log.filter((l) => l.startsWith("read")).at(-1)!,
    );
    const firstWrite = log.findIndex((l) => l.startsWith("write"));
    expect(firstWrite).toBeGreaterThan(lastRead);
    expect(log.filter((l) => l.startsWith("write"))).toEqual([
      "write:a",
      "write:b",
      "write:c",
    ]);
  });
});
