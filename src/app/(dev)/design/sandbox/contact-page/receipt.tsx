"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { REPLY_LINE } from "@/lib/constants/contact";

import { PERSONAS } from "./fixtures";
import { PlainField, Stationery, stopLinks } from "./pieces";

/**
 * DECISION 2: THE RECEIPT. Drawn on the planner's fixture: what she holds
 * after she sends her question about a 300-guest weekend, before anyone has
 * replied. `card` is today's own success state, read straight off
 * contact-form.tsx's (unexported) submitted branch.
 *
 * `modal` is the fourth option this board's own overrule named and left
 * undrawn (the shipped precedent for a confirmation "worth feeling" is a
 * dialog, `welcome-to-pro.tsx`, not a bigger card). It quotes that precedent
 * as plain markup, never the real `Dialog` family: `DialogPortal`/
 * `DialogOverlay`/`DialogPrimitive.Content` are radix portals that would
 * cover the whole board instead of sitting inside this tile (`profile-page`'s
 * landmine with its own confirm dialog), and `DialogTitle`/`DialogDescription`
 * throw outright with no `Dialog.Root` above them (radix reads its context,
 * not just a className) — caught live in this preview before this comment was
 * corrected. So the header, title, description and footer are rebuilt as
 * plain elements carrying the same classNames, and the surface itself is
 * `floatingPanel`, the family's own material, never `DialogContent`.
 * Deliberately no `PartyPopper`, no confetti: the option borrows the
 * mechanism, never the celebration, because a note is not a Pro upgrade.
 */
export type ReceiptShape = "card" | "email" | "reference" | "modal";

function CheckMark() {
  return (
    <span className="mkt-check text-success" data-state="in" aria-hidden>
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M20 6 9 17l-5-5"
          style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
        />
      </svg>
    </span>
  );
}

/** The form, mid-fill, standing in for the page a modal would open over: a
 *  labelled skeleton built from the real `PlainField`, never a second copy
 *  of its typography. */
function DimmedForm() {
  return (
    <div className="flex flex-col gap-4">
      <PlainField label="Your name">
        <div className="h-11 rounded-xl bg-background" />
      </PlainField>
      <PlainField label="Your email">
        <div className="h-11 rounded-xl bg-background" />
      </PlainField>
      <PlainField label="Your message">
        <div className="h-24 rounded-xl bg-background" />
      </PlainField>
    </div>
  );
}

/** The modal option's own surface: the form behind, dimmed and inert, a
 *  centered dialog in front built on `floatingPanel` (the family's material)
 *  rather than the real `Dialog`, which would portal over the whole board.
 *  See the type-level comment above for why. */
function ReceiptModal() {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none opacity-40 blur-[1px]">
        <Stationery>
          <DimmedForm />
        </Stationery>
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/10 p-4">
        <div className={`grid w-full max-w-sm gap-4 p-4 ${floatingPanel}`}>
          {/* DialogHeader/Title/Description, as plain elements: the real
              ones are radix primitives that read a `Dialog.Root` context and
              throw with none above them, not just styled divs. */}
          <div className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 font-heading text-card-title leading-none font-medium">
              <Check className="size-5 text-success" aria-hidden />
              Message sent
            </h2>
            <p className="text-sm text-pretty text-muted-foreground">
              Thanks for reaching out. {REPLY_LINE}
            </p>
          </div>
          {/* DialogFooter's own classes, quoted: the -mx-4 -mb-4 pull is
              tuned against DialogContent's p-4, which this card's own
              p-4 (above) matches on purpose. */}
          <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-float border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto">Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptPreview({ shape }: { shape: ReceiptShape }) {
  const persona = PERSONAS.planner;
  if (shape === "modal") {
    return (
      <div
        onClickCapture={stopLinks}
        data-mkt=""
        className="mx-auto max-w-md bg-background p-6 text-foreground"
      >
        <ReceiptModal />
      </div>
    );
  }
  return (
    <div
      onClickCapture={stopLinks}
      data-mkt=""
      className="mx-auto max-w-md bg-background p-6 text-foreground"
    >
      <Stationery>
        <div className="flex min-h-64 flex-col items-start justify-center gap-3">
          <CheckMark />
          <h3 className="font-heading text-subsection font-medium">
            Message sent
          </h3>
          <p className="text-sm text-pretty text-muted-foreground">
            Thanks for reaching out. {REPLY_LINE}
          </p>
          {shape === "reference" && (
            <p className="rounded-lg bg-background px-3 py-1.5 text-xs font-medium tabular-nums ring-1 ring-border">
              Ref PR-4F2A
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
            <Button variant="outline" size="sm" className="bg-background">
              Send another
            </Button>
            <Link
              href="/help"
              className="text-sm font-medium text-muted-foreground"
            >
              Browse the help center
            </Link>
          </div>
        </div>
      </Stationery>
      {shape === "email" && (
        <div className="mt-5 rounded-xl border border-dashed p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            In {persona.email}&rsquo;s inbox, a minute later
          </p>
          <p className="mt-2 text-sm font-medium">We got your note</p>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            {persona.subject}. {REPLY_LINE}
          </p>
        </div>
      )}
    </div>
  );
}
