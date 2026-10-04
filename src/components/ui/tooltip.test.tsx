import { act, fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  TapTooltip,
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

/**
 * ★ WORDS A FINGER MUST BE ABLE TO ASK FOR: THE ONE PRESS MODEL (crumbs-64). The code's corner mark, the glyph
 * count and the pricing matrix's row each carried this beside the primitive, and each of their own tests still holds
 * its surface's part of it; what is held here is the model itself, fired in a phone's order, a cursor's and a key's.
 */
const TIP = "Everything you and your guests keep."

function mountTap() {
  const clicks: string[] = []
  render(
    <>
      <TapTooltip words={TIP} side="bottom">
        <button type="button" onClick={() => clicks.push("face")}>
          Storage
        </button>
      </TapTooltip>
      <p>Elsewhere on the page</p>
    </>,
  )
  return { face: screen.getByRole("button", { name: "Storage" }), clicks }
}

const words = () =>
  Array.from(document.querySelectorAll("[data-slot='tooltip-content']")).map(
    (el) => el.textContent ?? "",
  )

/** One tap as a phone makes it: the pointer down and up, then the click (its compatibility mouse events never come). */
async function tap(el: Element) {
  await act(async () => {
    fireEvent.pointerDown(el, { pointerType: "touch", isPrimary: true })
    fireEvent.pointerUp(el, { pointerType: "touch", isPrimary: true })
    fireEvent.click(el, { detail: 1 })
  })
}

/** Radix starts listening for a press outside its words one task after they open. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

describe("TapTooltip: a finger, a cursor and a key", () => {
  it("★ a tap opens the words, and the next tap on the face puts them away", async () => {
    const { face, clicks } = mountTap()
    expect(words()).toEqual([])
    await tap(face)
    expect(words()).toEqual([expect.stringContaining(TIP)])
    await settle()
    await tap(face)
    expect(words()).toEqual([])
    // The face's own press is still its own: both taps reached its handler, ahead of the model's.
    expect(clicks).toEqual(["face", "face"])
  })

  it("★ a tap anywhere else, and a finger's tap on the words themselves, put them away", async () => {
    const { face } = mountTap()
    await tap(face)
    await settle()
    const elsewhere = screen.getByText("Elsewhere on the page")
    await act(async () => {
      fireEvent.pointerDown(elsewhere, { pointerType: "touch" })
      fireEvent.pointerUp(elsewhere, { pointerType: "touch" })
      fireEvent.click(elsewhere, { detail: 1 })
    })
    expect(words()).toEqual([])
    await tap(face)
    await settle()
    const bubble = document.querySelector("[data-slot='tooltip-content']")!
    await act(async () => {
      fireEvent.pointerDown(bubble, { pointerType: "touch" })
      fireEvent.click(bubble, { detail: 1 })
    })
    expect(words()).toEqual([])
  })

  it("a cursor's click on the words leaves them up: it may be selecting a phrase to copy", async () => {
    const { face } = mountTap()
    await act(async () => {
      fireEvent.pointerDown(face, { pointerType: "mouse" })
      fireEvent.click(face, { detail: 1 })
    })
    await settle()
    const bubble = document.querySelector("[data-slot='tooltip-content']")!
    await act(async () => {
      fireEvent.pointerDown(bubble, { pointerType: "mouse" })
      fireEvent.click(bubble, { detail: 1 })
    })
    expect(words()).toHaveLength(1)
  })

  it("★ a cursor's hover opens it and its click keeps the same words up, never blinking them", async () => {
    const { face } = mountTap()
    await act(async () => {
      fireEvent.pointerMove(face, { pointerType: "mouse" })
      // The provider's delay is 0, which radix still rides on a timer.
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
    const before = document.querySelector("[data-slot='tooltip-content']")
    expect(before).not.toBeNull()
    await settle()
    // Radix would dismiss the words at the pointerdown (the face is outside them) and the click would reopen them a
    // beat later; the face's own press is no dismissal.
    await act(async () => {
      fireEvent.pointerDown(face, { pointerType: "mouse" })
    })
    expect(document.querySelector("[data-slot='tooltip-content']")).toBe(before)
    await act(async () => {
      fireEvent.pointerUp(face, { pointerType: "mouse" })
      fireEvent.click(face, { detail: 1 })
    })
    expect(document.querySelector("[data-slot='tooltip-content']")).toBe(before)
    expect(words()).toHaveLength(1)
  })

  it("a key's focus opens it, Enter or Space toggles it, and Escape puts it away", async () => {
    const { face } = mountTap()
    await act(async () => {
      face.focus()
    })
    expect(words()).toEqual([expect.stringContaining(TIP)])
    // `detail` 0 is how a click no pointer made reads.
    await act(async () => {
      fireEvent.click(face, { detail: 0 })
    })
    expect(words()).toEqual([])
    await act(async () => {
      fireEvent.click(face, { detail: 0 })
    })
    expect(words()).toHaveLength(1)
    await act(async () => {
      fireEvent.keyDown(face, { key: "Escape" })
    })
    expect(words()).toEqual([])
  })

  it("a key's Enter after a mouse press that never clicked toggles, rather than opening on a stale press", async () => {
    const { face } = mountTap()
    // Pressed, dragged off the face, released elsewhere: no click ever came for it.
    await act(async () => {
      fireEvent.pointerDown(face, { pointerType: "mouse" })
    })
    await act(async () => {
      face.focus()
    })
    expect(words()).toHaveLength(1)
    await act(async () => {
      fireEvent.click(face, { detail: 0 })
    })
    expect(words()).toEqual([])
  })

  it("a finger's focus alone opens nothing: only its click does (the primitive's scar stands)", async () => {
    const { face } = mountTap()
    fireEvent.pointerDown(face, { pointerType: "touch", isPrimary: true })
    await act(async () => {
      face.focus()
    })
    expect(words()).toEqual([])
    fireEvent.pointerUp(face, { pointerType: "touch", isPrimary: true })
    await act(async () => {
      fireEvent.click(face, { detail: 1 })
    })
    expect(words()).toHaveLength(1)
  })

  it("★ draws the face bare with the words as its title before hydration, and mounts no tooltip", () => {
    // The server's paint and the hydrating render: a radix tooltip in a server-rendered first paint left the host page
    // unhydrated in production (architecture.md), so the rich tooltip waits for the render after it.
    const html = renderToString(
      <TapTooltip words={TIP}>
        <button type="button">Storage</button>
      </TapTooltip>,
    )
    expect(html).toContain(`title="${TIP}"`)
    expect(html).not.toContain("tooltip")
  })
})
