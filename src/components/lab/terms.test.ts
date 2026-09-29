import { describe, expect, it } from "vitest";

import { termsIn } from "./terms";

/**
 * A COINED TERM IS GLOSSED WHERE IT IS SAID (the context layer, 2026-09-29).
 * The matcher is the whole mechanism, so its three edges are pinned: the case
 * a sentence starts with, the apostrophe's two shapes, and a word inside
 * another word.
 */
const ROLL = { term: "the roll", means: "The event's hidden shots." };
const HOSTS = { term: "the host's door", means: "A door led by her face." };

describe("which of a board's terms a line uses", () => {
  it("matches whole words whatever their case", () => {
    expect(termsIn(["The roll develops at 9 am."], [ROLL])).toEqual([ROLL]);
  });

  it("reads the typographic apostrophe as the plain one", () => {
    expect(termsIn(["Push the host’s door further."], [HOSTS])).toEqual([
      HOSTS,
    ]);
  });

  it("never lights a term up inside another word", () => {
    expect(termsIn(["She enrolled the rollers."], [ROLL])).toEqual([]);
    expect(termsIn(["the rolls"], [ROLL])).toEqual([]);
  });

  it("keeps the board's order and says nothing without terms", () => {
    expect(termsIn(["the host's door, then the roll"], [ROLL, HOSTS])).toEqual([
      ROLL,
      HOSTS,
    ]);
    expect(termsIn(["the roll"], undefined)).toEqual([]);
  });
});
