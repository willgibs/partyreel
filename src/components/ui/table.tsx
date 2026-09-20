import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * THE TABLE, AND THE ONE THING IT ADDS TO SHADCN'S (`density=hybrid` +
 * `colour=rows`, Will 2026-09-20).
 *
 * Five raw `<table>`s shipped in the admin portal, each spelling its own
 * `py-2 pr-3 text-xs text-muted-foreground` header and its own
 * `border-b border-border/50` row, and two more lists were tables pretending to
 * be `divide-y` stacks. The parts below are shadcn's, hand-checked against the
 * tree they replace; what is NEW is `tone`.
 *
 * ★ `tone` IS A DATA ATTRIBUTE, NOT A CLASS PER STATE, and that is the whole
 * design. Will's answer on colour was "the same four, reaching the row": a
 * failed run tints its own row and takes a leading edge, "Makes it a bit harder
 * to miss." If each tone were its own class string, the inbox list would need a
 * second copy of the mapping to tint a row the same way. Instead
 * `tableRowVariants` carries all four rules at once, scoped by
 * `data-[tone=...]`, and the row simply says which one it is. One import, one
 * vocabulary, and a surface that is not a table (`inbox-pane.tsx`) wears the
 * identical treatment on an `<li>`.
 *
 * ★ THE EDGE LIVES ON THE FIRST CELL BECAUSE A `<tr>` CANNOT CARRY IT.
 * Tailwind's preflight collapses table borders, and a collapsed table's row box
 * does not paint a box-shadow in any engine we ship to. So the tint is the
 * row's and the 2px leading edge is its first child's, through the
 * `inset-shadow` utility (material, not elevation: the two-shadow law in
 * `elevation-policy.test.ts` is about depth, and this is a marker drawn inside
 * the cell).
 */

export const tableRowVariants = cva(
  [
    "border-b transition-colors last:border-0",
    // The tint, at the faintest wash that still finds a bad row while
    // scrolling. A tone-less row is untouched, which is almost every row.
    "data-[tone=success]:bg-success/6 data-[tone=warning]:bg-warning/8 data-[tone=info]:bg-info/6 data-[tone=destructive]:bg-destructive/6",
    // The leading edge, on the first cell. `--tone` is set alongside so ONE
    // arbitrary utility serves all four rather than four near-identical ones.
    // Spelled out in full because Tailwind scans source TEXT: a class composed
    // from a constant at runtime compiles to nothing at all.
    "[&>*:first-child]:inset-shadow-[2px_0_0_0_var(--tone,transparent)]",
    "data-[tone=success]:[--tone:var(--color-success)] data-[tone=warning]:[--tone:var(--color-warning)] data-[tone=info]:[--tone:var(--color-info)] data-[tone=destructive]:[--tone:var(--color-destructive)]",
  ].join(" "),
  {
    variants: {
      /**
       * A row you can press. Off by default: most admin rows are read, and a
       * hover state on a row nothing happens to is a lie about affordance.
       */
      interactive: {
        true: "cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-muted",
        false: "",
      },
    },
    defaultVariants: { interactive: false },
  }
)

/** The four states the portal speaks, and the only values `tone` takes. */
export type TableTone = "success" | "warning" | "info" | "destructive"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  tone,
  interactive,
  ...props
}: React.ComponentProps<"tr"> &
  VariantProps<typeof tableRowVariants> & { tone?: TableTone }) {
  return (
    <tr
      data-slot="table-row"
      // Undefined rather than "" so an untoned row carries no attribute at all
      // and a `[data-tone]` selector means exactly what it says.
      data-tone={tone}
      className={cn(tableRowVariants({ interactive }), className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // The caption step, which is where every one of the five hand-rolled
        // admin headers already sat (`text-xs`), now named.
        "h-9 px-3 text-left align-middle text-caption font-medium whitespace-nowrap text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-2.5 align-middle", className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-caption text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
