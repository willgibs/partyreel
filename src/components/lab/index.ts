/**
 * THE LAB KIT'S FRONT DOOR: what a board's drawings import, and nothing else.
 *
 * A board is one folder, `sandbox/<id>/`: `spec.ts` is `defineExploration`
 * (imported from `@/components/lab/exploration`, which is pure data, because a
 * server page and a node test read every spec), and `board.tsx` renders
 * `ExplorationBoard` with a preview per option. Everything a preview draws
 * with comes through here. The rest of `src/components/lab/` is the machinery
 * those two ride on (the template, the dock, the step, the walk, the review's
 * store), which the lab's own pages import by module and a board never touches.
 *
 * ★ TRIMMED TO WHAT THE BOARDS USE (the lab revamp, 2026-09-29). This file
 * exported a hundred names for the page-shaped board the question-first
 * exploration replaced, and a lane's brief spent words on them; every name
 * below is one a standing board imports. `kit-discipline.test.ts` refuses a
 * board that reaches past these two doors, so a piece a new board needs
 * arrives here, in the open, with its row on `/design/lab/kit`.
 *
 * ★ NOTHING OUTSIDE THE LAB MAY IMPORT THIS (boundary.test.ts). The kit is a
 * review instrument, not a component library: it reaches into
 * `getComputedStyle`, writes into iframe documents and hands a frame a
 * candidate stylesheet, so a product page importing any of it would ship a dev
 * tool to a guest. The arrow points the other way: the kit imports production
 * components so a board can judge the real thing.
 */

/* The board: its page, and the preview map it owes (typed exhaustively) */
export { ExplorationBoard } from "./exploration-board";
export type { PreviewsFor } from "./exploration";

/* Reading the board's state inside a preview */
export {
  type BoardState,
  optionId,
  optionLabel,
  optionMeans,
} from "./board-spec";

/* What a preview draws on: a real viewport, fitted and measured */
export { Frame } from "./frame";
export { Fit, Measured } from "./scene";
export { CANVAS, type Mode } from "./stage";

/* A board's own dock cluster wears the dock's pill */
export { DOCK_PILL } from "./dock";
