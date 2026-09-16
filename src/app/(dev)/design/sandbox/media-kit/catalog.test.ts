import { describe, expect, it } from "vitest";

import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import { CATALOGUE } from "./catalogue";
import { drawableVerticals, SOURCES } from "./sources";
import { MEDIA_KIT } from "./spec";
import { frameForId, swapCoverage, swapCss } from "./swap";
import { MANIFEST_IDS, VERTICAL_OF_ID } from "./vertical-map";

/**
 * THE CATALOG, PINNED TO WHAT IT CLAIMS (round six, 2026-09-16).
 *
 * The cards carry the WORDS a reviewer compares and `sources.ts` carries the
 * STRUCTURE, written out separately because `pnpm lab:review` reads a spec as
 * text with no build step and a `.map` over another module reads as no items at
 * all. Two copies of one fact is exactly how a board goes quietly wrong, so the
 * duplication is an invariant instead: the two lists are the same set, and a
 * Licence fact has to be a real substring of that source's verbatim clause.
 *
 * ★ THE MISQUOTE IS THE FAULT THIS SUITE EXISTS FOR. A card's Licence line is a
 * trimmed quotation of a legal document, typed by hand, next to twelve others.
 * A board that misquotes a licence is worse than a board with no licences on
 * it, because the whole point of quoting a clause rather than naming a platform
 * is that a platform name proves nothing about what was agreed.
 */

const bySourceId = new Map(SOURCES.map((s) => [s.id, s]));

