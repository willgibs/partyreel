"use client";

import type { ReactNode } from "react";

import { ExplorationBoard, TrueFit } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";
import { cn } from "@/lib/utils";

import { TYPE_PHONE } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE.
 *
 * `defineExploration` derived the sections, the controls and every state patch,
 * so what is left to write is the one thing only a person can: what each option
 * LOOKS like. Each is the real markup of the surface the question is about,
 * drawn in a 375 column at TRUE pixels, because a type question judged at any
 * other size is not the question.
 *
 * ★ TRUE PIXELS, NOT A THUMBNAIL. A step's tile lives inside a zoomed 1440
 * canvas, so 18px would arrive as something else entirely; `TrueFit` takes the
 * ancestors' zoom back out (`src/components/lab/true-fit.tsx`). Every class
 * below is copied from the shipped component, never approximated: a preview
 * that is not the real thing answers a different question.
 */

/** A 375 column, the width every one of these is judged at. */
function Phone({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <TrueFit natural={375}>
      <div className="w-[375px] rounded-lg border border-border bg-background px-5 py-6">
        {children}
        <p className="mt-5 border-t border-border pt-2 text-[11px] text-faint">
          {label}
        </p>
      </div>
    </TrueFit>
  );
}

/**
 * /about and /help: a `prose` h2, then the sub-head under it, then body copy.
 * The whole question is which of the first two is louder.
 */
function Subhead({ step, label }: { step: string; label: string }) {
  return (
    <Phone label={label}>
      <h2 className="font-heading text-prose text-balance">
        What we are building
      </h2>
      <div className="mt-6 grid gap-2">
        <h3 className={cn("font-heading", step)}>One place, not five</h3>
        <p className="text-[15px] leading-7 text-pretty text-muted-foreground">
          Every photo and video from the night lands in one album, at the size
          it was shot, without anyone installing anything.
        </p>
      </div>
    </Phone>
  );
}

/** The marketing 404, at the step its title wears. */
function DeadLink({ step, label }: { step: string; label: string }) {
  return (
    <Phone label={label}>
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-brand">404</span>
        {/* Copied from not-found-screen.tsx: no font-semibold, no
            tracking-tight (it resolves to 0em and would cancel the step). */}
        <h1 className={cn("font-heading text-balance", step)}>
          That page has moved on
        </h1>
        <p className="text-pretty text-muted-foreground">
          The link you followed does not lead anywhere any more. The pages below
          are the ones people usually want.
        </p>
      </div>
    </Phone>
  );
}

/**
 * A masthead at the display step, with and without a trim that tracks the
 * leading. The rule above the word is the line the caps should sit on.
 */
function Trim({ trim, label }: { trim: string; label: string }) {
  return (
    <Phone label={label}>
      <span className="block h-px w-full bg-brand/50" />
      <p
        className={cn(
          "mkt-name py-[0.08em] text-display whitespace-nowrap",
          trim,
        )}
      >
        About
      </p>
      <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
        The gap between the rule and the caps is what the trim takes back.
      </p>
    </Phone>
  );
}

const PREVIEWS: PreviewsFor<typeof TYPE_PHONE> = {
  "subhead.today": (
    <Subhead step="text-xl sm:text-2xl" label="text-xl · 20px at 375" />
  ),
  "subhead.subsection": (
    <Subhead step="text-subsection" label="text-subsection · 18px at 375" />
  ),
  "dead-link.prose": (
    <DeadLink step="text-prose" label="text-prose · 18px at 375" />
  ),
  "dead-link.section": (
    <DeadLink step="text-section" label="text-section · 24px at 375" />
  ),
  "display-trim.flat": (
    <Trim trim="-mt-[0.12em]" label="-0.12em, flat: what ships" />
  ),
  "display-trim.clamped": (
    <Trim
      trim="mt-[calc(-0.12em-((1-var(--display-leading,0.98))*0.5em))]"
      label="a trim that tracks the leading"
    />
  ),
};

export function TypePhoneBoard() {
  return <ExplorationBoard spec={TYPE_PHONE} previews={PREVIEWS} />;
}
