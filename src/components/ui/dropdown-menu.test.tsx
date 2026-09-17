// @contract-for: src/components/ui/dropdown-menu.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuGroup,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu"

/**
 * THE MENU'S CONTRACT (the `floating-surfaces` wiring, 2026-09-17).
 *
 * What is pinned is FUNCTION, never a look: that a submenu is portalled out of
 * the panel that would clip it, that a third level of nesting cannot be
 * composed at all, and that Card's parts exist as parts a call site can leave
 * out. Nothing here asserts a radius, a duration, a colour or a word: the next
 * round may rebuild all of that (Will, 2026-09-12).
 */

/** The smallest menu that renders a submenu without a pointer: both open. */
function nested(children: React.ReactNode) {
  return (
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

describe("the menu opens a second menu, and never a third", () => {
  it("portals the submenu, so a transformed or scrolled parent cannot clip it", () => {
    // ★ THE BUG THIS REPLACED, measured on the live alias: SubContent rendered
    // as a DOM DESCENDANT of Content, which carries overflow-y-auto and
    // animates with a transform. A transformed ancestor becomes the containing
    // block for its `fixed` descendants, so a submenu opened by a CLICK (which
    // puts the parent into its closing animation) had a real measured box,
    // three items, and painted nothing; a scrolled parent clipped it the same
    // way. Hover on a settled parent worked, which is how it survived.
    //
    // The contract is therefore an ANCESTRY one and not a pixel one: whatever
    // the parent does to itself, it must not be able to reach the submenu.
    render(
      nested(
        <DropdownMenuSub open>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Light</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>,
      ),
    )

    const panel = document.querySelector('[data-slot="dropdown-menu-content"]')
    const submenu = document.querySelector(
      '[data-slot="dropdown-menu-sub-content"]',
    )
    expect(panel, "the menu never opened").not.toBeNull()
    expect(submenu, "the submenu never rendered").not.toBeNull()
    expect(
      panel!.contains(submenu!),
      "the submenu is inside the panel that clips and transforms it: wrap SubContent in a Portal",
    ).toBe(false)
    expect(screen.getByText("Light")).toBeTruthy()
  })

  it("refuses a third level, at render, rather than in a review note", () => {
    // Will, 2026-09-17: "we should not allow an additional third level of
    // nesting. That gets too complicated." A comment saying so is a rule the
    // next agent breaks by accident, so the cap is structural.
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect(() =>
        render(
          nested(
            <DropdownMenuSub open>
              <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuSub open>
                  <DropdownMenuSubTrigger>Deeper</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Too far</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>,
          ),
        ),
      ).toThrow(/two levels/i)
    } finally {
      quiet.mockRestore()
    }
  })
})

describe("Card's anatomy is parts, not a shape", () => {
  it("wears a title row, labelled groups and a footer rail when a menu has them", () => {
    render(
      nested(
        <>
          <DropdownMenuHeader meta="Pro">Ana and Theo</DropdownMenuHeader>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Share</DropdownMenuLabel>
            <DropdownMenuItem>Copy the guest link</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuFooter>
            <DropdownMenuItem variant="destructive">
              Delete the event
            </DropdownMenuItem>
          </DropdownMenuFooter>
        </>,
      ),
    )
    for (const slot of [
      "dropdown-menu-header",
      "dropdown-menu-group",
      "dropdown-menu-label",
      "dropdown-menu-footer",
    ]) {
      expect(
        document.querySelector(`[data-slot="${slot}"]`),
        `${slot} is missing`,
      ).not.toBeNull()
    }
    expect(screen.getByText("Pro")).toBeTruthy()
  })

  it("renders a two-row overflow with none of them, because Card's cost is real", () => {
    // The board's own note on the winner: "a two-row menu is suddenly
    // furniture. It is the right answer for the event menu and the wrong one
    // for a three-row overflow." So every part is optional, and a menu with
    // nothing to say says nothing.
    render(
      nested(
        <>
          <DropdownMenuItem>SVG</DropdownMenuItem>
          <DropdownMenuItem>PNG</DropdownMenuItem>
        </>,
      ),
    )
    expect(
      document.querySelector('[data-slot="dropdown-menu-header"]'),
    ).toBeNull()
    expect(document.querySelectorAll('[data-slot="dropdown-menu-item"]')).toHaveLength(
      2,
    )
  })
})
