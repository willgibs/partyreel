"use client";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { closePreview } from "./close";
import { pairPreview } from "./pair";
import { phonePreview } from "./phone";
import { picturesPreview } from "./pictures";
import { proofPreview } from "./proof";
import { shapePreview } from "./shape";
import { HOW_IT_WORKS } from "./spec";
import { stepsPreview } from "./steps";
import { whoPreview } from "./who";

/**
 * THE PREVIEWS: every option is the real page pieces (`PageHero`,
 * `PaperChapter`, the spine's own layout, `ReelPayoff`, `PricingPointer`,
 * `CtaBand`) or the site's own frame vocabulary, drawn at 1440 and 375 inside
 * a real viewport (`scene.tsx`'s `Widths`), measured rather than asserted.
 * THE STEPS and THE PICTURES read each other's live pick (state.ts); THE
 * SHAPE reads both; THE PHONE, staged after THE PICTURES, reads it the same
 * way its own staging promises.
 */
const PREVIEWS: PreviewsFor<typeof HOW_IT_WORKS> = {
  "pair.split": pairPreview("split"),
  "pair.merged": pairPreview("merged"),
  "pair.renamed": pairPreview("renamed"),

  "who.host": whoPreview("host"),
  "who.guest": whoPreview("guest"),
  "who.planner": whoPreview("planner"),

  "steps.six": stepsPreview("six"),
  "steps.five": stepsPreview("five"),
  "steps.three": stepsPreview("three"),

  "pictures.bespoke": picturesPreview("bespoke"),
  "pictures.site": picturesPreview("site"),
  "pictures.live": picturesPreview("live"),

  "shape.scroll": shapePreview("scroll"),
  "shape.stepper": shapePreview("stepper"),
  "shape.ledger": shapePreview("ledger"),

  "proof.reel": proofPreview("reel"),
  "proof.stats": proofPreview("stats"),
  "proof.demo": proofPreview("demo"),

  "phone.div": phonePreview("div"),
  "phone.frame": phonePreview("frame"),
  "phone.screens": phonePreview("screens"),

  "close.band": closePreview("band"),
  "close.folded": closePreview("folded"),
  "close.demo": closePreview("demo"),
};

export function HowItWorksBoard() {
  return <ExplorationBoard spec={HOW_IT_WORKS} previews={PREVIEWS} />;
}
