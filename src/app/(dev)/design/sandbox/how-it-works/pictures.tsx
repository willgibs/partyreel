"use client";

import type { BoardState } from "@/components/lab/board-spec";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";

import type { PictureTreatment } from "./picture-treatments";
import { Widths } from "./scene";
import { SpineList } from "./spine-list";
import { stepsShapeOf } from "./state";
import { STEP_HEADING, STEP_SET } from "./step-set";
import type { StepsShape } from "./steps";

/**
 * THE PICTURES: what a step's frame looks like. THE STEPS carries no `after`
 * against this one, so this reads THE STEPS' live pick and falls back to its
 * recommendation ("six") rather than assuming today's step count.
 */
function PicturesPage({
  treatment,
  stepsShape,
}: {
  treatment: PictureTreatment;
  stepsShape: StepsShape;
}) {
  return (
    <PaperChapter>
      <SectionShell
        eyebrow="The walkthrough"
        heading={STEP_HEADING[stepsShape]}
        subhead="What you set up as the host and what your guests see, in the order a real event runs."
      >
        <SpineList steps={STEP_SET[stepsShape]} treatment={treatment} />
      </SectionShell>
    </PaperChapter>
  );
}

// Measured against the real rendered frames (PROGRAM.md, "measure every tile
// before it ships"): "site" at six steps ran 2,968 px of phone against a
// first guess of 5,450 (the desktop two-column layout is what runs long, not
// the phone's single stacked column); "live" measured 2,528 at 1440 against a
// first guess of 3,450, comfortably inside it.
const PICTURES_H: Record<PictureTreatment, { d: number; p: number }> = {
  bespoke: { d: 3350, p: 3400 },
  site: { d: 3350, p: 3400 },
  live: { d: 3450, p: 3500 },
};

const NOTE: Record<PictureTreatment, string> = {
  bespoke:
    "FrameCard quotes, as today; step three alone wears a real BrowserFrame.",
  site: "PhoneFrame, QrFrame, AlbumFrame, GalleryFrame and ReelFrame: the same six /features already draws with.",
  live: "The wizard mid-name and the real QR; the album mid-fill; the rest keep the site's own frame.",
};

export function picturesPreview(treatment: PictureTreatment) {
  return function PicturesPreview(state: BoardState) {
    const stepsShape = stepsShapeOf(state.steps);
    return (
      <Widths
        id={`pictures-${treatment}`}
        ground="paper"
        desktopH={PICTURES_H[treatment].d}
        phoneH={PICTURES_H[treatment].p}
        note={NOTE[treatment]}
        render={() => (
          <PicturesPage treatment={treatment} stepsShape={stepsShape} />
        )}
      />
    );
  };
}
