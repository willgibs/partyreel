import { describe, expect, it } from "vitest";

import { bestTrial, fitStage, trialWidths, zoomFor } from "./whole";

/**
 * THE WHOLE STAGE'S ARITHMETIC (lab-focus, 2026-09-29): every frame of the
 * shown option on the first screen, as large as the room allows. What is
 * pinned is the choice (the scale that fits every option, the width that
 * draws it largest, the stack that may stand in a row) and never a look; a
 * browser measures the real stages (`pnpm lab:demo`'s reach gate).
 */

const room = { w: 1400, h: 560 };

describe("the scale a trial is drawn at", () => {
  it("is the largest that fits every option's room, never above 1:1", () => {
    expect(zoomFor({ width: 700, views: [{ h: 280, room }] })).toBe(1);
    expect(zoomFor({ width: 2800, views: [{ h: 280, room }] })).toBe(0.5);
    expect(zoomFor({ width: 700, views: [{ h: 1120, room }] })).toBe(0.5);
  });

  it("draws every option at the scale the largest one needs", () => {
    // Blinking between two compares like with like only at one scale.
    const k = zoomFor({
      width: 1000,
      views: [
        { h: 560, room },
        { h: 1120, room },
      ],
    });
    expect(k).toBe(0.5);
  });
});

describe("the width a drawing is laid out at", () => {
  it("keeps the width that draws it largest", () => {
    const best = bestTrial([
      { width: 375, views: [{ h: 3400, room }] }, // four phones stacked
      { width: 774, views: [{ h: 1700, room }] }, // two by two
      { width: 1572, views: [{ h: 850, room }] }, // one row
    ]);
    expect(best?.width).toBe(1572);
    expect(best?.k).toBeCloseTo(560 / 850);
  });

  it("gives a near tie to the wider width, the fewer wrapped rows", () => {
    const best = bestTrial([
      { width: 900, views: [{ h: 1000, room }] },
      { width: 1200, views: [{ h: 1001, room }] },
    ]);
    expect(best?.width).toBe(1200);
  });

  it("tries the room's own width and both natural ends, in order", () => {
    const widths = trialWidths(375, 1971, 1400);
    expect(widths[0]).toBe(375);
    expect(widths.at(-1)).toBe(1971);
    expect(widths).toContain(1400);
    expect([...widths].sort((a, b) => a - b)).toEqual(widths);
    expect(trialWidths(500, 500)).toEqual([500]);
  });
});

/**
 * A stand-in for a browser's layout: four phone frames (375 by 850, a 24px
 * gap) in a column that, once it is a row that wraps, holds as many a line as
 * the width allows. jsdom lays nothing out, so the drawing's box answers
 * `offsetWidth` and `offsetHeight` from the width it was last set to.
 */
function stageOf(frames = 4, box = { w: 1400, h: 560 }) {
  const stage = document.createElement("div");
  Object.defineProperty(stage, "clientWidth", { get: () => box.w });
  Object.defineProperty(stage, "clientHeight", { get: () => box.h });
  const view = document.createElement("div");
  view.setAttribute("data-lab-view", "");
  const wrap = document.createElement("div");
  wrap.setAttribute("data-lab-fit", "");
  const column = document.createElement("div");
  column.style.display = "flex";
  column.style.flexDirection = "column";
  const lede = document.createElement("p");
  lede.textContent = "One design for every state.";
  column.append(lede);
  for (let i = 0; i < frames; i++) {
    const figure = document.createElement("figure");
    figure.textContent = `Frame ${i + 1}`;
    column.append(figure);
  }
  wrap.append(column);
  view.append(wrap);
  stage.append(view);
  const W = 375;
  const GAP = 24;
  const H = 850;
  const width = () => {
    const w = wrap.style.width;
    if (w === "min-content") return W;
    if (w === "max-content") return frames * W + (frames - 1) * GAP;
    return Number.parseFloat(w) || W;
  };
  const perRow = () =>
    column.hasAttribute("data-lab-reflow")
      ? Math.max(1, Math.floor((width() + GAP) / (W + GAP)))
      : 1;
  Object.defineProperty(wrap, "offsetWidth", { get: width });
  Object.defineProperty(wrap, "offsetHeight", {
    get: () => {
      const rows = Math.ceil(frames / perRow());
      return 40 + rows * H + (rows - 1) * GAP;
    },
  });
  return { stage, wrap, column, lede };
}

describe("fitting a stage whole", () => {
  it("lays a stack of frames out as the row that draws it largest, at a desk", () => {
    const { stage, wrap, column, lede } = stageOf(4, { w: 1400, h: 560 });
    const fitted = fitStage(stage, { side: false })!;
    // The column became a row that wraps, the lede a line of its own.
    expect(column.getAttribute("data-lab-reflow")).toBe("column");
    expect(lede.hasAttribute("data-lab-line")).toBe(true);
    // Four in a row (1572 wide, 890 tall) beats every narrower shape.
    expect(fitted.width).toBeGreaterThanOrEqual(1572);
    expect(fitted.k).toBeCloseTo(560 / 890, 2);
    expect(wrap.style.zoom).toBe(String(fitted.k));
  });

  it("stands them two by two in a phone's room", () => {
    const { stage } = stageOf(4, { w: 343, h: 480 });
    const fitted = fitStage(stage, { side: false })!;
    // A row of four (0.22 by width) and a stack (0.14 by height) both lose
    // to two a row (0.26 by height).
    expect(fitted.k).toBeGreaterThan(0.25);
    expect(fitted.width).toBeLessThan(2 * 375 + 24 + 375);
  });

  it("writes nothing on a re-fit that finds the same answer", () => {
    const { stage } = stageOf();
    const first = fitStage(stage, { side: false })!;
    const again = fitStage(stage, { side: false, last: first });
    expect(again).toBe(first);
  });

  it("leaves a row that holds anything but frames as the board drew it", () => {
    const { stage, column } = stageOf();
    column.style.flexDirection = "row";
    column.append(document.createElement("button"));
    column.lastElementChild!.textContent = "an arrow between two frames";
    fitStage(stage, { side: false });
    expect(column.hasAttribute("data-lab-reflow")).toBe(false);
  });

  it("stands a column as the board drew it again once it holds one frame", () => {
    const { stage, column, lede } = stageOf();
    fitStage(stage, { side: false });
    expect(column.hasAttribute("data-lab-reflow")).toBe(true);
    // A knob redraws the column with a single frame: no stack to wrap.
    for (const figure of [...column.querySelectorAll("figure")].slice(1))
      figure.remove();
    fitStage(stage, { side: false });
    expect(column.hasAttribute("data-lab-reflow")).toBe(false);
    expect(lede.hasAttribute("data-lab-line")).toBe(false);
  });

  it("takes no room when nothing is drawn", () => {
    const stage = document.createElement("div");
    const view = document.createElement("div");
    view.setAttribute("data-lab-view", "");
    const wrap = document.createElement("div");
    wrap.setAttribute("data-lab-fit", "");
    view.append(wrap);
    stage.append(view);
    expect(fitStage(stage, { side: false })).toBeNull();
    expect(stage.hasAttribute("data-empty")).toBe(true);
  });
});
