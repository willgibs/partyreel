import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CodeChip } from "@/components/ui/code-chip"

/**
 * THE CODE AS A CHIP (`event-header` r1, the atom contract with identity r2: `data-slot="code-chip"`): where a
 * bar has no room for a scannable code, the code's glyph on its white, and a press opens the real one. Never a
 * shrunken code: under the module floor a code cannot scan.
 */
describe("the code as a chip", () => {
  it("is a button wearing its slot, named by the caller, that opens the code", () => {
    const onClick = vi.fn()
    render(
      <CodeChip aria-label="Show the code for this event" onClick={onClick} />
    )
    const chip = screen.getByRole("button", {
      name: "Show the code for this event",
    })
    expect(chip).toHaveAttribute("data-slot", "code-chip")
    fireEvent.click(chip)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("★ draws the code's glyph, never a code", () => {
    const { container } = render(<CodeChip aria-label="Show the code" />)
    // One glyph (lucide's), out of the tree; no canvas, no code's own SVG.
    const drawn = container.querySelectorAll("svg, canvas")
    expect(drawn).toHaveLength(1)
    expect(drawn[0]).toHaveClass("lucide-qr-code")
    expect(drawn[0]).toHaveAttribute("aria-hidden")
  })

  it("carries a corner mark beside its glyph", () => {
    render(
      <CodeChip aria-label="Show the code">
        <span data-testid="mark" />
      </CodeChip>
    )
    expect(screen.getByTestId("mark")).toBeInTheDocument()
  })
})
