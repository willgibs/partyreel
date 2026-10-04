"use client"

import * as React from "react"
import {
  Dialog as DialogPrimitive,
  Popover as PopoverPrimitive,
} from "radix-ui"
import { usePortalContainer } from "@/components/ui/portal-container"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/lib/use-media-query"
import {
  floatingClock,
  floatingEdgeEntrance,
  floatingDisplayPanel,
  floatingEntrance,
  floatingGutter,
  floatingRow,
} from "@/components/ui/floating-layer"
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup"
import { DESK_QUERY, shapeFor } from "@/components/ui/popup-kinds"
import { Switch } from "@/components/ui/switch"

/**
 * THE ONE RESPONSIVE MENU (`popups` r1, `choices=menu`, Will 2026-09-27): a
 * quick choice opens where the hand that asked for it is. At a desk it is a
 * menu under the button that asked, like any menu; in a hand its rows rise to
 * the thumb as the phone's own chooser does, Cancel beneath. Add photos, what
 * to download and the code's style all ride it.
 *
 * ★ A ROW IS THE ACT. Pressing Take a photo takes one, Photos downloads the
 * photos, Rounded saves Rounded: no Save under the choices, which is what makes
 * a menu lighter than a dialog and is its whole cost too (no second look before
 * it acts). A row's `onSelect` runs INSIDE the tap, before the menu closes, so
 * an act that must happen in the gesture (Safari opens a file picker only
 * there) still can.
 *
 * ★ ITS KIND'S ROW DECIDES, LIKE EVERY POPUP'S (`popup-kinds.ts`, `choice`). A
 * row that ever names a dialog shape instead gets the same rows in
 * `PopupContent`, so the answer moves in one line here too.
 *
 * ★ THE BUTTON THAT ASKED, EVEN WHEN NOBODY PASSED IT. Add photos is opened by
 * three buttons the page owns (the row under the event's name, the dock, the
 * empty album), so `anchor="pressed"` remembers the last control pressed, in
 * the capture phase, before its own handler opens the menu. A keyboard's Enter
 * on a button is a click too, so it anchors the same way.
 */

type MenuShape = "menu" | "rows"

type MenuState = { shape: MenuShape; close: () => void }

const MenuContext = React.createContext<MenuState>({
  shape: "menu",
  close: () => {},
})

/** Which of its two shapes the nearest menu is drawn in, for a part that differs by it. */
function useResponsiveMenuShape(): MenuShape {
  return React.useContext(MenuContext).shape
}

/** The last button pressed anywhere on the page, remembered before its own click handler runs. */
function usePressedAnchor(enabled: boolean) {
  const ref = React.useRef<HTMLElement | null>(null)
  React.useEffect(() => {
    if (!enabled) return
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const pressed = target.closest<HTMLElement>(
        "button, a, [role='button']"
      )
      if (pressed && !pressed.closest("[data-slot^='responsive-menu']")) {
        ref.current = pressed
      }
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [enabled])
  return ref
}

/** Up and down (and left and right, for a grid) move between the rows, Home and End to either end. */
function moveBetweenRows(event: React.KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"]
  if (!keys.includes(event.key)) return
  const rows = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      "[role='menuitem']:not([disabled]), [role='switch']:not([disabled])"
    )
  )
  if (rows.length === 0) return
  event.preventDefault()
  const at = rows.indexOf(document.activeElement as HTMLElement)
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? rows.length - 1
        : event.key === "ArrowDown" || event.key === "ArrowRight"
          ? (at + 1) % rows.length
          : (at - 1 + rows.length) % rows.length
  rows[next]?.focus()
}

