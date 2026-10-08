/**
 * THE CARD'S TITLE KEEPS ONE GAP BETWEEN ITS WORDS (crumbs-93, red-team 58's NIT: "A Partyreel  event").
 *
 * Satori draws each word kerned inside the box it measured unkerned, so a text node's gap after a long word opened by
 * the word's own kerning (36 px after "Partyreel" against 23 after "A", on the bundled Geist at 76 px). The title is
 * therefore a row of words, each a row of letters, each letter a tile of its own: nothing is left to kern, and the gap is
 * an explicit margin. What is pinned here is that structure and its edges (the words of a name, its letters, the clamp);
 * the pixels were measured on the real renderer (the lane's walk: the same gap after "A" and after "Partyreel" to within
 * their own side bearings).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CardTitle, lettersOf, wordsOf } from "./title";

const draw = (text: string) =>
  renderToStaticMarkup(
    <CardTitle text={text} size={76} wrapWidth={1000} clipWidth={1024} />,
  );

describe("a name's words and letters", () => {
  it("★ the words of a name are its runs of non-space: doubled, leading and trailing spaces never draw as a gap", () => {
    expect(wordsOf("A  Partyreel \n event ")).toEqual([
      "A",
      "Partyreel",
      "event",
    ]);
    expect(wordsOf("   ")).toEqual([]);
  });

  it("★ a letter is a grapheme, never a code unit: an accent, a flag and an emoji family each stay one tile", () => {
    expect(lettersOf("Zoë")).toEqual(["Z", "o", "ë"]);
    expect(lettersOf("🇧🇷!")).toEqual(["🇧🇷", "!"]);
    expect(lettersOf("👨‍👩‍👧")).toHaveLength(1);
    // A combining accent stays on its letter.
    expect(lettersOf("éx")).toEqual(["é", "x"]);
  });
});

describe("the title, drawn", () => {
  it("★ is a row of word rows of single-letter tiles, in order, with no space character left to kern or collapse", () => {
    const markup = draw("A Partyreel event");
    const letters = [...markup.matchAll(/<span>([^<]*)<\/span>/g)].map(
      (m) => m[1],
    );
    expect(letters.join("")).toBe("APartyreelevent");
    expect(letters).toHaveLength("APartyreelevent".length);
    // Three word rows, each with the gap as its own margin (a quarter of the 76 px em), never a text space.
    expect(markup.match(/margin-right:19px/g)).toHaveLength(3);
    expect(markup).not.toMatch(/<span>\s+<\/span>/);
    expect(markup).toContain('data-card-title="A Partyreel event"');
  });

  it("carries the name as the card says it, whitespace collapsed, for whoever reads what the card says", () => {
    expect(draw("  Maya's   30th ")).toContain(
      'data-card-title="Maya&#x27;s 30th"',
    );
  });

  it("★ cuts at three lines and no wider than the card's padding, so a long name never runs over the foot", () => {
    const markup = draw("Wwwwwwwwwwwww Wwwwwwwwwwwww Wwwwwwwwwwwww");
    // Three lines of 76 px at a line height of 1.05, clipped in the outer box; the wrap width is the inner box's.
    expect(markup).toContain("max-height:240px");
    expect(markup).toContain("overflow:hidden");
    expect(markup).toContain("width:1024px");
    expect(markup).toContain("max-width:1000px");
    expect(markup).toContain("flex-wrap:wrap");
  });

  it("draws nothing for a name of nothing but space, and never throws", () => {
    expect(draw("   ")).not.toMatch(/<span>/);
  });
});
