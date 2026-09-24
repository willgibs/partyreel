"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  floatingClock,
  floatingEntrance,
  floatingPanel,
  floatingRow,
} from "@/components/ui/floating-layer"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

/**
 * THE MENU AS A SMALL MADE OBJECT (Will, `floating-surfaces` r7,
 * `direction=card`, 2026-09-17: "Card is my overall favorite").
 *
 * What Card is, as anatomy: a TITLE ROW saying what the menu belongs to,
 * LABELLED GROUPS saying what each part is for, an ICON RAIL so every label
 * starts at one x, a TRAILING COLUMN for the state you opened the menu to read,
 * and a FOOTER RAIL giving the action you cannot undo a ground of its own
 * instead of a hairline between it and "Download everything".
 *
 * Every one of those is a PART here, not a shape baked into the panel, because
 * Card's own declared cost is real: "a two-row menu is suddenly furniture". A
 * menu with a subject wears the title row; a two-row overflow wears the
 * material, the corner, the entrance and the rail and says nothing it has no
 * need to say. The parts are the vocabulary, and the call site is the sentence.
 *
 * ★ THE GROUP LABELS COME FROM GLASS, THE SURFACE DOES NOT. Will, same ruling:
 * "I like the more subtle group labels from Glass. I also do think the glassy
 * background would be more visually pleasant... However, I prefer not to create
 * a one-off instance of glass here." So `DropdownMenuLabel` takes Glass's
 * treatment (sentence case, no tracking, the foreground at 70 percent, tight
 * padding) and nothing in this file is translucent. The Glass exploration he
 * banked owns the material.
 *
 * The corner, the entrance and the light are NOT here: they are the
 * floating-layer contract (`floating-layer.ts`), shared with the select, the
 * popover, the tooltip, the dialog and the sheet, and held by
 * `floating-layer.test.ts`.
 */

/**
 * ★ TWO LEVELS, AND THE THIRD CANNOT BE COMPOSED. Will, on keeping the nested
 * menu: "Yes, this unlocks much more comprehensive menus than limiting to a
 * single list of everything included. However, we should not allow an
 * additional third level of nesting. That gets too complicated."
 *
 * A rule written as a comment is a rule the next agent breaks by accident, so
 * the cap is structural: each `Sub` publishes its depth, and a `Sub` opened
 * inside a `Sub` throws at render. There is no third level to review, no lint
 * note to ignore, and `dropdown-menu.test.tsx` pins it. A branch that wants a
 * third level is a branch that wants a flat group of its own.
 */
const DropdownMenuDepthContext = React.createContext(0)

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          // The panel's 4px of padding IS the row's corner offset.
          // Move it and `floatingRow` is wrong by the difference.
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto p-1 data-[state=closed]:overflow-hidden",
          floatingPanel,
          floatingEntrance,
          // The surface a host opens most, and the one they open by mistake.
          floatingClock.instant,
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

/**
 * THE TITLE ROW: what this menu is about. A menu with no subject makes the
 * reader carry it, which on a dashboard of four events means remembering which
 * one the overflow belongs to. It bleeds to the panel's edge (the negative
 * margins undo the content's own padding) so the rule under it runs the full
 * width, and the rounded panel's `overflow` clips its corners.
 */
function DropdownMenuHeader({
  className,
  children,
  meta,
  ...props
}: React.ComponentProps<"div"> & {
  /** The trailing note: a plan, a count, a state. Optional by design. */
  meta?: React.ReactNode
}) {
  return (
    <div
      data-slot="dropdown-menu-header"
      className={cn(
        "-mx-1 -mt-1 mb-1 flex items-baseline justify-between gap-3 border-b border-border px-3 py-2",
        className
      )}
      {...props}
    >
      <div className="min-w-0 text-sm leading-tight font-semibold tracking-tight">
        {children}
      </div>
      {meta ? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {meta}
        </span>
      ) : null}
    </div>
  )
}

/**
 * THE FOOTER RAIL: the action that cannot be undone gets its own ground, not
 * just a separator. A destructive row one pixel under "Download everything" is
 * a menu asking for it. `p-1` for the same reason the content is: the rail
 * holds rows, and a row's corner is the padding around it.
 */
function DropdownMenuFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-footer"
      className={cn(
        "-mx-1 -mb-1 mt-1 flex flex-col gap-0.5 border-t border-border bg-muted/40 p-1",
        className
      )}
      {...props}
    />
  )
}

