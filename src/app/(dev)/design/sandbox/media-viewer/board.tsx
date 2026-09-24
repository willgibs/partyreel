"use client";

import "./media-viewer.css";

import { type ReactNode, useState } from "react";

import { ExplorationBoard, Fit, Frame, Measured } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { MINE_IDS } from "./fixtures";
import { AlbumPage, SCREENS, type ScreenId, screenOf } from "./page-parts";
import { MEDIA_VIEWER } from "./spec";

/**
 * ROUND TWO: ONE ASK, `mine`, AND NOTHING ELSE. Round one's eight decisions
 * are answered (`docs/reviews/media-viewer.json`) and landing on the real
 * component via `media-viewer-wiring` at the same time as this round, so this
 * file no longer draws them — their own preview code stands, unimported, in
 * `board-r1.tsx` (the desk re-cut, `site-chrome`'s own precedent). What
 * follows is `mine` alone: the own-item mark's shape and place on the grid,
 * over the same twenty-six item wedding, at 375 with 1440 on the knob.
 *
 * The mark's own tap-to-filter mechanics, and the standing "Yours (N)" control
 * `live-gallery.tsx` already carries, are unmoved: every option here changes
 * only what a marked tile looks like at rest, never how the filter is reached.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;

/** Which of the four treatments actually rendered, read off the grid rather
 *  than asserted: a corner glyph, a ring, or neither. */
const measureMine: Reader = (root) => {
  const mine = root.querySelectorAll("[data-mv-mine]").length;
  if (!mine) return null;
  const glyphed = root.querySelectorAll(
    '[data-mv-mine="dot"], [data-mv-mine="label"]',
  ).length;
  const ringed = root.querySelectorAll('[data-mv-mine="ring"]').length;
  if (glyphed)
    return `Measured: ${glyphed} of this guest's ${mine} own tiles carry a corner mark.`;
  if (ringed)
    return `Measured: ${ringed} of this guest's ${mine} own tiles wear a ring, no corner glyph at all.`;
  return `Measured: ${mine} of this guest's own tiles carry no mark on the grid at all.`;
};

function Scene({
  id,
  screen,
  measure,
  children,
}: {
  id: string;
  screen: ScreenId;
  measure: Reader;
  children: ReactNode;
}) {
  const { w, h, name } = SCREENS[screen];
  const [said, setSaid] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`mine-${id}-${screen}`}
        w={w}
        h={h}
        title={`The own-item mark, ${name}`}
        caption={said}
      >
        <Measured probe={measure} deps={[screen, id]} onMeasure={setSaid}>
          {children}
        </Measured>
      </Frame>
    </Fit>
  );
}

const screenFor = (s: BoardState): ScreenId => screenOf(s.screen);

function mineScreen(style: "dot" | "label" | "ring" | "none", s: BoardState) {
  const screen = screenFor(s);
  return (
    <Scene id={style} screen={screen} measure={measureMine}>
      <AlbumPage
        screen={screen}
        scrolled={false}
        mineIds={MINE_IDS}
        mineStyle={style}
      />
    </Scene>
  );
}

const PREVIEWS: PreviewsFor<typeof MEDIA_VIEWER> = {
  "mine.dot": (s) => mineScreen("dot", s),
  "mine.label": (s) => mineScreen("label", s),
  "mine.ring": (s) => mineScreen("ring", s),
  "mine.none": (s) => mineScreen("none", s),
};

export function MediaViewerBoard() {
  return <ExplorationBoard spec={MEDIA_VIEWER} previews={PREVIEWS} />;
}
