"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * THE CONSEQUENCE LINE (event-settings r1, Will 2026-09-29, `inside=count` with his note: "We should
 * flag that swap too, where switching to 'me' with guests already in closes them out completely"): a
 * change that affects people already in says what happens BEFORE it happens, in the control's own
 * place, rather than in a dialog over it.
 *
 * The control that asked stays where it is; this line opens under it with the one sentence of what the
 * change does to people ("31 guests are already in. Only me closes them out."), the change itself as
 * its primary action and the way back beside it. Nothing is written until the host presses the first.
 * The door's swaps use it; the disposable camera's mode switch will.
 *
 * ★ ANNOUNCED, NOT FOCUSED: a live region reads the sentence as it opens, and focus stays on the
 * control that asked, so a host tabbing through the choices is never pulled away from them.
 *
 * ★ FLAT, IN THE HOUSE SET (identity r5): a tone of the warning's own hue with no hairline, so it reads
 * as a note set into the control's place and never as a field or a card; its key works in words.
 */
function ConsequenceLine({
  children,
  confirmLabel,
  cancelLabel = "Keep it as it is",
  onConfirm,
  onCancel,
  busy = false,
  workingLabel = "Saving",
  className,
}: {
  /** What the change does to people, in a sentence or two. */
  children: React.ReactNode
  /** The change itself, as the primary action ("Close it to everyone"). */
  confirmLabel: React.ReactNode
  cancelLabel?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  /** The change is being written. */
  busy?: boolean
  /** What the confirming key says while it writes the change (working = words). */
  workingLabel?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="consequence-line"
      className={cn(
        "space-y-3 rounded-lg bg-warning/8 p-3",
        className
      )}
    >
      <p
        aria-live="polite"
        className="flex gap-2 text-sm text-pretty text-foreground"
      >
        <TriangleAlert
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-warning"
        />
        <span>{children}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          working={busy}
          workingLabel={workingLabel}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  )
}

export { ConsequenceLine }
