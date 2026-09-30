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
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

describe("a kind is announced as what it is (crumbs-20)", () => {
  // ★ A confirm stops the person to ask one thing and waits: that is an ALERT dialog, which a screen
  // reader announces as an alert and reads with its question. It was `role="dialog"` for every kind. The role is one more column of the kind's row, so a later answer on
  // a kind is still one line.
  it("a confirm is an alertdialog, at a desk and in a hand", () => {
    for (const width of [1024, 375]) {
      setViewportWidth(width)
      const { unmount } = mount("confirm")
      const confirm = screen.getByRole("alertdialog", { name: "Report this event" })
      expect(confirm.getAttribute("data-kind"), `at ${width}`).toBe("confirm")
      expect(screen.queryByRole("dialog"), `at ${width}`).toBeNull()
      unmount()
    }
  })

  it("every other kind stays the Dialog's own `dialog`, and never loses its role", () => {
    setViewportWidth(1024)
    for (const kind of Object.keys(POPUP_KINDS) as PopupKind[]) {
      if (kind === "confirm") continue
      const { unmount } = mount(kind)
      const panel = document.querySelector<HTMLElement>('[data-slot="popup-content"]')
      expect(panel?.getAttribute("role"), kind).toBe("dialog")
      unmount()
    }
  })

  it("keeps its question announced with its name: the header's description is the alert's text", () => {
    render(
      <Popup defaultOpen>
        <PopupContent kind="confirm">
          <PopupHeader title="Block Maya?" description="She won't be notified." />
        </PopupContent>
      </Popup>,
    )
    expect(screen.getByRole("alertdialog", { name: "Block Maya?" })).toHaveAccessibleDescription(
      "She won't be notified.",
    )
  })

  it("lets a call site's own role win", () => {
    render(
      <Popup defaultOpen>
        <PopupContent kind="confirm" role="dialog" aria-describedby={undefined}>
          <PopupHeader title="Report this event" />
        </PopupContent>
      </Popup>,
    )
    expect(screen.getByRole("dialog", { name: "Report this event" })).toBeInTheDocument()
    expect(screen.queryByRole("alertdialog")).toBeNull()
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
    const dialog = screen.getByRole("alertdialog", { name: "Block Maya?" })
    fireEvent.keyDown(dialog, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(opener).toHaveFocus()
  })

  it("a STACKED popup (no trigger, opened from inside a layer left open behind it) gives focus back to the control inside that layer, never the page behind it", async () => {
    // event-settings-sheet.tsx's shape: a panel with no trigger of its own,
    // whose own close routes through a guard (`requestClose`) that raises a
    // confirm — also with no PopupTrigger — instead of ever closing, so the
    // panel is still there when the confirm's own close runs.
    function Stacked() {
      const [panelOpen, setPanelOpen] = useState(true)
      const [confirmOpen, setConfirmOpen] = useState(false)
      function requestClose(next: boolean) {
        if (next) setPanelOpen(true)
        else setConfirmOpen(true) // always "dirty", for the test
      }
      return (
        <>
          <Popup open={panelOpen} onOpenChange={requestClose}>
            <PopupContent kind="settings" aria-describedby={undefined}>
              <PopupHeader title="Settings" />
              <PopupBody>
                <input aria-label="Event name" />
              </PopupBody>
            </PopupContent>
          </Popup>
          <Popup open={confirmOpen} onOpenChange={setConfirmOpen}>
            <PopupContent kind="confirm" aria-describedby={undefined}>
              <PopupHeader title="Discard changes?" />
              <PopupFooter>
                <Button type="button" onClick={() => setConfirmOpen(false)}>
                  Keep editing
                </Button>
              </PopupFooter>
            </PopupContent>
          </Popup>
        </>
      )
    }
    render(<Stacked />)
    const field = screen.getByLabelText("Event name")
    act(() => field.focus())
    fireEvent.keyDown(field, { key: "Escape" })
    const confirm = await screen.findByRole("alertdialog", { name: "Discard changes?" })
    fireEvent.click(within(confirm).getByRole("button", { name: "Keep editing" }))
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog", { name: "Discard changes?" })).toBeNull()
    )
    expect(field).toHaveFocus()
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()
  })

  it("the same, for a confirm's PopupContent wrapped in a plain Dialog/DialogTrigger rather than this file's Popup", async () => {
    // media-lightbox-parts/actions.tsx's shape: `PurgeConfirmContent`'s
    // `PopupContent` sits inside a bare `Dialog`/`DialogTrigger`
    // (`ui/dialog.tsx`), never this file's `Popup`, so there is no
    // `PopupStateContext` at all to say it has a trigger — same as none.
    function ViewerWithPurge() {
      return (
        <Dialog defaultOpen>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Viewer</DialogTitle>
            <Dialog>
              <DialogTrigger asChild>
                <button type="button">Delete permanently</button>
              </DialogTrigger>
              <PopupContent kind="confirm" aria-describedby={undefined}>
                <PopupHeader title="Delete permanently?" />
              </PopupContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      )
    }
    render(<ViewerWithPurge />)
    const viewer = screen.getByRole("dialog", { name: "Viewer" })
    const trigger = within(viewer).getByRole("button", { name: "Delete permanently" })
    act(() => trigger.focus())
    fireEvent.click(trigger)
    const confirm = await screen.findByRole("alertdialog", { name: "Delete permanently?" })
    fireEvent.keyDown(confirm, { key: "Escape" })
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog", { name: "Delete permanently?" })).toBeNull()
    )
    expect(trigger).toHaveFocus()
    expect(viewer).toBeInTheDocument()
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

/**
 * THE BODY KEEPS ITS CHILDREN WHOLE (a ROADMAP carry-over from `crumbs-8`: build 17's Event Settings
 * laid its body out as a flex column, and the column shrank its clipping Cards to their padding). The
 * body is where the popup scrolls, so no child of it may shrink to fit it, whatever layout a caller
 * gives it; jsdom lays nothing out, so the pin is the rule the body carries, as the settings sheet's is.
 */
describe("the body", () => {
  it("never lets a child shrink to fit, even when a caller lays it out as a flex column", () => {
    render(
      <Popup defaultOpen>
        <PopupContent kind="share" aria-describedby={undefined}>
          <PopupHeader title="Share" />
          <PopupBody className="flex flex-col gap-5">
            <section>A card that clips</section>
          </PopupBody>
        </PopupContent>
      </Popup>,
    )
    const body = document.querySelector<HTMLElement>('[data-slot="popup-body"]')!
    const classes = body.className.split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["flex", "flex-col", "*:shrink-0"]))
  })
})

describe("a level in: a page's head goes up, never out (event-settings r1, `opens=page`)", () => {
  function mountUp(onUp: () => void) {
    return render(
      <Popup defaultOpen>
        <PopupContent kind="settings" routed aria-describedby={undefined}>
          <PopupHeader title="Who can get in" up={{ label: "Settings", onUp }} />
          <PopupBody>
            <p>The door</p>
          </PopupBody>
        </PopupContent>
      </Popup>,
    )
  }

  it("in a hand, the bar's own arrow names where it goes and goes up, the popup staying open", () => {
    setViewportWidth(375)
    let ups = 0
    mountUp(() => ups++)
    fireEvent.click(screen.getByRole("button", { name: "Settings" }))
    expect(ups).toBe(1)
    expect(document.querySelector('[data-slot="popup-content"]')).not.toBeNull()
  })

  it("at a desk, a small back row above the title does the same, the close staying in its corner", () => {
    setViewportWidth(1024)
    let ups = 0
    mountUp(() => ups++)
    const up = screen.getByRole("button", { name: "Settings" })
    expect(up.hasAttribute("data-popup-up")).toBe(true)
    fireEvent.click(up)
    expect(ups).toBe(1)
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="popup-content"]')).not.toBeNull()
  })
})

