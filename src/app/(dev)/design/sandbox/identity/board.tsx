"use client";

import type { ReactNode } from "react";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import { ScreenFrames, SpecimenFrames } from "./frames";
import { screenOf, showOf } from "./knobs";
import type { FamilyId } from "./model";
import { IDENTITY } from "./spec";

/**
 * THE PREVIEWS: every option is one family, drawn as its specimen or on the
 * three screens (the Show knob), at 1440 or 375 (the Screen knob). Each frame
 * is the board's scene route wearing the family's stylesheet over
 * production's own components (`frames.tsx`, `scene/`), titled with the
 * option's own name off the spec and captioned with what it read.
 */

/** An option's name off the spec, cut at its colon ("Crystal"). */
const NAME = (family: FamilyId): string => {
  const found = IDENTITY.asks
    .find((a) => a.id === "family")
    ?.options.find((o) => optionId(o) === family);
  return (found ? optionLabel(found) : family).split(":")[0];
};

function preview(family: FamilyId, s: BoardState): ReactNode {
  const w = screenOf(s.screen) === "375" ? 375 : 1440;
  const name = NAME(family);
  return showOf(s.show) === "screens" ? (
    <ScreenFrames family={family} name={name} w={w} />
  ) : (
    <SpecimenFrames family={family} name={name} w={w} />
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY> = {
  "family.today": (s) => preview("today", s),
  "family.editorial": (s) => preview("editorial", s),
  "family.soft": (s) => preview("soft", s),
  "family.crystal": (s) => preview("crystal", s),
  "family.viewfinder": (s) => preview("viewfinder", s),
};

export function IdentityBoard() {
  return <ExplorationBoard spec={IDENTITY} previews={PREVIEWS} />;
}
