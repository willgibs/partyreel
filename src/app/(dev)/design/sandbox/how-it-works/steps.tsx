"use client";

import type { BoardState } from "@/components/lab/board-spec";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";

import type { PictureTreatment } from "./picture-treatments";
import { Widths } from "./scene";
import { SpineList } from "./spine-list";
import { pictureTreatmentOf } from "./state";
import { STEP_HEADING, STEP_SET } from "./step-set";

/**
 * THE STEPS: how many moments the walkthrough tells. THE PICTURES carries no
 * `after` against this one (either can be answered first, spec.ts), so this
 * reads THE PICTURES' live pick and falls back to its recommendation
 * ("site") rather than assuming today's bespoke frames.
 */
export type StepsShape = "six" | "five" | "three";

function StepsPage({
  shape,
  treatment,
}: {
  shape: StepsShape;
  treatment: PictureTreatment;
}) {
  return (
    <PaperChapter>
      <SectionShell
        eyebrow="The walkthrough"
        heading={STEP_HEADING[shape]}
        subhead="What you set up as the host and what your guests see, in the order a real event runs."
      >
        <SpineList steps={STEP_SET[shape]} treatment={treatment} />
      </SectionShell>
    </PaperChapter>
  );
}

// Measured against the real rendered frames (PROGRAM.md, "measure every tile
// before it ships"): six's phone column ran 2,968 px against a first guess of
// 5,450, nearly double what six steps of copy and a picture apiece actually
// take at 375 (the two-column desktop layout is what made the first guess run
// long; a phone stacks one column, which is shorter per step, not taller).
const STEPS_H: Record<StepsShape, { d: number; p: number }> = {
  six: { d: 3350, p: 3400 },
  five: { d: 2900, p: 2950 },
  three: { d: 1950, p: 1950 },
};

export function stepsPreview(shape: StepsShape) {
  return function StepsPreview(state: BoardState) {
    const treatment = pictureTreatmentOf(state.pictures);
    return (
      <Widths
        id={`steps-${shape}`}
        ground="paper"
        desktopH={STEPS_H[shape].d}
        phoneH={STEPS_H[shape].p}
        note={`${STEP_SET[shape].length} steps, THE PICTURES' pick (${treatment}) held steady.`}
        render={() => <StepsPage shape={shape} treatment={treatment} />}
      />
    );
  };
}
