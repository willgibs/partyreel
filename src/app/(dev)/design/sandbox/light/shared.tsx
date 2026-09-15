"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
  type Mode,
} from "@/components/dev/board";
import { MARKETING_TUNER_CONTROLS } from "@/components/dev/motion-tuner-config";
import {
  getTunerServerSnapshot,
  getTunerSnapshot,
  setTunerValue,
  subscribeTuner,
} from "@/components/dev/tuner-store";

import type { LightCandidate } from "./candidates";

/**
 * THE LIGHT BOARD'S ATOMS (the review wave, 2026-09-14).
 *
 * Two rules decide everything in this file, and both come from what the board
 * is judging:
 *
 * 1. A LABEL IS NEVER INSIDE THE JUDGED AREA. Every cue on this board is an
 *    edge treatment, so a caption box drawn around a specimen would be a fifth
 *    cue competing with the four. Captions sit under the specimen, on the bare
 *    ground, in the ground's own muted ink.
 * 2. A SPECIMEN SITS ON THE GROUND, NOT IN A FRAME. Same reason. The
 *    glow-doctrine board learned this the other way round (its beam specimens
 *    are bare divs with no ring, and un-applying their lit surface to re-judge
 *    them would change what they are).
 */

/** The board's own text sizes. The lab's caption atom is `text-xs`; a board
 *  this dense wants one step under it for the per-cell labels, and the label is
 *  the body face with tabular figures, never a mono face (bible 7 is retiring). */
export function CellLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 text-[11px] leading-snug text-muted-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A named specimen: the thing, then its label. `note` is the one line that
 *  says what this cell is evidence FOR; `proposed` marks the cell the board
 *  lands on.
 *
 *  ★ THE MARK IS IN THE LABEL, NEVER AROUND THE SPECIMEN. A dashed outline at
 *  an offset is the obvious way to say "this one", and on a board whose whole
 *  subject is edge treatments it is a fifth cue: the eye reads the outlined
 *  card as the one with the extra edge. Tried it, removed it. */
export function Cell({
  name,
  note,
  proposed,
  className,
  children,
}: {
  name: string;
  note?: string;
  proposed?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {children}
      </div>
      <CellLabel>
        <span
          className={cn(
            "font-medium",
            proposed ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {name}
        </span>
        {proposed ? (
          <span className="block text-foreground">
            <span className="mr-1.5 inline-block size-1.5 translate-y-[-1px] rounded-full bg-foreground align-middle" />
            {proposed}
          </span>
        ) : null}
        {note ? <span className="block">{note}</span> : null}
      </CellLabel>
    </div>
  );
}

/**
 * A labelled FULL-WIDTH block: a stage and the line that says what it is.
 *
 * ★ NOT `Cell`. Cell centres its child in a flex row, and Stage measures the
 * box it is given to decide its zoom, so a Stage inside a flex row shrinks to
 * its content width, measures ~100px and renders a 1440px canvas at 7 percent.
 * It looks like a thumbnail and nothing about it says it is wrong. Stages go
 * here; specimens go in Cell.
 */
export function Labeled({
  name,
  note,
  children,
}: {
  name: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col">
      {children}
      <CellLabel>
        <span className="font-medium text-foreground">{name}</span>
        {note ? <span className="block">{note}</span> : null}
      </CellLabel>
    </div>
  );
}

/** A section of the board: the heading, the case for the section, the stages. */
export function Part({
  n,
  title,
  lede,
  children,
}: {
  n: string;
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // The id is the part's anchor: four parts on one long board, and a ruling
    // conversation wants to point at one of them.
    <section id={`lgt-${n.toLowerCase()}`} className="flex flex-col gap-4">
      <div className="max-w-2xl scroll-mt-6">
        <h2 className="text-sm font-semibold tracking-tight">
          <span className="mr-2 text-muted-foreground tabular-nums">{n}</span>
          {title}
        </h2>
        <div className="mt-1.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
          {lede}
        </div>
      </div>
      {children}
    </section>
  );
}

/** The proposal a section lands on, stated on the board rather than in a doc. */
export function Proposal({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-2xl border-l-2 border-foreground/25 pl-3 text-xs leading-relaxed text-foreground">
      {children}
    </p>
  );
}

/** A real photograph, because two grey rectangles cannot argue about whether
 *  two photographs need separating. Sized in CSS by the caller. */
export function Photo({
  id,
  className,
  style,
  cue,
  sizes = "240px",
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  /** board.css's depth cue, applied to the photograph's own box. */
  cue?: string;
  sizes?: string;
}) {
  const img = marketingImage(id);
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ borderRadius: "var(--radius-tile)", ...style }}
      data-lgt-cue={cue}
    >
      <Image src={img.src} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  );
}

/** Body copy stand-in: the thing a floating layer has to detach FROM, and the
 *  thing an aurora must not wash over. Real line lengths, real leading. */
export function Copy({
  lines = 3,
  width = 280,
  className,
}: {
  lines?: number;
  width?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)} style={{ width }}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full bg-foreground/15"
          style={{ width: `${i === lines - 1 ? 58 : 92 - i * 6}%` }}
        />
      ))}
    </div>
  );
}

