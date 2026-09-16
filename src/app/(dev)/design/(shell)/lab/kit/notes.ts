/**
 * THE TOOLBOX, AS DATA (the revamp, 2026-09-16).
 *
 * One row per tool: what it is for, WHEN to reach for it, and the demo the page
 * mounts beside it. The "when" is the half that was missing: an agent arriving
 * with a board to build does not need a catalogue of nouns, it needs to know
 * which tool its evidence wants, and the alternative to answering that here is
 * the alternative the kit exists to end (a board building its own).
 *
 * ★ THIS IS A STAND-IN, AND IT SHOULD NOT SURVIVE. `for` lines belong in
 * `rules/component-notes.ts`, which the collector reads for every indexed
 * component, so the kit would be described in the same place and the same shape
 * as every other component in the library. When `src/components/lab` is in
 * COMPONENT_DIRS and these lines are in COMPONENT_NOTES, delete this file and
 * let the page read the index like every library page does. The `reach` and
 * `demo` halves would move with it.
 */
export type KitPiece = {
  name: string;
  file: string;
  /** What it is for, in this lab. */
  note: string;
  /** When to reach for it, against the tool next to it. */
  reach: string;
  /** The demo component's key in `kit-demos.tsx`, when it can be mounted. */
  demo?: string;
  /** Why there is no demo, when there cannot be one. */
  inert?: string;
};

