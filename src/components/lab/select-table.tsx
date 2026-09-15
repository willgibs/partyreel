"use client";

import { cn } from "@/lib/utils";

/**
 * THE TABLE THAT IS ALSO THE CHOOSER.
 *
 * A board that has computed a number per candidate (a radius per token, a
 * duration per register, a count per treatment) usually prints a table AND a
 * separate row of switches, and the reviewer then has to hold the mapping
 * between them. One table, whose rows ARE the choice, removes that entirely:
 * the numbers being compared and the control that selects between them are the
 * same object.
 *
 * ★ THE ROWS ARE BUTTONS, NOT A CLICK HANDLER ON A <tr>. A row a keyboard
 * cannot reach is not a control, and a table with a click handler and no focus
 * ring is the most common way a lab surface becomes mouse-only. One button per
 * row, filling its cell, keeps tab order, Enter and the focus ring for free.
 *
 * ★ AND THE RECOMMENDED ROW IS MARKED IN THE LABEL, never by a highlight alone:
 * a tinted row on a board about colour is a fifth cue (specimen.tsx's rule, one
 * layer out).
 */
export function SelectTable<Id extends string>({
  columns,
  rows,
  value,
  onChange,
  caption,
  className,
}: {
  columns: readonly string[];
  rows: readonly {
    id: Id;
    /** Cells, in column order. The first is the row's name. */
    cells: readonly React.ReactNode[];
    recommended?: boolean;
    note?: string;
  }[];
  value: Id;
  onChange: (id: Id) => void;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl overflow-x-auto", className)}>
      <table className="w-full text-left text-[11px] tabular-nums">
        {caption ? (
          <caption className="pb-2 text-left text-[11px] text-muted-foreground">
            {caption}
          </caption>
        ) : null}
        <thead className="text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c} className="py-1 pr-4 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const on = r.id === value;
            return (
              <tr
                key={r.id}
                className={cn(
                  "border-t border-border",
                  on && "bg-muted/60 text-foreground",
                )}
              >
                {r.cells.map((cell, i) => (
                  <td key={i} className="p-0">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => onChange(r.id)}
                      className="w-full px-0 py-1.5 pr-4 text-left"
                    >
                      {i === 0 ? (
                        <span
                          className={cn(
                            "font-medium",
                            on ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {cell}
                          {r.recommended ? (
                            <span className="ml-1.5 font-normal text-muted-foreground">
                              proposed
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        cell
                      )}
                      {i === 0 && r.note ? (
                        <span className="block leading-snug font-normal text-muted-foreground">
                          {r.note}
                        </span>
                      ) : null}
                    </button>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
