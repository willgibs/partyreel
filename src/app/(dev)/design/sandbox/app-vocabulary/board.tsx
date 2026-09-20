"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  PillsOption,
  RowOption,
  SheetOption,
  ViewMenuOption,
} from "./controls-home";
import { APP_VOCABULARY } from "./spec";
import { Scene, widthOf } from "./scene";

/**
 * THE PREVIEWS, and nothing else: one real surface per option, redrawn at
 * whichever width the shared dock knob is on (`s.width`). Every function
 * here is a thin `Scene` wrapper over the real composition in
 * `controls-home.tsx`; nothing is built here that is not already a named
 * export there.
 */

/** Every number measured off the frame's own root: does the controls row
 *  wrap or overflow at this width (round one's own `measureFit`, unchanged
 *  in spirit). `pills` carries two rows; this reads the first (at rest),
 *  which is the tighter of its two states. */
function measureRow(root: HTMLElement): string {
  const el = root.querySelector<HTMLElement>("[data-controls-row]");
  if (!el) return "measuring";
  const over = el.scrollWidth > el.clientWidth + 1;
  return over
    ? `overflows: ${el.scrollWidth}px of controls in ${el.clientWidth}px`
    : `fits: ${el.scrollWidth}px in ${el.clientWidth}px`;
}

const controlsHome = (
  s: BoardState,
  option: "row" | "view-menu" | "sheet" | "pills",
) => {
  const width = widthOf(s.width);
  return (
    <Scene
      id={`ch-${option}`}
      width={width}
      title="Where the controls live"
      tall
      measure={measureRow}
    >
      {option === "row" && <RowOption />}
      {option === "view-menu" && <ViewMenuOption />}
      {option === "sheet" && <SheetOption width={width} />}
      {option === "pills" && <PillsOption />}
    </Scene>
  );
};

const PREVIEWS: PreviewsFor<typeof APP_VOCABULARY> = {
  "controls-home.row": (s) => controlsHome(s, "row"),
  "controls-home.view-menu": (s) => controlsHome(s, "view-menu"),
  "controls-home.sheet": (s) => controlsHome(s, "sheet"),
  "controls-home.pills": (s) => controlsHome(s, "pills"),
};

export function AppVocabularyBoard() {
  return <ExplorationBoard spec={APP_VOCABULARY} previews={PREVIEWS} />;
}
