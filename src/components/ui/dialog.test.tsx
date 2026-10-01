/**
 * THE PAGE UNDER A DIALOG, IN BOTH OF ITS SHAPES.
 *
 * Radix holds the page still from the OVERLAY (its RemoveScroll, which also takes the desk's scrollbar
 * away with it), never from Content. A `fullScreen` takeover that left the overlay out scrolled the
 * album beneath it and kept a scrollbar strip down the side of its edge, and its own comment said the
 * lock came for free. What is pinned is the lock, as `data-scroll-locked` on the body: that it stands
 * while either shape is open and lets go when it closes. How the takeover looks is the Library's.
 */
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

function mount(fullScreen: boolean) {
  return render(
    <Dialog open>
      <DialogContent
        fullScreen={fullScreen}
        showCloseButton={!fullScreen}
        aria-describedby={undefined}
      >
        <DialogTitle>Review</DialogTitle>
      </DialogContent>
    </Dialog>,
  )
}

describe("the page under a dialog", () => {
  it.each([
    ["the centred dialog", false],
    ["the fullScreen takeover", true],
  ])("cannot scroll while %s is open, and scrolls again once it closes", (_, fullScreen) => {
    expect(document.body).not.toHaveAttribute("data-scroll-locked")
    const { unmount } = mount(fullScreen)
    expect(document.body).toHaveAttribute("data-scroll-locked")
    unmount()
    expect(document.body).not.toHaveAttribute("data-scroll-locked")
  })
})