/**
 * A GROUP: rows that belong together, under a label that says what for. The
 * gap between two groups is carried by the second one, so a menu with a single
 * group has no stray margin and the header stays tight against the first label.
 */
function DropdownMenuGroup({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group
      data-slot="dropdown-menu-group"
      className={cn(
        "flex flex-col gap-0.5 [[data-slot=dropdown-menu-group]+&]:mt-1.5",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // THE ICON RAIL, as a contract rather than as nine copies: the leading
        // glyph is quiet and 16px wide, so every label in a menu starts at the
        // same x and a call site never types `text-muted-foreground` on an icon
        // again. `data-inset` puts a row with no icon on that same x.
        "group/dropdown-menu-item relative flex cursor-default items-center gap-2 px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>svg:first-child]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive",
        floatingRow,
        className
      )}
      {...props}
    />
  )
}

/**
 * THE TRAILING COLUMN: the value, count or state you opened the menu to read.
 * Separate from `DropdownMenuShortcut`, which is a keystroke and wears the wide
 * tracking that makes one legible.
 */
function DropdownMenuMeta({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-meta"
      className={cn(
        "ml-auto text-xs text-muted-foreground tabular-nums group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-2 py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>svg:first-child]:text-muted-foreground",
        floatingRow,
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-2 py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>svg:first-child]:text-muted-foreground",
        floatingRow,
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon
          />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/**
 * THE GROUP LABEL, TAKEN FROM GLASS (Will, 2026-09-17). Card's own label was
 * 11px uppercase on wide tracking, which turns a two-word group name into
 * signage; Glass's is the same size in sentence case at 70 percent of the
 * foreground, so it recedes without going grey. The submenu's own label is the
 * same part, which is why nothing here knows which panel it is on.
 */
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 pt-0.5 pb-1 text-xs text-foreground opacity-70 data-inset:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  const depth = React.useContext(DropdownMenuDepthContext)
  if (depth >= 1) {
    throw new Error(
      "A dropdown menu stops at two levels (Will, floating-surfaces r7, 2026-09-17: a third level 'gets too complicated'). Flatten this branch into a group of its own under its name."
    )
  }
  return (
    <DropdownMenuDepthContext.Provider value={depth + 1}>
      <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
    </DropdownMenuDepthContext.Provider>
  )
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-8 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>svg:first-child]:text-muted-foreground",
        floatingRow,
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto text-muted-foreground" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

/**
 * ★ THE PORTAL IS THE BUG FIX, NOT DECORATION (on Will's queue since the board
 * measured it; repaired here because `submenu=keep` is worthless while the
 * thing is unreliable).
 *
 * `SubContent` shipped with no `Portal`, so it rendered as a DOM descendant of
 * `Content`, which carries `overflow-y-auto` AND animates with a transform.
 * Two ways that breaks, both measured on the live alias:
 *   1. a transformed ancestor becomes the containing block for its `fixed`
 *      descendants, so while the parent panel is mid animation the submenu is
 *      positioned against the parent's box and clipped by it: present in the
 *      DOM, a real measured box, three items, and painting NOTHING. That is
 *      what a CLICK on the sub-trigger produces, because the click puts the
 *      parent into its closing animation;
 *   2. a scrolled parent clips it at its own edge, for the same reason.
 * On a settled, unscrolled parent (a hover-opened submenu) it paints fine,
 * which is why this survived to production: the failure is conditional, not
 * total.
 *
 * Portalled, the submenu is a sibling of the parent panel in `document.body`
 * and neither the parent's transform nor its scroll can reach it.
 */
function DropdownMenuSubContent({
  className,
  collisionPadding = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        collisionPadding={collisionPadding}
        className={cn(
          // ★ THE 96px FLOOR IS LOAD-BEARING ON A PHONE, and raising it is the
          // easy mistake (this lane made it and measured it back out). Radix
          // flips a submenu to whichever side has more room and then
          // `limitShift` keeps it ATTACHED to its trigger, so it will not slide
          // further into view: a submenu is fully visible only while it is
          // narrower than the room beside its parent panel. On a 375 screen the
          // account menu is a 240px panel aligned to the right edge, which
          // leaves about 119px to its left; the theme picker measures about
          // 109px and fits. A floor of 160px would not have.
          "z-50 min-w-24 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden p-1",
          floatingPanel,
          floatingEntrance,
          floatingClock.instant,
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuFooter,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuMeta,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
