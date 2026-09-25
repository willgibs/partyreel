"use client";

import "./album-columns.css";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { arrivalPreview } from "./arrival";
import { rhythmPreview } from "./rhythm";
import { ALBUM_COLUMNS } from "./spec";
import { stepsPreview } from "./steps";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the real `rows` layout of
 * the one grid (`MasonryColumns`, `layout="rows"`) over the lab's album, in a
 * real frame at the width the screen knob names. The arrival's options differ
 * only in the board's sheet; the steps' faces really re-lay the album under
 * them; the rhythm's options are the engine's own feature rows.
 */
const PREVIEWS: PreviewsFor<typeof ALBUM_COLUMNS> = {
  "arrival.rise": (s) => arrivalPreview(s, "rise"),
  "arrival.push": (s) => arrivalPreview(s, "push"),
  "arrival.beats": (s) => arrivalPreview(s, "beats"),
  "arrival.snap": (s) => arrivalPreview(s, "snap"),

  "steps.menu": (s) => stepsPreview(s, "menu"),
  "steps.segments": (s) => stepsPreview(s, "segments"),
  "steps.pinch": (s) => stepsPreview(s, "pinch"),
  "steps.both": (s) => stepsPreview(s, "both"),

  "rhythm.plain": (s) => rhythmPreview(s, "plain"),
  "rhythm.double": (s) => rhythmPreview(s, "double"),
  "rhythm.solo": (s) => rhythmPreview(s, "solo"),
};

export function AlbumColumnsBoard() {
  return <ExplorationBoard spec={ALBUM_COLUMNS} previews={PREVIEWS} />;
}
