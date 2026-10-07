"use client";

import "./brand-marks.css";

import {
  type BoardState,
  ExplorationBoard,
  optionId,
  optionLabel,
  type PreviewsFor,
} from "@/components/lab";

import type { IconId } from "./icon/ring";
import { IconStory } from "./icon/story";
import { screenOf } from "./knobs";
import type { GradeId } from "./palette/grades";
import { GradeStory } from "./palette/story";
import { BRAND_MARKS } from "./spec";
import type { StatusSetId } from "./status/sets";
import { StatusStory } from "./status/story";
import type { WordmarkId } from "./wordmark/candidates";
import { WordStory } from "./wordmark/story";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option drawn whole, first as the mark
 * itself (the word, the icon, the grade's tokens, the status set), then on
 * production's own surfaces wearing it, at a laptop or a phone (the Screen
 * knob), the room and paper side by side.
 */

/** An option's own name off the spec, so a story's lede and the step's head agree. */
const LABEL = (ask: string, option: string) => {
  const found = BRAND_MARKS.asks
    .find((a) => a.id === ask)
    ?.options.find((o) => optionId(o) === option);
  return found ? optionLabel(found) : option;
};

function word(s: BoardState, id: WordmarkId) {
  return (
    <WordStory
      id={id}
      screen={screenOf(s.screen)}
      lede={`${LABEL("wordmark", id)}: the word on both grounds, then signing production's own pages.`}
    />
  );
}

function icon(s: BoardState, id: IconId) {
  return (
    <IconStory
      id={id}
      screen={screenOf(s.screen)}
      lede={`${LABEL("icon", id)}: the icon itself, then on a home screen and among a browser's tabs.`}
    />
  );
}

function grade(s: BoardState, id: GradeId) {
  return (
    <GradeStory
      id={id}
      screen={screenOf(s.screen)}
      lede={`${LABEL("palette", id)}: the grade as its tokens, then production's own pages wearing it.`}
    />
  );
}

function status(s: BoardState, id: StatusSetId) {
  return (
    <StatusStory
      id={id}
      screen={screenOf(s.screen)}
      lede={`${LABEL("status", id)}: the set beside the tally, then a host's night on production's own pieces.`}
    />
  );
}

const PREVIEWS: PreviewsFor<typeof BRAND_MARKS> = {
  "wordmark.finished": (s) => word(s, "finished"),
  "wordmark.nameplate": (s) => word(s, "nameplate"),
  "wordmark.lowercase": (s) => word(s, "lowercase"),
  "icon.ember": (s) => icon(s, "ember"),
  "icon.whole": (s) => icon(s, "whole"),
  "icon.shutter": (s) => icon(s, "shutter"),
  "palette.graphite": (s) => grade(s, "graphite"),
  "palette.black": (s) => grade(s, "black"),
  "palette.warm": (s) => grade(s, "warm"),
  "status.pilot": (s) => status(s, "pilot"),
  "status.ink": (s) => status(s, "ink"),
  "status.amber": (s) => status(s, "amber"),
};

export function BrandMarksBoard() {
  return <ExplorationBoard spec={BRAND_MARKS} previews={PREVIEWS} />;
}
