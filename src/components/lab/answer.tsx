"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  anchorFor,
  type Ask,
  type BoardSpec,
  optionId,
  optionLabel,
  optionMeans,
  type Section,
} from "./board-spec";

/**
 * THE ANSWER, FIRST.
 *
 * ★ A BOARD CANNOT PUT PROSE BEFORE ITS FIRST SECTION, and this block is why.
 * Every board before the template opened with three paragraphs of how it got
 * here, then an index, then seventeen thousand pixels, with the thing being
 * asked at the bottom. A reviewer's first screen should be: the question, the
 * board's answer, the case in one breath, what would change its mind, and the
 * words he can reply with. The argument is evidence FOR the answer and belongs
 * under it; the history belongs at the end, collapsed.
 *
 * ★ THE ASKS ARE OPTION PILLS, NOT SENTENCES. A ruling is one word ("registers",
 * "quarters", "B"), and the reviewer should be able to see the words he can say
 * without reading a paragraph to infer them. The recommended one is FILLED, so
 * the board's own answer is visible at a glance and a "yes" is the cheapest
 * reply; "See it" jumps to the section that argues it, which is the one link a
 * reviewer who disagrees actually wants.
 *
 * ★ AND AN ASK CARRIES ITS CONTEXT WHEREVER IT IS MET (the clarity round,
 * 2026-09-15). The pills wear the options' LABELS, and the ask's `context` and
 * `look` print here as they do on the desk's session and the review card: a
 * reviewer who reads the board's first screen must not meet a bare label with
 * four tokens under it, which is exactly what stopped Will's first review.
 */
export function Answer({
  spec,
  className,
}: {
  spec: BoardSpec;
  className?: string;
}) {
  const { verdict, round } = spec;
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="max-w-3xl">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          The question
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {spec.question}
        </p>
        <h2 className="mt-4 font-heading text-2xl leading-tight tracking-tight text-balance">
          {verdict.recommendation}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {verdict.because}
        </p>
        {verdict.overrule ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              What would change it:{" "}
            </span>
            {verdict.overrule}
          </p>
        ) : null}
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            Round {round.n}, {round.date}:{" "}
          </span>
          {round.changed}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {spec.asks.map((ask) => (
          <AskPills key={ask.id} boardId={spec.id} ask={ask} />
        ))}
      </ul>
    </section>
  );
}

function AskPills({ boardId, ask }: { boardId: string; ask: Ask }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-3.5 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[12px] font-medium">{ask.question}</span>
        <a
          href={`#${anchorFor(boardId, ask.evidence)}`}
          className="text-[11px] text-muted-foreground underline decoration-foreground/20 underline-offset-2 transition-colors duration-150 ease-emphasis hover:text-foreground hover:decoration-foreground/50 motion-reduce:transition-none"
        >
          See it
        </a>
      </div>
      {ask.context ? (
        <p className="max-w-2xl text-[11px] leading-relaxed text-foreground/80">
          {ask.context}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {ask.options.map((o) => (
          <span
            key={optionId(o)}
            title={optionMeans(o)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-medium",
              optionId(o) === ask.recommended
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground",
            )}
          >
            {optionLabel(o)}
          </span>
        ))}
      </div>
      {ask.look ? (
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">Where to look: </span>
          {ask.look}
        </p>
      ) : null}
      {ask.because ? (
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">Why the board says so: </span>
          {ask.because}
        </p>
      ) : null}
      {ask.overrule ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">Overrule if: </span>
          {ask.overrule}
        </p>
      ) : null}
    </li>
  );
}

/** The sections, numbered, each a link. It is the reviewer's map of a board he
 *  cannot see the end of, and it is derived, so it cannot drift from what is
 *  actually rendered below it. */
