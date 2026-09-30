import { describe, expect, it } from "vitest";

import { splitTerms, termsIn } from "./terms";

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

/**
 * AND IT IS MARKED WHERE IT STANDS (lab-focus, 2026-09-29): a term's meaning
 * is one hover away on the words themselves, so the line is cut at its terms
 * with the line's own spelling kept and every word still there.
 */
describe("a line cut at the terms it uses", () => {
  const whole = (pieces: { text: string }[]) =>
    pieces.map((p) => p.text).join("");

  it("keeps every word and the line's own spelling", () => {
    const line = "Push The host’s door further, then the roll.";
    const pieces = splitTerms(line, [ROLL, HOSTS]);
    expect(whole(pieces)).toBe(line);
    expect(pieces.filter((p) => p.term).map((p) => p.text)).toEqual([
      "The host’s door",
      "the roll",
    ]);
  });

  it("marks a term the first time the line says it, never inside a word", () => {
    const pieces = splitTerms("the roll, the rolls, the roll", [ROLL]);
    expect(pieces.filter((p) => p.term)).toHaveLength(1);
    expect(splitTerms("She enrolled.", [ROLL])).toEqual([
      { text: "She enrolled." },
    ]);
  });

  it("gives an overlap to the longer term", () => {
    const DOOR = { term: "door", means: "A door." };
    const pieces = splitTerms("the host's door", [DOOR, HOSTS]);
    expect(pieces.filter((p) => p.term).map((p) => p.term)).toEqual([HOSTS]);
  });
});
