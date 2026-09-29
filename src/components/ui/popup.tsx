"use client"

import * as React from "react"
import { Dialog as PopupPrimitive } from "radix-ui"
import { ChevronLeftIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useKeyboardInset } from "@/lib/use-keyboard-inset"
import { useMediaQuery } from "@/lib/use-media-query"
import { Button } from "@/components/ui/button"
import { floatingPopupShapes } from "@/components/ui/floating-layer"
import { useBackCloses } from "@/components/ui/popup-back"
import {
  DESK_QUERY,
  isDialogShape,
  isPlaceShape,
  POPUP_KINDS,
  shapeFor,
  type DialogShape,
  type PopupKind,
  type PopupRow,
} from "@/components/ui/popup-kinds"

/**
 * THE POPUP: the Dialog and the Sheet as one element that names its kind
 * (`popups` r1, 2026-09-27; the carried call `one-table`).
 *
 * `<PopupContent kind="confirm">` is the whole of a call site's answer to
 * "where does this open?". The kind's row in `popup-kinds.ts` picks the shape
 * for the width it opens at, and the shape's classes are the floating-layer
 * contract's (`floatingPopupShapes`). So a confirmation, a form, a list, a plan
 * or a place never spells a posture for itself, and when Will moves a kind the
 * one row moves every popup of it.
 *
 * ★ ONE STRUCTURE FOR EVERY SHAPE: a header, a body that scrolls, a footer that
 * stays. A centred dialog, a side panel and a phone's whole screen are the same
 * three parts at different sizes, so the parts read the shape they are in
 * (`usePopupShape`) and a screen's header becomes its bar with a back arrow,
 * a dialog's footer becomes its banded row, and nothing else changes.
 *
 * ★ IT IS KEYBOARD-SAFE AT EVERY SHAPE (`keyboard-dialog`). The Sheet's own
 * hook (`useKeyboardInset`) writes the keyboard onto this element while a text
 * field inside holds focus on a touch screen, every shape stands in what the
 * keyboard leaves, and the body is the scroller the hook reveals a field in.
 *
 * ★ FOCUS NEVER RAISES A KEYBOARD INTO A SURFACE STILL ARRIVING. In a hand
 * focus lands on the popup itself (the Sheet's own rule); at a desk the row's
 * `deskFocus` says (a form is typed into at once, a place is read first).
 */

/**
 * A layer that closes as a SIDE EFFECT of the very interaction that opens the
 * next popup, so its own control is gone by the time focus must return: a
 * menu row (selecting it closes the menu) and a listbox option (Radix
 * Select). A dialog or a sheet is not one of these — nothing about opening a
 * popup over it closes it — so a control inside one is still there to give
 * focus back to.
 */
const EPHEMERAL_LAYER = "[role='menu'], [role='listbox']"

/**
 * THE LAST CONTROL STILL THERE TO GIVE FOCUS BACK TO: on the page itself, or
 * inside a dialog or sheet left open behind the popup that is about to close
 * (a STACKED popup — the one table's rows read on top of whatever opened
 * them, `design-system.md`). A popup opened by something that is not its own
 * trigger (a menu's row, a toast's action, a switch, a stacked confirm's
 * opener) hands focus back here when it closes; Radix would give it to the
 * trigger, and with none, this is what stands in — the CONTROL, never the
 * page behind every open layer, or a confirm raised from inside a still-open
 * panel or viewer would drop focus behind it instead of back inside it. A
 * press counts as well as a focus because Safari does not focus a button it
 * clicks. Watched from the capture phase, once, for the whole document.
 */
let lastOpener: HTMLElement | null = null

function watchTheOpener(event: Event) {
  const target = event.target
  if (!(target instanceof Element)) return
  const control = target.closest<HTMLElement>(
    "button, a[href], input, select, textarea, [tabindex]"
  )
  if (
    control &&
    control !== document.body &&
    !control.closest(EPHEMERAL_LAYER)
  ) {
    lastOpener = control
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("focusin", watchTheOpener, true)
  document.addEventListener("pointerdown", watchTheOpener, true)
}

type PopupState = {
  open: boolean
  setOpen: (open: boolean) => void
  /** Whether the popup has a trigger of its own (`PopupTrigger`) to give focus back to. */
  hasTrigger: () => boolean
  setTrigger: (el: HTMLElement | null) => void
}

const PopupStateContext = React.createContext<PopupState | null>(null)
const PopupShapeContext = React.createContext<DialogShape>("dialog")

/** The shape the nearest popup is standing in, for a part that lays itself out by it. */
function usePopupShape(): DialogShape {
  return React.useContext(PopupShapeContext)
}

/**
 * Radix's Dialog root, holding its own open state when it is not handed one,
 * so the content can close itself (a phone's Back) whichever way it is driven.
 */
function Popup({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof PopupPrimitive.Root>) {
  const [own, setOwn] = React.useState(defaultOpen)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : own
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const setTrigger = React.useCallback((el: HTMLElement | null) => {
    triggerRef.current = el
  }, [])
  const hasTrigger = React.useCallback(() => triggerRef.current !== null, [])
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!controlled) setOwn(next)
      onOpenChange?.(next)
    },
    [controlled, onOpenChange]
  )
  const state = React.useMemo(
    () => ({ open, setOpen, hasTrigger, setTrigger }),
    [open, setOpen, hasTrigger, setTrigger]
  )
  return (
    <PopupStateContext.Provider value={state}>
      <PopupPrimitive.Root open={open} onOpenChange={setOpen} {...props} />
    </PopupStateContext.Provider>
  )
}

