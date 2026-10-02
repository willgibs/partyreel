"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { usePortalContainer } from "@/components/ui/portal-container"

import { cn } from "@/lib/utils"
import { useKeyboardInset } from "@/lib/use-keyboard-inset"
import { Button } from "@/components/ui/button"
import {
  floatingClock,
  floatingEntrance,
  floatingPanel,
  floatingPopupShapes,
} from "@/components/ui/floating-layer"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={usePortalContainer()} {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 ease-emphasis supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        // The scrim shares the panel's clock, or the page dims on one beat and
        // the dialog lands on another.
        floatingClock.standard,
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  fullScreen = false,
  size = "sm",
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  // fullScreen = an edge-to-edge takeover (e.g. the host review surface): a flex
  // column that fills the viewport, entering on a fade + slight RISE (never the
  // centered zoom - a whole-screen zoom reads wrong). Still gets radix's focus
  // trap, scroll lock and Escape: the lock is the Overlay's, so a takeover wears
  // one that draws nothing (below). Pair with showCloseButton={false} + your own
  // header close.
  fullScreen?: boolean
  /**
   * How wide it is, by what it says (the `dialog` shape's `data-size`). A
   * width class would lose to the shape's own scoped rule, so size it here.
   */
  size?: "sm" | "md" | "lg"
}) {
  // ★ THE DIALOG LEARNED THE SHEET'S KEYBOARD RULE (`popups` r1, the carried
  // call `keyboard-dialog`). It used to centre in the layout viewport, so on a
  // phone the lower half of any dialog with a field sat under the keyboard. It
  // now wears the contract's `dialog` shape (`floatingPopupShapes`), which
  // centres in the band `useKeyboardInset` measures while a field inside holds
  // focus on a touch screen and falls back to exactly `top-1/2` otherwise, so a
  // dialog nobody types in never moves. A kind of popup opens through
  // `PopupContent` (`ui/popup.tsx`); this stays the primitive for the dialogs
  // the popups board left alone (Welcome to Pro, the cropper, the viewer's own).
  // The element, as state: Radix mounts the content a render after its portal.
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const composedRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      setNode(el)
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )
  useKeyboardInset(node, !fullScreen)

  return (
    <DialogPortal>
      {/* ★ THE OVERLAY IS THE PAGE'S SCROLL LOCK, so a takeover keeps one. Radix
          locks the page from the Overlay (its RemoveScroll, which also takes the
          desk's scrollbar away), never from Content: a takeover with no Overlay
          scrolled the page under it and kept a scrollbar strip beside its edge.
          fullScreen content is opaque + edge-to-edge, so its overlay draws
          nothing: no scrim, and no backdrop-blur, which would burn a
          full-viewport blur every frame (costly on phones, the host's device)
          and peek at the edges during the slide-out. It keeps the dialog's
          animation classes, invisible on a transparent ground, so the lock holds
          through the takeover's own exit instead of letting the page's
          scrollbar back in a beat before the screen has left. */}
      <DialogOverlay
        className={
          fullScreen
            ? "bg-transparent supports-backdrop-filter:backdrop-blur-none"
            : undefined
        }
      />
      <DialogPrimitive.Content
        ref={composedRef}
        data-slot="dialog-content"
        data-shape={fullScreen ? undefined : "dialog"}
        data-size={fullScreen ? undefined : size}
        className={cn(
          // A dialog wants a decision, so it is the surface Will kept a beat
          // for when he chose entrances by frequency: the standard clock, in
          // both shapes.
          floatingClock.standard,
          fullScreen
            ? // Takeover: fill the screen, fade + a small rise in (8px).
              // bg-background so it's opaque over the page; the children own the
              // header / scroll / footer rows. Not the centred zoom: a
              // whole-screen zoom reads wrong, which is why this one shape sits
              // outside the shared entrance rather than pretending to be in it.
              "fixed inset-0 z-50 flex flex-col bg-background ease-emphasis outline-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-2 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-2"
            : // The floating layer: the family's corner, material and light,
              // and its entrance (the `data-[side]` travel in that language
              // simply never matches a centred panel); where it stands, how
              // wide it is and its cap are the `dialog` shape's. A dialog
              // taller than what is left of the screen scrolls inside itself.
              cn(
                "fixed z-50 grid gap-4 overflow-x-hidden overflow-y-auto overscroll-contain p-4 text-sm outline-none",
                floatingPanel,
                floatingEntrance,
                floatingPopupShapes
              ),
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-float border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // The ladder's `card-title` step. `leading-none` stays and deliberately
        // overrides the step's line-height: a dialog header is a tight
        // two-element lockup where the title's own box is the spacing. No
        // weight of its own: the face's 700 is the utility's (card.tsx).
        "font-heading text-card-title leading-none",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
