"use client";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import type { GridMedia } from "@/components/app/media-grid";
import { MediaTile } from "@/components/app/media-grid";
import { distributeColumns, MasonryColumns } from "@/components/shared/masonry";
import type { BoardState } from "@/components/lab/board-spec";
import { tileAspect } from "@/lib/media/tile-aspect";

import { Canvas, Ground } from "./canvas";
import { phoneScreenOf, PHONE_SCREEN_W, type PhoneScreen } from "./screens";

export type PhoneOption = "fixed-two" | "scales" | "step-three";

const GAP = 4;
const PHONE_GUTTER = 40; // px-5 each side, same as every other surface

/**
 * "scales" and "step-three" are NOT WIRED (masonry.tsx hardcodes two columns
 * under 640px, `PHONE_MAX`), so both are a local simulation rather than the
 * production component: the same balancing algorithm the shipped grid uses
 * (`distributeColumns`, imported, never re-implemented), fed a column count
 * this board computes instead of `columnsFor`'s. "fixed-two" is today, so it
 * is the real `MasonryColumns` untouched.
 */
const cols: Record<PhoneOption, (w: number) => number> = {
  "fixed-two": () => 2,
  // A ~160px floor, the same shape gallery-width already uses above 640px.
  scales: (w) =>
    Math.max(2, Math.floor((w - PHONE_GUTTER + GAP) / (160 + GAP))),
  // One more explicit breakpoint: three from 480px, two below it.
  "step-three": (w) => (w >= 480 ? 3 : 2),
};

function SimulatedColumns({ items, n }: { items: GridMedia[]; n: number }) {
  const columns = distributeColumns(items, n, false);
  return (
    <div
      data-album-grid
      className="flex w-full items-start gap-[var(--gap-gallery)]"
    >
      {columns.map((col, i) => (
        <div key={i} className="min-w-0 flex-1 space-y-[var(--gap-gallery)]">
          {col.map((item) => (
            <div
              key={item.id}
              className="w-full overflow-hidden bg-black/10"
              style={{
                aspectRatio: tileAspect(item),
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

export function PhoneShowcase({
  option,
  screen,
}: {
  option: PhoneOption;
  screen: PhoneScreen;
}) {
  const w = PHONE_SCREEN_W[screen];
  const items = GALLERY_ITEMS.slice(0, 10);
  return (
    <Ground>
      <div className="px-5">
        <div className="pointer-events-none" data-lab-specimen>
          {option === "fixed-two" ? (
            <MasonryColumns items={items} />
          ) : (
            <SimulatedColumns items={items} n={cols[option](w)} />
          )}
        </div>
      </div>
    </Ground>
  );
}

export function phonePreview(state: BoardState, option: PhoneOption) {
  const screen = phoneScreenOf(state["phone-screen"]);
  const w = PHONE_SCREEN_W[screen];
  const simulated = option !== "fixed-two";
  return (
    <Canvas
      id={`phone-${option}-${screen}`}
      w={w}
      h={860}
      title={`${option}, ${w}px`}
      caption={
        simulated
          ? `${cols[option](w)} columns (simulated: not yet wired)`
          : undefined
      }
    >
      <PhoneShowcase option={option} screen={screen} />
    </Canvas>
  );
}
