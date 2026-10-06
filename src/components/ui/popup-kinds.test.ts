import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import { describe, expect, it } from "vitest"

import { POPUP_KINDS } from "./popup-kinds"

/**
 * THE ONE TABLE AND WHO READS IT (`popups` r1, the carried call `one-table`).
 *
 * Two things fail quietly and are pinned here, never a look:
 *
 * - every kind has a shape at each width, from that width's own set (a panel in
 *   a hand or a screen at a desk has no rules to stand on);
 * - a product popup NAMES ITS KIND rather than picking a posture for itself: a
 *   new call site of the bare `SheetContent` or `DialogContent` is refused unless
 *   it is one the board left alone, with the reason it was left. That is what
 *   lets a later answer on a kind move every popup of it in one row.
 */

const DESK = new Set(["dialog", "wide", "panel", "menu", "card", "anchored"])
const HAND = new Set(["dialog", "screen", "cover", "sheet", "rows", "card"])

/**
 * THE SURFACES THE BOARD LEFT AS THEY ARE (`left-alone`, `failure-sheet`), or
 * that another lane is moving, each with why. A file that stops using the bare
 * primitive simply stops matching; nothing here fails for an entry gone stale.
 */
const LEFT_ALONE: Record<string, string> = {
  "src/components/guest/entry-shell.tsx": "the door itself, a held sheet (identity-door)",
  "src/components/auth/confirm-email-dialog.tsx": "the door's held confirm sheet",
  "src/components/guest/add-email-dialog.tsx": "the door's held change sheet",
  "src/components/likes/likes-provider.tsx":
    "the Like this door, moving to the door's held sheet (door-r3-wiring)",
  "src/components/guest/upload/failure-sheet.tsx":
    "`failure-sheet`: it opens by itself when a run ends, so it stays the sheet",
  "src/components/marketing/chrome/mobile-menu.tsx":
    "a phone's menu with no desk posture (`left-alone`: menus)",
  "src/components/app/avatar-cropper.tsx": "the photo cropper (`left-alone`)",
  "src/components/app/pricing/welcome-to-pro.tsx": "Welcome to Pro (`left-alone`)",
  "src/components/shared/media-lightbox.tsx": "the viewer (`left-alone`)",
  "src/components/marketing/system/demo-modal/demo-modal.tsx":
    "the demo's own code card on the marketing site, its kind (`share`) named in its comment; moving it onto the card is marketing's line",
}

const ROOT = process.cwd()

function sources(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === "(dev)" || name === "ui") continue
      out.push(...sources(full))
    } else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) {
      out.push(full)
    }
  }
  return out
}

describe("the one table", () => {
  it("gives every kind a shape at each width, from that width's own set", () => {
    for (const [kind, row] of Object.entries(POPUP_KINDS)) {
      expect(DESK.has(row.desk), `${kind} at a desk: ${row.desk}`).toBe(true)
      expect(HAND.has(row.hand), `${kind} in a hand: ${row.hand}`).toBe(true)
    }
  })

  it("★ only a confirm speaks as an alertdialog: it asks one thing and waits for the answer (crumbs-20)", () => {
    const alerts = Object.entries(POPUP_KINDS)
      .filter(([, row]) => "role" in row)
      .map(([kind, row]) => [kind, (row as { role: string }).role])
    expect(alerts).toEqual([["confirm", "alertdialog"]])
  })

  it("is read at every product popup: a bare Sheet or Dialog is one the board left alone", () => {
    const bare = [
      ...sources(join(ROOT, "src/components")),
      ...sources(join(ROOT, "src/app")),
    ]
      .map((file) => relative(ROOT, file))
      .filter((file) => /<(SheetContent|DialogContent)[\s>]/.test(readFileSync(join(ROOT, file), "utf8")))
      .filter((file) => !(file in LEFT_ALONE))
    expect(
      bare,
      "a popup that picks its own posture: name its kind (`<PopupContent kind=...>`, ui/popup.tsx), or add it to LEFT_ALONE with why",
    ).toEqual([])
  })
})
