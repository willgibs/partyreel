// @contract-for: src/components/ui/button.tsx
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button, buttonVariants } from "./button"

/**
 * THE BUTTON'S PAIRING CONTRACT (Will, `body-type` r2, 2026-09-20,
 * `pairs=step-up`): "the download and select buttons felt mismatched
 * between their icon sizes and new font size" becomes a stated rule instead
 * of an accident. Every icon sits ONE Tailwind icon-step over its own text
 * (12/14, 14/16, 16/18), and every one of the eight sizes carries its OWN
 * icon selector in the `cva` table rather than inheriting the base's
 * `[&_svg:not([class*='size-'])]:size-4` by accident — the exact bug
 * `icon-sm` shipped with (no selector of its own, silently reading 16 beside
 * `sm`'s 12px text).
 *
 * ★ WHY A CONTRACT TEST AND NOT A LINE IN `type-ladder-policy.test.ts`: that
 * file's own scan walks JSX opening elements, so a size string inside a
 * `cva` table is invisible to it (its own comment says so). Button's sizes
 * are a round, judged in the lab, never a lint.
 *
 * Two halves: the FUNCTIONAL pairing (rendered, reading the class string
 * `cn()` resolves to, since jsdom never loads the compiled stylesheet and a
 * computed pixel is the lab's job, not this one's — the same reason
 * `avatar.test.tsx` reads `className` rather than a `getBoundingClientRect`);
 * and the SOURCE shape (every size's own string in `button.tsx`, so a
 * future size added the day's easy way — no selector, just inherit the base
 * — fails here even when the number it inherits happens to be right).
 */

/** A class list, tokenised for EXACT membership checks: "size-4" is a
 *  substring of "size-4.5", so `.toContain` on the raw string would lie. */
function tokens(className: string): Set<string> {
  return new Set(className.split(/\s+/).filter(Boolean))
}

const iconSelector = (px: string) => `[&_svg:not([class*='size-'])]:size-${px}`

describe("a text size pairs its icon one Tailwind step over its own text", () => {
  it.each([
    ["xs", "text-xs", "3.5"],
    ["sm", "text-xs", "3.5"],
    ["default", "text-sm", "4"],
    ["lg", "text-sm", "4"],
    ["cta", "text-base", "4.5"],
  ] as const)("size=%s reads %s with an icon of size-%s", (size, text, icon) => {
    render(
      <Button size={size} data-testid="btn">
        Label
      </Button>,
    )
    const cls = tokens(screen.getByTestId("btn").className)
    expect(cls.has(text), `size=${size} text step`).toBe(true)
    expect(cls.has(iconSelector(icon)), `size=${size} icon step`).toBe(true)
  })
})

describe("an icon-only size pairs by the height it shares with a text size", () => {
  it.each([
    ["icon-xs", "xs", "3.5"],
    ["icon-sm", "sm", "3.5"],
    ["icon", "default", "4"],
    ["icon-lg", "lg", "4"],
  ] as const)("size=%s (%s's height) carries an explicit icon of size-%s", (size, _pairsWith, icon) => {
    render(<Button size={size} aria-label="action" data-testid="btn" />)
    const cls = tokens(screen.getByTestId("btn").className)
    expect(cls.has(iconSelector(icon)), `size=${size}`).toBe(true)
  })
})

describe("no size's height moved", () => {
  it.each([
    ["xs", "h-6"],
    ["sm", "h-7"],
    ["default", "h-8"],
    ["lg", "h-9"],
    ["cta", "h-11"],
  ] as const)("size=%s keeps %s", (size, h) => {
    expect(tokens(buttonVariants({ size })).has(h), size).toBe(true)
  })

  it.each([
    ["icon-xs", "size-6"],
    ["icon-sm", "size-7"],
    ["icon", "size-8"],
    ["icon-lg", "size-9"],
  ] as const)("size=%s keeps its box at %s", (size, box) => {
    expect(tokens(buttonVariants({ size })).has(box), size).toBe(true)
  })
})

describe("every size's icon selector is explicit in the source, none by accident", () => {
  const SRC = readFileSync(
    join(process.cwd(), "src/components/ui/button.tsx"),
    "utf8",
  )

  // Scoped to the `size: { ... }` object alone: `variant: { default: ... }`
  // has its OWN bare `default:` key, and a search over the whole file would
  // read that string instead of the size table's.
  const sizeBlockStart = SRC.indexOf("size: {")
  const sizeBlock = SRC.slice(
    sizeBlockStart,
    SRC.indexOf("\n      },", sizeBlockStart),
  )

  /** Each size's own string in the `size: { ... }` cva table: a bare key
   *  (`xs:`) or a quoted one (`"icon-sm":`), a plain string or (`cta`'s)
   *  a template literal with one interpolation. */
  function sizeSource(size: string): string {
    const key = /^[a-z]+$/.test(size) ? size : `"${size}"`
    const re = new RegExp(`(?:^|\\s)${key}:\\s*(\`[^\`]*\`|"[^"]*")`, "m")
    const m = re.exec(sizeBlock)
    if (!m) throw new Error(`"${size}" not found in button.tsx's size table`)
    return m[1]
  }

  it.each([
    "default",
    "xs",
    "sm",
    "lg",
    "cta",
    "icon",
    "icon-xs",
    "icon-sm",
    "icon-lg",
  ])("size=%s carries its own icon selector, not the base's fallback", (size) => {
    expect(sizeSource(size)).toContain("[&_svg:not([class*='size-'])]:size-")
  })
})
