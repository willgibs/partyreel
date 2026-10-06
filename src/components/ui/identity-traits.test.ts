import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { entries } from "@/testing/source-tree"

import { badgeVariants } from "./badge"
import { buttonVariants } from "./button"
import {
  floatingDisplay,
  floatingDisplayPanel,
  floatingTip,
  floatingTipCorner,
  floatingWorkSurface,
} from "./floating-layer"
import { navigationMenuTriggerStyle } from "./navigation-menu"
import { toggleVariants } from "./toggle-group"

/**
 * WILL'S THREE SETTLED TRAITS, EACH IN ONE HOME (identity r4 on his desk 3:
 * focus=halo, press=shrink, edge=floating). What is held here is what fails
 * quietly: a focusable atom drawing a ring of its own beside the halo (his r2
 * note: "some focuses rings, some corners, which is bad"), an action pressing
 * on a scale of its own, a floating layer keeping its hairline, and the
 * mechanisms each trait stands on. How each looks (its tokens, its timings)
 * is shown in the Library and tuned freely in globals.css.
 */

const ROOT = process.cwd()
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8")
const css = read("src/app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "")

/** The body of the block whose `{` is at `open`. */
function body(text: string, open: number): string {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++
    else if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i)
  }
  throw new Error("unbalanced braces in globals.css")
}

/** The body of the first top-level block opened by `head`. */
function block(head: string): string {
  const at = css.indexOf(head)
  expect(at, `${head} is missing from globals.css`).toBeGreaterThan(-1)
  return body(css, css.indexOf("{", at))
}

/** The atoms' sources, tests aside. */
const UI = entries("src/components/ui")
  .map((entry) => entry.name)
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))

const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
  "on-photo",
  "glass",
] as const
const SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "cta",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
  "icon-cta",
] as const

