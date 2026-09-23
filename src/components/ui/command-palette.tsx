"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  floatingClock,
  floatingEntrance,
  floatingPanel,
  floatingRow,
} from "@/components/ui/floating-layer"

/**
 * THE COMMAND PALETTE, AS A PRIMITIVE (`nav=rail-palette`, Will 2026-09-20).
 *
 * The help centre shipped one of these in 2026-09-19 and it is excellent, but
 * it is one component with the help library, its ranking, its deep-link anchors
 * and the marketing paper skin welded into it (`marketing/help/help-palette.tsx`,
 * 549 lines). The admin needs the same COMBOBOX and the same keyboard model
 * over a completely different index, so what moves here is the mechanism and
 * nothing else: no data source, no router, no skin, no ranking. The admin's
 * index, the help centre's ranking and any future palette are all call sites.
 *
 * ★ THE ACTIVE OPTION IS FOUND IN THE DOM, NEVER IN A REGISTRY. A palette's
 * options are declared by its children, so a Root that wants to arrow through
 * them either makes every Item register an id on mount (and then fight React
 * about ordering when a group appears above it) or simply asks the list what it
 * is currently drawing. The second is both shorter and always correct: the DOM
 * order IS the visual order, which is the only order an arrow key means. Enter
 * clicks the active element rather than calling a stored callback, for the same
 * reason: there is no second copy of "what this row does" to fall out of date.
 *
 * ★ IT IS SKIN-AGNOSTIC AND THEREFORE HAS NO OPINION ABOUT NAVIGATION. The
 * help palette suppresses radix's close-autofocus while it routes, because
 * restoring focus to a trigger AFTER a hash scroll strands the reader. That is
 * a real bug and a real fix, and it belongs to a palette that navigates: this
 * one exposes `onCloseAutoFocus` through the Content's own props so a call site
 * that routes can do the same.
 */

type PaletteContextValue = {
  query: string
  setQuery: (next: string) => void
  activeId: string | undefined
  setActiveId: (id: string | undefined) => void
  listId: string
  listRef: React.RefObject<HTMLDivElement | null>
  /** Close the palette (an Item calls it after doing whatever it does). */
  dismiss: () => void
}

const PaletteContext = React.createContext<PaletteContextValue | null>(null)

function usePalette(part: string): PaletteContextValue {
  const ctx = React.useContext(PaletteContext)
  if (!ctx)
    throw new Error(`${part} must render inside <CommandPalette>`)
  return ctx
}

/** Every option the list is currently drawing, in the order a reader sees them. */
function options(list: HTMLElement | null): HTMLElement[] {
  if (!list) return []
  return Array.from(
    list.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])')
  )
}

function CommandPalette({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {/*
        ★ THE PALETTE'S STATE IS KEYED TO ITS OPENING, WHICH IS WHY THERE IS NO
        RESET EFFECT. A query left over from last night's session is a list the
        operator did not ask for, and the obvious fix (an effect that clears on
        close) is a setState inside an effect: a cascading render, and one that
        misses anyway when a parent closes the palette without going through
        `onOpenChange` (a ⌘K toggle does exactly that). Remounting on the
        transition is both shorter and complete.
      */}
      <PaletteState
        key={open ? "open" : "closed"}
        onOpenChange={onOpenChange}
      >
        {children}
      </PaletteState>
    </DialogPrimitive.Root>
  )
}

function PaletteState({
  onOpenChange,
  children,
}: {
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  const [query, setQueryState] = React.useState("")
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const listId = React.useId()

  // Typing narrows the list, so the previous active row is usually gone; the
  // list's own effect puts the first row of the NEW list back under Enter.
  const setQuery = React.useCallback((next: string) => {
    setQueryState(next)
    setActiveId(undefined)
  }, [])

  const dismiss = React.useCallback(() => onOpenChange(false), [onOpenChange])

  const value = React.useMemo<PaletteContextValue>(
    () => ({
      query,
      setQuery,
      activeId,
      setActiveId,
      listId,
      listRef,
      dismiss,
    }),
    [query, setQuery, activeId, listId, dismiss]
  )

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  )
}

