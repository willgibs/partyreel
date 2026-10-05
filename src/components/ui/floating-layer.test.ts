import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  floatingCrossSlide,
  floatingEdgeEntranceResponsive,
  floatingGutter,
  floatingPopupShapes,
} from "./floating-layer"
import { POPUP_KINDS, isDialogShape } from "./popup-kinds"

/**
 * THE FLOATING LAYER'S TWO MECHANISMS THAT FAIL QUIETLY. Neither pins how a
 * panel looks (its corner, its clock, its material are shown in the Library
 * and tuned freely):
 *
 * - the responsive sheet's posture lives in the contract and every rule in it
 *   is scoped to its own side, so it can never fight one of the four fixed
 *   sides in a specificity race;
 * - the cross-slide's direction and blur ride `motion-safe`, so reduced motion
 *   gets the plain fade by the class simply not existing;
 * - every popup shape is scoped to its own `data-shape`, and every dialog shape
 *   the one table names has rules to stand on (`popups` r1).
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

describe("the gutter at the glass", () => {
  it("★ is the contract's one number on every anchored layer that keeps one", () => {
    // Red-team 51's NIT: the storage ring's popover sat flush to the left edge at 375 because it set no
    // `collisionPadding` at all. The menus' 8 is `floatingGutter` now, so a layer that keeps a gutter reads it, and a
    // literal typed back in is a second number the next retune would miss. Two menus that name the gutter for their
    // own reason (the Display menu's panel scrolls inside the room it leaves; the profile menu hangs from its trigger's
    // side at a phone) each typed that 8 until crumbs-70 had them read it.
    for (const file of [
      "src/components/ui/popover.tsx",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/responsive-menu.tsx",
      "src/components/ui/tooltip.tsx",
      "src/components/app/dashboard/display-menu.tsx",
      "src/components/social/profile-actions-menu.tsx",
    ]) {
      const source = readFileSync(join(ROOT, file), "utf8")
      expect(source, `${file} stopped reading the gutter`).toMatch(
        /\bfloatingGutter\b/,
      )
      expect(
        source,
        `${file} types a gutter of its own`,
      ).not.toMatch(/collisionPadding\s*(=|:)\s*\{?\s*\d/)
    }
    expect(floatingGutter).toBe(8)
  })
})

describe("the popup's shapes", () => {
  it("scopes every shape's rule to a shape of its own", () => {
    // One element wears any shape the table picks, so a rule that is not
    // scoped to its shape would stand under every other shape too.
    const loose = floatingPopupShapes
      .split(" ")
      .filter((c) => !/^data-\[shape=[a-z]+\]:/.test(c))
    expect(
      loose,
      "a popup-shape utility that is not scoped to its own data-shape",
    ).toEqual([])
  })

  it("draws every dialog shape the table names", () => {
    // A row that names a shape with no rules would open a popup with no
    // position at all: at the viewport's corner, the size of its words.
    const drawn = new Set(
      [...floatingPopupShapes.matchAll(/data-\[shape=([a-z]+)\]:/g)].map(
        (m) => m[1],
      ),
    )
    for (const [kind, row] of Object.entries(POPUP_KINDS)) {
      for (const shape of [row.desk, row.hand]) {
        if (!isDialogShape(shape)) continue
        expect(drawn.has(shape), `${kind}'s ${shape} has no rules`).toBe(true)
      }
    }
  })
})