function ResponsiveMenu({
  open,
  onOpenChange,
  anchor,
  title,
  showTitle = false,
  align = "start",
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * The button that asked: its ref, or `"pressed"` for a menu several buttons
   * open. A desk's menu opens under it and focus returns to it.
   */
  anchor: React.RefObject<HTMLElement | null> | "pressed"
  /** What the choice is about: the phone's caption over the rows; at a desk the menu's name. */
  title: React.ReactNode
  /** Say the title at a desk too, as a small label over the rows. */
  showTitle?: boolean
  align?: "start" | "center" | "end"
  /** The desk menu's own width and layout. */
  className?: string
  children: React.ReactNode
}) {
  const desk = useMediaQuery(DESK_QUERY)
  const pressed = usePressedAnchor(anchor === "pressed")
  const anchorRef = anchor === "pressed" ? pressed : anchor
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])
  const shape = shapeFor("choice", desk)
  const container = usePortalContainer()

  const giveBackFocus = (event: Event) => {
    event.preventDefault()
    anchorRef.current?.focus({ preventScroll: true })
  }

  if (shape === "menu") {
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <PopoverPrimitive.Anchor
          virtualRef={
            anchorRef as React.RefObject<{
              getBoundingClientRect: () => DOMRect
            }>
          }
        />
        <PopoverPrimitive.Portal container={container}>
          <PopoverPrimitive.Content
            data-slot="responsive-menu"
            role="menu"
            aria-label={typeof title === "string" ? title : undefined}
            align={align}
            sideOffset={6}
            collisionPadding={floatingGutter}
            onCloseAutoFocus={giveBackFocus}
            // The button that asked is outside the menu: pressing it again
            // must not dismiss here and reopen in its own click a beat later.
            onInteractOutside={(event) => {
              const target = event.target
              if (target instanceof Node && anchorRef.current?.contains(target)) {
                event.preventDefault()
              }
            }}
            onKeyDown={moveBetweenRows}
            className={cn(
              // The panel's 4px of padding IS the row's corner offset (`floatingRow`).
              "z-50 flex max-h-(--radix-popover-content-available-height) w-72 origin-(--radix-popover-content-transform-origin) flex-col overflow-y-auto p-1 text-sm outline-none",
              // The display (layers=display), in both shapes: the Add's rows
              // are a quick choice, the camera's own screen.
              floatingDisplayPanel,
              floatingEntrance,
              // A menu, opened as often as any: the dropdown's own clock.
              floatingClock.instant,
              className
            )}
          >
            <MenuContext.Provider value={{ shape: "menu", close }}>
              {showTitle ? (
                <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
                  {title}
                </p>
              ) : null}
              {children}
            </MenuContext.Provider>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    )
  }

  if (shape === "rows") {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal container={container}>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
              floatingClock.edge
            )}
          />
          <DialogPrimitive.Content
            data-slot="responsive-menu-rows"
            // The edge language's travel from the foot (`floatingEdgeEntrance`).
            data-side="bottom"
            aria-describedby={undefined}
            onCloseAutoFocus={giveBackFocus}
            className={cn(
              "fixed inset-x-2 bottom-2 z-50 flex flex-col gap-2 text-sm outline-none",
              floatingEdgeEntrance,
              floatingClock.edge
            )}
          >
            <div
              role="menu"
              onKeyDown={moveBetweenRows}
              className={cn(
                "max-h-[calc(100svh-6rem)] overflow-y-auto overscroll-contain p-1",
                floatingDisplayPanel
              )}
            >
              <DialogPrimitive.Title className="px-3 pt-2.5 pb-2 text-center text-xs text-pretty text-muted-foreground">
                {title}
              </DialogPrimitive.Title>
              <MenuContext.Provider value={{ shape: "rows", close }}>
                {children}
              </MenuContext.Provider>
            </div>
            <DialogPrimitive.Close
              className={cn(
                "flex h-12 shrink-0 items-center justify-center text-base font-medium outline-none transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:active:scale-100",
                floatingDisplayPanel
              )}
            >
              Cancel
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }

  // The row names a dialog shape: the same rows, in the Dialog or the Sheet.
  return (
    <Popup open={open} onOpenChange={onOpenChange}>
      <PopupContent kind="choice" aria-describedby={undefined}>
        <PopupHeader title={title} />
        <PopupBody role="menu" onKeyDown={moveBetweenRows}>
          <MenuContext.Provider value={{ shape: "rows", close }}>
            {children}
          </MenuContext.Provider>
        </PopupBody>
      </PopupContent>
    </Popup>
  )
}

// A chosen row is the display's (layers=display): its light wash and a light
// outline inside it, on whatever chooses it in each shape.
const DESK_ROW =
  "flex min-h-9 w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm outline-none select-none hover:bg-accent hover:ring-[1.5px] hover:ring-(color:--display-cursor) hover:ring-inset focus-visible:bg-accent focus-visible:ring-[1.5px] focus-visible:ring-(color:--display-cursor) focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"

const HAND_ROW =
  "flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left text-base outline-none select-none active:bg-accent active:ring-[1.5px] active:ring-(color:--display-cursor) active:ring-inset focus-visible:bg-accent focus-visible:ring-[1.5px] focus-visible:ring-(color:--display-cursor) focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"

/**
 * A ROW: an icon, its words, and what it is worth (a count, a size, a check)
 * at its end. Pressing it runs `onSelect` inside the tap and closes the menu,
 * unless the handler prevents it.
 */
function ResponsiveMenuItem({
  icon,
  hint,
  onSelect,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "onSelect"> & {
  icon?: React.ReactNode
  hint?: React.ReactNode
  onSelect?: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const { shape, close } = React.useContext(MenuContext)
  return (
    <button
      type="button"
      role="menuitem"
      data-slot="responsive-menu-item"
      onClick={(event) => {
        onSelect?.(event)
        if (!event.defaultPrevented) close()
      }}
      className={cn(shape === "menu" ? DESK_ROW : HAND_ROW, floatingRow, className)}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1">{children}</span>
      {hint ? (
        <span
          className={cn(
            "shrink-0 text-muted-foreground tabular-nums",
            shape === "menu" ? "text-xs" : "text-sm"
          )}
        >
          {hint}
        </span>
      ) : null}
    </button>
  )
}

/**
 * A SETTING AMONG THE ROWS that changes what the rows do (the host's Include
 * hidden items), not an act: its switch flips in place and the menu stays.
 */
function ResponsiveMenuToggle({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: React.ReactNode
}) {
  const shape = useResponsiveMenuShape()
  const labelId = React.useId()
  return (
    <div
      data-slot="responsive-menu-toggle"
      className={cn(
        "flex items-center justify-between gap-3",
        shape === "menu"
          ? "min-h-9 px-2.5 py-1.5 text-sm"
          : "min-h-12 px-3 py-2 text-base"
      )}
    >
      <span id={labelId} className="min-w-0 text-muted-foreground">
        {children}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
      />
    </div>
  )
}

/** A quiet line among the rows: the terms of the act, what a choice is worth. */
function ResponsiveMenuNote({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const shape = useResponsiveMenuShape()
  return (
    <p
      data-slot="responsive-menu-note"
      className={cn(
        "text-xs text-pretty text-muted-foreground",
        shape === "menu" ? "px-2.5 pt-1 pb-1.5" : "px-3 pt-1 pb-2 text-center",
        className
      )}
      {...props}
    />
  )
}

export {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
  ResponsiveMenuToggle,
  useResponsiveMenuShape,
}
