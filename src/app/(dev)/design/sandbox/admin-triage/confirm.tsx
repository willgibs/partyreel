"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * THE PORTAL'S ONE CONFIRM, DRAWN STILL: `DestructiveSheet` on the popup's
 * `confirm` kind at `md` (a centred dialog at every width since 3e7952e3). A
 * title and its line, "What this touches" one line each, then Cancel and the
 * verb on the banded foot. Albums' own Remove and Forensics' Release hold open
 * exactly this today.
 *
 * ★ QUOTED, NOT MOUNTED. The real one is a Radix Dialog, which portals to the
 * lab page's body rather than into this frame, and its `onConfirm` is a live
 * server action at every call site. So the markup is copied on the same
 * classes: the overlay's wash and blur, the dialog shape's width, corner and
 * ring, the header, the touches box and the banded footer.
 *
 * ★ THE ONE THING IT DOES NOT HAVE TODAY IS `note`, and it is the fix at the
 * source both asks that draw it offer: a line typed INTO the confirm (a
 * verdict's reason for `resolution_note`, a hold's reason on the record)
 * rather than a second form beside it. One optional prop on
 * `DestructiveSheet`, so any destructive act in the portal can leave a reason,
 * not only these two.
 */
export function ConfirmLook({
  title,
  lede,
  touches,
  verb,
  severity,
  note,
}: {
  title: string;
  /** One sentence: what happens, in the operator's own terms. */
  lede: string;
  /** Everything the act reaches, one line each. */
  touches: string[];
  /** The confirm button's words. */
  verb: string;
  /** `permanent` is red; `reversible` is the default button, as the real one. */
  severity: "reversible" | "permanent";
  /** The line the confirm would carry: the proposed prop. */
  note?: {
    label: string;
    required: boolean;
    /** What is typed; absent draws the empty field with its placeholder. */
    value?: string;
    placeholder: string;
    /** One quiet line under the field. */
    hint?: string;
  };
}) {
  // A required line left empty is exactly the state the verb waits in.
  const waiting = Boolean(note?.required && !note.value);
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs"
      />
      <section
        role="dialog"
        aria-label={title}
        data-tri-confirm
        className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-float bg-popover text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10"
      >
        <div className="flex shrink-0 flex-col gap-1 p-4 pr-12">
          <h2 className="font-heading text-card-title font-medium text-pretty text-foreground">
            {title}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">{lede}</p>
        </div>

        <div className="min-h-0 flex-1 px-4 pb-4">
          <div className="rounded-md border bg-muted/50 px-3 py-2.5">
            <p className="mb-1.5 text-label font-medium text-muted-foreground uppercase">
              What this touches
            </p>
            <ul className="space-y-1">
              {touches.map((touch) => (
                <li key={touch} className="flex gap-2 text-caption">
                  <span aria-hidden className="text-muted-foreground">
                    -
                  </span>
                  <span>{touch}</span>
                </li>
              ))}
            </ul>
          </div>

          {note ? (
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="tri-confirm-note">
                {note.label}{" "}
                <span className="font-normal text-muted-foreground">
                  {note.required ? "(required)" : "(optional)"}
                </span>
              </Label>
              <Textarea
                id="tri-confirm-note"
                rows={2}
                readOnly
                value={note.value ?? ""}
                placeholder={note.placeholder}
                className="min-h-0 resize-none"
              />
              {note.hint ? (
                <p className="text-caption text-muted-foreground">
                  {note.hint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-row justify-end gap-2 border-t bg-muted/50 p-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            type="button"
            variant={severity === "permanent" ? "destructive" : "default"}
            disabled={waiting}
          >
            {verb}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          className="absolute top-2 right-2"
        >
          <X />
        </Button>
      </section>
    </>
  );
}
