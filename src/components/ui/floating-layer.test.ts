// @policy: engineering · Bible 15: one floating layer, read from one contract
// @refuses: a floating primitive that spells its own corner, entrance or clock instead of reading floating-layer.ts, a fourth clock rung, and any translucency on a panel while the Glass exploration is banked.

import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  floatingClock,
  floatingCorner,
  floatingEdgeEntranceResponsive,
  floatingRow,
} from "./floating-layer"

/**
 * BIBLE 15'S FIRST TEST (the `floating-surfaces` wiring, 2026-09-17).
 *
 * The rule has been ratified since the nav round and enforced by nothing:
 * "Every floating surface rides the floating-layer contract: one radius, one
 * entrance, one light." With `enforcedBy: "review"` under it the family drifted
 * exactly where nobody was looking. Three drifts, all real, all found by
 * reading rather than by a gate:
 *
 *   - `navigation-menu` shipped `rounded-lg` (the SURFACE corner, 2px then)
 *     and a stock Tailwind shadow, and was outside the family for months;
 *   - `select` shipped `rounded-md border` with no entrance at all, so it was
 *     the one menu in the product that opened on the browser's timing;
 *   - three panels carried three hand-typed clocks (175/120, 150/100, 200/150)
 *     that nobody had ever compared side by side.
 *
 * ★ WHAT THIS POLICY GUARDS IS SINGLE-SOURCING, NOT A LOOK. It never asserts a
 * radius, a duration or a colour: Will retunes those without asking a test, and
 * he said so on this very board ("We can always adjust later once we start
 * implementing everything into the app"). What it refuses is a panel that
 * answers the question LOCALLY, because a rule spelled out in nine className
 * strings is a rule the tenth panel will not know about.
 *
 * ★ AND IT REFUSES TRANSLUCENCY ON A PANEL, on Will's own words. He liked the
 * glass and declined it here: "I prefer not to create a one-off instance of
 * glass here. Rather, let's bank a near-term agent for a dedicated Glass
 * exploration across marketing and app." A `backdrop-blur` added to one panel
 * later is that one-off arriving by the back door. The Glass exploration lifts
 * this guard when it lands; until then a red gate here is the ruling holding.
 *
 * SCOPED `engineering` FOR NOW, like the elevation policy: a design scope has
 * to be cited by a bible rule (rules-registry.test.ts), and bible 15's
 * `enforcedBy` is the Orchestrator's to point at this file. When it does, the
 * scope becomes `shared`, which is what this is.
 *
 * NOT HERE: the shadow (`src/lib/elevation-policy.test.ts` owns the whole
 * elevation family and this file never re-states it), and `drawer.tsx` and
 * `sonner.tsx`, which are listed below with the reason they are outside.
 */
const ROOT = process.cwd()
const UI = "src/components/ui"
const CONTRACT = "floating-layer.ts"

/**
 * THE FAMILY, AND WHAT EACH PANEL MUST READ FROM THE CONTRACT. One row per
 * floating SURFACE rather than per file, because two of them live in one file
 * and a panel is the unit bible 15 talks about.
 *
 * `corner` is the constant that has to appear (`floatingPanel` carries the
 * corner, the material and the light; `floatingCorner` is for the tooltip,
 * which is inverted on purpose and brings its own ink; the sheet has no corner
 * at all because it is anchored to an edge of the screen).
 */
