"use client";

import "./brand-marks.css";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import type { IconId } from "./icon/ring";
import { IconStory } from "./icon/story";
import { screenOf } from "./knobs";
import { BRAND_MARKS } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each take drawn whole, the brief's reads in
 * its order (`icon/story.tsx`), at a laptop's layout or a phone's (the Screen
 * knob) where a frame is a page rather than a phone.
 */

function icon(s: BoardState, id: IconId) {
  return <IconStory id={id} screen={screenOf(s.screen)} />;
}

const PREVIEWS: PreviewsFor<typeof BRAND_MARKS> = {
  "icon.ember": (s) => icon(s, "ember"),
  "icon.mirrorball": (s) => icon(s, "mirrorball"),
  "icon.sparkler": (s) => icon(s, "sparkler"),
  "icon.reel": (s) => icon(s, "reel"),
};

export function BrandMarksBoard() {
  return <ExplorationBoard spec={BRAND_MARKS} previews={PREVIEWS} />;
}
