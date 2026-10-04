"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { usePortalContainer } from "@/components/ui/portal-container"

import { cn } from "@/lib/utils"
import {
  floatingClock,
  floatingDisplayPanel,
  floatingEntrance,
  floatingGutter,
} from "@/components/ui/floating-layer"

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  collisionPadding = floatingGutter,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal container={usePortalContainer()}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        // The menus' gutter: a popover beside a control at the edge of a phone
        // (the storage ring at 375) stands clear of the glass, never flush to it.
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 w-64 origin-(--radix-popover-content-transform-origin) p-3",
          // The display (layers=display): a popover is a quick layer, what a
          // press opens and the next press closes, so it is the camera's own
          // screen; whatever it holds reads the screen's tokens.
          floatingDisplayPanel,
          floatingEntrance,
          // A popover is asked for, not stumbled into: the storage meter's
          // explanation, the anonymous-upload note. Occasional, so it gets the
          // beat a menu cannot afford.
          floatingClock.standard,
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
