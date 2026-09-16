import { describe, expect, it } from "vitest";

import { ACTIONS, factsFor, gapFor, RECOMMENDED, SURFACES } from "./candidates";
import { ROUNDING } from "./spec";

/**
 * THE SIX FAMILIES, PINNED TO THE SPEC THAT PRINTS THEM (the catalog rebuild,
 * 2026-09-16).
 *
 * ★ THE DUPLICATION IS DELIBERATE AND THIS TEST IS THE PRICE OF IT. The review
 * scanner reads a board's spec as TEXT and resolves `candidates: ITEMS` exactly
 * one hop to a const array in the same file, so a `.map` over `candidates.ts`
 * reads as NO items and every ruling on a card would be refused (the palette
 * board learned it twice). So the words are written out in spec.ts and the
 * numbers live in candidates.ts, and the two lists are held equal here: id for
 * id, name for name, line for line and fact for fact. Change one and this
 * fails, which is the only thing that keeps a card's fact honest about the
 * preview above it.
 */
describe("the rounding families", () => {
  it("writes the same six in the spec as in candidates.ts", () => {
    expect(ROUNDING.candidates.map((c) => c.id)).toEqual(
      SURFACES.map((c) => c.id),
    );
    for (const family of SURFACES) {
      const card = ROUNDING.candidates.find((c) => c.id === family.id);
      expect(card, `spec.ts has no card for "${family.id}"`).toBeTruthy();
      expect(card!.name, `${family.id}: name`).toBe(family.name);
      expect(card!.one, `${family.id}: the one line`).toBe(family.one);
      expect(card!.verdict, `${family.id}: the builder's verdict`).toBe(
        family.verdict,
      );
      expect(card!.rationale, `${family.id}: the rationale`).toBe(
        family.rationale,
      );
      expect(Boolean(card!.recommended), `${family.id}: recommended`).toBe(
        Boolean(family.recommended),
      );
      expect(card!.facts, `${family.id}: the four facts`).toEqual(
        factsFor(family),
      );
    }
  });

  /**
   * ★ A CARD SAYS WHAT KEEPING IT COSTS (the stepped review, 2026-09-16). The
   * one line says what a family IS; `lands` says what the repository does the
   * morning after it wins, which is the half a reviewer cannot read off a
   * picture of a corner.
   */
  it("says what every card lands as", () => {
    for (const card of ROUNDING.candidates) {
      expect(card.lands?.trim(), `${card.id}: no "lands" line`).toBeTruthy();
    }
  });

  it("names exactly one pick, and it is the board's recommendation", () => {
    const marked = SURFACES.filter((c) => c.recommended);
    expect(marked.map((c) => c.id)).toEqual([RECOMMENDED]);
    expect(ROUNDING.verdict.recommendation.startsWith(marked[0].name)).toBe(
      true,
    );
  });

  /**
   * ★ A GAP BELOW ITS PHOTOGRAPH'S CORNER OPENS A HOLE, which is the round's
   * worst finding and the reason the gap is pinned to the tile rather than
   * chosen. A family that declared a gap of its own could reintroduce the bug
   * the board exists to report.
   */
  it("pins every family's gap to its photograph", () => {
    for (const family of SURFACES) {
      expect(family.values.gap, `${family.id}: the gallery gap`).toBe(
        gapFor(family.values.tile),
      );
    }
  });

  it("gives every card four facts, in the same order", () => {
    for (const family of SURFACES) {
      const labels = factsFor(family).map(([label]) => label);
      expect(labels).toEqual(["Surfaces", "Menus", "Photographs", "Buttons"]);
    }
  });

  /** The fourth fact is bible 8's claim as a number, read against the shipped
   *  button rung; a board that quietly moved the rung would make every card's
   *  fourth fact wrong at once. */
  it("reads the button fact off the shipped rung", () => {
    expect(ACTIONS[0].id).toBe("today");
    expect(ACTIONS[0].values.action).toBe(16);
    const soft = SURFACES.find((c) => c.id === "c")!;
    expect(factsFor(soft)[3]).toEqual(["Buttons", "16px, 2x the surface"]);
  });
});
