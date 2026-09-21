"use client"

import * as React from "react"
import { ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

/**
 * THE CONFIRM SWITCH (`app-vocabulary` r1, `confirm-switch=primitive`): one
 * component owns the GLYPH and the DEFERRED-OPEN DANCE once. Three switches
 * shared one settings card and one behaviour, written out by hand twice:
 * `accepting_uploads` flips at once, `moderation_mode` and
 * `require_verified_email` each open a confirm dialog on their consequential
 * direction via `setTimeout(() => setOpen(true), 0)` — the same radix
 * dismissable-layer race, dodged the same way, in two files. This is that fix
 * named once: `uploads-section.tsx`'s two hand-rolled pairs retire into it.
 *
 * ★ ASKS ON THE EDGE IT NAMES, NEVER ON THE OTHER. `confirmWhen` is a
 * PREDICATE over the value the switch is ABOUT to become, not a boolean flag
 * — "turning off is the consequential direction" is a decision each caller
 * makes about ITS OWN field (and can further gate on more than the direction
 * alone, e.g. only when a queue is non-empty), never a rule this primitive
 * guesses at.
 *
 * ★ FORM-AGNOSTIC ON PURPOSE. This is a `ui/` primitive, not a react-hook-form
 * field: it takes `checked`/`onCheckedChange` like the plain `Switch` it
 * wraps, so the calling `FormField`'s `render` prop wires it to a field
 * exactly as it wires the bare `Switch` today. A future consequential switch
 * outside any form (an account setting, an admin toggle) reaches for this
 * with no react-hook-form in sight.
 *
 * The glyph (`ShieldCheck`, beside the label: "scannable without reading the
 * description", spec.ts's own words) is UNCONDITIONAL — reaching for this
 * component is what says a switch asks first, so every instance shows it.
 */
export function ConfirmSwitch({
  id,
  checked,
  onCheckedChange,
  disabled,
  label,
  description,
  confirmWhen,
  dialogTitle,
  dialogDescription,
  confirmLabel,
  cancelLabel = "Cancel",
  className,
}: {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  label: React.ReactNode
  description?: React.ReactNode
  /** Given the value the switch is about to become, true opens the confirm
   *  dialog first; false applies it at once. */
  confirmWhen: (next: boolean) => boolean
  dialogTitle: React.ReactNode
  dialogDescription: React.ReactNode
  confirmLabel: React.ReactNode
  cancelLabel?: React.ReactNode
  className?: string
}) {
  const reactId = React.useId()
  const switchId = id ?? reactId
  const descriptionId = description ? `${switchId}-description` : undefined

  const [open, setOpen] = React.useState(false)
  // What the switch is ABOUT to become, captured at the moment the confirm
  // opens — never assumed to be `!checked`, so a caller whose `checked` maps
  // through non-identity logic (moderation_mode's hold_for_approval/live) is
  // still asked about the value IT will apply, not a guess.
  const [pendingValue, setPendingValue] = React.useState<boolean | null>(null)

  function handleCheckedChange(next: boolean) {
    if (confirmWhen(next)) {
      setPendingValue(next)
      // Deferred a tick: opening the Dialog SYNCHRONOUSLY inside this click
      // lets radix's dismissable-layer catch the same in-flight pointer
      // event and close the confirm the instant it opens
      // (uploads-section.tsx's original fix; owned once, here, now).
      setTimeout(() => setOpen(true), 0)
    } else {
      onCheckedChange(next)
    }
  }

  function confirm() {
    if (pendingValue !== null) onCheckedChange(pendingValue)
    setOpen(false)
  }

  return (
    <div
      data-slot="confirm-switch"
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <div className="space-y-0.5">
        <Label htmlFor={switchId}>
          {label}
          <ShieldCheck aria-hidden className="size-3.5 text-muted-foreground" />
        </Label>
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={switchId}
        aria-describedby={descriptionId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={handleCheckedChange}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </DialogClose>
            <Button onClick={confirm}>{confirmLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
