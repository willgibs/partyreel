"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * THE METER AS FRAMES (identity r2: voice=camera builds it, status=lights
 * colours it): twelve frames that fill as a roll fills, a short bar cut by
 * gaps into frames rather than one rounded track. The track is a faint wash of
 * the ground's ink; what is measured fills in its state's light, the success
 * green, or the failure red when the meter says it failed (`aria-invalid` on
 * the meter, which a caller sets with what it reports).
 *
 * ★ ONE MASK, ON THE ROOT: the gaps are cut through the track and the fill
 * together, so the fill's leading edge stops inside a frame like a roll's
 * counter, and the indicator still moves on its own transform (no mask on the
 * moving element). The mask's twelve repeats are of the meter's own width.
 */
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "group/progress relative h-1.5 w-full overflow-hidden bg-foreground/10 [mask-image:repeating-linear-gradient(90deg,#000_0_calc(100%/12_-_3px),transparent_calc(100%/12_-_3px)_calc(100%/12))]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-success transition-transform duration-300 ease-emphasis group-aria-invalid/progress:bg-destructive"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
