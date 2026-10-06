/**
 * WORKING = WORDS (identity r5, loading=words): a key working on what was pressed says so twice, the arc
 * in its icon's place and its words turned to what it is doing, holds both faces from its first paint so
 * its width never moves, keeps its focus and its face (busy, never off), and takes no second press.
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { ImageUp } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"

describe("a key that works", () => {
  it("at rest, says its own words, with the working face laid out and hidden", () => {
    render(
      <Button working={false} workingLabel="Saving">
        Save
      </Button>
    )
    const key = screen.getByRole("button", { name: "Save" })
    expect(key).not.toHaveAttribute("aria-busy")
    // Both faces stand in one cell from the first paint, so the key holds the wider of the two.
    const working = key.querySelector('[data-slot="button-working"]')
    expect(working).not.toBeNull()
    expect(working).toHaveClass("invisible")
    expect(working).toHaveAttribute("aria-hidden", "true")
    expect(working?.querySelector(".working-arc")).not.toBeNull()
  })

  it("working, says what it is doing beside the arc, and a press does nothing", () => {
    const onClick = vi.fn()
    render(
      <Button type="submit" working workingLabel="Saving" onClick={onClick}>
        Save
      </Button>
    )
    const key = screen.getByRole("button", { name: "Saving" })
    expect(key).toHaveAttribute("aria-busy", "true")
    expect(key).toHaveAttribute("aria-disabled", "true")
    // Busy, never off: it keeps its focus (a disabled key would drop it to the page).
    expect(key).not.toBeDisabled()
    fireEvent.click(key)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("a submit that is working sends nothing", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" working workingLabel="Saving">
          Save
        </Button>
      </form>
    )
    fireEvent.click(screen.getByRole("button", { name: "Saving" }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("without words of its own, says its own beside the arc, the arc standing in its icon's place", () => {
    render(
      <Button working>
        <ImageUp /> Add photos
      </Button>
    )
    const key = screen.getByRole("button", { name: "Add photos" })
    const working = key.querySelector('[data-slot="button-working"]')
    expect(working).toHaveClass("[&>svg:first-child]:hidden")
    expect(working?.firstElementChild).toHaveClass("working-arc")
  })

  it("a key that never works draws one face", () => {
    render(<Button>Share</Button>)
    expect(
      screen.getByRole("button", { name: "Share" }).querySelector('[data-slot="button-faces"]')
    ).toBeNull()
  })

  it("off, a key with a face settles clear, unless it is working", () => {
    render(<Button disabled>Off</Button>)
    const cls = screen.getByRole("button", { name: "Off" }).className
    expect(cls).toMatch(/disabled:not-aria-busy:bg-transparent/)
    expect(cls).toMatch(/disabled:not-aria-busy:text-faint/)
  })
})
