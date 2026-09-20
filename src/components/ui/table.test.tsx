// @contract-for: src/components/ui/table.tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableRowVariants,
} from "./table"

/**
 * THE TABLE'S CONTRACT (admin-wiring, 2026-09-20).
 *
 * What is pinned is the one thing this table adds to shadcn's: `tone` as a DATA
 * ATTRIBUTE, and a rule set a surface that is not a table can wear. Will's
 * answer was "the same four, reaching the row" with the note "Makes it a bit
 * harder to miss", so what must hold is that a row can SAY what state it is in
 * and that the inbox list says it the same way.
 *
 * Nothing here asserts a colour, an alpha or an edge width: those are Will's to
 * retune and a contract guards function, never a look.
 */

function row(tone?: "success" | "warning" | "info" | "destructive") {
  return render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow tone={tone}>
          <TableCell>04:00</TableCell>
          <TableCell>ok</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )
}

describe("a row says what state it is in", () => {
  it("writes the tone as data, so a stylesheet and a test can both read it", () => {
    row("destructive")
    expect(screen.getByRole("row", { name: /04:00/ })).toHaveAttribute(
      "data-tone",
      "destructive",
    )
  })

  it("carries no attribute at all when it has no tone", () => {
    // Undefined rather than "", so `[data-tone]` means exactly what it says and
    // almost every row in the portal stays untouched.
    row()
    expect(screen.getByRole("row", { name: /04:00/ })).not.toHaveAttribute(
      "data-tone",
    )
  })
})

describe("the tone rules are shared, not copied", () => {
  const classes = tableRowVariants()

  it("scopes every tone to its own data value, so one class string serves four", () => {
    // This is what lets `inbox-pane.tsx` and `queue-list.tsx` wear the identical
    // treatment on an <li>: the row declares WHICH tone it is and the shared
    // rules decide what that looks like. Four class strings would mean a second
    // mapping in every surface that is not a table.
    for (const tone of ["success", "warning", "info", "destructive"]) {
      expect(classes, `${tone} has no rule in the shared variants`).toContain(
        `data-[tone=${tone}]:`,
      )
    }
  })

  it("puts the leading edge on the row's first child, not on the row", () => {
    // Tailwind's preflight collapses table borders, and a collapsed table's row
    // box paints no box-shadow in any engine we ship to: an edge declared on
    // the <tr> would simply not be there.
    expect(classes).toContain("[&>*:first-child]:")
  })

  it("offers the pressable row as an opt-in", () => {
    // Most admin rows are read. A hover state on a row nothing happens to is a
    // lie about affordance, so `interactive` is off unless a surface asks.
    expect(tableRowVariants({ interactive: true })).toContain("cursor-pointer")
    expect(tableRowVariants()).not.toContain("cursor-pointer")
  })
})