const SURFACES: {
  file: string
  slot: string
  corner: string
  entrance: string
  why: string
}[] = [
  {
    file: "dropdown-menu.tsx",
    slot: "dropdown-menu-content",
    corner: "floatingPanel",
    entrance: "floatingEntrance",
    why: "the menu",
  },
  {
    file: "dropdown-menu.tsx",
    slot: "dropdown-menu-sub-content",
    corner: "floatingPanel",
    entrance: "floatingEntrance",
    why: "the submenu, which is a menu and reads the same lines",
  },
  {
    file: "select.tsx",
    slot: "select-content",
    corner: "floatingPanel",
    entrance: "floatingEntrance",
    why: "the select, brought into the family by this wiring",
  },
  {
    file: "popover.tsx",
    slot: "popover-content",
    corner: "floatingPanel",
    entrance: "floatingEntrance",
    why: "the popover",
  },
  {
    file: "tooltip.tsx",
    slot: "tooltip-content",
    corner: "floatingCorner",
    entrance: "floatingEntrance",
    why: "the tooltip: inverted material on purpose, same corner and entrance",
  },
  {
    file: "dialog.tsx",
    slot: "dialog-content",
    corner: "floatingPanel",
    entrance: "floatingEntrance",
    why: "the dialog (its full-screen takeover is a different KIND of arrival and says so in place)",
  },
  {
    file: "sheet.tsx",
    slot: "sheet-content",
    corner: "",
    entrance: "floatingEdgeEntrance",
    why: "the sheet: no corner, because its edges are the viewport's",
  },
  {
    file: "navigation-menu.tsx",
    slot: "navigation-menu-viewport",
    corner: "floatingPanel",
    entrance: "floatingEntrance",
    why: "the marketing mega-menu",
  },
]

/**
 * OUTSIDE THE CONTRACT, BY NAME AND WITH THE REASON. Short on purpose: an entry
 * added to turn a red gate green, without a reason that survives being read
 * aloud, is the regression this file exists to stop.
 */
const OUTSIDE: Record<string, string> = {
  "drawer.tsx":
    "vaul owns its own drag physics and its entrance is a gesture, not a curve: a clock imposed from outside would fight the drag",
  "sonner.tsx":
    "the toaster is a third-party surface we theme through CSS variables; it already reads --radius-float, and its stack motion is the library's",
  // Arrives with admin-wiring (2026-09-20): a command palette on the raw Radix Dialog, the lab's
  // help-centre pattern as a primitive. Listed ahead of its file so the scan does not go red the
  // day it lands; the Orchestrator moves it into SURFACES at that merge, where it belongs.
  "command-palette.tsx":
    "arrives with admin-wiring; a palette is a combobox in a dialog and reads the contract's corner and clock; moved into SURFACES at its merge",
}

/**
 * THE ONE SANCTIONED SURFACE OUTSIDE `ui/` (the hub's QR mini-modal,
 * hub-wiring 2026-09-20). It is a radix Dialog built in the app layer because
 * its entrance is a VIEW TRANSITION rather than an animation of its own, which
 * `ui/dialog.tsx` cannot express for its other callers. Bible 15 still binds
 * it: it reads the corner, the material, the clock and its (deliberately
 * empty) entrance from the contract, and the block below proves it.
 *
 * ★ IT IS LISTED HERE BECAUSE THE SCAN ABOVE CANNOT SEE IT. "names every
 * floating primitive in the tree" reads `src/components/ui` only, so an
 * app-level portal is exactly the tenth panel this file exists to stop — one
 * that answers the corner and the clock locally where nobody is looking.
 */
const SANCTIONED = {
  path: "src/components/app/share/event-code-modal.tsx",
  slot: "event-code-modal",
  /** It spreads no props, so the fence is its first child. */
  endAt: "<DialogPrimitive.Title",
  why: "the mini-modal: the view transition IS its entrance, and reduced motion falls back to the standard clock",
} as const

const read = (file: string) => readFileSync(join(ROOT, UI, file), "utf8")

/** The className block a surface declares, from its slot to the spread. */
function panelBlock(
  file: string,
  slot: string,
  source?: string,
  /**
   * Where the panel's OWN declaration stops. The ui/ surfaces all spread their
   * props at the end of the opening tag, so `{...props}` is the natural fence.
   * A surface that does not spread needs one given, or the scan runs on into
   * the panel's CHILDREN and reads a close button's `rounded-full` as the
   * panel answering its corner locally.
   */
  endAt = "{...props}",
): string {
  const src = source ?? read(file)
  const at = src.indexOf(`data-slot="${slot}"`)
  expect(at, `${file} declares no ${slot}`).toBeGreaterThan(-1)
  const end = src.indexOf(endAt, at)
  return src.slice(at, end > at ? end : at + 4000)
}

