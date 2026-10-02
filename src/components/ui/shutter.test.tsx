import { readFileSync } from "node:fs"
import { join } from "node:path"

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Shutter } from "@/components/ui/shutter"

/**
 * THE SHUTTER'S CONTRACT (`event-header` r1, `stays=shutter`, the atom contract with identity r2): the hooks
 * its board styles are exactly `data-slot="shutter"`, its `data-state` and its `--progress` (0 to 1), and the
 * states are the caller's word, never guessed. What is pinned is the contract and the behaviour, never a
 * colour: identity r2 restyles the look against these hooks.
 */
const sheet = readFileSync(
  join(process.cwd(), "src/components/ui/shutter.css"),
  "utf8"
)

const shutter = () => screen.getByRole("button", { name: /Add photos/ })

describe("the shutter's hooks", () => {
  it("is a button wearing its slot and its state, idle by default", () => {
    render(<Shutter aria-label="Add photos" />)
    expect(shutter()).toHaveAttribute("data-slot", "shutter")
    expect(shutter()).toHaveAttribute("data-state", "idle")
  })

  it("carries the run's progress in --progress, held between 0 and 1", () => {
    const { rerender } = render(
      <Shutter aria-label="Add photos" state="sending" progress={0.62} />
    )
    expect(shutter().style.getPropertyValue("--progress")).toBe("0.62")
    rerender(<Shutter aria-label="Add photos" state="sending" progress={1.4} />)
    expect(shutter().style.getPropertyValue("--progress")).toBe("1")
    rerender(<Shutter aria-label="Add photos" state="sending" progress={-3} />)
    expect(shutter().style.getPropertyValue("--progress")).toBe("0")
    rerender(
      <Shutter aria-label="Add photos" state="sending" progress={Number.NaN} />
    )
    expect(shutter().style.getPropertyValue("--progress")).toBe("0")
  })

  it("wears the album's light as three hues, the house's where it is handed fewer", () => {
    const { rerender } = render(
      <Shutter aria-label="Add photos" hues={[45, 20, 350, 120]} />
    )
    expect(shutter().style.getPropertyValue("--shutter-h1")).toBe("45")
    expect(shutter().style.getPropertyValue("--shutter-h3")).toBe("350")
    rerender(<Shutter aria-label="Add photos" hues={[45]} />)
    expect(shutter().style.getPropertyValue("--shutter-h1")).toBe("25")
  })
})

describe("the shutter's states", () => {
  it("counts the files still on their way on its shoulder while sending, and nowhere else", () => {
    const { rerender, container } = render(
      <Shutter aria-label="Add photos" state="sending" count={3} />
    )
    const count = () => container.querySelector("[data-slot='shutter-count']")
    expect(count()?.textContent).toBe("3")
    rerender(<Shutter aria-label="Add photos" state="sending" count={0} />)
    expect(count()).toBeNull()
    rerender(<Shutter aria-label="Add photos" state="idle" count={3} />)
    expect(count()).toBeNull()
  })

  it("shows a check for the beat after a run lands, and its own glyph otherwise", () => {
    const { rerender, container } = render(
      <Shutter aria-label="Add photos" state="done" />
    )
    expect(container.querySelector(".lucide-check")).not.toBeNull()
    rerender(<Shutter aria-label="Add photos" state="idle" />)
    expect(container.querySelector(".lucide-check")).toBeNull()
    expect(container.querySelector(".lucide-image-up")).not.toBeNull()
  })

  it("★ takes a press in every state: a press while files go adds more", () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <Shutter aria-label="Add photos" state="sending" onClick={onClick} />
    )
    fireEvent.click(shutter())
    expect(shutter()).toBeEnabled()
    rerender(<Shutter aria-label="Add photos" state="done" onClick={onClick} />)
    fireEvent.click(shutter())
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("keeps everything it draws out of the accessibility tree: its name is the caller's words", () => {
    const { container } = render(
      <Shutter aria-label="Add photos, 3 uploading" state="sending" count={3} />
    )
    for (const child of container.querySelectorAll("button > *")) {
      expect(child).toHaveAttribute("aria-hidden")
    }
    expect(
      screen.getByRole("button", { name: "Add photos, 3 uploading" })
    ).toBeInTheDocument()
  })
})

describe("the shutter's sheet", () => {
  it("★ glides a registered copy of --progress, never registering the contract's own name", () => {
    expect(sheet).toMatch(/@property --shutter-p\s*\{/)
    expect(sheet).not.toMatch(/@property --progress\b/)
    expect(sheet).toMatch(/--shutter-p: var\(--progress, 0\)/)
  })

  it("★ moves nothing unless motion is welcome: every animation and transition sits behind no-preference", () => {
    const stripped = sheet.replace(/\/\*[\s\S]*?\*\//g, "")
    const gate = stripped.indexOf("@media (prefers-reduced-motion: no-preference)")
    expect(gate).toBeGreaterThan(-1)
    const outside = stripped.slice(0, gate)
    expect(outside).not.toMatch(/\banimation\s*:/)
    expect(outside).not.toMatch(/\btransition\s*:/)
  })

  it("splits its two masks across two elements (the ring's band, the fill's sweep)", () => {
    expect(sheet).toMatch(/\.shutter-ring\s*\{[^}]*mask:/)
    expect(sheet).toMatch(/\.shutter-fill\s*\{[^}]*mask:/)
  })
})
