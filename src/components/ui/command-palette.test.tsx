import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
} from "./command-palette"

/**
 * THE PALETTE'S CONTRACT (admin-wiring, 2026-09-20).
 *
 * A palette is a COMBOBOX over a listbox, and the whole of what makes it usable
 * without a mouse is the aria wiring plus five keys. That is what is pinned:
 * the roles, `aria-activedescendant` following the arrows, Enter taking the row
 * that is actually highlighted, and Home and End reaching the ends. Nothing
 * here asserts a width, a corner, a duration or a word.
 *
 * ★ IT ALSO PINS THE FIRST ROW BEING ACTIVE BEFORE ANY KEY IS PRESSED, which is
 * the bug the DOM-reading approach was written to avoid: an Item cannot know
 * whether it is first during its own render, so the list decides after the page
 * exists. A palette that opens with nothing selected makes Enter do nothing,
 * which is the one thing a palette must never do.
 */

function palette(onSelect = vi.fn()) {
  render(
    <CommandPalette open onOpenChange={() => {}}>
      <CommandPaletteContent label="Search the portal">
        <CommandPaletteInput label="Search" />
        <CommandPaletteList label="Results">
          <CommandPaletteGroup heading="Surfaces">
            <CommandPaletteItem onSelect={() => onSelect("support")}>
              Support
            </CommandPaletteItem>
            <CommandPaletteItem onSelect={() => onSelect("jobs")}>
              Jobs
            </CommandPaletteItem>
            <CommandPaletteItem onSelect={() => onSelect("reports")}>
              Reports
            </CommandPaletteItem>
          </CommandPaletteGroup>
        </CommandPaletteList>
      </CommandPaletteContent>
    </CommandPalette>,
  )
  return { onSelect, input: screen.getByRole("combobox") }
}

const options = () => screen.getAllByRole("option")
const active = () => screen.getByRole("combobox").getAttribute("aria-activedescendant")

describe("the palette is a combobox over a listbox", () => {
  it("wires the field to the list it controls", () => {
    const { input } = palette()
    expect(input).toHaveAttribute("aria-autocomplete", "list")
    expect(input).toHaveAttribute("aria-expanded", "true")
    const listbox = screen.getByRole("listbox")
    expect(input.getAttribute("aria-controls")).toBe(listbox.id)
  })

  it("activates the first row before a key is pressed, so Enter always does something", () => {
    palette()
    expect(active()).toBe(options()[0].id)
    expect(options()[0]).toHaveAttribute("aria-selected", "true")
  })
})

describe("five keys and nothing else", () => {
  it("walks the list with the arrows and stops at both ends", async () => {
    const user = userEvent.setup()
    const { input } = palette()
    await user.click(input)

    await user.keyboard("{ArrowDown}")
    expect(active()).toBe(options()[1].id)
    await user.keyboard("{ArrowDown}{ArrowDown}")
    // Three rows: it clamps rather than wrapping, so holding the key does not
    // spin a list a reader is trying to read.
    expect(active()).toBe(options()[2].id)
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}")
    expect(active()).toBe(options()[0].id)
  })

  it("reaches both ends with Home and End", async () => {
    const user = userEvent.setup()
    const { input } = palette()
    await user.click(input)
    await user.keyboard("{End}")
    expect(active()).toBe(options()[2].id)
    await user.keyboard("{Home}")
    expect(active()).toBe(options()[0].id)
  })

  it("opens the row that is highlighted, not the one that was first", async () => {
    const user = userEvent.setup()
    const { input, onSelect } = palette()
    await user.click(input)
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onSelect).toHaveBeenCalledWith("jobs")
  })

  it("moves the highlight with the pointer, so the mouse and the keys agree", async () => {
    const user = userEvent.setup()
    palette()
    await user.hover(options()[2])
    expect(active()).toBe(options()[2].id)
  })
})

describe("what the field holds", () => {
  it("hands the query to whoever is filtering, and never filters itself", async () => {
    // The primitive has no index and no ranking on purpose: the admin's index,
    // the help centre's ranking and any future palette are all call sites.
    const user = userEvent.setup()
    const { input } = palette()
    await user.click(input)
    await user.keyboard("sup")
    expect(input).toHaveValue("sup")
    // All three rows are still drawn, because nothing in the primitive removed
    // any of them.
    expect(options()).toHaveLength(3)
  })
})
