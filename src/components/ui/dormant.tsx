"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

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
      {/* The line: open while asleep, folded away as the controls unfold. */}
      <div
        aria-hidden={awake}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-emphasis motion-reduce:transition-none",
          awake ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            data-dormant-summary=""
            className="border-l-2 border-border py-0.5 pl-3 text-caption text-pretty text-muted-foreground"
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
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

export { Dormant }
