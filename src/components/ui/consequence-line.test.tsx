/**
 * THE CONSEQUENCE LINE (event-settings r1, `inside=count`): a change that reaches people already in
 * says what it does before it happens, in the control's own place. Held: nothing happens until the
 * change itself is pressed, the way back does nothing but leave, the sentence is announced, and a
 * change being written cannot be pressed twice.
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ConsequenceLine } from "@/components/ui/consequence-line"

function mount(busy = false) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConsequenceLine
      confirmLabel="Close it to everyone"
      onConfirm={onConfirm}
      onCancel={onCancel}
      busy={busy}
    >
      31 guests are already in. Only me closes them out.
    </ConsequenceLine>,
  )
  return { onConfirm, onCancel }
}

describe("the consequence line", () => {
  it("says it, announced, before anything happens", () => {
    const { onConfirm, onCancel } = mount()
    const line = screen.getByText(/Only me closes them out/)
    expect(line.closest("[aria-live='polite']")).not.toBeNull()
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it("the change is its primary act, and the way back only leaves", () => {
    const { onConfirm, onCancel } = mount()
    fireEvent.click(screen.getByRole("button", { name: "Keep it as it is" }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Close it to everyone" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  // Reshaped with identity r5 (loading=words): the change's key was disabled while written; it works now,
  // saying so (Saving, with the arc) and keeping its focus, and a second press still does nothing.
  it("a change being written cannot be pressed again, and says it is being written", () => {
    const { onConfirm } = mount(true)
    const key = screen.getByRole("button", { name: "Saving" })
    expect(key).toHaveAttribute("aria-busy", "true")
    expect(key).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(key)
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Keep it as it is" })).toBeDisabled()
  })
})
