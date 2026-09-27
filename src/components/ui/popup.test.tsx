/**
 * THE POPUP: A KIND, NAMED AT THE CALL SITE, AND THE ONE TABLE SAYS WHERE IT OPENS (`popups` r1).
 *
 * What is pinned is the mechanism the answer rides, never a look: that a kind reaches the shape its
 * row names at each width (so a later answer moves in one line), that every shape stands on the
 * keyboard the Sheet's way, where focus lands when it opens, and that a place in a hand is closed
 * by the phone's own Back and leaves no dead history entry behind. How any shape looks is the
 * contract's (`floating-layer.ts`) and the Library's.
 */
import { useState } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { Button } from "@/components/ui/button"
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup"
import { POPUP_HISTORY_MARKER } from "@/components/ui/popup-back"
import { POPUP_KINDS, type PopupKind } from "@/components/ui/popup-kinds"
import { setViewportWidth } from "../../../vitest.setup"

type FakeViewport = EventTarget & { height: number; offsetTop: number; width: number }
let vv: FakeViewport

beforeEach(() => {
  vv = Object.assign(new EventTarget(), { height: 667, offsetTop: 0, width: 375 })
  Object.defineProperty(window, "visualViewport", { value: vv, configurable: true })
  Object.defineProperty(window, "innerHeight", { value: 667, configurable: true })
})

afterEach(() => {
  setViewportWidth(1024)
})

/** Let the keyboard hook's one-per-frame update run. */
async function frame() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  })
}

function mount(kind: PopupKind, extra: { routed?: boolean; open?: boolean } = {}) {
  const view = render(
    <Popup defaultOpen={extra.open ?? true}>
      <PopupContent kind={kind} routed={extra.routed} aria-describedby={undefined}>
        <PopupHeader title="Report this event" back="Album" />
        <PopupBody>
          <textarea aria-label="Reason" />
        </PopupBody>
        <PopupFooter>
          <Button type="button">Send</Button>
        </PopupFooter>
      </PopupContent>
    </Popup>,
  )
  const panel = () => document.querySelector<HTMLElement>('[data-slot="popup-content"]')
  return { ...view, panel }
}

describe("a kind reaches the shape its row names", () => {
  it("at a desk and in a hand, for every kind that opens as the Dialog or the Sheet", () => {
    const dialogShapes = new Set(["dialog", "wide", "panel", "screen", "cover", "sheet"])
    for (const [kind, row] of Object.entries(POPUP_KINDS) as [PopupKind, (typeof POPUP_KINDS)[PopupKind]][]) {
      for (const [width, shape] of [
        [1024, row.desk],
        [375, row.hand],
      ] as const) {
        if (!dialogShapes.has(shape)) continue
        setViewportWidth(width)
        const { panel, unmount } = mount(kind)
        expect(panel()?.getAttribute("data-shape"), `${kind} at ${width}`).toBe(shape)
        unmount()
      }
    }
  })

  it("stands an own shape where the Dialog or the Sheet would, never nowhere", () => {
    // A choice's row names a menu at a desk and rows in a hand: those are the
    // responsive menu's, and PopupContent asked to draw one anyway stands as a
    // dialog (a desk) or a sheet (a hand) rather than at the viewport's corner.
    setViewportWidth(1024)
    const desk = mount("choice")
    expect(desk.panel()?.getAttribute("data-shape")).toBe("dialog")
    desk.unmount()
    setViewportWidth(375)
    const hand = mount("choice")
    expect(hand.panel()?.getAttribute("data-shape")).toBe("sheet")
  })
})

