/**
 * WHAT EACH KIT PIECE IS FOR, one line each.
 *
 * ★ THIS IS A STAND-IN, AND IT SHOULD NOT SURVIVE. `for` lines belong in
 * `rules/component-notes.ts`, which the collector reads for every indexed
 * component, so the kit would be described in the same place and the same shape
 * as every other component in the library. That file and the collector's
 * COMPONENT_DIRS are two other tracks' lanes, so the lab-kit track asks for both
 * in its Handoff and keeps this map meanwhile. When `src/components/lab` is in
 * COMPONENT_DIRS and these lines are in COMPONENT_NOTES, delete this file and
 * let the page read the index like every library page does.
 */
export type KitPiece = { name: string; file: string; note: string };

export const KIT_PIECES: readonly KitPiece[] = [
  {
    name: "BoardPage",
    file: "src/components/lab/board-page.tsx",
    note: "the template every board renders through: the dock, the answer, the index, the sections, the meta, the history, in that fixed order",
  },
  {
    name: "defineBoard",
    file: "src/components/lab/board-spec.ts",
    note: "what a board IS as data; the density limits registry.test.ts pins live here too",
  },
  {
    name: "useBoardState",
    file: "src/components/lab/board-state.tsx",
    note: "the declared controls, read from the URL rather than mirrored to it, so a link reopens the exact canvas and candidate a note was written about",
  },
  {
    name: "BoardDock",
    file: "src/components/lab/dock.tsx",
    note: "a board's page-wide controls, always on screen, with the shell's reading controls at its right end",
  },
  {
    name: "Knob, DockRow, AppliedBadge, ReplayButton, MotionToggle",
    file: "src/components/lab/dock.tsx",
    note: "the dock's atoms: a named control, a row of them, what stands on the site, the one-shot runner, live or rest",
  },
  {
    name: "Stage, FitStage",
    file: "src/components/lab/stage.tsx",
    note: "a real viewport's pixels on a real ground, 1:1 by default; FitStage takes its height from what it is handed",
  },
  {
    name: "Frame, FrameRow",
    file: "src/components/lab/frame.tsx",
    note: "the only 1:1 surface the lab has: a same-origin iframe wearing the candidate as an adopted stylesheet, in scroll-locked rows",
  },
  {
    name: "Compare",
    file: "src/components/lab/compare.tsx",
    note: "two states of one thing, side by side, wiped or stacked; the line saying what differs is required",
  },
  {
    name: "Specimen, Cell, Labeled, CellLabel",
    file: "src/components/lab/specimen.tsx",
    note: "the judged thing and the line that names it; a label is never inside the judged area and a stage never goes in a Cell",
  },
  {
    name: "ConceptCard",
    file: "src/components/lab/concept-card.tsx",
    note: "a candidate as the thing it proposes, with its copy at its real weight and its departures on the card",
  },
  {
    name: "SelectTable",
    file: "src/components/lab/select-table.tsx",
    note: "the table that is also the chooser: the numbers and the control that picks between them are one object",
  },
  {
    name: "Loupe",
    file: "src/components/lab/loupe.tsx",
    note: "a magnifier over a copy of the specimen, pixel-snapped, for a difference smaller than the eye at arm's length",
  },
  {
    name: "useComputedTokens, useLineCount",
    file: "src/components/lab/measure.ts",
    note: "every number a board prints, read off the page rather than typed; a derived step is probed with a real element because its token is empty at runtime",
  },
  {
    name: "CostMeter",
    file: "src/components/lab/cost-meter.tsx",
    note: "what a candidate costs, measured with every other animated thing on the board hidden, reporting what a frame gap cannot see",
  },
  {
    name: "ApplyToSite",
    file: "src/components/lab/apply.tsx",
    note: "hands the whole site the exact block a ruling would land; a radio across the board, never a checkbox on each candidate",
  },
  {
    name: "Paste, CopyButton",
    file: "src/components/lab/paste.tsx",
    note: "the ruling as a paste, collapsed to its first lines, with one settled copy state everywhere on a board",
  },
  {
    name: "Walk, WalkPages, useDesignKey",
    file: "src/components/lab/walk.tsx",
    note: "the board's lookFirst made executable (each step scrolls AND sets the state), the walk an applied block reaches, and the gate key with its three meanings",
  },
  {
    name: "ReviewQuestions",
    file: "src/components/lab/review.tsx",
    note: "the asks as pills and a note a piece, composing one ledger line to paste into chat; the lab never writes the repo",
  },
  {
    name: "Notes",
    file: "src/components/lab/notes.tsx",
    note: "the builder's note on a section, carrying the state it was written in, with one press to go there",
  },
  {
    name: "useReplay, useMotionState",
    file: "src/components/lab/motion.ts",
    note: "a one-shot runs again by remount, never by an animationend listener; rest is an attribute the board's own sheet reads",
  },
  {
    name: "useMountOnApproach",
    file: "src/components/lab/approach.ts",
    note: "mounts a costly row when the reader is nearly there, and never unmounts it again",
  },
  {
    name: "TRAPS",
    file: "src/components/lab/traps.ts",
    note: "every landmine the boards paid for, written down once; the list below is this file",
  },
];
