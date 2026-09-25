"use client";

import "./media-viewer.css";

import { useState } from "react";

import { ExplorationBoard, Fit, Frame, Measured } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { groundOf, type Mark, MineAlbum, SCREENS, screenOf } from "./album";
import { BURST } from "./fixtures";
import { MEDIA_VIEWER } from "./spec";

/**
 * ROUND THREE: `mine` AGAIN, AND NOTHING ELSE. Every option is the same album
 * at the same screen and ground with one thing changed, what her own tiles
 * wear; the album, the rows and the burst are `album.tsx`'s and
 * `fixtures.ts`'s, the marks are `media-viewer.css`.
 *
 * ★ EVERY CAPTION IS READ OFF THE FRAME (the lab's rule). The rows are
 * grouped by where each tile really sits, her runs by which of hers stand
 * side by side in a row, and what each mark drew by its computed style, so the
 * words under a picture are the browser's answer, never this file's claim.
 */

type Reader = (root: HTMLElement, win: Window) => string | null;

/** Her runs, row by row, as the browser laid them: the length of each run of
 *  her tiles standing side by side in one row, head first. */
function readRuns(root: HTMLElement): {
  runs: number[];
  marks: HTMLElement[];
  gutter: number | null;
} | null {
  const grid = root.querySelector("[data-album-grid]");
  if (!grid) return null;
  const tiles = [
    ...grid.querySelectorAll<HTMLElement>(":scope > [data-rows-key]"),
  ];
  if (tiles.length === 0) return null;
  const rows = new Map<number, HTMLElement[]>();
  for (const t of tiles) {
    const row = rows.get(t.offsetTop) ?? [];
    row.push(t);
    rows.set(t.offsetTop, row);
  }
  const runs: number[] = [];
  let gutter: number | null = null;
  for (const [, row] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    let len = 0;
    row.forEach((t, i) => {
      if (!t.hasAttribute("data-mv-mine")) {
        if (len) runs.push(len);
        len = 0;
        return;
      }
      len++;
      // The gutter between two of hers, measured where it matters.
      const prev = row[i - 1];
      if (prev?.hasAttribute("data-mv-mine") && gutter === null)
        gutter =
          t.getBoundingClientRect().left - prev.getBoundingClientRect().right;
    });
    if (len) runs.push(len);
  }
  const marks = [...grid.querySelectorAll<HTMLElement>("[data-mv-mark]")];
  return { runs, marks, gutter };
}

/** How the pick of five fell into rows: "2, 2 and 1". */
function burstRows(runs: number[]): string {
  const head: number[] = [];
  let left = BURST;
  for (const r of runs) {
    if (left <= 0) break;
    head.push(Math.min(r, left));
    left -= r;
  }
  if (head.length === 1) return `all ${head[0]} in one row`;
  return `${head.slice(0, -1).join(", ")} and ${head[head.length - 1]} across ${head.length} rows`;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

const measureFor =
  (mark: Mark): Reader =>
  (root, win) => {
    const read = readRuns(root);
    if (!read || read.marks.length === 0) return null;
    const { runs, marks, gutter } = read;
    const mine = marks.length;
    const pick = `the pick of five falls ${burstRows(runs)}`;
    const gap = gutter === null ? "" : `, ${Math.round(gutter)}px apart`;
    if (mark === "none") {
      const drawn = marks.filter(
        (m) => win.getComputedStyle(m).display !== "none",
      ).length;
      const yours =
        root.querySelector('[data-mv-option="mine"]')?.textContent ?? "";
      if (!yours) return null;
      return `Measured: ${drawn} of her ${mine} tiles carry a mark; View's Showing offers "${yours}". Here ${pick}.`;
    }
    if (mark === "inset") {
      const rings = marks.filter(
        (m) => win.getComputedStyle(m).boxShadow !== "none",
      ).length;
      return `Measured: ${rings} rings on her ${mine} tiles, each inside its own edge; ${pick}, neighbours ring to ring${gap}.`;
    }
    // A run's first tile is the one that draws its left end.
    const starts = marks.filter(
      (m) => win.getComputedStyle(m).getPropertyValue("--mv-l").trim() === "1",
    ).length;
    // A bridge is a mark whose right edge really meets the next tile's left
    // edge across the gutter, read off both boxes.
    const bridged = marks.filter((m) => {
      const next = m.parentElement?.nextElementSibling;
      if (!next?.hasAttribute("data-mv-mine")) return false;
      const gap =
        next.getBoundingClientRect().left - m.getBoundingClientRect().right;
      return Math.abs(gap) < 0.75;
    }).length;
    const what =
      mark === "run"
        ? plural(starts, "outline", "outlines")
        : plural(starts, "underline", "underlines");
    return `Measured: her ${mine} tiles drawn as ${what}, one per run in a row (${runs.join(", ")}), bridging ${plural(bridged, "gutter", "gutters")}; ${pick}.`;
  };

const TITLE: Record<Mark, string> = {
  inset: "A ring inside each tile",
  run: "One outline round each run",
  baseline: "An underline under each run",
  none: "Nothing on the tiles",
};

function Scene({ mark, state }: { mark: Mark; state: BoardState }) {
  const screen = screenOf(state.screen);
  const ground = groundOf(state.ground);
  const { w, h, name } = SCREENS[screen];
  const [said, setSaid] = useState("measuring");
  return (
    <Fit w={w}>
      <Frame
        id={`mine-${mark}-${screen}-${ground}`}
        w={w}
        h={h}
        title={`${TITLE[mark]}, ${name}, ${ground}`}
        caption={said}
      >
        <Measured
          probe={measureFor(mark)}
          deps={[mark, screen, ground]}
          onMeasure={setSaid}
        >
          <MineAlbum screen={screen} ground={ground} mark={mark} />
        </Measured>
      </Frame>
    </Fit>
  );
}

const PREVIEWS: PreviewsFor<typeof MEDIA_VIEWER> = {
  "mine.inset": (s) => <Scene mark="inset" state={s} />,
  "mine.run": (s) => <Scene mark="run" state={s} />,
  "mine.baseline": (s) => <Scene mark="baseline" state={s} />,
  "mine.none": (s) => <Scene mark="none" state={s} />,
};

export function MediaViewerBoard() {
  return <ExplorationBoard spec={MEDIA_VIEWER} previews={PREVIEWS} />;
}