/** The quoted run inside a Licence fact: everything between the outer quotes. */
function quoted(value: string): string[] {
  return [...value.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** A clause fragment may elide with " ... "; each piece must be verbatim. */
function pieces(fragment: string): string[] {
  return fragment
    .split("...")
    .map((p) => p.trim())
    .filter(Boolean);
}

describe("the catalog's cards", () => {
  it("are the sourcing sheet, one card per place", () => {
    expect(MEDIA_KIT.candidates.map((c) => c.id).sort()).toEqual(
      SOURCES.map((s) => s.id).sort(),
    );
  });

  it("carries a line, a verdict, three facts and what it buys", () => {
    for (const c of MEDIA_KIT.candidates) {
      expect(c.one, `${c.id} has no line`).toBeTruthy();
      expect(c.verdict, `${c.id} has no verdict`).toBeTruthy();
      expect(
        c.facts?.map(([label]) => label),
        `${c.id}'s facts`,
      ).toEqual(["Price", "Licence", "Faces"]);
      // ★ A KEPT CARD HERE IS A PURCHASE (the stepped review, 2026-09-16), so
      // `lands` is what the money buys and it carries a number: the month, the
      // pack, the credit, the frames. A card without one is a card a reviewer
      // cannot rule on, because keeping it is a spend.
      expect(c.lands, `${c.id} does not say what keeping it buys`).toBeTruthy();
    }
  });

  it("quotes every Licence fact verbatim from its source's own clause", () => {
    for (const c of MEDIA_KIT.candidates) {
      const source = bySourceId.get(c.id)!;
      const fact = c.facts!.find(([label]) => label === "Licence")![1];
      const runs = quoted(fact);
      expect(runs.length, `${c.id} quotes no clause at all`).toBeGreaterThan(0);
      // The comparison is case-insensitive on the first letter only: a
      // fragment lifted from mid-sentence is often capitalised on the card.
      const clause = source.clause.toLowerCase();
      for (const run of runs) {
        for (const piece of pieces(run)) {
          expect(
            clause.includes(piece.toLowerCase()),
            `${c.id} quotes "${piece}", which is not in its clause`,
          ).toBe(true);
        }
      }
    }
  });

  it("draws the board's line with its own verdicts, kills last", () => {
    const verdicts = MEDIA_KIT.candidates.map((c) => c.verdict);
    const firstKill = verdicts.indexOf("kill");
    expect(firstKill, "no card is killed, so there is no line").toBeGreaterThan(
      0,
    );
    expect(
      verdicts.slice(firstKill).every((v) => v === "kill"),
      "a kept card sits below the line the board draws",
    ).toBe(true);
    expect(
      MEDIA_KIT.candidates.filter((c) => c.verdict === "ship").length,
    ).toBeGreaterThan(0);
  });

  it("marks exactly one card as the board's own answer", () => {
    expect(MEDIA_KIT.candidates.filter((c) => c.recommended)).toHaveLength(1);
  });

  it("offers every card on the pick control", () => {
    const ids = MEDIA_KIT.candidates.map((c) => c.id).sort();
    expect(
      MEDIA_KIT.controls!.find((c) => c.id === "source")!
        .options.map((o) => o.id)
        .filter((id) => id !== "none")
        .sort(),
    ).toEqual(ids);
  });

  /**
   * ★ KEEP-ANY, AS A GALLERY, AND NO WINNER (the stepped review, 2026-09-16).
   * A kept card here is a PURCHASE and the board's own answer keeps two of
   * them, so a pick-one shape would force a reviewer to throw one away to keep
   * the other. The registry test already refuses a pick-one catalog with no
   * winner ask; this refuses the reverse for the reason that is this board's.
   */
  it("is decided card by card, with no winner to pick", () => {
    expect(MEDIA_KIT.catalog?.mode).toBe("keep-any");
    expect(MEDIA_KIT.catalog?.walk).toBe("gallery");
    expect(MEDIA_KIT.catalog?.winner).toBeUndefined();
    expect(
      MEDIA_KIT.candidates.filter((c) => c.verdict === "ship").length,
      "a keep-any catalog whose board ships only one card wants pick-one",
    ).toBeGreaterThan(1);
  });

  /**
   * ★ EVERY STEP HAS ITS OWN SPECIMEN, WHICH IS THE ROUND'S WHOLE SHAPE (Will:
   * "all context is made available for 1+ questions around the same content,
   * then onto the next context"). Two asks pointing at one section is two
   * questions sharing a screen, which is what round six did with all four.
   */
  it("gives every question a section of its own, and says what it decides", () => {
    const seen = new Set<string>();
    for (const ask of MEDIA_KIT.asks) {
      expect(ask.lands, `${ask.id} does not say what it decides`).toBeTruthy();
      expect(seen.has(ask.evidence), `${ask.id} shares ${ask.evidence}`).toBe(
        false,
      );
      seen.add(ask.evidence);
    }
  });
});

describe("the swap", () => {
  it("knows a kind of event for every still the site ships, and no other", () => {
    expect(Object.keys(VERTICAL_OF_ID).sort()).toEqual(
      [...MANIFEST_IDS].sort(),
    );
    expect(MANIFEST_IDS).toHaveLength(MARKETING_IMAGES.length);
  });

  it("dresses every still from a source that draws all five kinds", () => {
    // Unsplash+ is the recommendation, so the block it hands the site has to be
    // complete: a bridge with holes in it is not a bridge.
    expect(swapCoverage("unsplash-plus")).toBe(MARKETING_IMAGES.length);
    const css = swapCss("unsplash-plus");
    for (const image of MARKETING_IMAGES) {
      expect(css, `${image.id} has no rule`).toContain(`mkt-${image.id}-01`);
    }
  });

  it("hands two stills of one kind two different photographs", () => {
    const weddings = MANIFEST_IDS.filter(
      (id) => VERTICAL_OF_ID[id] === "weddings",
    );
    const urls = weddings.map((id) => frameForId("unsplash-plus", id));
    expect(new Set(urls).size, "two wedding stills share a frame").toBe(
      weddings.length,
    );
  });

  it("hands the site nothing for a place that draws nothing", () => {
    for (const source of SOURCES) {
      if (drawableVerticals(source.id).length > 0) continue;
      expect(swapCss(source.id), `${source.id} swaps something`).toBe("");
      expect(swapCoverage(source.id)).toBe(0);
    }
  });

  it("points every rule at a frame the contact sheets actually hold", () => {
    const thumbs = new Set(
      Object.values(CATALOGUE).flatMap((sheet) =>
        sheet.frames.map((f) => f.thumb),
      ),
    );
    for (const source of SOURCES) {
      for (const id of MANIFEST_IDS) {
        const url = frameForId(source.id, id);
        if (url === null) continue;
        expect(thumbs.has(url), `${source.id}/${id} invents a frame`).toBe(
          true,
        );
      }
    }
  });
});