function CommandPaletteContent({
  className,
  children,
  label,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  /** The accessible name of the dialog and of its input. */
  label: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="command-palette-overlay"
        className={cn(
          "fixed inset-0 isolate z-50 bg-black/10 ease-emphasis supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          // The scrim shares the panel's clock, or the page dims on one beat
          // and the palette lands on another.
          floatingClock.standard
        )}
      />
      <DialogPrimitive.Content
        data-slot="command-palette-content"
        aria-describedby={undefined}
        className={cn(
          // Top-aligned, not centred: a list you read downwards wants the room
          // under it, and a palette that grows from the middle of the screen
          // pushes its own first row out from under the cursor.
          "fixed top-[12vh] left-1/2 z-50 flex w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden outline-none",
          floatingPanel,
          floatingEntrance,
          // Opened a few times a session, and worth a beat (bible 12).
          floatingClock.standard,
          className
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function CommandPaletteInput({
  className,
  label,
  ...props
}: Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "role" | "aria-activedescendant"
> & {
  /** The accessible name of the combobox itself. */
  label: string
}) {
  const { query, setQuery, activeId, setActiveId, listId, listRef, dismiss } =
    usePalette("CommandPaletteInput")

  function move(to: number | "first" | "last" | "next" | "prev") {
    const rows = options(listRef.current)
    if (rows.length === 0) return
    const at = rows.findIndex((row) => row.id === activeId)
    const current = at === -1 ? 0 : at
    const next =
      to === "first"
        ? 0
        : to === "last"
          ? rows.length - 1
          : to === "next"
            ? Math.min(current + 1, rows.length - 1)
            : to === "prev"
              ? Math.max(current - 1, 0)
              : to
    const row = rows[next]
    if (!row) return
    setActiveId(row.id)
    row.scrollIntoView({ block: "nearest" })
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      move("next")
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      move("prev")
    } else if (event.key === "Home" && !event.shiftKey) {
      event.preventDefault()
      move("first")
    } else if (event.key === "End" && !event.shiftKey) {
      event.preventDefault()
      move("last")
    } else if (event.key === "Enter") {
      const rows = options(listRef.current)
      const row = rows.find((r) => r.id === activeId) ?? rows[0]
      if (!row) return
      event.preventDefault()
      // The row's own click handler is the single source of what it does; a
      // callback registry here would be a second copy of the same fact.
      row.click()
      dismiss()
    }
  }

  return (
    <div
      data-slot="command-palette-field"
      className="flex h-12 shrink-0 items-center gap-3 border-b px-4"
    >
      <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <input
        data-slot="command-palette-input"
        role="combobox"
        aria-expanded
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label={label}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          "h-full flex-1 bg-transparent text-reading text-foreground outline-none placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandPaletteList({
  className,
  children,
  label,
  ...props
}: React.ComponentProps<"div"> & { label: string }) {
  const { listId, listRef, activeId, setActiveId } =
    usePalette("CommandPaletteList")

  /**
   * ★ THE LIST OWNS "WHICH ROW IS ACTIVE BY DEFAULT", AND IT HAS TO RUN AFTER
   * EVERY COMMIT. An Item cannot answer "am I the first?" during render (its
   * siblings are not on the page yet on the first pass, and a group appearing
   * above it changes the answer without changing its own props), so the list
   * asks the DOM once the page exists: if nothing is active, or the active row
   * has just been filtered away, the first surviving row takes it. No deps
   * array on purpose, and it settles in one extra commit because the row it
   * picks is by construction in the list it just read.
   */
  React.useLayoutEffect(() => {
    const rows = options(listRef.current)
    if (rows.length === 0) {
      if (activeId !== undefined) setActiveId(undefined)
      return
    }
    if (!rows.some((row) => row.id === activeId)) setActiveId(rows[0].id)
  })

  return (
    <div
      data-slot="command-palette-list"
      id={listId}
      ref={listRef}
      role="listbox"
      aria-label={label}
      // The floating family's rail: `p-1` with every row on `floatingRow`, the
      // panel's corner minus this padding (bible 9).
      className={cn("max-h-[min(26rem,55vh)] overflow-y-auto p-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CommandPaletteGroup({
  className,
  heading,
  children,
  ...props
}: React.ComponentProps<"div"> & { heading: string }) {
  return (
    <div
      data-slot="command-palette-group"
      role="group"
      aria-label={heading}
      className={cn("pb-1", className)}
      {...props}
    >
      <p className="px-3 pt-2 pb-1.5 text-label font-medium text-muted-foreground uppercase">
        {heading}
      </p>
      {children}
    </div>
  )
}

function CommandPaletteItem({
  className,
  children,
  onSelect,
  disabled = false,
  asChild = false,
  ...props
}: Omit<React.ComponentProps<"div">, "onSelect"> & {
  onSelect: () => void
  disabled?: boolean
  /**
   * Render the row as whatever the call site passes (a `next/link`, say), so a
   * palette that navigates keeps a real anchor a reader can middle-click.
   * Whatever it renders still takes the id, the role and the selection state.
   */
  asChild?: boolean
}) {
  const { activeId, setActiveId, dismiss } = usePalette("CommandPaletteItem")
  const id = React.useId()
  const active = activeId === id

  const rowProps = {
    id,
    role: "option" as const,
    "aria-selected": active,
    "aria-disabled": disabled || undefined,
    tabIndex: -1,
    onClick: () => {
      if (disabled) return
      onSelect()
      dismiss()
    },
    // Pointer and keyboard share one notion of "active", so a mouse resting
    // over row four then pressing Enter opens row four.
    onMouseMove: () => {
      if (!disabled && activeId !== id) setActiveId(id)
    },
    className: cn(
      "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm select-none",
      floatingRow,
      active && "bg-muted",
      disabled && "pointer-events-none opacity-50",
      className
    ),
    ...props,
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      { "data-slot": "command-palette-item", ...rowProps }
    )
  }

  return (
    <div data-slot="command-palette-item" {...rowProps}>
      {children}
    </div>
  )
}

function CommandPaletteEmpty({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="command-palette-empty"
      className={cn("px-3 py-10 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CommandPaletteFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-palette-footer"
      className={cn(
        "flex shrink-0 items-center gap-4 border-t bg-muted/40 px-4 py-2.5 text-caption text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/** The query, for a call site that filters its own index. */
function useCommandPaletteQuery(): string {
  return usePalette("useCommandPaletteQuery").query
}

export {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  useCommandPaletteQuery,
}
