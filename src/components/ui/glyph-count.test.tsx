import { act, fireEvent, render, screen } from "@testing-library/react"
import { Images } from "lucide-react"
import { describe, expect, it } from "vitest"

import { GlyphCount } from "@/components/ui/glyph-count"
import { TooltipProvider } from "@/components/ui/tooltip"

/**
 * THE GLYPH COUNT (`event-header` r1's carried call `glyphs`): an icon and a number on a head, its words on a
 * cursor's hover, a keyboard's focus and a tap. The tooltip primitive refuses a finger on purpose
 * (`tooltip.test.tsx`), so the atom answers the tap itself, as the code's corner mark does: a phone is never left
 * with a glyph it cannot ask about.
 */
function mount(count = 1240, label = "1,240 photos & videos") {
  render(
    <TooltipProvider delayDuration={0}>
      <GlyphCount icon={<Images />} count={count} label={label} />
    </TooltipProvider>
  )
  return screen.getByRole("button", { name: label })
}

const words = () =>
  document.querySelector("[data-slot='tooltip-content']")?.textContent ?? null

describe("a glyph and its words", () => {
  it("is named by its words, and shows the glyph and the number alone", () => {
    const count = mount()
    expect(count).toHaveAttribute("data-slot", "glyph-count")
    // The face is the number, grouped as the site groups, and the glyph: both out of the tree.
    expect(count.textContent).toBe("1,240")
    expect(count.querySelector("svg")).not.toBeNull()
    for (const part of count.children) expect(part).toHaveAttribute("aria-hidden")
  })

  it("★ its number is the hook the voice's sheets style (`data-n`), and nothing else in the atom is", () => {
    const count = mount()
    // Identity's voice and status sheets write `[data-slot="glyph-count"] [data-n]` for the readout's face and ink. A rule
    // that names a hook the atom never draws reaches nothing, silently: the real atom answers to it on the number's
    // span, once, and never on the glyph beside it.
    const reached = document.querySelectorAll(
      '[data-slot="glyph-count"] [data-n]'
    )
    expect(reached).toHaveLength(1)
    const [number] = reached
    expect(number).toHaveTextContent("1,240")
    expect(number?.closest('[data-slot="glyph-count"]')).toBe(count)
    expect(count.querySelector("svg")?.closest("[data-n]")).toBeNull()
  })

  it("★ a tap shows its words, and a second tap puts them away", async () => {
    const count = mount()
    await act(async () => {
      fireEvent.pointerDown(count, { pointerType: "touch" })
      fireEvent.click(count)
    })
    expect(words()).toContain("1,240 photos & videos")
    await act(async () => {
      fireEvent.pointerDown(count, { pointerType: "touch" })
      fireEvent.click(count)
    })
    expect(words()).toBeNull()
  })

  it("a keyboard's Enter toggles them as a tap does", async () => {
    const count = mount(31, "31 guests")
    await act(async () => {
      fireEvent.click(count, { detail: 0 })
    })
    expect(words()).toContain("31 guests")
    await act(async () => {
      fireEvent.click(count, { detail: 0 })
    })
    expect(words()).toBeNull()
  })

  it("a cursor's click keeps them open", async () => {
    const count = mount(31, "31 guests")
    await act(async () => {
      fireEvent.pointerDown(count, { pointerType: "mouse" })
      fireEvent.click(count, { detail: 1 })
    })
    expect(words()).toContain("31 guests")
    await act(async () => {
      fireEvent.pointerDown(count, { pointerType: "mouse" })
      fireEvent.click(count, { detail: 1 })
    })
    expect(words()).toContain("31 guests")
  })
})
