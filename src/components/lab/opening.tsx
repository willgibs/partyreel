"use client";

import { Fragment } from "react";

import { cn } from "@/lib/utils";

import type { Opening, Term } from "./board-spec";
import { openingTexts, termsIn } from "./terms";

/**
 * THE CONTEXT LAYER'S FURNITURE (2026-09-29). Will decides across every open
 * board in one sitting, and his biggest friction was a question that "hits me
 * with such a specific question and targeted terminology within a spot example
 * without really introducing more of the context around what's happening". So
 * a board opens with what it is about, what is settled and what he said
 * before; an ask with where it happens; and a coined word with its meaning.
 * These are the three shapes that say so, shared by the step and the board.
 */

/** Where an ask happens: the surface, then the screen and the moment. */
export function Crumbs({
  where,
  className,
}: {
  where?: readonly string[];
  className?: string;
}) {
  if (!where?.length) return null;
  return (
    <p
      data-lab-where=""
      className={cn(
        "flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs leading-snug text-muted-foreground",
        className,
      )}
    >
      <span className="sr-only">Where it happens: </span>
      {where.map((crumb, i) => (
        <Fragment key={`${i}-${crumb}`}>
          {i > 0 && (
            <span aria-hidden className="text-faint">
              ›
            </span>
          )}
          <span className={i === 0 ? "font-medium text-foreground" : undefined}>
            {crumb}
            {i < where.length - 1 && <span className="sr-only">,</span>}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

/**
 * A board's coined words, each with its plain meaning. `wide` lets a long list
 * flow in two columns where the page is wide, so a gloss never costs a screen.
 */
export function TermList({
  terms,
  wide = false,
  className,
}: {
  terms: readonly Term[];
  wide?: boolean;
  className?: string;
}) {
  if (terms.length === 0) return null;
  return (
    <div data-lab-terms="" className={cn("text-xs leading-relaxed", className)}>
      <p className="text-[11px] font-medium text-foreground">The words here</p>
      <dl className={cn("mt-0.5 space-y-0.5", wide && "gap-x-8 lg:columns-2")}>
        {terms.map((t) => (
          <div key={t.term} className="break-inside-avoid">
            <dt className="inline font-medium text-foreground">{t.term}</dt>
            <dd className="inline text-muted-foreground">: {t.means}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Lines({ label, lines }: { label: string; lines?: readonly string[] }) {
  if (!lines?.length) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-foreground">{label}</p>
      <ul className="mt-0.5 space-y-0.5 text-xs leading-relaxed text-muted-foreground">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span className="min-w-0">{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * THE BOARD'S OPENING: what it is about, what is settled, what he picked and
 * wrote before, and the board's words it uses. Drawn open where his sitting
 * enters the board and at the head of the whole board; `folded` draws it as
 * one line that opens, for a step that is not the board's first.
 */
export function BoardOpening({
  opening,
  terms,
  folded = false,
  className,
}: {
  opening?: Opening;
  terms?: readonly Term[];
  folded?: boolean;
  className?: string;
}) {
  if (!opening) return null;
  const used = termsIn(openingTexts(opening), terms);
  // Settled beside what came before where there is room: the two lists are
  // read together, and stacked they pushed the question a screen down.
  const body = (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm leading-relaxed">{opening.about}</p>
      <div className="grid gap-x-8 gap-y-2.5 lg:grid-cols-2">
        <Lines label="Already settled" lines={opening.settled} />
        <Lines
          label="What you picked and said before"
          lines={opening.earlier}
        />
      </div>
      <TermList terms={used} wide />
    </div>
  );
  if (folded)
    return (
      <details
        data-lab-opening="folded"
        className={cn("max-w-6xl text-xs", className)}
      >
        <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          About this board
        </summary>
        <div className="mt-2 rounded-xl border border-border bg-card px-4 py-3">
          {body}
        </div>
      </details>
    );
  return (
    <section
      data-lab-opening=""
      aria-label="About this board"
      className={cn(
        "max-w-6xl rounded-xl border border-border bg-card px-4 py-3",
        className,
      )}
    >
      <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        About this board
      </p>
      {body}
    </section>
  );
}
