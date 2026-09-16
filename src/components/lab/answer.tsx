"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { anchorFor, type BoardSpec, type Section } from "./board-spec";

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
 * ★ AND THE ASKS ARE NOT HERE ANY MORE (the stepped review, 2026-09-16). This
 * block used to restate every ask as a row of option pills, the sections
 * restated them again as "Rule on:", the review panel restated them a third
 * time and the card a fourth. Four printings of one question is the density
 * that made Will "spend tons of time per track figuring what I'm even being
 * asked": the ONE place a question is asked is its step (`step.tsx`), and this
 * is what a board says when nobody is reviewing it.
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
    </section>
  );
}

/**
 * ONE SECTION: the number, the title, the lede, the evidence, then the
 * collapsed rest.
 *
 * ★ THE ASKS ARE NOT RESTATED HERE (the stepped review, 2026-09-16). They were,
 * so that a stranger scrolling the board could tell which ruling a specimen
 * belonged to; a review is now a walk through the questions themselves, each
 * one with its own evidence under it, and the restatement was one of four
 * printings of the same question on one page.
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
  notes,
  children,
}: {
  boardId: string;
  n: number;
  section: Section;
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
            // The rationale folds under the name (the light board measured
            // about 990 words of template reprints in 2,889, 2026-09-16); the
            // card already folds it the same way, and a closed fold is not
            // reading. The summary carries the one line where the item has one.
            <details key={c.id} className="lab-disclosure">
              <summary className="cursor-pointer">
                <span
                  className={
                    c.recommended ? "font-medium text-foreground" : undefined
                  }
                >
                  {c.name}
                  {c.recommended ? " (the board's answer)" : ""}
                </span>
                {c.one ? `: ${c.one}` : ""}
              </summary>
              <p className="mt-1">{c.rationale}</p>
            </details>
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
  // ★ FOLDED (the stepped review, 2026-09-16). Every one of these rows is for
  // the AUTHOR of the next round (what was considered, what it costs, what it
  // asks Will for), and a reviewer who meets them open reads three screens of
  // the board's own bookkeeping before the evidence. Nothing is hidden that one
  // press does not return, and the smoke's reading budget counts what is open.
  return (
    <details className={cn("max-w-2xl", className)}>
      <summary className="cursor-pointer rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
        The ideas, the rules it breaks and the assets it asks for
      </summary>
      <dl className="mt-2 grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        {rows.map(([label, lines]) => (
          <div key={label} className="contents">
            <dt className="text-[11px] font-medium text-foreground">{label}</dt>
            <dd className="space-y-1">{lines}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
