import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  floatingDisplay,
  floatingDisplayPanel,
  floatingPanel,
  floatingTip,
  floatingWorkSurface,
} from "./floating-layer"

/**
 * THE DISPLAY'S MECHANISMS THAT FAIL QUIETLY (identity r2, layers=display,
 * wired 2026-10-03; its room's grade is room=graphite, identity r3). None pins
 * how the display looks (its greys and its corner are tuned freely in
 * globals.css and floating-layer.ts):
 *
 * - `.surface-display` is a GROUND, so it carries every token a part inside it
 *   reads, in whole pairs: a pair it leaves out resolves to the page's ground
 *   instead, and a muted line, a separator or a row's glyph paints in paper's
 *   ink on the near-black screen, which no other check sees;
 * - the screen is ONE SET PER GROUND (near-black on paper, lit graphite in the
 *   room), declared in whole on both, and `.surface-display` reads the set for
 *   every value that differs between them: a grey typed into the ground
 *   instead would keep paper's value in the room, and half of graphite would
 *   look wired while the rest did not;
 * - `--signal` (the live mark's red) is re-declared beside `--destructive` in
 *   every set that declares it: a var() in a custom property resolves where it
 *   is declared, so a set that moves the red without it carries another
 *   ground's red into this one;
 *
 * and which layers wear it, read off their source the way the floating-layer
 * contract's own test reads the sheet: the quick layers are the display, the
 * work layers (a host works in them) stay the body's.
 */
const ROOT = process.cwd()
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8")
const globals = read("src/app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "")

/** The declarations of the one top-level block opened by `selector {`. */
function block(selector: string): string {
  const at = globals.indexOf(`\n${selector} {`)
  expect(at, `${selector} has no block in globals.css`).toBeGreaterThan(-1)
  const open = globals.indexOf("{", at)
  return globals.slice(open + 1, globals.indexOf("}", open))
}

const declares = (body: string, token: string) =>
  new RegExp(`(^|[;\\s])${token}\\s*:`).test(body)

describe("the display's ground", () => {
  const display = block(".surface-display")

  it("carries every token a part reads, in whole pairs", () => {
    const pairs = [
      ["--background", "--foreground"],
      ["--card", "--card-foreground"],
      ["--popover", "--popover-foreground"],
      ["--primary", "--primary-foreground"],
      ["--secondary", "--secondary-foreground"],
      ["--muted", "--muted-foreground"],
      ["--accent", "--accent-foreground"],
      ["--border", "--input"],
      ["--brand", "--brand-foreground"],
    ]
    for (const pair of pairs)
      for (const token of pair)
        expect(
          declares(display, token),
          `.surface-display leaves ${token} to the ground under it`,
        ).toBe(true)
    for (const token of ["--faint", "--ring", "--destructive", "--signal"])
      expect(declares(display, token), token).toBe(true)
    expect(display).toMatch(/color-scheme:\s*dark/)
  })

  it("★ is one screen per ground: paper and the room declare the whole set, and the ground reads it", () => {
    // Paper's set rides the block `.surface-paper` aliases (so a paper subtree inside the room takes paper's again);
    // the room's rides `.dark`. A token declared on one alone leaves the other ground with nothing, or, on `:root`
    // alone, with a value the room could never differ from.
    const named = (body: string) =>
      [...body.matchAll(/(--display(?:-[a-z]+)?)\s*:/g)].map(([, t]) => t).sort()
    const paper = named(block(".surface-paper"))
    expect(paper.length, "paper declares no display set").toBeGreaterThan(1)
    expect(named(block(".dark")), "the room's display set is not paper's, token for token").toEqual(paper)
    expect(display).toMatch(/--popover:\s*var\(--display\)/)
    expect(display).toMatch(/--background:\s*var\(--display\)/)
  })

  it("★ reads, never types, the values that differ between the grounds", () => {
    // The step, the muted words, the caption grey, the lines: each is a ground's own, so a literal here would be
    // paper's value on graphite.
    for (const token of [
      "--card",
      "--muted",
      "--muted-foreground",
      "--faint",
      "--border",
      "--input",
    ])
      expect(
        display,
        `.surface-display types ${token} instead of reading the ground's --display* token`,
      ).toMatch(new RegExp(`${token}:\\s*var\\(--display`))
  })
})

describe("the recording red", () => {
  it("is re-declared beside --destructive in every set that declares it", () => {
    const sets = [...globals.matchAll(/\n([^\n{}@]+)\{([^{}]*)\}/g)]
    const reds = sets.filter(([, , body]) => declares(body, "--destructive"))
    expect(reds.length, "no set declares --destructive").toBeGreaterThan(2)
    for (const [, selector, body] of reds)
      expect(
        body,
        `${selector.trim()} moves --destructive without --signal`,
      ).toMatch(/--signal:\s*var\(--destructive\)/)
  })
})

describe("which layers are the display", () => {
  it("makes the display one material the quick panels and the tooltip share", () => {
    expect(floatingDisplay.split(" ")).toContain("surface-display")
    expect(floatingDisplayPanel).toContain(floatingDisplay)
    expect(floatingTip).toContain(floatingDisplay)
    expect(floatingPanel).not.toContain("surface-display")
    expect(floatingWorkSurface).not.toContain("surface-display")
  })

  it("dresses every quick layer in it", () => {
    for (const [file, count] of [
      ["src/components/ui/dropdown-menu.tsx", 2],
      ["src/components/ui/select.tsx", 1],
      ["src/components/ui/popover.tsx", 1],
      ["src/components/ui/responsive-menu.tsx", 3],
      ["src/components/ui/command-palette.tsx", 1],
    ] as const) {
      const source = read(file)
      expect(
        source.match(/\bfloatingDisplayPanel\b/g)?.length ?? 0,
        `${file}: a quick layer that is not the display`,
      ).toBeGreaterThanOrEqual(count + 1) // the import, then each panel
      expect(source, `${file} still wears the body's panel`).not.toMatch(
        /\bfloatingPanel\b/,
      )
    }
    expect(read("src/components/ui/tooltip.tsx")).toMatch(/\bfloatingTip\b/)
    const toaster = read("src/components/ui/sonner.tsx")
    expect(toaster).toMatch(/toast:\s*"[^"]*\bsurface-display\b/)
    expect(toaster).toMatch(/"--normal-bg":\s*"var\(--display\)"/)
  })

  it("★ outlines its chosen row in the ground's own cursor, never a foreground at an alpha", () => {
    // The row a pointer or a key holds is a wash and an outline, and the outline is `--display-cursor` (fifty percent
    // on paper's display, fifty-five on the room's graphite): a `ring-foreground/50` typed back in is paper's value
    // in the room, which nothing else would see.
    for (const file of [
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/select.tsx",
      "src/components/ui/responsive-menu.tsx",
      "src/components/ui/command-palette.tsx",
    ]) {
      const source = read(file)
      expect(source, `${file}: a chosen row without the cursor`).toMatch(
        /ring-\(color:--display-cursor\)/,
      )
      expect(source, `${file}: a chosen row typed as a foreground alpha`).not.toMatch(
        /ring-foreground\/50/,
      )
    }
  })

  it("leaves the work layers in the body, where a host works", () => {
    for (const file of [
      "src/components/ui/popup.tsx",
      "src/components/ui/dialog.tsx",
      "src/components/ui/sheet.tsx",
    ])
      expect(
        read(file),
        `${file} wears the display: a work layer is the body's`,
      ).not.toMatch(/surface-display|floatingDisplay/)
  })
})
