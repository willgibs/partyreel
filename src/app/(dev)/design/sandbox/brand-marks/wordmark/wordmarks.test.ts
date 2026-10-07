import { describe, expect, it } from "vitest";

import { WORDMARK_PATH } from "@/lib/brand/wordmark";

import { pasteFor, WORDMARKS } from "./candidates";

/**
 * WHAT EVERY WORDMARK ON THE TABLE OWES PRODUCTION'S `Logo`, and what the
 * finished cut owes Will's drawing: his letters byte for byte.
 */
describe("the wordmarks", () => {
  it("keeps every drawing at least production's 308 units wide, so the bars never shrink it", () => {
    for (const mark of Object.values(WORDMARKS))
      for (const cut of [mark.display, mark.small])
        expect(cut.w, mark.id).toBeGreaterThanOrEqual(308);
  });

  it("moves his shapes in both cuts and changes none of them", () => {
    // Every shape of a cut is his own, moved: the same commands in the same
    // order, every y his, every x his plus one amount for the whole shape.
    const his = WORDMARK_PATH.split(/(?=M)/);
    const numbers = (shape: string) =>
      [...shape.matchAll(/-?\d*\.?\d+/g)].map((m) => Number(m[0]));
    const commands = (s: string) => s.replace(/[-\d.\s,]+/g, " ").trim();
    for (const cut of [WORDMARKS.finished.display, WORDMARKS.finished.small]) {
      const shapes = cut.d.split(/(?=M)/);
      expect(shapes).toHaveLength(his.length);
      shapes.forEach((shape, i) => {
        expect(commands(shape)).toBe(commands(his[i]));
        const mine = numbers(shape);
        const theirs = numbers(his[i]);
        const moved = mine.map((n, k) => Math.round((n - theirs[k]) * 1000));
        // An M and an L carry x then y, an H an x alone: every non-zero move
        // in a shape is the same one.
        expect(new Set(moved.filter(Boolean)).size).toBeLessThanOrEqual(1);
      });
    }
  });

  it("parts the display cut by less than the small cut, and both by something", () => {
    const { display, small } = WORDMARKS.finished;
    expect(display.w).toBeGreaterThan(308);
    expect(small.w).toBeGreaterThan(display.w);
  });

  it("swaps production's Logo by a transform, never by rewriting his numbers", () => {
    const paste = pasteFor(WORDMARKS.finished.small);
    expect(paste).toContain(`d: path("${WORDMARKS.finished.small.d}")`);
    expect(paste).toMatch(/transform: translateX\(-[\d.]+px\)/);
  });
});
