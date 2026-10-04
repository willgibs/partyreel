import { render, screen } from "@testing-library/react"
import { Images } from "lucide-react"
import { describe, expect, it } from "vitest"

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty"
import { EmptyState } from "@/components/shared/empty-state"
import { Empty } from "@/components/ui/empty"

/**
 * THE ONE EMPTY PLACE (identity r2's carried call `one-empty`): "nothing here
 * yet" is one atom, a glyph, a title, a line and an action, wearing the board's
 * hooks, and the shared empty states are it. Behaviour and hooks only: its
 * lens is the Library's to show.
 */
describe("the empty place", () => {
  it("draws its parts on the board's hooks, the glyph out of the reading order", () => {
    render(
      <Empty
        icon={<Images data-testid="glyph" />}
        title="Nothing waiting"
        line="Photos you hold for review land here."
        action={<button type="button">Open the album</button>}
      />,
    )
    const root = document.querySelector('[data-slot="empty"]')
    expect(root).not.toBeNull()
    const glyph = screen
      .getByTestId("glyph")
      .closest('[data-slot="empty-glyph"]')
    expect(glyph).toHaveAttribute("aria-hidden", "true")
    expect(
      screen.getByRole("heading", { name: "Nothing waiting" }),
    ).toHaveAttribute("data-slot", "empty-title")
    expect(
      screen.getByText("Photos you hold for review land here."),
    ).toHaveAttribute("data-slot", "empty-line")
    expect(
      screen.getByRole("button", { name: "Open the album" }).parentElement,
    ).toHaveAttribute("data-slot", "empty-action")
    for (const part of [
      "empty-glyph",
      "empty-copy",
      "empty-title",
      "empty-line",
      "empty-action",
    ])
      expect(root!.querySelector(`[data-slot="${part}"]`), part).not.toBeNull()
  })

  it("is quiet without a glyph, and draws no part it was not given", () => {
    render(<Empty title="No likes yet" />)
    const root = document.querySelector('[data-slot="empty"]')!
    expect(root.querySelector('[data-slot="empty-glyph"]')).toBeNull()
    expect(root.querySelector('[data-slot="empty-line"]')).toBeNull()
    expect(root.querySelector('[data-slot="empty-action"]')).toBeNull()
  })

  it("titles the place as a heading unless its head already says what it is", () => {
    const { rerender } = render(<Empty title="Nothing here" />)
    expect(screen.getByRole("heading", { name: "Nothing here" }).tagName).toBe(
      "H3",
    )
    rerender(<Empty title="Nothing here" titleAs="p" />)
    expect(screen.queryByRole("heading")).toBeNull()
    expect(screen.getByText("Nothing here").tagName).toBe("P")
  })
})

describe("the shared empty states are the one empty place", () => {
  it("draws EmptyState as the atom, its glyph only in the icon form", () => {
    const { rerender } = render(
      <EmptyState
        icon={Images}
        title="No likes yet"
        description="Tap the heart."
      />,
    )
    expect(document.querySelector('[data-slot="empty"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="empty-glyph"]')).not.toBeNull()
    expect(
      screen.getByRole("heading", { name: "No likes yet" }),
    ).toBeInTheDocument()
    rerender(
      <EmptyState
        icon={Images}
        variant="quiet"
        title="No likes yet"
        description="Tap the heart."
      />,
    )
    expect(document.querySelector('[data-slot="empty-glyph"]')).toBeNull()
  })

  it("keeps the feed's section empty a line under its head, on the swap's entrance", () => {
    render(
      <FeedSectionEmpty
        icon={Images}
        title="Nothing waiting"
        desc="Photos you hold for review land here."
      />,
    )
    const root = document.querySelector('[data-slot="empty"]')
    expect(root).toHaveAttribute("data-arrive")
    expect(screen.queryByRole("heading")).toBeNull()
    expect(screen.getByText("Nothing waiting")).toHaveAttribute(
      "data-slot",
      "empty-title",
    )
  })
})
