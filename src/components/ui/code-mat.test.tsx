import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CodeMat } from "@/components/ui/code-mat"

/**
 * THE CODE ON ITS WHITE MAT (`event-header` r1, the atom contract with identity r2: `data-slot="code-mat"`). A
 * mat is always a door (it opens the code's card), and dimmed is the code's alone: the modules fade for a door
 * that takes no photo, and the mat, the white the code scans on, stays.
 */
describe("the code on its mat", () => {
  it("is a button wearing its slot, named by what it opens", () => {
    const onClick = vi.fn()
    render(
      <CodeMat aria-label="Show the code for Maya & Jay" onClick={onClick}>
        <svg data-testid="code" />
      </CodeMat>
    )
    const mat = screen.getByRole("button", {
      name: "Show the code for Maya & Jay",
    })
    expect(mat).toHaveAttribute("data-slot", "code-mat")
    expect(mat).toHaveAttribute("type", "button")
    fireEvent.click(mat)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("★ dims the code, never the mat, and only when asked", () => {
    const { rerender } = render(
      <CodeMat aria-label="Show the code">
        <svg data-testid="code" />
      </CodeMat>
    )
    const mat = screen.getByRole("button", { name: "Show the code" })
    const code = screen.getByTestId("code").parentElement!
    expect(mat).not.toHaveAttribute("data-dimmed")
    expect(code).not.toHaveAttribute("data-code-dim")
    rerender(
      <CodeMat aria-label="Show the code" dimmed>
        <svg data-testid="code" />
      </CodeMat>
    )
    expect(mat).toHaveAttribute("data-dimmed")
    // The fade is on the code's own box, inside the white.
    expect(screen.getByTestId("code").parentElement).toHaveAttribute(
      "data-code-dim"
    )
    expect(mat.className).not.toMatch(/opacity-/)
  })
})
