"use client";

import { type CSSProperties } from "react";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import { MasonryColumns } from "@/components/shared/masonry";
import type { BoardState } from "@/components/lab/board-spec";
import { MAX_SANE_RATIO, MIN_SANE_RATIO } from "@/lib/media/tile-aspect";

import { Canvas, Ground } from "./canvas";
import {
  layoutScreenOf,
  LAYOUT_SCREEN_W,
  layoutSizeOf,
} from "./screens";

export type LayoutOption = "masonry" | "justified" | "uniform" | "mosaic";

const GAP = 4;
const EDGE_GUTTER = 40; // px-5 each side, same as every other surface

function ratioOf(item: GridMedia): number {
  if (!item.width || !item.height) return 1;
  const r = item.width / item.height;
  if (!Number.isFinite(r) || r <= 0) return 1;
  return Math.min(MAX_SANE_RATIO, Math.max(MIN_SANE_RATIO, r));
}

/**
 * THE JUSTIFIED-ROWS PACK (Flickr's and Google Photos' own algorithm, NOT
 * WIRED — masonry.tsx has no row-based layout today). Every photo keeps its
 * own ratio and is never cropped; a row fills until the next photo would
 * overshoot the container, then STRETCHES to the container's exact width by
 * scaling every photo in it by the same factor, which is what makes the
 * right edge line up. The last row is left at the target height, unstretched
 * (a single leftover photo blown up to fill the row would read as an error).
 */
function justifiedRows(
  items: GridMedia[],
  containerW: number,
  targetH: number,
): { items: GridMedia[]; height: number }[] {
  const rows: { items: GridMedia[]; height: number }[] = [];
  let row: GridMedia[] = [];
  let sumRatios = 0;
  for (const item of items) {
    const ratio = ratioOf(item);
    const nextSum = sumRatios + ratio;
    const gaps = row.length * GAP;
    const widthIfAdded = nextSum * targetH + gaps;
    if (row.length > 0 && widthIfAdded > containerW) {
      const doneGaps = (row.length - 1) * GAP;
      const scale = (containerW - doneGaps) / (sumRatios * targetH);
      rows.push({ items: row, height: targetH * scale });
      row = [item];
      sumRatios = ratio;
    } else {
      row.push(item);
      sumRatios = nextSum;
    }
  }
  if (row.length) rows.push({ items: row, height: targetH });
  return rows;
}

function JustifiedGrid({
  items,
  containerW,
  targetH,
}: {
  items: GridMedia[];
  containerW: number;
  targetH: number;
}) {
  const rows = justifiedRows(items, containerW, targetH);
  return (
    <div data-album-grid className="flex flex-col gap-[var(--gap-gallery)]">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex gap-[var(--gap-gallery)]"
          style={{ height: row.height }}
        >
          {row.items.map((item) => (
            <div
              key={item.id}
              className="shrink-0 overflow-hidden bg-black/10"
              style={{
                width: ratioOf(item) * row.height,
                borderRadius: "var(--radius-tile)",
              }}
            >
              <MediaTile item={item} playBadge="none" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * THE MOSAIC (NOT WIRED): the three most-liked photographs span a 2x2 cell,
 * `grid-auto-flow: dense` fills every gap around them. The one layout here
 * that gives some of a guest's photographs more room than others, and the
 * only one that crops (a spanned cell has no one natural ratio to keep).
 */
function MosaicGrid({ items, base }: { items: GridMedia[]; base: number }) {
  const featured = new Set(
    [...items]
      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
      .slice(0, 3)
      .map((i) => i.id),
  );
  return (
    <div
      data-album-grid
      className="grid"
      style={
        {
          gridTemplateColumns: `repeat(auto-fill, minmax(${base}px, 1fr))`,
          gridAutoRows: `${base}px`,
          gridAutoFlow: "dense",
          gap: "var(--gap-gallery)",
        } as CSSProperties
      }
    >
      {items.map((item) => {
        const big = featured.has(item.id);
        return (
          <div
            key={item.id}
            className="overflow-hidden bg-black/10"
            style={{
              gridColumn: big ? "span 2" : "span 1",
              gridRow: big ? "span 2" : "span 1",
              borderRadius: "var(--radius-tile)",
            }}
          >
            <MediaTile item={item} playBadge="none" />
          </div>
        );
      })}
    </div>
  );
}

export function LayoutShowcase({
  option,
  w,
  size,
}: {
  option: LayoutOption;
  w: number;
  size: number;
}) {
  const items = GALLERY_ITEMS.slice(0, 14);
  const containerW = w - EDGE_GUTTER;
  return (
    <Ground>
      <div
        className="px-5"
        style={{ "--album-column": `${size}px` } as CSSProperties}
      >
        <div className="pointer-events-none" data-lab-specimen>
          {option === "masonry" && <MasonryColumns items={items} />}
          {option === "uniform" && (
            <MasonryColumns items={items} layout="uniform" />
          )}
          {option === "justified" && (
            <JustifiedGrid items={items} containerW={containerW} targetH={size} />
          )}
          {option === "mosaic" && <MosaicGrid items={items} base={size} />}
        </div>
      </div>
    </Ground>
  );
}

/** justified's row height is the one number here that is not a column count
 *  read off the box: masonry, uniform and the mosaic base all solve the same
 *  "columns of at least this width" formula `columnsFor` measures, but a
 *  justified row's own width is decided by its photographs, not the reverse. */
export function layoutPreview(state: BoardState, option: LayoutOption) {
  const screen = layoutScreenOf(state["layout-screen"]);
  const size = layoutSizeOf(state["layout-size"]);
  const w = LAYOUT_SCREEN_W[screen];
  return (
    <Canvas
      id={`layout-${option}-${screen}-${size}`}
      w={w}
      h={screen === "375" ? 820 : 780}
      title={`${option}, ${w}px`}
      caption={option === "justified" ? `${size}px row height, target` : undefined}
    >
      <LayoutShowcase option={option} w={w} size={size} />
    </Canvas>
  );
}
