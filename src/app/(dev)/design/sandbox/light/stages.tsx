"use client";

import { type CSSProperties } from "react";

import {
  ApplyToSite,
  CellLabel,
  GroundBox,
  ReplayButton,
  useReplay,
  type Mode,
} from "@/components/lab";
import { LAMP_SET } from "@/components/dev/lamp-set";
import { ReelFrame } from "@/components/marketing/frames";
import { CinemaClose } from "@/components/marketing/sections/home/cinema-close";
import { Privacy } from "@/components/marketing/sections/home/privacy";
import { Glow } from "@/components/shared/glow";

import { PAPER_FIVE, PAPER_FIVE_VALUES, PAPER_FLAT_VALUES } from "./candidates";
import { Light, type Placement } from "./composer";
import { LEANED } from "./previews";
import { CadenceKnob, SectionCrop } from "./shared";

/**
 * THE FIVE STEPS AFTER THE CARDS (round seven, the stepped review, 2026-09-16).
 *
 * ★ EACH ONE IS ITS OWN CONTEXT WITH ITS OWN SPECIMEN, which is Will's brief in
 * his own words: "move that context out and bring in new context to frame the
 * shadow specific questions. Then new context again for the lamp breathe speed
 * question." Round six had all four crammed into one section called "the four
 * calls left", under a shared heading, which is exactly the shape that made him
 * "spend tons of time per track figuring what I'm even being asked".
 *
 * ★ AND EACH STAGE DRAWS ONE STATE, NEVER A ROW OF THEM. The review renders the
 * stage once per option, in that option's declared state, so a stage that drew
 * its own three-up would draw nine. One specimen, one state, one argument.
 */

/* ── 1. Where the aurora lands ───────────────────────────────────────────── */

const CHAPTER_H = { desktop: 510, phone: 600 } as const;

/**
 * THE CLOSER, WHOLE, WITH THE FIELD AT ONE PLACEMENT.
 *
 * ★ THE FOOTER IS NOT IN QUESTION UNDER ANY OF THESE, which is the confusion
 * this step exists to end: Will read round five's four-word ask and asked back
 * "am I being asked what aurora placement within the footer? Or what aurora
 * replacement looks better in general?". The footer keeps its own seam under
 * every option; what moves is where a media-less CHAPTER carries its light.
 */
export function AuroraStage({
  mode,
  landing,
}: {
  mode: Mode;
  landing: Placement;
}) {
  const h = CHAPTER_H[mode];
  return (
    <SectionCrop ground="cinema" mode={mode} height={h}>
      <div className="relative isolate h-full w-full overflow-hidden">
        <Light
          treatment="aurora"
          placement={landing}
          ground="cinema"
          register="accent"
          clock="aurora"
          height={h}
          grain
          drive="mask"
        />
        <div className="relative">
          <CinemaClose />
        </div>
      </div>
    </SectionCrop>
  );
}

/* ── 2. How slowly a lamp breathes ───────────────────────────────────────── */

/**
 * ONE REAL LAMP AT ONE NUMBER: the seam on the closer's own bottom boundary,
 * with the site's clock overridden on the crop.
 *
 * ★ THE LAMP, NOT THE FIELD, AND THE OVERRIDE IS WHY. The field's clock is
 * declared once at the root as a multiple of the lamp's, so a --spill-cadence
 * set on a wrapper cannot reach it: a custom property's value is computed where
 * it is DECLARED. The seam reads --spill-cadence at the point of use, so the
 * override lands. It is also the honest specimen: the question is how slowly a
 * LAMP breathes, and the field follows whatever it answers.
 *
 * ★ AND TWO TILES CANNOT SETTLE IT. They show that two numbers are two numbers;
 * they cannot show what three lamps a viewport apart feel like on a page you
 * are scrolling. So the knobs write the clock on the real SITE and the ruling
 * is made on a walk, which is the instrument the tuner's slider already is.
 */
export function ClockStage({ mode, cadence }: { mode: Mode; cadence: string }) {
  const h = CHAPTER_H[mode];
  return (
    <div className="flex flex-col gap-3">
      <SectionCrop
        ground="cinema"
        mode={mode}
        height={h}
        style={{ "--spill-cadence": cadence } as CSSProperties}
      >
        <div className="relative isolate h-full w-full overflow-hidden">
          <Light
            treatment="seam"
            placement="bottom"
            ground="cinema"
            register="accent"
            clock="lamp"
            height={h}
            grain={false}
            drive="mask"
          />
          <div className="relative">
            <CinemaClose />
          </div>
        </div>
      </SectionCrop>
      <div className="flex flex-wrap items-center gap-2">
        <CadenceKnob seconds={8} />
        <CadenceKnob seconds={11} />
        <CellLabel className="mt-0 max-w-md">
          Writes the clock on the real site, for the walk. The crop above will
          not move: a lab page wears an applied block, not the tuner&rsquo;s own
          overrides.
        </CellLabel>
      </div>
    </div>
  );
}

/* ── 3. The five hues, on paper ──────────────────────────────────────────── */

const ROWS: Record<string, { note: string; row: readonly string[] }> = {
  dark: {
    note: "What a paper lamp wears today. No override exists.",
    row: LAMP_SET,
  },
  flat: {
    note: "One lightness and one chroma for every hue: the sampled path's answer.",
    row: PAPER_FLAT_VALUES,
  },
  "hand-tuned": {
    note: "Two of the five lifted and desaturated; the other two carry the chroma.",
    row: PAPER_FIVE_VALUES,
  },
};

