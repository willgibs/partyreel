/**
 * THE ONE RESPONSIVE MENU (`popups` r1, `choices=menu`).
 *
 * Pinned is what a choice must do whichever shape it is in, never how it looks: a desk gets a menu
 * (a real `menu` of rows, at the button that asked, focus given back to that button), a hand gets
 * the rows with Cancel beneath, and in both a row is the act, run inside the tap that pressed it
 * and closing the menu after. Where the menu stands on the page is Radix's Popper and the shape is
 * the Library's.
 */
import { useRef, useState } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
} from "@/components/ui/responsive-menu"
import { setViewportWidth } from "../../../vitest.setup"

afterEach(() => {
  setViewportWidth(1024)
})

function Harness({
  onTake = vi.fn(),
  anchor = "ref",
}: {
  onTake?: () => void
  anchor?: "ref" | "pressed"
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button ref={ref} type="button" onClick={() => setOpen(true)}>
        Add photos
      </button>
      <ResponsiveMenu
        open={open}
        onOpenChange={setOpen}
        anchor={anchor === "ref" ? ref : "pressed"}
        title="Everything you add joins Maya's album."
      >
        <ResponsiveMenuItem onSelect={onTake}>Take a photo</ResponsiveMenuItem>
        <ResponsiveMenuItem>Choose from your album</ResponsiveMenuItem>
        <ResponsiveMenuNote>Photos and videos, up to 10 GB each.</ResponsiveMenuNote>
      </ResponsiveMenu>
    </>
  )
}

describe("at a desk: a menu under the button that asked", () => {
  it("opens a menu of rows, and a row is the act: it runs, then the menu closes", () => {
    const onTake = vi.fn()
    render(<Harness onTake={onTake} />)
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }))
    expect(screen.getByRole("menu")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull()

    fireEvent.click(screen.getByRole("menuitem", { name: "Take a photo" }))
    expect(onTake).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("walks its rows with the arrow keys", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }))
    const menu = screen.getByRole("menu")
    const [first, second] = screen.getAllByRole("menuitem")
    act(() => first.focus())
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    expect(second).toHaveFocus()
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    expect(first).toHaveFocus()
  })

  it("gives focus back to the button that asked, even one it was never handed", async () => {
    // Add photos is opened by buttons the page owns: the menu remembers the
    // one pressed, in the capture phase, before its own handler opened it.
    render(<Harness anchor="pressed" />)
    const add = screen.getByRole("button", { name: "Add photos" })
    fireEvent.click(add)
    expect(screen.getByRole("menu")).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    expect(add).toHaveFocus()
  })
})

describe("in a hand: the rows at the thumb, Cancel beneath", () => {
  it("says what the choice is about, offers Cancel, and a row is still the act", () => {
    setViewportWidth(375)
    const onTake = vi.fn()
    render(<Harness onTake={onTake} />)
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }))
    const sheet = screen.getByRole("dialog", { name: /joins maya's album/i })
    expect(sheet).toBeInTheDocument()

    fireEvent.click(screen.getByRole("menuitem", { name: "Take a photo" }))
    expect(onTake).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("closes on Cancel and does nothing else", () => {
    setViewportWidth(375)
    const onTake = vi.fn()
    render(<Harness onTake={onTake} />)
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(onTake).not.toHaveBeenCalled()
  })
})