function PopupTrigger({
  ref,
  ...props
}: React.ComponentProps<typeof PopupPrimitive.Trigger>) {
  const setTrigger = React.useContext(PopupStateContext)?.setTrigger
  const composedRef = React.useCallback(
    (el: HTMLButtonElement | null) => {
      setTrigger?.(el)
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref, setTrigger]
  )
  return (
    <PopupPrimitive.Trigger
      ref={composedRef}
      data-slot="popup-trigger"
      {...props}
    />
  )
}

function PopupClose({
  ...props
}: React.ComponentProps<typeof PopupPrimitive.Close>) {
  return <PopupPrimitive.Close data-slot="popup-close" {...props} />
}

/**
 * The scrim: the Dialog's and the Sheet's own (10 percent, a hair of blur), on
 * the clock of the shape it sits under. A whole screen needs none, and a
 * full-viewport blur behind an opaque screen is a cost paid every frame for
 * nothing, so it stands but is not drawn there (it stays MOUNTED: Radix's
 * scroll lock rides on it).
 */
const OVERLAY = cn(
  "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
  "duration-300 data-closed:duration-200",
  "data-[shape=dialog]:ease-emphasis data-[shape=dialog]:duration-200 data-[shape=dialog]:data-closed:duration-150 data-[shape=wide]:ease-emphasis data-[shape=wide]:duration-200 data-[shape=wide]:data-closed:duration-150",
  "data-[shape=screen]:invisible data-[shape=cover]:invisible"
)

/**
 * The element every shape stands on: a flex column that clips its own corner,
 * on the popover's ink and the layer's light. A screen and a cover trade both
 * for the page's own ground, since they ARE the page while they are open
 * (`floatingPopupShapes` says so, scoped to their shapes).
 */
const CONTENT =
  "fixed z-50 flex flex-col overflow-hidden bg-popover text-sm text-popover-foreground shadow-layer outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"

function PopupContent({
  kind,
  size = "sm",
  routed = false,
  showCloseButton = true,
  overlayClassName,
  className,
  children,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ref,
  ...props
}: React.ComponentProps<typeof PopupPrimitive.Content> & {
  /** What this popup IS. Its row in `popup-kinds.ts` is where it opens. */
  kind: PopupKind
  /**
   * How wide a centred shape is, by what it says: `sm` a question, `md` one
   * that lists what leaves (`confirm=dialog`: "wider when it lists what
   * leaves"), `lg` a long form. The edge shapes ignore it.
   */
  size?: "sm" | "md" | "lg"
  /**
   * The popup has a URL of its own (`?room=settings`, `?room=share`), so the
   * page already puts it in history and a phone's Back already closes it.
   */
  routed?: boolean
  showCloseButton?: boolean
  overlayClassName?: string
}) {
  const desk = useMediaQuery(DESK_QUERY)
  const row: PopupRow = POPUP_KINDS[kind]
  const wanted = shapeFor(kind, desk)
  // An own shape (a menu, the code card, a card at a name) is its own
  // primitive's to draw; asked to stand anyway, this element stands where the
  // Dialog or the Sheet would.
  const shape: DialogShape = isDialogShape(wanted)
    ? wanted
    : desk
      ? "dialog"
      : "sheet"

  const state = React.useContext(PopupStateContext)
  useBackCloses(
    Boolean(state?.open) && !routed && !desk && isPlaceShape(shape),
    () => state?.setOpen(false)
  )

  // The element itself, as state: Radix mounts the content a render after its
  // portal, so the keyboard hook needs the node when it arrives.
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const composedRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      setNode(el)
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )
  useKeyboardInset(node, true)

  // Where focus goes back to when it closes, for a popup opened without its
  // own trigger: the last control still there to give it back to
  // (`lastOpener`), which for a menu's row is the menu's own button, and for
  // a stacked popup is the control inside the layer still open behind it.
  const returnTo = React.useRef<HTMLElement | null>(null)

  return (
    <PopupShapeContext.Provider value={shape}>
      <PopupPrimitive.Portal>
        <PopupPrimitive.Overlay
          data-slot="popup-overlay"
          data-shape={shape}
          className={cn(OVERLAY, overlayClassName)}
        />
        <PopupPrimitive.Content
          ref={composedRef}
          data-slot="popup-content"
          data-kind={kind}
          data-shape={shape}
          data-size={size}
          onOpenAutoFocus={(event) => {
            returnTo.current = lastOpener
            onOpenAutoFocus?.(event)
            if (!event.defaultPrevented) {
              if (desk && row.deskFocus === "first") return
              event.preventDefault()
            }
            const panel = event.currentTarget
            if (
              panel instanceof HTMLElement &&
              !panel.contains(document.activeElement)
            ) {
              panel.focus({ preventScroll: true })
            }
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event)
            if (event.defaultPrevented || state?.hasTrigger()) return
            const back = returnTo.current
            if (back?.isConnected) {
              event.preventDefault()
              back.focus({ preventScroll: true })
            }
          }}
          className={cn(CONTENT, floatingPopupShapes, className)}
          {...props}
        >
          {children}
          {showCloseButton && shape !== "screen" && (
            <PopupPrimitive.Close data-slot="popup-close" asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "absolute",
                  shape === "dialog" || shape === "wide"
                    ? "top-2 right-2"
                    : "top-3 right-3"
                )}
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </PopupPrimitive.Close>
          )}
        </PopupPrimitive.Content>
      </PopupPrimitive.Portal>
    </PopupShapeContext.Provider>
  )
}

