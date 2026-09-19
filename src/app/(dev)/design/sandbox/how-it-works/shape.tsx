"use client";

import { useState } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import { SideChip } from "@/components/marketing/sections/how-it-works/side-chip";
import { Caption } from "@/components/marketing/system/caption";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { cn } from "@/lib/utils";

import { SIX_STEPS } from "./content";
import { type PictureTreatment, StepPicture } from "./picture-treatments";
import { Widths } from "./scene";
import { SpineList } from "./spine-list";
import { pictureTreatmentOf, stepsShapeOf } from "./state";
import { STEP_SET } from "./step-set";
import type { StepsShape } from "./steps";

/**
 * THE SHAPE: how the walkthrough lays out its steps, holding THE STEPS' and
 * THE PICTURES' own live picks (falling back to their recommendations)
 * exactly as the two decisions do for each other.
 */
export type ShapeKind = "scroll" | "stepper" | "ledger";

/* ── "stepper": one step visible, a numbered tab row above it ────────────── */

function Stepper({
  stepsShape,
  treatment,
}: {
  stepsShape: StepsShape;
  treatment: PictureTreatment;
}) {
  const steps = STEP_SET[stepsShape];
  const [active, setActive] = useState(0);
  const step = steps[Math.min(active, steps.length - 1)];
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap justify-center gap-2">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border text-sm font-medium tabular-nums transition-colors",
              i === active
                ? "border-foreground/40 bg-foreground text-background"
                : "text-muted-foreground hover:border-foreground/25",
            )}
            aria-label={`Step ${i + 1}: ${s.title}`}
            aria-pressed={i === active}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="grid items-center gap-x-10 gap-y-6 lg:grid-cols-12">
        <div className="flex flex-col gap-2.5 lg:col-span-5">
          <SideChip>{step.side}</SideChip>
          <h3 className="font-heading text-subsection">{step.title}</h3>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {step.body}
          </p>
        </div>
        <div className="lg:col-span-7">
          <div className="mx-auto w-full max-w-md">
            <StepPicture moment={step.picture} treatment={treatment} first />
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {active + 1} of {steps.length}: tap a number to jump.
      </p>
    </div>
  );
}

/* ── "ledger": a host column and a guest column, read down together ──────── */

type LedgerRow = {
  title: string;
  host: string;
  guest: string;
  picture: (typeof SIX_STEPS)[number]["picture"];
};

// Six.tsx's own body split into two perspectives at the SAME moment, which
// the alternating scroll cannot show at all: a body belongs to one side, so
// "what is the OTHER side doing right now" has never been written down
// before this option asked the question.
const LEDGER: LedgerRow[] = [
  {
    title: "Create the event",
    host: "Names the event, styles the QR. Finishing that step creates it, live immediately.",
    guest: "Doesn't know yet: nothing exists to scan until the host shares it.",
    picture: "create",
  },
  {
    title: "Scan and you're in",
    host: "Shares the code: on a screen, a print-out, or a link.",
    guest: "Scans it, lands on a welcome screen. No app, no account.",
    picture: "scan",
  },
  {
    title: "The album fills live",
    host: "Watches the album fill, live, from the head table.",
    guest: "Uploads photos and videos, straight from the camera roll.",
    picture: "fill",
  },
  {
    title: "Shape it",
    host: "Reviews new uploads, or lets everything appear live.",
    guest: "Keeps uploading. A pending photo just says “sent”.",
    picture: "review",
  },
  {
    title: "Browse, save, download",
    host: "Downloads the whole album as one zip, once the night's over.",
    guest: "Opens the same link afterward and saves a favorite.",
    picture: "export",
  },
  {
    title: "The reel",
    host: "Taps Create reel, picks a style from the catalog.",
    guest: "Gets the finished highlight video in the same album.",
    picture: "reel",
  },
];

/**
 * ★ THE GRID STACKS BELOW `sm` (found reading the 375 capture against its own
 * words, docs/tracks/how-it-works.md, "measure every tile before it ships"):
 * three columns squeezed into 375 px read as two cramped slivers rather than
 * a comparison. Each row carries its own Host/Guest chip (not just the header
 * above the loop) so a stacked row still says which side is speaking; the
 * header stays for the desktop read, where the chips would repeat needlessly.
 */
function Ledger({ treatment }: { treatment: PictureTreatment }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3">
      <div className="hidden gap-3 px-1 sm:grid sm:grid-cols-[auto_1fr_1fr]">
        <span aria-hidden />
        <SideChip>Host</SideChip>
        <SideChip>Guest</SideChip>
      </div>
      {LEDGER.map((row, i) => (
        <div
          key={row.title}
          className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 sm:grid sm:grid-cols-[auto_1fr_1fr] sm:items-center sm:gap-4"
        >
          <Caption className="tabular-nums">
            {String(i + 1).padStart(2, "0")} &middot; {row.title}
          </Caption>
          <div className="flex flex-col gap-1.5">
            <SideChip className="w-fit sm:hidden">Host</SideChip>
            <p className="text-sm leading-relaxed text-pretty">{row.host}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <SideChip className="w-fit sm:hidden">Guest</SideChip>
            <p className="text-sm leading-relaxed text-pretty">{row.guest}</p>
          </div>
          <div className="sm:col-span-3">
            <div className="mx-auto w-full max-w-[9rem]">
              <StepPicture
                moment={row.picture}
                treatment={treatment}
                first={i === 0}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── the three, on the real chapter ground ────────────────────────────────── */

function ShapePage({
  kind,
  stepsShape,
  treatment,
}: {
  kind: ShapeKind;
  stepsShape: StepsShape;
  treatment: PictureTreatment;
}) {
  return (
    <PaperChapter>
      <SectionShell
        eyebrow="The walkthrough"
        heading="Six steps, two sides."
        subhead="What you set up as the host and what your guests see, in the order a real event runs."
      >
        {kind === "scroll" && (
          <SpineList steps={STEP_SET[stepsShape]} treatment={treatment} />
        )}
        {kind === "stepper" && (
          <Stepper stepsShape={stepsShape} treatment={treatment} />
        )}
        {kind === "ledger" && <Ledger treatment={treatment} />}
      </SectionShell>
    </PaperChapter>
  );
}

// Measured against the real rendered frames (PROGRAM.md, "measure every tile
// before it ships"): stepper ran 670 px at 1440 against a first guess of
// 1,150 (one step on screen at a time is inherently short); ledger ran 2,065
// against 2,500. Ledger's phone height keeps its generous first guess: the
// stacked-below-sm layout (found reading this capture) runs taller per row
// than the cramped three-column read it replaced.
const SHAPE_H: Record<ShapeKind, { d: number; p: number }> = {
  scroll: { d: 3350, p: 3400 },
  stepper: { d: 800, p: 1050 },
  ledger: { d: 2200, p: 4300 },
};

const NOTE: Record<ShapeKind, string> = {
  scroll: "As today: alternating sides, the whole story in one scroll.",
  stepper: "Six tabs, one step on screen at a time.",
  ledger: "A host column and a guest column, read down together.",
};

export function shapePreview(kind: ShapeKind) {
  return function ShapePreview(state: BoardState) {
    const stepsShape = stepsShapeOf(state.steps);
    const treatment = pictureTreatmentOf(state.pictures);
    return (
      <Widths
        id={`shape-${kind}`}
        ground="paper"
        desktopH={SHAPE_H[kind].d}
        phoneH={SHAPE_H[kind].p}
        note={NOTE[kind]}
        render={() => (
          <ShapePage kind={kind} stepsShape={stepsShape} treatment={treatment} />
        )}
      />
    );
  };
}
