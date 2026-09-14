/**
 * THE BOARD SHELL (the review wave, 2026-09-14): the pieces every exploration
 * board in the lab composes, so a board is its candidates and nothing else.
 * Stage (a real viewport on a real ground, zoom-fitted), Toggle (the board's
 * switches), BoardMeta (the question, the candidates, the asks Will rules on).
 */
export { BoardMeta, type BoardMetaProps } from "./board-meta";
export { CANVAS, Stage, useTabHidden, type Ground, type Mode } from "./stage";
export { Toggle } from "./toggle";
