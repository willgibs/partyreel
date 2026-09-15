/**
 * THE BOARD SHELL (the review wave, 2026-09-14): the pieces every exploration
 * board in the lab composes, so a board is its candidates and nothing else.
 * Stage (a real viewport on a real ground, zoom-fitted), Toggle (the board's
 * switches), BoardMeta (the question, the candidates, the asks Will rules on).
 */
export { BoardMeta, type BoardMetaProps } from "./board-meta";
export { CANVAS, Stage, useTabHidden, type Ground, type Mode } from "./stage";
export { Toggle } from "./toggle";
// A board offers "Apply to the site": its candidate block, as the paste the
// ruling would land, rendered on every page with a tuner island.
export {
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
} from "../candidate-style";
