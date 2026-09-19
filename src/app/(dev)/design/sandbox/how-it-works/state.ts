/**
 * THE BOARD'S LIVE STATE, READ ONCE PER PREVIEW (the pricing-page precedent,
 * `pairOf`/`sizeOf`/`passOf`): coercions from the dock's raw string state to
 * each decision's own option union, defaulting to THAT decision's own
 * recommended answer, never to "today". THE STEPS and THE PICTURES carry no
 * `after` between them (either can be answered first), so each one's preview
 * reads the other's live pick and falls back to its recommendation until it
 * has one; THE PHONE is staged `after` THE PICTURES and reads the same helper.
 */
import type { PictureTreatment } from "./picture-treatments";
import type { StepsShape } from "./steps";

export const stepsShapeOf = (v: string | undefined): StepsShape =>
  v === "five" || v === "three" ? v : "six";

export const pictureTreatmentOf = (v: string | undefined): PictureTreatment =>
  v === "bespoke" || v === "live" ? v : "site";
