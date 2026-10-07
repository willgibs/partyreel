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

  /**
   * ★ A HALO NEEDS ROOM (crumbs-87, red-team 56b's LOW). The fold clips with `overflow: hidden`, and a focus halo is drawn
   * outside its control, so a control that touched the box (the door's two switches at the card's edge, the size select, the
   * first look and the first hold: measured at 0px) lost the side of its halo that touched it. Layout has no size in
   * jsdom, so what is pinned is the construction the measurement was fixed with: each clip box padded by a step and
   * pulled back by the same (it moves nothing), taking no press of its own, with the content keeping its.
   */
  it("★ clips a halo's reach outside its content, not at its edge, and moves nothing for it", () => {
    mount(true)
    const clips = [...document.querySelectorAll("[data-dormant-clip]")]
    // The line's box and the controls' box.
    expect(clips).toHaveLength(2)
    for (const clip of clips) {
      const classes = clip.className.split(/\s+/)
      expect(classes).toContain("overflow-hidden")
      const pad = classes.find((c) => /^p-\d+$/.test(c))?.slice(2)
      expect(pad, "a padded clip box").toBeDefined()
      expect(classes).toContain(`-m-${pad}`)
      expect(classes).toContain("pointer-events-none")
    }
    expect(screen.getByRole("button", { name: "Noir" }).parentElement?.className).toContain("pointer-events-auto")
    expect(screen.getByText("Its look and its hold.").className).toContain("pointer-events-auto")
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
