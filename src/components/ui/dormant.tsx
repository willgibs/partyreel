"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The room a clipped control's halo needs (Tailwind's step, a quarter-rem each: 12px): the band and the line (about
 * 4px) and the bloom's body. A pair, padding and the same pulled back, so the box's content stays where it was.
 */
const HALO_ROOM = "-m-3 p-3"

/**
 * THE DORMANT SETTING (event-settings r1, `idle=greyed` with Will's note, 2026-09-29): a setting with
 * no effect right now stays in view, tucked under the switch that controls it as ONE QUIET LINE naming
 * what is inside, and unfolds into its full controls when that switch turns it on.
 *
 * His note is the specification: "I don't want the no current effect settings to fully disappear
 * because they do an amazing job at hinting at unused features ... I don't love this selected
 * option's disabled design simply going grey ... a more 'magical' transition that keeps unused
 * features visible, nested clearly to show what controls what, but not always showing the full state
 * of all configs when some have no effect." So:
 *   - never plain grey and never hidden: asleep, the line names what waits ("Its look and its hold"),
 *     on the same nesting rule its controls stand on, so what controls what reads at a glance;
 *   - awake, the line gives way to the controls themselves, which unfold in its place (the row's
 *     height opens as the controls fade up); under reduced motion nothing moves, it simply changes;
 *   - asleep, the controls are `inert`: a keyboard never tabs into a setting that does nothing.
 *
 * Used by the reel's look and hold, A photo first while uploads are paused, the size cap under
 * Videos, and the door's steps under Only me: one primitive, so every setting another one switches
 * off behaves the same.
 *
 * ★ THE BOX THAT CLIPS LEAVES ROOM FOR A FOCUS HALO (crumbs-87, red-team 56b's LOW). The fold needs
 * `overflow: hidden` to collapse its row, and a halo (the band, the line, the bloom: `focus-halo`) is
 * drawn OUTSIDE its control, so a control that touched the box lost the side of its halo that touched
 * it: the door's two switches at the card's right edge (measured: 0px of room), the size select, the
 * first look and the first hold. The clip box is padded by `HALO_ROOM` and pulled back by the same, so
 * nothing in the layout moves and the clip stands a halo's reach outside the content. Its padding
 * takes no press (`pointer-events-none`; the content keeps its own while it is shown), and a folded
 * side is inert (crumbs-89: the folded line showed through that padding and took the press meant for
 * the control under it), so the strip lying over a neighbour never catches a tap meant for it.
 */
function Dormant({
  awake,
  summary,
  className,
  children,
}: {
  /** Whether the switch above has given these settings an effect. */
  awake: boolean
  /** The one quiet line while asleep: what waits here, and what wakes it. */
  summary: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="dormant"
      data-awake={awake ? "" : undefined}
      className={cn("group/dormant", className)}
    >
      {/* The line: open while asleep, folded away as the controls unfold. ★ FOLDED, IT TAKES NO PRESS (crumbs-89, red-team
          57b's LOW): its clip box stands a halo's reach outside the fold, so the folded line, invisible and in a layer of
          its own (its fold's opacity), showed through the box's 12px under the fold and caught the taps meant for the
          control drawn there (the "A photo first" label and "Max size", at every width). Inert, as the controls are
          while asleep: no press, no focus, no reader, and the box still clips nothing of a halo. */}
      <div
        aria-hidden={awake}
        inert={awake}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-emphasis motion-reduce:transition-none",
          awake ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div
          data-dormant-clip=""
          className={cn("pointer-events-none min-h-0 overflow-hidden", HALO_ROOM)}
        >
          <p
            data-dormant-summary=""
            className="pointer-events-auto border-l-2 border-border py-0.5 pl-3 text-caption text-pretty text-muted-foreground"
          >
            {summary}
          </p>
        </div>
      </div>
      {/* The controls: folded while asleep (and out of reach), unfolding in the line's place. */}
      <div
        inert={!awake}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-emphasis motion-reduce:transition-none",
          awake ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div
          data-dormant-clip=""
          className={cn("pointer-events-none min-h-0 overflow-hidden", HALO_ROOM)}
        >
          <div className="pointer-events-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}

export { Dormant }
