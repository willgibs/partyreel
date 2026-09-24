import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  floatingCrossSlide,
  floatingEdgeEntranceResponsive,
} from "./floating-layer"

/**
 * THE FLOATING LAYER'S TWO MECHANISMS THAT FAIL QUIETLY. Neither pins how a
 * panel looks (its corner, its clock, its material are shown in the Library
 * and tuned freely):
 *
 * - the responsive sheet's posture lives in the contract and every rule in it
 *   is scoped to its own side, so it can never fight one of the four fixed
 *   sides in a specificity race;
 * - the cross-slide's direction and blur ride `motion-safe`, so reduced motion
 *   gets the plain fade by the class simply not existing.
 */
const ROOT = process.cwd()

describe("the floating layer's mechanisms", () => {
  it("keeps the one responsive sheet in the contract, scoped to its own side", () => {
    // A side panel at a desk and a bottom sheet in a hand are one surface, so
    // the posture pair lives in the contract and the sheet opts in with a
    // boolean rather than spelling a second set of edges for itself.
    const sheet = readFileSync(join(ROOT, "src/components/ui/sheet.tsx"), "utf8")
    expect(
      sheet.includes("floatingEdgeEntranceResponsive"),
      "the sheet stopped reading the responsive posture from the contract",
    ).toBe(true)
    // A side of its own is what keeps it out of a specificity race with the
    // four fixed sides, so every rule in the constant is scoped to that side.
    const scoped = floatingEdgeEntranceResponsive
      .split(" ")
      .filter((c) => !c.startsWith("data-[side=responsive]:"))
    expect(
      scoped,
      "a responsive-sheet utility that is not scoped to its own side: it will fight one of the four fixed sides",
    ).toEqual([])
  })

  it("keeps the cross-slide a fade at its floor, with direction and blur behind motion-safe", () => {
    // The baseline fade has no variant at all: it is what every state gets,
    // reduced motion included.
    expect(floatingCrossSlide).toMatch(
      /data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0/,
    )
    // Direction and blur are gated on motion-safe (never unprefixed, or
    // reduced motion would need to out-specificity its own travel instead of
    // the class simply not existing under that media query).
    for (const utility of [
      "data-[motion=from-end]:slide-in-from-right-8",
      "data-[motion=from-start]:slide-in-from-left-8",
      "data-[motion=to-end]:slide-out-to-right-8",
      "data-[motion=to-start]:slide-out-to-left-8",
      "data-[motion^=from-]:blur-in-[3px]",
      "data-[motion^=to-]:blur-out-[3px]",
    ]) {
      expect(
        floatingCrossSlide,
        `${utility} rides unprefixed: reduced motion would have to out-specificity it rather than it simply being absent`,
      ).toContain(`motion-safe:${utility}`)
    }
  })
})
