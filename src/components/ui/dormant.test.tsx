/**
 * THE DORMANT SETTING (event-settings r1, `idle=greyed` with Will's note): what does nothing right now
 * stays in view as one quiet line naming what waits, and unfolds into its controls when its switch
 * wakes it. Held: never gone (the line is in the page while asleep), never reachable while asleep (the
 * controls are inert), and awake the line steps aside for the controls. The motion is CSS, and under
 * reduced motion there is none (`motion-reduce:transition-none`, read off the classes).
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Dormant } from "@/components/ui/dormant"

function mount(awake: boolean) {
  return render(
    <Dormant awake={awake} summary="Its look and its hold.">
      <button type="button">Noir</button>
    </Dormant>,
  )
}

describe("the dormant setting", () => {
  it("★ asleep: the line names what waits, and the controls are out of reach, never gone", () => {
    mount(false)
    expect(screen.getByText("Its look and its hold.")).toBeInTheDocument()
    const control = screen.getByText("Noir")
    expect(control.closest("[inert]")).not.toBeNull()
    expect(document.querySelector("[data-slot='dormant']")?.hasAttribute("data-awake")).toBe(false)
  })

  it("awake: the controls are live and the line is hidden from a reader", () => {
    mount(true)
    expect(screen.getByRole("button", { name: "Noir" }).closest("[inert]")).toBeNull()
    expect(screen.getByText("Its look and its hold.").closest("[aria-hidden='true']")).not.toBeNull()
  })

  it("moves only where motion is welcome", () => {
    mount(false)
    const folds = document.querySelectorAll("[data-slot='dormant'] > div")
    expect(folds).toHaveLength(2)
    for (const fold of folds) {
      expect(fold.className).toContain("motion-reduce:transition-none")
    }
  })
})
