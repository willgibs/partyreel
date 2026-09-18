"use client";

import { cn } from "@/lib/utils";

import type { Candidate } from "./board-spec";

/**
 * A CANDIDATE, AS THE THING IT IS PROPOSING.
 *
 * Generalised from the hero-concept contract the marketing boards each rebuilt:
 * a candidate is not only a rendering, it is a claim with copy attached, and the
 * copy is half of what is being ruled on. A hero candidate that shows a layout
 * and hides its own headline is asking for a ruling on half of itself.
 *
 * ★ THE PROPOSED COPY IS SHOWN AS COPY, in the faces and sizes it would ship
 * in, not as a list of strings in a table. A headline read at 13px in a data
 * table is a different headline; the whole reason copy is on a board rather than
 * in a doc is that it can be seen at its real weight.
 *
 * The rules an idea breaks ride the card rather than only the meta panel,
 * because a departure belongs to the candidate that causes it: ruling FOR that
 * candidate is ruling for its departures, and that should be visible at the
 * moment of choosing. The card says "breaks"; the field is still `departures`.
 */
export function ConceptCard({
  candidate,
  selected,
  onSelect,
  children,
  className,
}: {
  candidate: Candidate;
  selected?: boolean;
  onSelect?: () => void;
  /** The rendering: a Stage, a Frame, a Compare. */
  children?: React.ReactNode;
  className?: string;
}) {
  const { proposed } = candidate;
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4",
        selected ? "border-foreground/40" : "border-border",
        className,
      )}
    >
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {onSelect ? (
          <button
            type="button"
            aria-pressed={!!selected}
            onClick={onSelect}
            className="text-sm font-semibold tracking-tight underline decoration-transparent underline-offset-2 transition-colors hover:decoration-foreground/40"
          >
            {candidate.name}
          </button>
        ) : (
          <h3 className="text-sm font-semibold tracking-tight">
            {candidate.name}
          </h3>
        )}
        {candidate.recommended ? (
          <span className="rounded-md bg-foreground px-1.5 py-px text-[10px] font-medium text-background">
            the board&apos;s answer
          </span>
        ) : null}
      </header>

      {children}

      {proposed ? (
        <div className="flex flex-col gap-1.5 border-l-2 border-foreground/25 pl-3">
          {proposed.eyebrow ? (
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {proposed.eyebrow}
            </p>
          ) : null}
          {proposed.h1 ? (
            <p className="font-heading text-xl leading-tight tracking-tight text-balance">
              {proposed.h1}
            </p>
          ) : null}
          {proposed.subhead ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {proposed.subhead}
            </p>
          ) : null}
          {proposed.secondary ? (
            <p className="text-[12px] text-muted-foreground">
              {proposed.secondary}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        {candidate.rationale}
      </p>

      {candidate.departures?.length ? (
        <ul className="flex flex-col gap-1">
          {candidate.departures.map((d) => (
            <li
              key={d.id}
              className="text-[11px] leading-snug text-muted-foreground"
            >
              <span className="font-medium text-foreground">
                {typeof d.from === "number" ? `Breaks bible ${d.from}` : d.from}
                :{" "}
              </span>
              {d.text}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
