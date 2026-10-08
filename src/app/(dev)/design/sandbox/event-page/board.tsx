"use client";

import { ExplorationBoard, type PreviewsFor } from "@/components/lab";

import { CORNER } from "./corner";
import { FEATURED } from "./featured";
import { QUIET } from "./quiet";
import { RISE } from "./rise";
import { SKY } from "./sky";
import { EVENT_PAGE } from "./spec";
import { TODAY } from "./today";
import { Whole } from "./whole";

/**
 * THE PREVIEWS, one per whole design: each draws the moment and the side the
 * knobs ask for, in the same frames (`whole.tsx`), from the design's own parts
 * (`today.tsx`, `rise.tsx`, `sky.tsx`, `corner.tsx`, `quiet.tsx`,
 * `featured.tsx`, each a `Kit`). What a frame draws is production's atoms in a
 * design's composition; the stand-ins are the stills, the faces and the counts
 * (`fixtures.ts`), and every press is inert.
 */
const PREVIEWS: PreviewsFor<typeof EVENT_PAGE> = {
  "page.today": (s) => <Whole kit={TODAY} s={s} />,
  "page.rise": (s) => <Whole kit={RISE} s={s} />,
  "page.sky": (s) => <Whole kit={SKY} s={s} />,
  "page.corner": (s) => <Whole kit={CORNER} s={s} />,
  "page.quiet": (s) => <Whole kit={QUIET} s={s} />,
  "page.featured": (s) => <Whole kit={FEATURED} s={s} />,
};

export function EventPageBoard() {
  return <ExplorationBoard spec={EVENT_PAGE} previews={PREVIEWS} />;
}
