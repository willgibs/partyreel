"use client";

import type { ReactNode } from "react";

import type { HomeContext } from "@/lib/dashboard/home-event";
import type { StageView as Stage } from "@/lib/dashboard/home-view";

import { LitStage } from "./empty-stage";
import { PhotoStage } from "./photo-stage";

/**
 * THE STAGE, WHICHEVER EVENT LEADS IT: production's stage with its photographs
 * (`photo-stage.tsx`, a copy with slots), or the lit stage of an event with
 * none yet (`empty-stage.tsx`, `stage=lit` as settled). Every direction of the
 * round draws its control through these slots and nothing else, so the stage
 * under each option is the same stage:
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
  ends,
  fresh = false,
  ...slots
}: {
  stage: Stage;
  ctx: HomeContext;
  /** Each ranged event's last day (`event-dates`, drawn as settled). */
  ends: Record<string, string>;
  /** She has just come from Create: the empty stage's lamp ignites once. */
  fresh?: boolean;
} & StageSlots) {
  const event = stage.event;
  if (stage.photos.length === 0)
    return (
      <LitStage
        event={event}
        ctx={ctx}
        share={stage.share}
        end={ends[event.id]}
        fresh={fresh}
        eyebrow={slots.eyebrow}
        overlay={slots.overlay}
        className={slots.className}
        plateCaption={slots.plateCaption}
      />
    );
  return (
    <PhotoStage
      event={event}
      ctx={ctx}
      guests={stage.guests}
      photos={stage.photos}
      share={stage.share}
      qrToken={event.qrToken}
      eyebrow={slots.eyebrow}
      overlay={slots.overlay}
      className={slots.className}
      countWord={slots.countWord}
    />
  );
}
