import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * ★ A TAP NEVER OPENS A TOOLTIP (crumbs-33, from the viewer's lost Share: "`ui/tooltip`'s arrow at `sideOffset`
 * 0 plus radix's open-on-focus loses a touch tap on any tooltip-wrapped control on Android Chrome"). A touch's
 * compatibility mousedown arrives AFTER its pointerup and focuses the button, so radix's own guard (no open on a
 * focus while a pointer is down) has already let go, the tooltip opens on that focus with no delay, and its arrow
 * lands on the finger. The order is a phone's, fired here as a phone fires it.
 */
function mount() {
  const clicks: string[] = []
  render(
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => clicks.push("share")}>
            Share
          </button>
        </TooltipTrigger>
        <TooltipContent>Share this photo</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  )
  return { button: screen.getByRole("button", { name: "Share" }), clicks }
}

const open = () => screen.queryByRole("tooltip")

describe("a tooltip's trigger under a finger, a cursor and a keyboard", () => {
  it("★ a touch's tap never opens it, and the tap lands on the control", async () => {
    const { button, clicks } = mount()
    // Android Chrome's order for one tap: the pointer down and up, then the compatibility mouse events, whose
    // mousedown is what focuses the button, then the click.
    fireEvent.pointerDown(button, { pointerType: "touch", isPrimary: true })
    fireEvent.pointerUp(button, { pointerType: "touch", isPrimary: true })
    fireEvent.pointerUp(document, { pointerType: "touch", isPrimary: true })
    fireEvent.mouseDown(button)
    await act(async () => {
      button.focus()
    })
    expect(open()).toBeNull()
    fireEvent.mouseUp(button)
    fireEvent.click(button)
    expect(clicks).toEqual(["share"])
    expect(open()).toBeNull()
  })

  it("★ after a tap, the keyboard's focus opens it again", async () => {
    const { button } = mount()
    fireEvent.pointerDown(button, { pointerType: "touch", isPrimary: true })
    fireEvent.pointerUp(document, { pointerType: "touch", isPrimary: true })
    await act(async () => {
      button.focus()
    })
    fireEvent.click(button)
    await act(async () => {
      button.blur()
    })
    // Tab, later: a focus no pointer began.
    await act(async () => {
      button.focus()
    })
    expect(open()).not.toBeNull()
  })

  it("a tap that turns into a scroll leaves the next keyboard focus its tooltip", async () => {
    const { button } = mount()
    fireEvent.pointerDown(button, { pointerType: "touch", isPrimary: true })
    fireEvent.pointerCancel(button, { pointerType: "touch", isPrimary: true })
    // Radix's own press guard lets go at the next pointerup anywhere (a later tap on the page).
    fireEvent.pointerUp(document, { pointerType: "touch", isPrimary: true })
    await act(async () => {
      button.focus()
    })
    expect(open()).not.toBeNull()
  })

  it("a keyboard's focus opens it", async () => {
    const { button } = mount()
    await act(async () => {
      button.focus()
    })
    expect(open()).not.toBeNull()
  })

  it("a cursor's hover opens it, and a mouse's click reaches the control", async () => {
    const { button, clicks } = mount()
    await act(async () => {
      fireEvent.pointerMove(button, { pointerType: "mouse" })
      // The provider's delay is 0, which radix still rides on a timer.
      await new Promise((r) => setTimeout(r, 5))
    })
    expect(open()).not.toBeNull()
    fireEvent.pointerDown(button, { pointerType: "mouse" })
    await act(async () => {
      button.focus()
    })
    fireEvent.pointerUp(document, { pointerType: "mouse" })
    fireEvent.click(button)
    expect(clicks).toEqual(["share"])
  })

  it("its arrow is marked, so it never takes a pointer meant for the control under it", async () => {
    const { button } = mount()
    await act(async () => {
      button.focus()
    })
    const arrow = document.querySelector("[data-slot=tooltip-arrow]")
    expect(arrow).not.toBeNull()
    // The rule rides the content: its arrow's wrapper (radix's own span, outside our reach) takes no pointer.
    const content = document.querySelector("[data-slot=tooltip-content]")
    expect(content?.className).toContain(
      "*:has-data-[slot=tooltip-arrow]:pointer-events-none",
    )
  })
})