export function BoardIndex({
  spec,
  className,
}: {
  spec: BoardSpec;
  className?: string;
}) {
  return (
    <nav
      aria-label="The board's sections"
      className={cn(
        "flex max-w-2xl flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3",
        className,
      )}
    >
      <p className="text-[12px] font-medium">
        The evidence, in the order the board argues it
      </p>
      <ol className="mt-1 flex flex-col gap-1">
        {spec.sections.map((s, i) => (
          <li key={s.id} className="flex gap-2 text-[11px] leading-snug">
            <span className="w-4 shrink-0 text-muted-foreground tabular-nums">
              {i + 1}
            </span>
            <a
              href={`#${anchorFor(spec.id, s.id)}`}
              className="text-muted-foreground underline decoration-foreground/20 underline-offset-2 transition-colors duration-150 ease-emphasis hover:text-foreground hover:decoration-foreground/50 motion-reduce:transition-none"
            >
              <span className="mr-1.5 font-medium text-foreground">
                {s.title}
              </span>
              {s.lede}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * ONE SECTION: the number, the title, the asks it answers restated, the lede,
 * the evidence, then the collapsed rest.
 *
 * ★ THE ASKS ARE RESTATED HERE, AND THAT IS NOT DECORATION. Walking a board
 * cold, the one thing a stranger cannot tell at any point is which ruling the
 * specimen in front of him belongs to: the asks live at the top, seventeen
 * thousand pixels up. They come from the spec, so the answer block, this header
 * and the meta panel are one source and cannot drift.
 *
 * ★ AND THE ARGUMENT IS COLLAPSED BY DEFAULT. The evidence is the thing; the
 * paragraphs explaining it are for the reader who disagrees with what he just
 * saw. Nothing is hidden that one click does not return, and a section with no
 * argument draws no disclosure at all.
 */
export function BoardSection({
  boardId,
  n,
  section,
  asks,
  notes,
  children,
}: {
  boardId: string;
  n: number;
  section: Section;
  asks: readonly Ask[];
  notes?: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchorFor(boardId, section.id)}
      className="flex flex-col gap-4"
    >
      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold tracking-tight">
          <span className="mr-2 text-muted-foreground tabular-nums">
            {String(n).padStart(2, "0")}
          </span>
          {section.title}
        </h2>
        {asks.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {asks.map((a) => (
              <li
                key={a.id}
                className="flex gap-2 text-[11px] leading-snug text-foreground"
              >
                <span
                  aria-hidden
                  className="mt-[5px] size-1.5 shrink-0 rounded-full bg-foreground"
                />
                <span>
                  <span className="text-muted-foreground">Rule on: </span>
                  {a.question} ({a.options.map(optionLabel).join(", ")})
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {section.lede}
        </p>
      </div>
      {children}
      <div className="flex flex-wrap gap-2">
        <Fold label="The argument" lines={section.argument} />
        <Fold label="For the wiring round" lines={section.wiring} />
        <Fold label="Notes" lines={notes} />
      </div>
    </section>
  );
}

function Fold({ label, lines }: { label: string; lines?: readonly string[] }) {
  const [open, setOpen] = useState(false);
  if (!lines?.length) return null;
  return (
    <div className="min-w-0 basis-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? `Hide ${label.toLowerCase()}` : `${label} (${lines.length})`}
      </button>
      {open ? (
        <div className="mt-2 max-w-2xl space-y-2 text-xs leading-relaxed text-muted-foreground">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * THE META PANEL, derived from the spec rather than retyped: the candidates,
 * the departures from the bible or a standing ruling, and the assets the board
 * asks Will for. The Orchestrator folds these exact lines into the track
 * manifest and `docs/ASSETS.md`, so a board that words them differently in two
 * places costs an integration.
 */
export function BoardMeta({
  spec,
  className,
}: {
  spec: BoardSpec;
  className?: string;
}) {
  const departures = [
    ...spec.departures,
    ...spec.candidates.flatMap((c) => c.departures ?? []),
  ];
  const assets = [
    ...spec.assets,
    ...spec.candidates.flatMap((c) => c.assets ?? []),
  ];
  // ★ THE HEADINGS ARE A STRANGER'S WORDS, NOT THE CODE'S (the sweep's finding,
  // 2026-09-16). `candidates` and `departures` are the spec's field names and
  // they stay field names; what a reviewer reads is what the row IS. The
  // glossary teaches both.
  const rows: [string, React.ReactNode[]][] = [
    [
      "Ideas",
      spec.candidates.length
        ? spec.candidates.map((c) => (
            <p key={c.id}>
              <span
                className={
                  c.recommended ? "font-medium text-foreground" : undefined
                }
              >
                {c.name}
                {c.recommended ? " (the board's answer)" : ""}:{" "}
              </span>
              {c.rationale}
            </p>
          ))
        : [<p key="none">not yet on the board</p>],
    ],
    [
      "Rules this breaks",
      departures.length
        ? departures.map((d) => (
            <p key={d.id}>
              <span className="text-foreground">
                {typeof d.from === "number" ? `Bible ${d.from}` : d.from}:{" "}
              </span>
              {d.text}
            </p>
          ))
        : [<p key="none">none</p>],
    ],
    [
      "Assets requested",
      assets.length
        ? assets.map((a, i) => (
            <p key={i}>
              <span className="text-foreground">{a.what}: </span>
              {a.spec} Replaces {a.replaces}
              {a.row ? ` (ASSETS.md row ${a.row})` : ""}
            </p>
          ))
        : [<p key="none">none</p>],
    ],
  ];
  return (
    <dl
      className={cn(
        "grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground",
        className,
      )}
    >
      {rows.map(([label, lines]) => (
        <div key={label} className="contents">
          <dt className="text-[11px] font-medium text-foreground">{label}</dt>
          <dd className="space-y-1">{lines}</dd>
        </div>
      ))}
    </dl>
  );
}