/**
 * A LAYER A TAP OPENED TAKES NO TAP UNTIL IT HAS SETTLED (crumbs-23, build 26's red-team). A layer fades
 * in under the finger and is hit-testable from its first frame, so the second tap of a double tap on the
 * hub's Settings card landed on the sheet's "This event" row. Read off the layer itself: a CSS
 * ANIMATION of its own still running (its entrance, its exit) swallows a click inside it and an outside
 * press on the scrim; a CSS transition (the keyboard's lift), a loop that never ends and an engine with
 * no `getAnimations` at all (jsdom) never do. jsdom runs no animation, so the element's own
 * `getAnimations` is stood in for, as the album's tiles stand in for `complete`.
 */
describe("a layer a tap opened takes no tap until it has settled (crumbs-23)", () => {
  type FakeAnimation = {
    playState: string
    animationName?: string
    transitionProperty?: string
    effect?: { getComputedTiming: () => { iterations: number } }
  }
  let running: FakeAnimation[] = []
  const realGetAnimations = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "getAnimations")

  beforeEach(() => {
    running = []
    Object.defineProperty(HTMLElement.prototype, "getAnimations", {
      configurable: true,
      value: () => running,
    })
  })
  afterEach(() => {
    if (realGetAnimations) Object.defineProperty(HTMLElement.prototype, "getAnimations", realGetAnimations)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>).getAnimations
  })

  const entrance: FakeAnimation = { animationName: "enter", playState: "running" }

  /** A popup with a row that counts its taps, and the header's own way out. */
  function mountRow(onRow: () => void) {
    setViewportWidth(375)
    const view = render(
      <Popup defaultOpen>
        <PopupContent kind="settings" routed aria-describedby={undefined}>
          <PopupHeader title="Settings" back="Album" />
          <PopupBody>
            <button type="button" onClick={onRow}>
              This event
            </button>
          </PopupBody>
        </PopupContent>
      </Popup>,
    )
    return {
      ...view,
      row: () => screen.getByRole("button", { name: "This event" }),
      open: () => document.querySelector('[data-slot="popup-content"]') !== null,
    }
  }

  it("★ swallows a click on a row while its entrance is still running, and takes it once it has run out", () => {
    let taps = 0
    const { row } = mountRow(() => taps++)

    running = [entrance]
    fireEvent.click(row())
    expect(taps).toBe(0)

    // The entrance is over (a finished animation leaves the element's list): the same tap is a tap.
    running = []
    fireEvent.click(row())
    expect(taps).toBe(1)
  })

  it("★ swallows the PRESS as well while it arrives: no row hears it, and its default (the focus that raises a phone's keyboard) never runs (crumbs-26, build 27's red-team)", () => {
    // The second tap of a double tap on the code card's "Everything" landed in the Share sheet it had just
    // opened: its click was swallowed, but its mousedown focused the "Custom link" field beside Save link
    // (2 runs of 3), and on a phone a focused field raises the keyboard over the sheet.
    setViewportWidth(375)
    const heard: string[] = []
    render(
      <Popup defaultOpen>
        <PopupContent kind="settings" routed aria-describedby={undefined}>
          <PopupHeader title="Share" back="Album" />
          <PopupBody>
            <input
              aria-label="Custom link"
              onPointerDown={() => heard.push("pointerdown")}
              onMouseDown={() => heard.push("mousedown")}
            />
          </PopupBody>
        </PopupContent>
      </Popup>,
    )
    const field = screen.getByRole("textbox", { name: "Custom link" })

    running = [entrance]
    // `fireEvent` answers false when a listener prevented the event's default.
    expect(fireEvent.pointerDown(field, { pointerType: "touch", button: 0 })).toBe(false)
    expect(fireEvent.mouseDown(field, { button: 0 })).toBe(false)
    expect(heard).toEqual([])

    // Settled: the same press is a press, and the field takes it.
    running = []
    expect(fireEvent.pointerDown(field, { pointerType: "touch", button: 0 })).toBe(true)
    expect(fireEvent.mouseDown(field, { button: 0 })).toBe(true)
    expect(heard).toEqual(["pointerdown", "mousedown"])
  })

  it("a press that began while it arrived takes its click with it, however late the finger lifts", () => {
    // The entrance can run out between the finger going down and coming up: the press was still nobody's.
    let taps = 0
    const { row } = mountRow(() => taps++)
    running = [entrance]
    fireEvent.pointerDown(row(), { pointerType: "touch", button: 0 })
    running = []
    fireEvent.click(row(), { detail: 1 })
    expect(taps).toBe(0)

    // The next press starts on a settled layer and is a tap.
    fireEvent.pointerDown(row(), { pointerType: "touch", button: 0 })
    fireEvent.click(row(), { detail: 1 })
    expect(taps).toBe(1)
  })

  it("a key's click after a swallowed press is still the key's: Enter on a row is never eaten for a finger that never lifted", () => {
    let taps = 0
    const { row } = mountRow(() => taps++)
    running = [entrance]
    fireEvent.pointerDown(row(), { pointerType: "touch", button: 0 })
    running = []
    // A keyboard's click carries no count (`detail` 0).
    fireEvent.click(row(), { detail: 0 })
    expect(taps).toBe(1)
  })

  it("★ never lets the scrim's outside press dismiss a layer that is still arriving", async () => {
    const { open } = mountRow(() => {})
    const scrim = document.querySelector<HTMLElement>('[data-slot="popup-overlay"]')!
    // Radix listens for an outside press only from the next task after it mounts (so the press that
    // opened it is never one): let that task run before pressing.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })

    running = [entrance]
    fireEvent.pointerDown(scrim, { pointerType: "mouse", button: 0 })
    await act(async () => {})
    expect(open()).toBe(true)

    running = []
    fireEvent.pointerDown(scrim, { pointerType: "mouse", button: 0 })
    await waitFor(() => expect(open()).toBe(false))
  })

  it("swallows a layer's exit too: one on its way out takes no tap", () => {
    let taps = 0
    const { row } = mountRow(() => taps++)
    running = [{ animationName: "exit", playState: "running" }]
    fireEvent.click(row())
    expect(taps).toBe(0)
  })

  it("an entrance that has run out (finished, or never started) is not an arrival", () => {
    let taps = 0
    const { row } = mountRow(() => taps++)
    for (const playState of ["finished", "idle", "paused"]) {
      running = [{ animationName: "enter", playState }]
      fireEvent.click(row())
    }
    expect(taps).toBe(3)
  })

  it("a CSS TRANSITION is not an arrival: the keyboard's lift glides the sheet and a tap mid-glide is a real tap", () => {
    let taps = 0
    const { row } = mountRow(() => taps++)
    running = [{ transitionProperty: "bottom", playState: "running" }]
    fireEvent.click(row())
    expect(taps).toBe(1)
  })

  it("a loop that never ends is not an arrival: a pulse a caller put on the layer cannot make it deaf for ever", () => {
    let taps = 0
    const { row } = mountRow(() => taps++)
    running = [
      {
        animationName: "pulse",
        playState: "running",
        effect: { getComputedTiming: () => ({ iterations: Infinity }) },
      },
    ]
    fireEvent.click(row())
    expect(taps).toBe(1)
  })

  it("an engine with no getAnimations never swallows anything (jsdom, every test in this file)", () => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).getAnimations
    let taps = 0
    const { row } = mountRow(() => taps++)
    fireEvent.click(row())
    expect(taps).toBe(1)
  })
})
