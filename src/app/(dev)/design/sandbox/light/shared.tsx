"use client";

import Image from "next/image";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import type { Mode } from "@/components/dev/board";

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
 *  says what this cell is evidence FOR. */
export function Cell({
  name,
  note,
  className,
  children,
}: {
  name: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {children}
      </div>
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
    <section className="flex flex-col gap-4">
      <div className="max-w-2xl">
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
