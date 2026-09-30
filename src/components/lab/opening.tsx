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
 * These are the shapes that say so, shared by the step, its About panel and
 * the whole board.
 *
 * ★ ON A STEP THEY ARE ONE PRESS AWAY, NOT A WALL (lab-focus, the same day).
 * Stacked above the question, block by block, they grew into what he called
 * "a Jackson Pollock painting of text" between him and the pictures. A step
 * keeps where it happens in its one line and puts the rest in its About panel
 * (`about.tsx`); the whole board still opens with its opening.
 */

/**
 * Where an ask happens: the surface, then the screen and the moment, inline,
 * so the step's one line can hold it beside the state that brings someone
 * there and cut them together.
 */
export function Crumbs({ where }: { where?: readonly string[] }) {
  if (!where?.length) return null;
  return (
    <>
      <span className="sr-only">Where it happens: </span>
      {where.map((crumb, i) => (
        <Fragment key={`${i}-${crumb}`}>
          {i > 0 && (
            <span aria-hidden className="px-1 text-faint">
              ›
            </span>
          )}
          <span className={i === 0 ? "font-medium text-foreground" : undefined}>
            {crumb}
            {i < where.length - 1 && <span className="sr-only">,</span>}
          </span>
        </Fragment>
      ))}
    </>
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

/** A label and its lines, a dot each: what is settled, what he said before. */
export function Lines({
  label,
  lines,
}: {
  label: string;
  lines?: readonly string[];
}) {
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
 * THE BOARD'S OPENING, at the head of the whole board: what it is about, what
 * is settled, what he picked and wrote before, and the board's words it uses.
 * A step carries the same lines in its About panel.
 */
export function BoardOpening({
  opening,
  terms,
  className,
}: {
  opening?: Opening;
  terms?: readonly Term[];
  className?: string;
}) {
  if (!opening) return null;
  const used = termsIn(openingTexts(opening), terms);
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
      <div className="flex flex-col gap-2.5">
        <p className="text-sm leading-relaxed">{opening.about}</p>
        {/* Settled beside what came before where there is room: the two
            lists are read together, and stacked they cost a screen. */}
        <div className="grid gap-x-8 gap-y-2.5 lg:grid-cols-2">
          <Lines label="Already settled" lines={opening.settled} />
          <Lines
            label="What you picked and said before"
            lines={opening.earlier}
          />
        </div>
        <TermList terms={used} wide />
      </div>
    </section>
  );
}
