"use client";

import type { ReactNode } from "react";

import type { HomeContext } from "@/lib/dashboard/home-event";
import type { StageView as Stage } from "@/lib/dashboard/home-view";

import { StageCopy } from "./stage-copy";

/**
 * THE STAGE, WHICHEVER EVENT LEADS IT: production's own stage (`stage-copy.tsx`,
 * copied with slots), drawn from its photographs or, before the first one, lit
 * by its own lamp (`stage=lit`, wired). Every direction of the round draws its
 * control through these slots and nothing else, so the stage under each option
 * is the same stage:
 *  - `eyebrow`: before the phase word, in the stage's first line;
 *  - `overlay`: a layer over the whole band (absolute, placed by its owner);
 *  - `className`: the band's own classes, for a direction's entrance;
 *  - `plateCaption`: words under an empty stage's plate in place of its opened
 *    line (a preview naming the event whose code it is);
 *  - `countWord`: the album count's word after its day (`details`, H6).
 */

export type StageSlots = {
  eyebrow?: ReactNode;
  overlay?: ReactNode;
  className?: string;
  plateCaption?: ReactNode;
  countWord?: string;
};

export function StageView({
  stage,
  ctx,
  ...slots
}: {
  stage: Stage;
  ctx: HomeContext;
} & StageSlots) {
  return (
    <StageCopy
      event={stage.event}
      ctx={ctx}
      guests={stage.guests}
      photos={stage.photos}
      share={stage.share}
      qrToken={stage.event.qrToken}
      {...slots}
    />
  );
}