/**
 * THE HEAD: a title and its line, stacked, with room for the close in the
 * corner; in a hand's `screen` it is the bar a phone opens a place under, the
 * back arrow saying where Back returns ("Album", the event's name) and the
 * title centred, the line under it.
 */
function PopupHeader({
  title,
  description,
  back,
  className,
  titleClassName,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** Where the back arrow returns to, in words: a hand's `screen` only. */
  back?: string
  className?: string
  titleClassName?: string
  children?: React.ReactNode
}) {
  const shape = usePopupShape()
  if (shape === "screen") {
    return (
      <div
        data-slot="popup-header"
        data-bar=""
        className={cn("shrink-0 border-b", className)}
      >
        <div className="grid h-13 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2">
          <PopupPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="sm"
              className="max-w-full justify-self-start gap-0.5 px-1.5 text-muted-foreground"
            >
              <ChevronLeftIcon className="size-5" />
              <span className="truncate">{back ?? "Back"}</span>
            </Button>
          </PopupPrimitive.Close>
          <PopupPrimitive.Title
            className={cn(
              "max-w-[55vw] truncate text-center font-heading text-base font-medium text-foreground",
              titleClassName
            )}
          >
            {title}
          </PopupPrimitive.Title>
          <span aria-hidden />
        </div>
        {description ? (
          <PopupPrimitive.Description className="px-4 pb-3 text-sm text-pretty text-muted-foreground">
            {description}
          </PopupPrimitive.Description>
        ) : null}
        {children}
      </div>
    )
  }
  return (
    <div
      data-slot="popup-header"
      className={cn("flex shrink-0 flex-col gap-1 p-4 pr-12", className)}
    >
      <PopupPrimitive.Title
        className={cn(
          // The ladder's `card-title` step, the Dialog's and the Sheet's own.
          "font-heading text-card-title font-medium text-pretty text-foreground",
          titleClassName
        )}
      >
        {title}
      </PopupPrimitive.Title>
      {description ? (
        <PopupPrimitive.Description className="text-sm text-pretty text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground">
          {description}
        </PopupPrimitive.Description>
      ) : null}
      {children}
    </div>
  )
}

/**
 * THE BODY: the one part that scrolls, so the head and the foot stay where a
 * thumb left them, and the part the keyboard hook scrolls a focused field into
 * view inside.
 *
 * ★ IT KEEPS ITS CHILDREN WHOLE (`*:shrink-0`). A caller that lays the body out
 * as a flex column (the share sheet, the claims review) makes every child a
 * flex item that shrinks to fit the scroller, and a child that clips (a Card is
 * `overflow: hidden`) has no content floor to stop it: build 17's Event
 * Settings crushed its last three cards to their padding that way. Here no
 * child can shrink, so the body scrolls instead, whatever layout a caller
 * picks; in block flow the rule does nothing.
 */
function PopupBody({ className, ...props }: React.ComponentProps<"div">) {
  const shape = usePopupShape()
  return (
    <div
      data-slot="popup-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 *:shrink-0",
        shape === "screen" && "pt-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * THE FOOT: the way out first and the act last in the markup, the act on top
 * when they stack. A centred shape bands it on the muted ground and rows it to
 * the right at a desk, as the Dialog always has; an edge shape stacks it, as
 * the Sheet always has.
 */
function PopupFooter({ className, ...props }: React.ComponentProps<"div">) {
  const shape = usePopupShape()
  const banded = shape === "dialog" || shape === "wide"
  return (
    <div
      data-slot="popup-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t p-4",
        banded && "bg-muted/50 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

export {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
  usePopupShape,
}
