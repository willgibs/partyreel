"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { usePortalContainer } from "@/components/ui/portal-container"

import { cn } from "@/lib/utils"
import {
  floatingClock,
  floatingEntrance,
  floatingTip,
} from "@/components/ui/floating-layer"

/**
 * A tooltip is the display (identity r2, layers=display): a label for the thing
 * under the cursor, on the camera's own screen, the same near-black on paper
 * and in the room (it was the ink, inverted, which in the room was a white
 * capsule over the dark). Its corner is a capsule's (`floatingTipCorner`); it
 * rides the contract's entrance and light like every panel.
 */

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

/**
 * ★ A TAP NEVER OPENS A TOOLTIP (crumbs-33, from the viewer's capsule, where every tap on Share was lost on
 * Android Chrome). Radix opens a tooltip on any focus no pointer is holding, and guards a press by watching for
 * its pointerup; but a touch's compatibility mousedown, the event that focuses the button, comes AFTER the
 * pointerup, so the focus opened the tooltip with no delay and its arrow landed under the finger, where the click
 * went. A focus a finger (or a pen) began is refused here, before radix reads it, until the tap's click, a blur
 * or a cancelled touch lets go; a keyboard's focus and a cursor's hover open it as before. On a phone a tooltip
 * has nothing to label anyway: the control's own name does.
 */
function TooltipTrigger({
  onPointerDown,
  onPointerCancel,
  onFocus,
  onClick,
  onBlur,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const tapRef = React.useRef(false)
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onPointerDown={(event) => {
        tapRef.current =
          event.pointerType === "touch" || event.pointerType === "pen"
        onPointerDown?.(event)
      }}
      onPointerCancel={(event) => {
        tapRef.current = false
        onPointerCancel?.(event)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        // Radix skips its own open on a prevented event (composeEventHandlers).
        if (tapRef.current) event.preventDefault()
      }}
      onClick={(event) => {
        tapRef.current = false
        onClick?.(event)
      }}
      onBlur={(event) => {
        tapRef.current = false
        onBlur?.(event)
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal container={usePortalContainer()}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
          floatingTip,
          floatingEntrance,
          // The most-opened surface in the product, and the only one opened by
          // a cursor passing over something. Anything slower reads as lag.
          floatingClock.instant,
          // ★ THE ARROW TAKES NO POINTER (crumbs-33). At `sideOffset` 0 radix
          // seats the arrow's box (its own span, which takes no class) over the
          // trigger's top edge, so a press there landed on the tooltip and never
          // reached the control. The diamond still draws; the press goes through.
          "*:has-data-[slot=tooltip-arrow]:pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          data-slot="tooltip-arrow"
          className="pointer-events-none z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-popover fill-popover"
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
