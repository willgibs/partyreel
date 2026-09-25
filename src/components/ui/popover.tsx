"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  floatingClock,
  floatingEntrance,
  floatingPanel,
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
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-64 origin-(--radix-popover-content-transform-origin) p-3",
          floatingPanel,
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
