import { describe, expect, it } from "vitest";

import { composeBoardLine, composeMessage, quoteNote } from "./review-message";

/**
 * THE GRAMMAR, from the composing side (the Library x Lab round, 2026-09-15).
 * The parsing side is `lab-review.test.ts`, which runs the round trip; this
 * file pins the shape the README states, so a change to one is a change to a
 * test rather than a silent drift.
 */

describe("the review message", () => {
  it("writes one line per board in the README's grammar", () => {
    expect(
      composeMessage([
        { board: "light", round: 4, ask: "aurora", choice: "yes" },
        { board: "light", round: 4, ask: "cadence", choice: "8s" },
        { board: "palette", round: 4, ask: "model", choice: "registers" },
      ]),
    ).toBe(
      "review light r4: aurora=yes; cadence=8s\nreview palette r4: model=registers",
    );
  });

  it("quotes a note beside its answer, and a board note at the end", () => {
    expect(
      composeBoardLine(
        "light",
        4,
        [{ board: "light", round: 4, ask: "aurora", choice: "yes", note: "on paper too" }],
        [{ board: "light", round: 4, text: "read the whole board first" }],
      ),
    ).toBe(
      'review light r4: aurora=yes "on paper too"; note: "read the whole board first"',
    );
  });

  it("flattens and escapes a note so a line stays one line", () => {
    expect(quoteNote('he said "no"\nand meant it')).toBe(
      '"he said \\"no\\" and meant it"',
    );
    expect(quoteNote("  spaced   out  ")).toBe('"spaced out"');
    expect(quoteNote("a back\\slash")).toBe('"a back\\\\slash"');
  });

  it("drops an empty note rather than writing empty quotes", () => {
    expect(
      composeBoardLine(
        "light",
        4,
        [{ board: "light", round: 4, ask: "aurora", choice: "yes", note: "   " }],
        [{ board: "light", round: 4, text: "" }],
      ),
    ).toBe("review light r4: aurora=yes");
  });

  it("is empty when nothing was answered", () => {
    expect(composeMessage([], [])).toBe("");
    expect(composeBoardLine("light", 4, [], [])).toBe("");
  });

  it("carries a board that has only a note", () => {
    expect(
      composeMessage([], [{ board: "light", round: 4, text: "not yet" }]),
    ).toBe('review light r4: note: "not yet"');
  });
});
