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

  it("draws v1's display cut as his path exactly", () => {
    expect(WORDMARKS.finished.display.d).toBe(WORDMARK_PATH);
  });

  it("moves his shapes in the small cut and changes none of them", () => {
    // Every shape of the small cut, moved back to where the letter before it
    // ends as he drew it, is his own: same commands, same y's, x's shifted
    // by one amount per shape.
    const his = WORDMARK_PATH.split(/(?=M)/);
    const cut = WORDMARKS.finished.small.d.split(/(?=M)/);
    expect(cut).toHaveLength(his.length);
    const commands = (s: string) => s.replace(/[-\d.\s,]+/g, " ").trim();
    cut.forEach((shape, i) => expect(commands(shape)).toBe(commands(his[i])));
  });

  it("swaps production's Logo by a transform, never by rewriting his numbers", () => {
    const paste = pasteFor(WORDMARKS.finished.small);
    expect(paste).toContain(`d: path("${WORDMARKS.finished.small.d}")`);
    expect(paste).toMatch(/transform: translateX\(-[\d.]+px\)/);
  });
});
