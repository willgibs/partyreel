"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { usePortalContainer } from "@/components/ui/portal-container"

import { useHydrated } from "@/lib/shared/use-hydrated"
import { cn } from "@/lib/utils"
import {
  floatingClock,
  floatingEntrance,
  floatingGutter,
  floatingTip,
} from "@/components/ui/floating-layer"

/**
 * A tooltip is the display (identity r2, layers=display): a label for the thing
 * under the cursor, on the camera's own screen, near-black on paper and lit
 * graphite in the room (it was the ink, inverted, which in the room was a white
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

/**
 * ★ WORDS A FINGER MUST BE ABLE TO ASK FOR, ONE PRESS MODEL (crumbs-64): for a control whose words are the thing asked for
 * (a glyph with no label beside it, a table row's fine print), where a tooltip no tap can open would leave a phone holding
 * something it cannot read. The code's corner mark, the glyph count and the pricing matrix's row each carried this logic
 * beside the primitive above, and each is this one now:
 *
 *  - a TAP toggles the words, open and shut;
 *  - a CURSOR's hover opens them as before, and its click KEEPS them open: Radix dismisses an open tooltip at the PRESS of
 *    anything outside its words, its own trigger included, so a click would blink them shut and reopen them a beat later
 *    (the face's own press is no dismissal here, `onPointerDownOutside`);
 *  - a KEY toggles them: Enter, Space and any click no pointer made (assistive technology's activation);
 *  - a tap anywhere else, the page scrolling and Escape put them away, and so does a finger's tap on the words themselves
 *    (a cursor's click on them does not: it may be selecting a phrase to copy).
 *
 * ★ AN ICON CONTROL NEVER WEARS IT. A control whose own name is its label (a toolbar's Share) keeps the primitive above,
 * which refuses a finger on purpose (crumbs-33): a tap there is the control's, and the words only get in its way.
 *
 * ★ THE FACE IS THE CALLER'S, ONE ELEMENT (a button), and the press lands on it: a glyph names itself (`aria-label`),
 * and what pressing it does besides is the face's own `onClick`, which runs first. It is never a link: its click's
 * default is cancelled.
 *
 * ★ THE RICH TOOLTIP MOUNTS ONLY AFTER HYDRATION (`architecture.md`: radix tooltips on an SSR'd surface left the host
 * page unhydrated in production). The server's paint and the hydrating render carry the browser's own `title` (the
 * words, when they are a string), and the swap is an ordinary later render.
 *
 * ★ ITS OWN PROVIDER, at the root's own timing (`providers.tsx`): an atom drawn wherever a head is, never one that
 * throws where a surface (or a test of one) stands outside the app's providers.
 *
 * Whatever else it is given reaches the words' layer (`side`, `className`, the portal skin's attributes); the gutter at
 * the glass is the floating layer's own (`floatingGutter`) unless a surface names its own.
 */
function TapTooltip({
  children,
  words,
  className,
  collisionPadding = floatingGutter,
  onPointerDownOutside,
  onPointerDown,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof TooltipContent>, "children"> & {
  /** The face: one element, which becomes the trigger. */
  children: React.ReactElement<{ title?: string }>
  /** The words. A string is also the face's `title` until hydration. */
  words: React.ReactNode
}) {
  const hydrated = useHydrated()
  const [open, setOpen] = React.useState(false)
  const faceRef = React.useRef<HTMLButtonElement>(null)
  // How the press about to click began, and whether the words stood open under it: a tap's own pointerleave reaches
  // the tooltip before its click does, so the click alone could not tell a tap that opens them from one that closes.
  const press = React.useRef<{ touch: boolean; wasOpen: boolean } | null>(null)
  // What last pressed the words themselves.
  const onWords = React.useRef("")

  if (!hydrated) {
    return typeof words === "string" && children.props.title === undefined
      ? React.cloneElement(children, { title: words })
      : children
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          ref={faceRef}
          onPointerDown={(event) => {
            press.current = {
              touch: event.pointerType !== "mouse",
              wasOpen: open,
            }
            // Radix closes an open tooltip on any press of its trigger; the click below decides instead.
            event.preventDefault()
          }}
          onPointerCancel={() => {
            press.current = null
          }}
          onClick={(event) => {
            // Radix's own click closes the tooltip; this one owns what a press does.
            event.preventDefault()
            const began = press.current
            press.current = null
            // A click no pointer made (a key's Enter or Space, assistive technology), or one that is a stale mouse
            // press's after a drag away from the face: a toggle.
            if (!began || (!began.touch && event.detail === 0))
              setOpen((o) => !o)
            else if (began.touch) setOpen(!began.wasOpen)
            else setOpen(true)
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          collisionPadding={collisionPadding}
          className={cn("max-w-60 text-pretty", className)}
          onPointerDownOutside={(event) => {
            // A press on the face is the face's to decide (its click, above), never a dismissal.
            if (faceRef.current?.contains(event.target as Node | null))
              event.preventDefault()
            onPointerDownOutside?.(event)
          }}
          onPointerDown={(event) => {
            onWords.current = event.pointerType
            onPointerDown?.(event)
          }}
          onClick={(event) => {
            onClick?.(event)
            if (onWords.current && onWords.current !== "mouse") setOpen(false)
          }}
          {...props}
        >
          {words}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export {
  TapTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
}
