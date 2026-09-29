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

  it("a change being written cannot be pressed again", () => {
    mount(true)
    expect(screen.getByRole("button", { name: "Close it to everyone" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Keep it as it is" })).toBeDisabled()
  })
})