/**
 * THE AURORA'S CLOCK, the board's one home for it.
 *
 * Part B sets it on the aurora's bands and part C puts it on a strip beside the
 * two under ruling, so it must be one number or the board is arguing with
 * itself. Three laps of --spill-cadence: the ratio is the proposal, not the
 * literal, and the ruling on part C picks the lamp's clock this multiplies.
 */
export const AURORA_CADENCE = "33s";

/** Desktop lays a matrix out in columns; 375 cannot, so it pairs them. One
 *  helper rather than a responsive class, because the stage renders at a REAL
 *  viewport width and a breakpoint inside a zoomed stage would read the lab's
 *  width, not the stage's. */
export function matrixCols(mode: Mode, desktop: number): number {
  return mode === "desktop" ? desktop : 2;
}

/* ───────────────────────  ROUND TWO: THE SITE CONTROLS  ─────────────────── */

/**
 * "APPLY TO THE SITE" (round two, 2026-09-14).
 *
 * A board proposes CSS; the shell can now hand that exact CSS to every page
 * with a tuner island, so a candidate is judged on the real dashboard and the
 * real pricing page rather than only on a stage. One block stands at a time,
 * so this control is a RADIO across the board's candidates and not a checkbox
 * on each: the store's newest block replaces the last, and showing four
 * independent "Applied" states while only one is live would be a lie.
 *
 * The button reads the store rather than local state (useTunerCandidate), so
 * clearing from the tuner panel, or applying a different board's block in
 * another tab of the lab, is reflected here on the next render.
 */
export function ApplyToSite({
  candidate,
  className,
}: {
  candidate: LightCandidate;
  className?: string;
}) {
  const applied = useTunerCandidate();
  const on = applied?.label === candidate.label;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() =>
          on ? clearCandidate() : setCandidateCss(candidate.label, candidate.css)
        }
        aria-pressed={on}
        className={cn(
          "h-8 rounded-[var(--radius-action-sm)] px-3 text-[12px] font-medium transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
          on
            ? "bg-foreground text-background"
            : "border border-border bg-card text-foreground hover:border-foreground/30",
        )}
      >
        {on ? "Applied to the site" : "Apply to the site"}
      </button>
      {on ? (
        <span className="text-[11px] text-muted-foreground">
          Walk: {candidate.pages}. It persists until you clear it.
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground">
          {candidate.what}
        </span>
      )}
    </div>
  );
}

/** The board's own clear, so a walk can be ended without hunting for the tuner
 *  panel. Renders nothing while no block stands. */
export function AppliedBanner() {
  const applied = useTunerCandidate();
  if (!applied) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-foreground/25 bg-card px-3 py-2 text-[11px]">
      <span className="font-medium text-foreground">
        On the site: {applied.label}
      </span>
      <button
        type="button"
        onClick={clearCandidate}
        className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
      >
        Clear
      </button>
    </div>
  );
}

/**
 * A KNOB ON THE SITE. The cadence ruling is a token, not a block, and the
 * tuner already owns it: this writes the same override the panel's slider
 * writes, so "8s on the site" is one tap and then a walk.
 *
 * ★ THE CONTROL OBJECT IS THE KEY, NOT THE STRING. setTunerValue keys off
 * control.cssVar and compares against control.default to decide whether to
 * store an override or drop one, so passing a hand-made object with the wrong
 * default would leave a phantom override that Reset never clears.
 */
const CADENCE = MARKETING_TUNER_CONTROLS.find(
  (c) => c.cssVar === "--spill-cadence",
);

/** The tuner's live overrides. motion-tuner.tsx keeps its own copy of this
 *  subscription; the store is the shared root, so a board reads it the same
 *  way rather than reaching into the panel. */
function useTunerOverrides() {
  return useSyncExternalStore(
    subscribeTuner,
    getTunerSnapshot,
    getTunerServerSnapshot,
  );
}

export function CadenceKnob({ seconds }: { seconds: number }) {
  const live = useTunerOverrides();
  if (!CADENCE) return null;
  const current = live[CADENCE.cssVar] ?? CADENCE.default;
  const on = Number(current) === seconds;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setTunerValue(CADENCE, seconds)}
      className={cn(
        "h-8 rounded-[var(--radius-action-sm)] px-3 text-[12px] font-medium tabular-nums transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
        on
          ? "bg-foreground text-background"
          : "border border-border bg-card text-foreground hover:border-foreground/30",
      )}
    >
      {seconds}s on the site
    </button>
  );
}

/** The ruling as a paste: the exact block, in the body face (there is no mono
 *  face in the product), with the copy the Orchestrator would land. */
export function Paste({ css, label }: { css: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[12px] font-medium">{label}</p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(css).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              },
              () => setCopied(false),
            );
          }}
          className="h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-sans text-[11px] leading-relaxed whitespace-pre tabular-nums">
        {css}
      </pre>
    </div>
  );
}
