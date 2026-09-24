"use client";

import type { CSSProperties } from "react";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import { MasonryColumns } from "@/components/shared/masonry";
import type { BoardState } from "@/components/lab/board-spec";

import { Canvas, Ground } from "./canvas";
import { BIG_SCREEN_W, bigScreenOf, type BigScreen } from "./screens";

export type ScaleOption = "unlimited" | "grows" | "ceiling";

/** The gap `--gap-gallery` resolves to at the tokens' own default (4px tile
 *  radius, so `max(3px, 4px)`) — used only to CHOOSE a floor; the caption
 *  measures the browser's own result, so a drift here costs nothing. */
const GAP = 4;
const EDGE_GUTTER = 40; // px-5 each side

const naturalCols = (w: number, floor: number) =>
  Math.floor((w - EDGE_GUTTER + GAP) / (floor + GAP));

/** Today: one floor, forever. */
const unlimitedFloor = () => 220;

/** The floor steps up past 1920, so the count climbs more slowly and every
 *  column stays a comfortable size (the spec's own numbers: 220 to 1920,
 *  then 260, then 300 beyond 2560). */
const growsFloor = (w: number) => (w <= 1920 ? 220 : w <= 2560 ? 260 : 300);

/** Below 8 natural columns, today's rule exactly; past it, the floor grows to
 *  fill the row at exactly 8, however wide the screen. */
const ceilingFloor = (w: number) => {
  const natural = naturalCols(w, 220);
  if (natural <= 8) return 220;
  const contentW = w - EDGE_GUTTER;
  return (contentW + GAP) / 8 - GAP;
};

const FLOOR: Record<ScaleOption, (w: number) => number> = {
  unlimited: unlimitedFloor,
  grows: growsFloor,
  ceiling: ceilingFloor,
};

export function ScaleShowcase({
  option,
  screen,
}: {
  option: ScaleOption;
  screen: BigScreen;
}) {
  const floor = FLOOR[option](BIG_SCREEN_W[screen]);
  return (
    <Ground>
      <div
        className="px-5"
        style={{ "--album-column": `${floor}px` } as CSSProperties}
      >
        <div className="pointer-events-none" data-lab-specimen>
          <MasonryColumns items={GALLERY_ITEMS} />
        </div>
      </div>
    </Ground>
  );
}

export function scalePreview(state: BoardState, option: ScaleOption) {
  const screen = bigScreenOf(state["big-screen"]);
  const w = BIG_SCREEN_W[screen];
  return (
    <Canvas id={`scale-${option}-${screen}`} w={w} h={820} title={`${option}, ${w}px`}>
      <ScaleShowcase option={option} screen={screen} />
    </Canvas>
  );
}
