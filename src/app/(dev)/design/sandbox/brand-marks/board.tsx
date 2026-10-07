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
import type { PlateId } from "./palette/grades";
import { PlateStory } from "./palette/story";
import { BRAND_MARKS } from "./spec";
import type { StatusSetId } from "./status/sets";
import { StatusStory } from "./status/story";
import type { WordmarkId } from "./wordmark/candidates";
import { WordStory } from "./wordmark/story";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole, first as the mark
 * itself (the word, the icon, the status set), then on production's own
 * surfaces wearing it, at a laptop or a phone (the Screen knob), the room and
 * paper side by side; the plate is drawn on its surfaces first, its tokens
 * after them.
 */

function word(s: BoardState, id: WordmarkId) {
  return <WordStory id={id} screen={screenOf(s.screen)} />;
}

function icon(s: BoardState, id: IconId) {
  return <IconStory id={id} screen={screenOf(s.screen)} />;
}

function plate(s: BoardState, id: PlateId) {
  return <PlateStory id={id} screen={screenOf(s.screen)} />;
}

function status(s: BoardState, id: StatusSetId) {
  return <StatusStory id={id} screen={screenOf(s.screen)} />;
}

const PREVIEWS: PreviewsFor<typeof BRAND_MARKS> = {
  "wordmark.finished": (s) => word(s, "finished"),
  "wordmark.nameplate": (s) => word(s, "nameplate"),
  "wordmark.lowercase": (s) => word(s, "lowercase"),
  "icon.ember": (s) => icon(s, "ember"),
  "icon.whole": (s) => icon(s, "whole"),
  "icon.shutter": (s) => icon(s, "shutter"),
  "plate.lifted": (s) => plate(s, "lifted"),
  "plate.room": (s) => plate(s, "room"),
  "status.pilot": (s) => status(s, "pilot"),
  "status.ink": (s) => status(s, "ink"),
  "status.amber": (s) => status(s, "amber"),
};

export function BrandMarksBoard() {
  return <ExplorationBoard spec={BRAND_MARKS} previews={PREVIEWS} />;
}