/** The five, as a style object. A row is set on the wrapper the field reads
 *  from, never on the engine element, so the aurora's own vars still win. */
function five(row: readonly string[]): CSSProperties {
  return {
    "--lamp-1": row[0],
    "--lamp-2": row[1],
    "--lamp-3": row[2],
    "--lamp-4": row[3],
    "--lamp-5": row[4],
  } as CSSProperties;
}

/** The five hues as a row, read off the same strings the chapter beside them
 *  paints, so a swatch here cannot drift from a colour there. */
function Swatches({ row }: { row: readonly string[] }) {
  return (
    <div aria-hidden className="mt-1.5 flex gap-1">
      {row.map((c) => (
        <span
          key={c}
          className="h-3 flex-1 rounded-full"
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

/** One real paper chapter wearing one row of five. */
/**
 * ONE REAL PAPER CHAPTER WEARING ONE ROW OF FIVE.
 *
 * ★ ONE BAND, AT THE CHAPTER'S REAL TOP BOUNDARY. The crop is shorter than the
 * chapter, so a second band at the crop's foot would sit mid-chapter and draw a
 * placement nobody proposed. The question here is the COLOUR, and one band at a
 * true boundary answers it without inventing a grammar.
 */
export function HuesStage({ mode, hues }: { mode: Mode; hues: string }) {
  const r = ROWS[hues] ?? ROWS["hand-tuned"];
  const h = mode === "desktop" ? 380 : 460;
  return (
    <div className="flex flex-col gap-2">
      <SectionCrop ground="paper" mode={mode} height={h} style={five(r.row)}>
        <div className="relative isolate h-full w-full overflow-hidden">
          <Light
            treatment="aurora"
            placement="top"
            ground="paper"
            register="accent"
            clock="aurora"
            height={h}
            grain={false}
            drive="mask"
          />
          <div className="relative">
            <Privacy />
          </div>
        </div>
      </SectionCrop>
      <Swatches row={r.row} />
      <CellLabel className="mt-0 max-w-2xl">{r.note}</CellLabel>
      <ApplyToSite block={PAPER_FIVE} />
    </div>
  );
}

/* ── 4. The publish flourish ─────────────────────────────────────────────── */

/**
 * ONE REEL FRAME UNDER ONE BEAT, with its own Replay.
 *
 * ★ THE SHIPPED BEAT IS THE PRODUCTION ATTRIBUTE, VERBATIM, re-keyed to replay.
 * It declares nothing outside its animation, so its rest state is no state,
 * which is precisely the difference the other two are arguing with: watch what
 * each one leaves behind rather than what it does while it runs.
 */
export function BeatStage({ mode, beat }: { mode: Mode; beat: string }) {
  const { runId, replay } = useReplay();
  const w = mode === "desktop" ? 360 : 300;
  return (
    <GroundBox
      ground="app-dark"
      className="overflow-hidden rounded-lg p-4"
      style={{ width: "fit-content" }}
    >
      <div className="flex flex-col gap-2">
        <div className="relative" style={{ width: w }}>
          {beat === "300" ? (
            <div className="relative overflow-hidden rounded-[var(--radius)]">
              <ReelFrame />
              <div
                key={runId}
                aria-hidden
                data-rxp-pubglow
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: "var(--radius)" }}
              />
            </div>
          ) : (
            <>
              <div
                aria-hidden
                className="absolute -inset-20"
                style={beat === "305" ? LEANED : undefined}
              >
                <Glow
                  shape="bloom"
                  runId={runId}
                  vars={{
                    "--glw-base": "0.22",
                    "--glw-strength": "0.72",
                    "--glw-reach": "62%",
                    "--glw-blur": "26px",
                  }}
                />
              </div>
              <div className="relative">
                <ReelFrame />
              </div>
            </>
          )}
        </div>
        <div>
          <ReplayButton runId={runId} onReplay={replay} />
        </div>
      </div>
    </GroundBox>
  );
}

/* ── 5. What lands second ────────────────────────────────────────────────── */

const SECOND: { id: string; name: string; lands: string; needs: string }[] = [
  {
    id: "home-arc",
    name: "The home page's two ends",
    lands:
      "The aurora on two sections: the guest ledger, and the closer above the footer.",
    needs: "The grain tile. A stand-in ships meanwhile.",
  },
  {
    id: "paper",
    name: "Paper",
    lands:
      "The five hues re-declared on the light ground, then the aurora on the paper chapters.",
    needs: "The palette board's paper ramp, in the same merge.",
  },
  {
    id: "features",
    name: "The feature pages",
    lands:
      "The seam on every feature hero with a screen; the throw and the lit face on the plates.",
    needs: "The media kit's feature art: these lights are sampled.",
  },
];

/** The one call that is a plan rather than a picture: three rows, no specimen. */
export function OrderStage() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SECOND.map((s) => (
        <div
          key={s.id}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2.5"
        >
          <p className="text-[12px] font-medium">{s.name}</p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {s.lands}
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            <span className="text-foreground">Needs: </span>
            {s.needs}
          </p>
        </div>
      ))}
    </div>
  );
}