export const KIT_PIECES: readonly KitPiece[] = [
  {
    name: "BoardPage, defineBoard",
    file: "src/components/lab/board-page.tsx",
    note: "the template every board renders through: the dock, the answer, the index, the sections, the meta, the history, in that fixed order",
    reach:
      "always. A board is a spec and an evidence function; everything above is this.",
    inert: "its specimen is a whole board (/design/lab/palette)",
  },
  {
    name: "Catalog, VerdictPill",
    file: "src/components/lab/catalog.tsx",
    note: "an exploration as a grid of finished ideas, each with its own line, its preview, its facts and the reviewer's verdict row",
    reach:
      "whenever the board is choosing between things. This is the default shape of an exploration, and pnpm new-board scaffolds it.",
    demo: "catalog",
  },
  {
    name: "ItemVerdictRow",
    file: "src/components/lab/item-verdict.tsx",
    note: "keep, refine or kill one item with a note, on the store every review surface shares",
    reach:
      "never directly: the Catalog mounts it on every card. Reach for it only to rule on something that is not a catalog card.",
    demo: "itemVerdict",
  },
  {
    name: "CompareTwo, SpotCompare",
    file: "src/components/lab/compare-two.tsx",
    note: "any two cards side by side from the board's declared A and B, and the same real places drawn under both",
    reach:
      "CompareTwo under every catalog. SpotCompare when one idea is applied in many real places (a voice, a rule) rather than being one object.",
    demo: "compareTwo",
  },
  {
    name: "Compare",
    file: "src/components/lab/compare.tsx",
    note: "two states of one thing, side by side, wiped or stacked; the line saying what differs is required",
    reach:
      "for two states that are not two cards. A difference at the edge of perception wants the wipe; one of position or size wants the stack.",
    demo: "compare",
  },
  {
    name: "Stage, FitStage, GroundBox",
    file: "src/components/lab/stage.tsx",
    note: "a real viewport's pixels on a real ground, 1:1 by default; FitStage takes its height from what it is handed, GroundBox drops the canvas and keeps the ground",
    reach:
      "Stage for anything viewport-shaped, FitStage for a block of arbitrary height, GroundBox inside a catalog cell, where a 1440 canvas would be a picture of one.",
    demo: "stage",
  },
  {
    name: "Frame, FrameRow",
    file: "src/components/lab/frame.tsx",
    note: "the only 1:1 surface the lab has: a same-origin iframe wearing the candidate as an adopted stylesheet, in scroll-locked rows",
    reach:
      "for the real production route, which is the only thing that proves a ruling survives the rest of the page.",
    inert:
      "it loads real pages; mounting one here would load the site into this page",
  },
  {
    name: "Specimen, Cell, Labeled, CellLabel",
    file: "src/components/lab/specimen.tsx",
    note: "the judged thing and the line that names it; a label is never inside the judged area and a stage never goes in a Cell",
    reach:
      "for a row of small things being compared. A Cell holds the thing; a Labeled wraps a stage with its name and note.",
    demo: "specimen",
  },
  {
    name: "SelectTable",
    file: "src/components/lab/select-table.tsx",
    note: "the table that is also the chooser: the numbers and the control that picks between them are one object",
    reach:
      "when the difference between candidates is numbers rather than pictures.",
    demo: "selectTable",
  },
  {
    name: "Loupe",
    file: "src/components/lab/loupe.tsx",
    note: "a magnifier over a copy of the specimen, pixel-snapped, for a difference smaller than the eye at arm's length",
    reach: "for a corner, a hairline, a half-pixel seam.",
    demo: "loupe",
  },
  {
    name: "BoardDock, Knob, Toggle, DockRow",
    file: "src/components/lab/dock.tsx",
    note: "a board's page-wide controls, always on screen, with the shell's reading controls at its right end",
    reach:
      "the template mounts the dock from the declared controls. Reach for Knob and Toggle for a switch that changes ONE section, which stays beside that section.",
    demo: "dock",
  },
  {
    name: "useBoardState, ControlKnobs",
    file: "src/components/lab/board-state.tsx",
    note: "the declared controls, read from the URL rather than mirrored to it, so a link reopens the exact canvas and candidate a note was written about",
    reach:
      "never directly: BoardPage calls it and hands the state to your evidence. Declare the control in the spec instead.",
    inert: "a hook; the dock on any board is the specimen",
  },
  {
    name: "Walk, WalkPages",
    file: "src/components/lab/walk.tsx",
    note: "the board's lookFirst made executable (each step scrolls AND sets the state), and the walk an applied block reaches",
    reach:
      "declare lookFirst in the spec and the dock carries the walk. WalkPages goes under an Apply, for the real routes.",
    demo: "walk",
  },
  {
    name: "ApplyToSite, CostMeter",
    file: "src/components/lab/apply.tsx",
    note: "hands the whole site the exact block a ruling would land, and measures what a candidate costs with everything else on the board hidden",
    reach:
      "Apply when the ruling is a stylesheet. CostMeter when a candidate animates and the question is whether it can ship.",
    demo: "cost",
  },
  {
    name: "Paste, CopyButton",
    file: "src/components/lab/paste.tsx",
    note: "the ruling as a paste, collapsed to its first lines, with one settled copy state everywhere on a board",
    reach: "for the block a ruling lands, and for any line to carry into chat.",
    demo: "paste",
  },
  {
    name: "Notes",
    file: "src/components/lab/notes.tsx",
    note: "the builder's note on a section, carrying the state it was written in, with one press to go there",
    reach:
      "for a note that is only true in one state. Declare it in the spec; the template mounts it under the section.",
    demo: "notes",
  },
  {
    name: "ReviewCard, ReviewQuestions",
    file: "src/components/lab/review-card.tsx",
    note: "the step being answered, pinned under the dock: an ask in plain words, or a catalog counted as its cards are ruled",
    reach:
      "never directly: the route mounts the card when a session names a step on this board, and the template mounts the panel.",
    demo: "reviewCard",
  },
  {
    name: "useComputedTokens, useLineCount",
    file: "src/components/lab/measure.ts",
    note: "every number a board prints, read off the page rather than typed",
    reach:
      "whenever a board states a number. A typed one drifts from the colour beside it within a round.",
    inert: "a hook; every number on the palette board is its specimen",
  },
  {
    name: "useMountOnApproach, useReplay, useMotionState",
    file: "src/components/lab/motion.ts",
    note: "mounts a costly row when the reader is nearly there, and re-runs a one-shot by remount rather than by an animationend listener",
    reach:
      "approach for a heavy section below the fold; replay for anything that plays once.",
    inert: "hooks; the glow boards are the specimen",
  },
  {
    name: "TRAPS",
    file: "src/components/lab/traps.ts",
    note: "every landmine the boards paid for, written down once; the list at the foot of this page is this file",
    reach: "read it before building anything here.",
    inert: "it is the list below",
  },
];
