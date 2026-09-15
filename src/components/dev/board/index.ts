/**
 * THE BOARD SHELL (the review wave, 2026-09-14): the pieces every exploration
 * board in the lab composes, so a board is its candidates and nothing else.
 * Stage (a real viewport on a real ground, 1:1 by default), Toggle (the
 * board's switches), BoardDock (the page-wide switches, always on screen),
 * BoardMeta (the question, the candidates, the asks Will rules on).
 */
export { BoardMeta, type BoardMetaProps } from "./board-meta";
export { BoardDock } from "./dock";
export {
  getLabPrefs,
  type LabFit,
  type LabPrefs,
  setLabPref,
  useLabPrefs,
} from "./lab-prefs";
export { CANVAS, Stage, useTabHidden, type Ground, type Mode } from "./stage";
export { Toggle } from "./toggle";
// A board offers "Apply to the site": its candidate block, as the paste the
// ruling would land, rendered on every page with a tuner island.
export {
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
} from "../candidate-style";