describe("a screen in a hand is a place", () => {
  it("heads itself with a back arrow that says where Back returns, and no corner close", () => {
    setViewportWidth(375)
    mount("list")
    expect(screen.getByRole("button", { name: /album/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })

  it("holds one history entry while open, and the phone's Back closes it", async () => {
    setViewportWidth(375)
    const before = window.history.length
    const { panel } = mount("list")
    await act(async () => {})
    expect(window.history.length).toBe(before + 1)
    expect((window.history.state as Record<string, unknown>)?.[POPUP_HISTORY_MARKER]).toBeTruthy()

    act(() => window.history.back())
    await waitFor(() => expect(panel()).toBeNull())
  })

  it("closed by its own arrow, it takes its entry back with it", async () => {
    setViewportWidth(375)
    const marker = () =>
      (window.history.state as Record<string, unknown> | null)?.[POPUP_HISTORY_MARKER]
    const { panel } = mount("list")
    await act(async () => {})
    const mine = marker()
    expect(mine).toBeTruthy()
    const depth = window.history.length

    fireEvent.click(screen.getByRole("button", { name: /album/i }))
    await waitFor(() => expect(panel()).toBeNull())
    // Back to the entry under it (the document's length never shrinks; where
    // the pointer stands is what moved).
    await waitFor(() => expect(marker()).not.toBe(mine))
    expect(window.history.length).toBe(depth)
  })

  it("stays out of history when the page already routes it (`?room=`)", async () => {
    setViewportWidth(375)
    const before = window.history.length
    mount("settings", { routed: true })
    await act(async () => {})
    expect(window.history.length).toBe(before)
  })

  it("stays out of history at a desk, where it is a panel beside the page", async () => {
    setViewportWidth(1024)
    const before = window.history.length
    mount("list")
    await act(async () => {})
    expect(window.history.length).toBe(before)
  })
})

describe("where focus lands when it opens", () => {
  it("in a hand, on the popup itself: no field raises a keyboard into a surface still arriving", () => {
    setViewportWidth(375)
    const { panel } = mount("form")
    expect(screen.getByLabelText("Reason")).not.toHaveFocus()
    expect(panel()).toHaveFocus()
  })

  it("at a desk, a form's first field, typed into at once", () => {
    setViewportWidth(1024)
    mount("form")
    expect(screen.getByLabelText("Reason")).toHaveFocus()
  })

  it("at a desk, a place opens unfocused (his settings note: not into the event's name)", () => {
    setViewportWidth(1024)
    const { panel } = mount("settings", { routed: true })
    expect(screen.getByLabelText("Reason")).not.toHaveFocus()
    expect(panel()).toHaveFocus()
  })
})

describe("where focus goes back to when it closes", () => {
  it("a popup opened by something other than its trigger gives focus back to that control", async () => {
    // A menu's row, a toast's action, a switch: Radix gives focus back to the
    // trigger, and a popup with none would drop it on the page.
    function Opener() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            More options
          </button>
          <Popup open={open} onOpenChange={setOpen}>
            <PopupContent kind="confirm" aria-describedby={undefined}>
              <PopupHeader title="Block Maya?" />
            </PopupContent>
          </Popup>
        </>
      )
    }
    render(<Opener />)
    const opener = screen.getByRole("button", { name: "More options" })
    act(() => opener.focus())
    fireEvent.click(opener)
    const dialog = screen.getByRole("dialog", { name: "Block Maya?" })
    fireEvent.keyDown(dialog, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(opener).toHaveFocus()
  })
})

describe("every shape stands on the keyboard", () => {
  it("writes nothing while no field is focused: a popup nobody types in never moves", async () => {
    setViewportWidth(375)
    const { panel } = mount("confirm")
    await frame()
    vv.height = 360
    vv.dispatchEvent(new Event("resize"))
    await frame()
    expect(panel()!.style.getPropertyValue("--vv-h")).toBe("")
  })

  it("a centred dialog in a hand learns the visible band once its field holds focus", async () => {
    setViewportWidth(375)
    const { panel } = mount("form")
    await frame()
    act(() => screen.getByLabelText("Reason").focus())
    vv.height = 360
    vv.dispatchEvent(new Event("resize"))
    await frame()
    expect(panel()!.getAttribute("data-shape")).toBe("dialog")
    expect(panel()!.style.getPropertyValue("--vv-h")).toBe("360px")
    expect(panel()!.style.getPropertyValue("--kb-inset")).toBe("307px")
  })
})
