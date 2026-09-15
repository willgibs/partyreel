/**
 * THE OLD BOARD SHELL'S PATH, as a re-export shim (the kit round, 2026-09-15).
 *
 * The kit lives at `src/components/lab` now. This file stays only until the
 * last board migrates onto the template, so the boards still on the legacy path
 * keep compiling while they wait their turn in the migration wave; the
 * discipline test (`src/components/lab/kit-discipline.test.ts`) names the boards
 * still allowed to import it, and that list only ever shrinks. When it empties,
 * delete this directory.
 *
 * New code imports `@/components/lab`. Nothing new belongs here; the kit's own
 * BoardMeta derives the panel from a spec, and `board-meta.tsx` beside this file
 * is the hand-written one the unmigrated boards still pass strings to.
 */
export { BoardMeta, type BoardMetaProps } from "./board-meta";
export {
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
} from "@/components/dev/candidate-style";
export {
  type BoardPageContextValue,
  BoardPageProvider,
  type BoardSectionLink,
  useBoardPage,
} from "@/components/lab/board-page-context";
export { BoardDock, Knob } from "@/components/lab/dock";
export {
  getLabPrefs,
  type LabFit,
  type LabPrefs,
  type LabSidebar,
  setLabPref,
  useLabPrefs,
} from "@/components/lab/lab-prefs";
export {
  CANVAS,
  type Ground,
  type Mode,
  Stage,
  useTabHidden,
} from "@/components/lab/stage";
export { Toggle } from "@/components/lab/toggle";
