import { describe, expect, it } from "vitest";

import { composeSoFar } from "./review-message";

/**
 * A partial paste (Will, 2026-09-16): only what is held composes, one line per
 * board, and a board with only a note takes its round from the spec.
 */
describe("composeSoFar", () => {
  const roundOf = (b: string) => (b === "light" ? 6 : undefined);

  it("composes only the held answers, verdicts and notes, one line per board", () => {
    const out = composeSoFar(
      {
        answers: {
          "light.r6.cadence": { choice: "eleven", note: "" },
          "light.r6.paper": { choice: "", note: "not yet" },
          "rounding.r6.gap": { choice: "pinned", note: "a bug" },
        },
        items: {
          "palette.r6.item.ember": { verdict: "kill", note: "warm" },
          "palette.r6.item.slate": { verdict: "", note: "less blue" },
        },
        notes: { light: "the footer keeps its seam", palette: "", type: "  " },
      },
      roundOf,
    );
    expect(out.answers).toBe(2);
    expect(out.items).toBe(1);
    expect(out.notes).toBe(1);
    expect(out.message.split("\n")).toEqual([
      'review light r6: cadence=eleven; note: "the footer keeps its seam"',
      'review rounding r6: gap=pinned "a bug"',
      'review palette r6: item:ember=kill "warm"',
    ]);
  });

  it("is empty when nothing is held", () => {
    const out = composeSoFar({ answers: {}, items: {}, notes: {} }, roundOf);
    expect(out.message).toBe("");
    expect(out.answers + out.items + out.notes).toBe(0);
  });

  it("drops a note on a board whose round it cannot know", () => {
    const out = composeSoFar(
      { answers: {}, items: {}, notes: { orphan: "words" } },
      () => undefined,
    );
    expect(out.notes).toBe(0);
  });
});
