/**
 * THE LAB KIT (the Library x Lab round, 2026-09-15): everything a board would
 * otherwise rebuild, in one home.
 *
 * A board is TWO files and nothing else: `sandbox/<id>/spec.ts`, which is pure
 * data, and `sandbox/<id>/board.tsx`, which is the evidence as a function of the
 * declared state. Everything between those two and the screen is here: the
 * template that renders a spec answer-first, the dock that carries the declared
 * controls, the true-viewport frame, the compare, the specimen furniture, the
 * measurements, the apply, the walk and the review's step.
 *
 * ★ NOTHING OUTSIDE THE LAB MAY IMPORT THIS (boundary.test.ts). The kit is a
 * review instrument, not a component library: it reaches into `getComputedStyle`,
 * writes into iframe documents, and hands the whole site a candidate stylesheet.
 * A product page importing any of it would be a dev tool shipped to a guest. The
 * arrow points the other way: the kit imports production components so a board
 * can judge the real thing.
 *
 * The traps every one of these mechanisms exists to prevent are in `traps.ts`,
 * written down once and rendered on `/design/lab/kit`.
 */

/* The board, as data */
export {
  anchorFor,
  type Ask,
  type AskAfter,
  type AskOption,
  type Asset,
  type BoardLinks,
  type BoardSpec,
  type BoardState,
  type BuilderVerdict,
  type Candidate,
  type CatalogSpec,
  type Control,
  type Departure,
  defineBoard,
  ITEM_VERDICTS,
  type ItemVerdict,
  LIBRARY_VERDICTS,
  type LibraryVerdict,
  LIMITS,
  type LookFirst,
  type Note,
  type Round,
  type Section,
  type SectionIdOf,
  type Verdict,
  type WalkPage,
} from "./board-spec";

/* An exploration: the questions in, an ordinary board out (2026-09-17) */
export {
  type Decision,
  type DecisionOption,
  defineExploration,
  type ExplorationInput,
  type PreviewKey,
} from "./exploration";
export { ExplorationBoard } from "./exploration-board";

/* The template and its furniture */
export { Answer, BoardMeta, BoardSection } from "./answer";
export { type BoardApi, BoardPage } from "./board-page";
export {
  type BoardPageContextValue,
  BoardPageProvider,
  type BoardReview,
  type BoardSectionLink,
  useBoardPage,
} from "./board-page-context";
export { ControlKnobs, RESERVED_PARAMS, useBoardState } from "./board-state";

/* The dock */
export {
  AppliedBadge,
  BoardDock,
  DOCK_PILL,
  DockRow,
  Knob,
  MotionToggle,
  ReplayButton,
} from "./dock";
export {
  getLabPrefs,
  type LabFit,
  type LabPrefs,
  type LabSidebar,
  setLabPref,
  useLabPrefs,
} from "./lab-prefs";
export { Toggle } from "./toggle";

/* The surfaces a candidate is judged on */
export {
  CANVAS,
  FitStage,
  type Ground,
  GroundBox,
  type Mode,
  Stage,
  useTabHidden,
} from "./stage";
export {
  Frame,
  type FrameProps,
  FrameRow,
  labScenePath,
  useFrameLock,
} from "./frame";
export { Compare, type CompareMode } from "./compare";
export { comparePair, CompareTwo, type Spot, SpotCompare } from "./compare-two";
export {
  Catalog,
  type CatalogRenderArgs,
  CatalogTiles,
  type CatalogTilesMode,
  VerdictPill,
} from "./catalog";
export { BeforeAfter } from "./before-after";
export { Cell, CellLabel, Labeled, Specimen } from "./specimen";
export { ConceptCard } from "./concept-card";
export { SelectTable } from "./select-table";
export { Loupe } from "./loupe";
export { TrueFit } from "./true-fit";

/* What a board measures, states and hands the site */
export { useComputedTokens, useLineCount } from "./measure";
export { CostMeter, type CostPhase } from "./cost-meter";
export { type ApplyBlock, ApplyToSite } from "./apply";
export { useMountOnApproach } from "./approach";
export { useMotionState, useReplay } from "./motion";
export { CopyButton, Paste } from "./paste";
export { Notes } from "./notes";

/* The review */
export { CARD_PARAM, Step, type StepBoard } from "./step";
export { ItemVerdictRow } from "./item-verdict";
export { scrollToSection, useDesignKey, Walk, WalkPages } from "./walk";

/* The traps, documented once */
export { TRAPS, type Trap } from "./traps";