describe("bible 15: one floating layer, read from one contract", () => {
  it("names every floating primitive in the tree, so a tenth cannot arrive unseen", () => {
    // A radix panel is a Portal plus a Content, which is what every surface in
    // the family is and what a new one would be. Anything in ui/ that portals
    // is either in the table above or in OUTSIDE with a reason.
    const portals = readdirSync(join(ROOT, UI))
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => /Primitive\.Portal|from "vaul"|from "sonner"/.test(read(f)))
    const known = new Set([...SURFACES.map((s) => s.file), ...Object.keys(OUTSIDE)])
    expect(
      portals.filter((f) => !known.has(f)),
      "a floating primitive nobody listed: add it to SURFACES, or to OUTSIDE with the reason it is not in the family",
    ).toEqual([])
  })

  it("reads the corner, the entrance and a clock from the contract, never from itself", () => {
    for (const { file, slot, corner, entrance, why } of SURFACES) {
      const block = panelBlock(file, slot)
      if (corner) {
        expect(block, `${slot} (${why}) declares no shared corner`).toContain(
          corner,
        )
      }
      expect(block, `${slot} (${why}) declares no shared entrance`).toContain(
        entrance,
      )
      // A clock is either one of the contract's rungs or the marketing nav's
      // tuner knob, whose default IS a rung (marketing.css, the 2026-08-28 nav
      // ruling). Never a number typed here.
      expect(
        /floatingClock\.|--mkt-dropdown-open-ms/.test(block),
        `${slot} (${why}) sets no clock from the contract`,
      ).toBe(true)
    }
  })

  it("types no corner and no duration by hand on a panel", () => {
    const hits: string[] = []
    for (const { file, slot } of SURFACES) {
      const block = panelBlock(file, slot)
      // Unprefixed only: a `variant:rounded-*` is a copy under a variant the
      // shared constant cannot carry, and it says so where it is written.
      for (const m of block.matchAll(/(?<![\w:-])rounded-[\w[\]./()-]+/g))
        hits.push(`${slot}: ${m[0]}`)
      for (const m of block.matchAll(
        /(?<![\w:-])(?:data-closed:)?duration-(?:\d+|\[\d+m?s\])/g,
      ))
        hits.push(`${slot}: ${m[0]}`)
    }
    expect(
      hits,
      "a corner or a clock answered locally: read floatingPanel / floatingCorner / floatingRow and floatingClock instead",
    ).toEqual([])
  })

  it("puts no glass on a panel while the Glass exploration is banked", () => {
    // Will, 2026-09-17: he preferred the glassy background AND refused a
    // one-off of it here. A scrim's blur is not a panel's material, which is
    // why this reads the panel block and not the file.
    const hits: string[] = []
    for (const { file, slot } of SURFACES) {
      const block = panelBlock(file, slot)
      for (const m of block.matchAll(/backdrop-(?:blur|filter)|color-mix/g))
        hits.push(`${slot}: ${m[0]}`)
    }
    expect(
      hits,
      "translucency on a floating panel: the dedicated Glass exploration owns that change (Will, 2026-09-17)",
    ).toEqual([])
  })

  it("keeps the corner derived from one token and the clocks to three rungs", () => {
    // The pair Will ruled nests (`radius=nested`, confirmed by
    // `roundness=nested`), and the corner ladder sized it: a 12px panel around
    // 8px rows under family C (2026-09-18), 8 and 4 before it. The VALUES are
    // globals.css's and no test here asserts them; what is pinned is that the
    // row is DERIVED from the panel's token, so retuning one token moves both
    // (C's retune did exactly that) and bible 9's nested corner cannot drift.
    expect(floatingCorner).toBe("rounded-float")
    // The row is a calc OFF the panel's token (the subtracted px is the panel's
    // own padding, bible 9's gap), never a radius of its own.
    expect(floatingRow).toMatch(/^rounded-\[calc\(var\(--radius-float\)/)

    // Three rungs, like the elevation family's two shadows: with a short list
    // in reach the question a panel answers is "how often is this opened?"
    // (bible 12), which has an answer. A scale invites picking by eye.
    expect(Object.keys(floatingClock).sort()).toEqual([
      "edge",
      "instant",
      "standard",
    ])
    for (const [rung, value] of Object.entries(floatingClock)) {
      const [enter, exit] = [...value.matchAll(/(\d+)m?s|duration-(\d+)/g)].map(
        (m) => Number(m[1] ?? m[2]),
      )
      // The house rule the whole site keeps: an exit is faster than its entrance.
      expect(exit, `${rung} exits no faster than it enters`).toBeLessThan(enter)
      // Bible 12's ceiling for anything that is not a rare delight.
      expect(enter, `${rung} is over the 300ms ceiling`).toBeLessThanOrEqual(300)
    }
  })

  it("keeps the one responsive sheet in the contract, not in the sheet", () => {
    // Will, `settings=sheet` (2026-09-20): "we likely want to apply this sheet
    // concept everywhere". A side panel at a desk and a bottom sheet in a hand
    // are one surface, so the posture pair lives HERE and the sheet opts in
    // with a boolean rather than spelling a second set of edges for itself.
    const sheet = read("sheet.tsx")
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
    // The corner it does take is the family's token, never one of its own.
    expect(
      floatingEdgeEntranceResponsive.includes("rounded-t-float"),
      "the bottom sheet's one non-viewport edge left the shared corner token",
    ).toBe(true)
  })

  it("holds the sanctioned no-entrance surface to every other clause", () => {
    const src = readFileSync(join(ROOT, SANCTIONED.path), "utf8")
    const block = panelBlock(
      SANCTIONED.path,
      SANCTIONED.slot,
      src,
      SANCTIONED.endAt,
    )
    // The corner, the material and the light: the family's, from one constant.
    expect(
      block,
      `${SANCTIONED.slot} (${SANCTIONED.why}) declares no shared corner`,
    ).toContain("floatingPanel")
    // The entrance is EMPTY on purpose, and that emptiness is itself read from
    // the contract, so it is a decision the family made rather than an omission.
    expect(
      block,
      `${SANCTIONED.slot} declares no entrance from the contract`,
    ).toContain("floatingTransitionEntrance")
    expect(
      /floatingClock\./.test(block),
      `${SANCTIONED.slot} sets no clock from the contract`,
    ).toBe(true)
    // And it answers nothing locally: no corner of its own, no duration of its
    // own. `max-sm:rounded-none` is prefixed, which is a variant the shared
    // constant cannot carry and says so where it is written.
    const local: string[] = []
    for (const m of block.matchAll(/(?<![\w:-])rounded-[\w[\]./()-]+/g))
      local.push(m[0])
    for (const m of block.matchAll(
      /(?<![\w:-])(?:data-closed:)?duration-(?:\d+|\[\d+m?s\])/g,
    ))
      local.push(m[0])
    expect(
      local,
      "the mini-modal answered a corner or a clock locally",
    ).toEqual([])
    // No glass, on the same ruling as every other panel.
    expect(
      [...block.matchAll(/backdrop-(?:blur|filter)|color-mix/g)].map((m) => m[0]),
      "translucency on the mini-modal: the Glass exploration owns that change",
    ).toEqual([])
  })

  it("keeps the contract itself free of a second opinion", () => {
    // Comments here name the banned things on purpose (they say WHY they are
    // banned), so the scan reads the code and not the prose.
    const src = readFileSync(join(ROOT, UI, CONTRACT), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
    // The module is the one home for the corner and the entrance; it must not
    // also re-declare the shadow, which the elevation policy owns.
    expect(src).not.toMatch(/shadow-(?:lift|2xs|xs|sm|md|lg|xl|2xl)\b/)
    expect(src).not.toMatch(/backdrop-(?:blur|filter)/)
  })
})