/** A focus or press treatment an atom spells for itself (a variant's ring, outline or border, an active scale). */
const OWN_FOCUS = /(?:^|[\s"'`])(?:[^\s:"'`]+:)*focus(?:-visible)?:(?:ring|outline|border)[^\s"'`]*/g
const OWN_PRESS = /(?:^|[\s"'`])(?:[^\s:"'`]+:)*(?:active|group-active\/[\w-]+):(?:not-[^\s:"'`]+:)?scale-[^\s"'`]*/g

/** Whether `text` holds each of `parts`, in order. */
const inOrder = (text: string, parts: string[]) => {
  let at = 0
  for (const part of parts) {
    const next = text.indexOf(part, at)
    if (next < 0) return false
    at = next + part.length
  }
  return true
}

/**
 * The rows of a display's list keep the display's own cursor (their wash and an
 * inset outline in `--display-cursor`, layers=display): a row is chosen, not
 * focused like an atom. The marketing panel's links give the ring slot back
 * to their row's wash the same way.
 */
const ROW_CURSOR = new Set([
  "focus:ring-[1.5px]",
  "focus:ring-(color:--display-cursor)",
  "focus:ring-inset",
  "focus-visible:ring-[1.5px]",
  "focus-visible:ring-(color:--display-cursor)",
  "focus-visible:ring-inset",
  "data-[variant=destructive]:focus:ring-destructive/50",
  "**:data-[slot=navigation-menu-link]:focus:ring-0",
  "**:data-[slot=navigation-menu-link]:focus:outline-none",
])

describe("the focus halo: `focus-halo` (focus=halo)", () => {
  const halo = () => block("@utility focus-halo")

  it("is drawn whole in the ring slot, so a call site's own ring replaces it, band and all", () => {
    const utility = halo()
    const focused = body(utility, utility.indexOf("{", utility.indexOf(":is(:focus-visible, [data-halo])")))
    // The band, the line in the halo's ink and the bloom, in that order, in ONE slot: a band left in
    // `--tw-ring-offset-shadow` would outlive a call site's `focus-visible:ring-0` as a painted moat.
    expect(
      inOrder(focused, ["--tw-ring-shadow:", "var(--halo-band", "var(--halo-ink)", "0 -1px", "var(--halo-bloom)"])
    ).toBe(true)
    expect(focused).not.toMatch(/--tw-ring-offset-shadow\s*:/)
    // Composed as every shadow utility composes, so the atom's own shadow stays under it.
    expect(focused).toMatch(
      /box-shadow:\s*var\(--tw-inset-shadow[^;]*var\(--tw-ring-shadow\)[^;]*var\(--tw-shadow/
    )
    expect(focused).toMatch(/outline:\s*none/)
  })

  it("arrives in one beat out of a registered number, and steps aside for a working control", () => {
    expect(halo()).toMatch(
      /:not\(\[aria-busy="true"\], \[data-quiet-focus\]\)\s*\{\s*animation:\s*halo-arrive 140ms var\(--ease-emphasis\)/
    )
    expect(css).toMatch(
      /@property --halo-t\s*\{\s*syntax:\s*"<number>";\s*inherits:\s*false;\s*initial-value:\s*1;\s*\}/
    )
    expect(css).toMatch(/@keyframes halo-arrive\s*\{\s*from\s*\{\s*--halo-t:\s*0;\s*\}\s*\}/)
  })

  it("draws its line in the destructive colour on an atom in error, and an outline where colours are forced", () => {
    expect(halo()).toMatch(/&\[aria-invalid="true"\]\s*\{\s*--halo-alert:\s*var\(--destructive\)/)
    expect(halo()).toMatch(/@media \(forced-colors: active\)\s*\{[^}]*\{\s*outline:\s*2px solid CanvasText/)
  })

  it("stands on every ground: its band and bloom are declared on each, and a photograph's travel with its two actions", () => {
    for (const ground of ["\n:root,\n.surface-paper {", "\n.dark {", "\n.surface-ink {", "\n.surface-display {"]) {
      const set = block(ground)
      expect(set, `${ground.trim()} leaves the halo's band to the ground under it`).toMatch(/--halo-gap:/)
      expect(set, `${ground.trim()} leaves the halo's bloom to the ground under it`).toMatch(/--halo-bloom:/)
    }
    const photo = block('[data-surface="photo"],\n[data-variant="on-photo"],\n[data-variant="glass"] {')
    for (const token of ["--halo-gap", "--halo-bloom", "--halo-line", "--halo-veil"])
      expect(photo, token).toMatch(new RegExp(`${token}:`))
  })

  it("is worn by every button, chip, segment, badge and nav trigger, in every variant and size", () => {
    for (const variant of VARIANTS)
      for (const size of SIZES) {
        const classes = buttonVariants({ variant, size })
        expect(classes, `Button ${variant}/${size}`).toMatch(/(^|\s)focus-halo(\s|$)/)
        expect(classes.match(OWN_FOCUS), `Button ${variant}/${size} draws a focus mark of its own`).toBeNull()
      }
    for (const variant of ["default", "outline"] as const)
      for (const size of ["default", "sm"] as const)
        expect(toggleVariants({ variant, size }), `a toggle ${variant}/${size}`).toMatch(/(^|\s)focus-halo(\s|$)/)
    expect(badgeVariants({ variant: "link" })).toMatch(/(^|\s)focus-halo(\s|$)/)
    expect(navigationMenuTriggerStyle()).toMatch(/(^|\s)focus-halo(\s|$)/)
  })

  it("is worn by every other focusable atom: the fields, the switch, a tab, the head's atoms, the code field's caret slot", () => {
    for (const file of [
      "input.tsx",
      "textarea.tsx",
      "select.tsx",
      "switch.tsx",
      "tabs.tsx",
      "shutter.tsx",
      "code-chip.tsx",
      "code-mat.tsx",
      "glyph-count.tsx",
      "input-otp.tsx",
      "navigation-menu.tsx",
      "responsive-menu.tsx",
      "sonner.tsx",
    ])
      expect(read(`src/components/ui/${file}`), `${file} has an atom without the halo`).toMatch(/\bfocus-halo\b/)
    // The caret's slot stands for the field's focus, which input-otp's hidden input holds.
    expect(read("src/components/ui/input-otp.tsx")).toMatch(/data-halo=\{isActive \? "" : undefined\}/)
  })

  it("★ is the only focus mark an atom draws: none spells a ring, an outline or a border of its own", () => {
    const own: string[] = []
    for (const file of UI)
      for (const m of read(`src/components/ui/${file}`).matchAll(OWN_FOCUS)) {
        const token = m[0].replace(/^[\s"'`]+/, "")
        if (!ROW_CURSOR.has(token)) own.push(`${file}: ${token}`)
      }
    expect(own, "an atom with a focus mark of its own beside the halo").toEqual([])
  })

  it("leaves at once: no focusable atom transitions its box-shadow, since the halo arrives in a beat of its own", () => {
    for (const classes of [
      buttonVariants({}),
      toggleVariants({}),
      read("src/components/ui/select.tsx"),
      read("src/components/ui/switch.tsx"),
      read("src/components/ui/tabs.tsx"),
      read("src/components/ui/input-otp.tsx"),
    ]) {
      expect(classes).not.toMatch(/transition-\[[^\]]*box-shadow/)
      expect(classes).not.toMatch(/(^|\s)transition-all(\s|$)/)
    }
  })

  // Reshaped with identity r5 (set=house): the resting error ring was an OUTER ring that had to step aside
  // (`aria-invalid:not-focus-visible:ring-3`), since it shared the halo's slot. It is drawn INSIDE now, in
  // the inset ring's slot (a key's and a switch's `inset-ring`, a field's well rim), so it stays while the
  // halo stands round it. The scar kept: an outer error ring would still replace the halo.
  it("lets an atom in error show where the keyboard is: its error is drawn inside, never in the halo's slot", () => {
    for (const file of ["button.tsx", "switch.tsx"]) {
      const source = read(`src/components/ui/${file}`)
      expect(source, file).toMatch(/aria-invalid:inset-ring-destructive/)
    }
    for (const file of ["input.tsx", "textarea.tsx", "select.tsx"])
      expect(read(`src/components/ui/${file}`), file).toMatch(/\bfield-well\b/)
    expect(block("@utility field-well")).toMatch(
      /&\[aria-invalid="true"\]\s*\{\s*--tw-inset-ring-shadow:\s*inset 0 0 0 1px var\(--destructive\)/
    )
    for (const file of ["button.tsx", "input.tsx", "textarea.tsx", "switch.tsx", "select.tsx"])
      expect(read(`src/components/ui/${file}`), `${file}'s error ring would replace the halo`).not.toMatch(
        /aria-invalid:(?:not-focus-visible:)?ring-/
      )
  })

  it("stays off a trigger a layer handed its focus back to after a pointer's choice (red-team 56)", () => {
    expect(halo()).toMatch(/&:is\(:focus-visible, \[data-halo\]\):not\(\[data-quiet-focus\]\)\s*\{/)
    expect(read("src/components/ui/dropdown-menu.tsx")).toMatch(/quietFocusAfterPointer\(\)/)
    expect(read("src/components/ui/responsive-menu.tsx")).toMatch(/giveFocusBack\(/)
  })

  it("stands beyond the shutter's own light, its line an outline over the glow", () => {
    const sheet = read("src/components/ui/shutter.css")
    expect(sheet).toMatch(/--halo-at:\s*7px/)
    expect(sheet).toMatch(/--halo-band:\s*var\(--halo-veil, transparent\)/)
    expect(sheet).toMatch(/\.shutter:focus-visible\s*\{\s*outline:\s*2px solid var\(--halo-ink\)/)
  })
})

describe("the press: `press-shrink` (press=shrink)", () => {
  const press = () => block("@utility press-shrink")

  it("lands at once, never while off, working or opening a layer, and gives by the atom's own measure", () => {
    // Whitespace folded: the formatter may break the selector across lines.
    expect(press().replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")")).toMatch(
      /&:active:not\(:disabled, \[data-disabled\], \[aria-busy="true"\], \[aria-haspopup\]\) \{ scale: var\(--press-scale, 0\.96\); transition-duration: 0ms !important;/
    )
  })

  it("is worn by every button in every variant and size, each size naming its give", () => {
    const give: Record<(typeof SIZES)[number], string | null> = {
      default: null,
      lg: null,
      xs: "0.95",
      sm: "0.95",
      cta: "0.98",
      icon: "0.92",
      "icon-xs": "0.92",
      "icon-sm": "0.92",
      "icon-lg": "0.92",
      "icon-cta": "0.92",
    }
    for (const variant of VARIANTS)
      for (const size of SIZES) {
        const classes = buttonVariants({ variant, size })
        expect(classes, `Button ${variant}/${size}`).toMatch(/(^|\s)press-shrink(\s|$)/)
        const scale = /\[--press-scale:([\d.]+)\]/.exec(classes)?.[1] ?? null
        expect(scale, `Button ${size}'s give`).toBe(give[size])
      }
  })

  it("is worn by the chips, the segments, a tab, the head's atoms and the Add's Cancel", () => {
    expect(toggleVariants({})).toMatch(/press-shrink \[--press-scale:0\.95\]/)
    expect(read("src/components/ui/tabs.tsx")).toMatch(/press-shrink \[--press-scale:0\.95\]/)
    expect(read("src/components/ui/code-chip.tsx")).toMatch(/press-shrink \[--press-scale:0\.92\]/)
    expect(read("src/components/ui/code-mat.tsx")).toMatch(/press-shrink \[--press-scale:0\.98\]/)
    expect(read("src/components/ui/responsive-menu.tsx")).toMatch(/press-shrink \[--press-scale:0\.98\]/)
    expect(read("src/components/ui/shutter.tsx")).toMatch(/\bpress-shrink\b/)
    expect(read("src/components/ui/shutter.css")).toMatch(/--press-scale:\s*0\.94/)
  })

  it("★ is the only press an atom draws: none presses on a scale of its own", () => {
    const own: string[] = []
    for (const file of UI)
      for (const m of read(`src/components/ui/${file}`).matchAll(OWN_PRESS)) own.push(`${file}: ${m[0].replace(/^[\s"'`]+/, "")}`)
    expect(own, "an atom pressing on a scale of its own").toEqual([])
  })

  it("lets go on the atom's own transition, which names scale", () => {
    expect(buttonVariants({})).toMatch(/transition-\[[^\]]*\bscale\b[^\]]*\]/)
    expect(toggleVariants({})).toMatch(/transition-\[[^\]]*\bscale\b[^\]]*\]/)
    expect(read("src/components/ui/tabs.tsx")).toMatch(/transition-\[[^\]]*\bscale\b[^\]]*\]/)
    for (const file of ["code-chip.tsx", "code-mat.tsx", "responsive-menu.tsx"])
      expect(read(`src/components/ui/${file}`), file).toMatch(/transition-transform/)
    expect(read("src/components/ui/shutter.css")).toMatch(/scale 150ms var\(--ease-emphasis\)/)
  })
})

describe("the edge on what floats (edge=floating)", () => {
  it("takes the place of the display's hairline, on every quick layer and tooltip", () => {
    const parts = floatingDisplay.split(" ")
    expect(parts).toContain("lit-display")
    expect(parts.filter((c) => /^ring-/.test(c)), "the display keeps a hairline beside its light").toEqual([])
    expect(floatingDisplayPanel).toContain(floatingDisplay)
    expect(floatingTip).toContain(floatingDisplay)
  })

  it("lights every work layer in the room, through the one material they all read", () => {
    expect(floatingWorkSurface.split(" ")).toContain("lit-work")
    for (const file of ["popup.tsx", "dialog.tsx", "sheet.tsx"])
      expect(read(`src/components/ui/${file}`), `${file} spells a work layer's material of its own`).toMatch(
        /\bfloatingWorkSurface\b/
      )
  })

  it("is the media's pixel and falloff, generated only where it can be drawn right, and never takes a tap", () => {
    const supports = css.slice(css.indexOf(".lit-display::after,") - 200)
    expect(supports).toMatch(/@supports \(color: color-mix\(in oklab, red, red\)\) and/)
    const ring = body(css, css.indexOf("{", css.indexOf(".lit-display::after,")))
    expect(ring).toMatch(/pointer-events:\s*none/)
    expect(ring).toMatch(/border:\s*solid transparent;\s*border-width:\s*var\(--lit-widths\)/)
    expect(ring).toMatch(/mask-clip:\s*padding-box, border-box/)
    expect(ring).toMatch(/radial-gradient\(\s*var\(--lit-spread\),\s*var\(--lit-light\) 0%/)
  })

  it("is the screen's own light on both grounds, a work layer's in the room alone, on its free edge", () => {
    expect(block(".lit-display,\n[data-sonner-toaster] [data-sonner-toast][data-styled=\"true\"] {")).toMatch(
      /--lit-light:\s*var\(--display-light\)/
    )
    const work = block("\n.lit-work {")
    expect(work).toMatch(/--lit-light:\s*transparent/)
    expect(work).toMatch(/@variant dark\s*\{\s*--lit-light:\s*color-mix\(in oklab, var\(--foreground\) 46%, transparent\)/)
    // Lit shapes only: a dialog all round, a sheet along its top, a panel down its left; never a whole screen.
    const lit = /\.lit-work:is\(([^)]*)\)::after/.exec(css)?.[1] ?? ""
    for (const shape of ['[data-shape="dialog"]', '[data-shape="wide"]', '[data-shape="sheet"]', '[data-shape="panel"]', '[data-side="responsive"]'])
      expect(lit, shape).toContain(shape)
    expect(lit).not.toMatch(/screen|cover/)
    expect(block('.lit-work[data-shape="sheet"] {')).toMatch(/--lit-widths:\s*1px 0 0/)
    expect(block('.lit-work[data-shape="panel"] {')).toMatch(/--lit-widths:\s*0 0 0 1px/)
  })

  it("steps a pixel in on paper, concentric with the layer's own corner, and is the outer pixel in the room", () => {
    expect(css).toMatch(/\.lit-display::after\s*\{\s*inset:\s*1px;\s*border-radius:\s*calc\(var\(--lit-r, var\(--radius-float\)\) - 1px\);/)
    expect(css).toMatch(/\.lit-display\s*\{\s*@variant dark\s*\{\s*&::after\s*\{\s*inset:\s*0;\s*border-radius:\s*inherit;/)
    // The tooltip's capsule is not the display's 16px: its corner IS the light's radius, spelled once.
    expect(floatingTipCorner).toMatch(/\[--lit-r:[^\]]+\] rounded-\(--lit-r\)/)
  })

  it("lands on a toast's border, which turns clear, on a pseudo-element sonner leaves free", () => {
    expect(css).toMatch(/\[data-sonner-toaster\] \[data-sonner-toast\]\[data-styled="true"\]\s*\{\s*border-color:\s*transparent;/)
    expect(css).toMatch(/\[data-sonner-toast\]\[data-styled="true"\]:not\(\s*\[data-swiping="true"\],\s*\[data-removed="true"\]\s*\)::before/)
  })

  it("drops where colours are forced and on a printed sheet", () => {
    expect(css).toMatch(/@media \(forced-colors: active\), print\s*\{\s*\.lit-display::after,\s*\.lit-work::after,/)
  })
})

describe("the camera wears them too", () => {
  it("is the room, so its controls' halo is light over a dark band in either theme", () => {
    expect(read("src/components/guest/camera/album-camera.tsx")).toMatch(/className="dark fixed inset-0/)
  })

  it("draws no focus mark of its own: its shutter, its reel and its small keys wear the halo", () => {
    const sheet = read("src/components/guest/camera/camera.css").replace(/\/\*[\s\S]*?\*\//g, "")
    expect(sheet, "a camera control keeps an outline of its own").not.toMatch(/:focus-visible/)
    // A control's class list, in whatever order the formatter sorts it.
    const classesOf = (file: string, base: string) =>
      [...read(`src/components/guest/camera/${file}`).matchAll(new RegExp(`"(${base}(?: [\\w-]+)*)"`, "g"))].map(
        (m) => m[1].split(" ")
      )
    for (const [file, base, traits] of [
      ["camera-shutter.tsx", "cam-shutter", ["focus-halo"]],
      ["camera-reel.tsx", "cam-reel", ["focus-halo"]],
      ["camera-screen.tsx", "cam-hint-action", ["focus-halo", "press-shrink"]],
      ["your-shots.tsx", "cam-shot-remove", ["focus-halo", "press-shrink"]],
    ] as const) {
      const lists = classesOf(file, base)
      expect(lists.length, `${base} is not drawn in ${file}`).toBeGreaterThan(0)
      for (const list of lists) for (const trait of traits) expect(list, `${base} without ${trait}`).toContain(trait)
    }
    // The reel's fade is its film's: a mask on the button would fade the halo away with the frames.
    const reel = body(sheet, sheet.indexOf("{", sheet.indexOf(".cam-reel {")))
    expect(reel).not.toMatch(/mask-image/)
  })
})
