"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { REPLY_LINE } from "@/lib/constants/contact";

import { PERSONAS } from "./fixtures";
import { Stationery, stopLinks } from "./pieces";

/**
 * DECISION 2: THE RECEIPT. Drawn on the planner's fixture: what she holds
 * after she sends her question about a 300-guest weekend, before anyone has
 * replied. `card` is today's own success state, read straight off
 * contact-form.tsx's (unexported) submitted branch.
 */
export type ReceiptShape = "card" | "email" | "reference";

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

export function ReceiptPreview({ shape }: { shape: ReceiptShape }) {
  const persona = PERSONAS.planner;
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
