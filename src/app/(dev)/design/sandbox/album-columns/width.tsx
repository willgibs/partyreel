"use client";

import { GALLERY_ITEMS } from "@/app/(dev)/design/sandbox/gallery-fixtures";
import { MasonryColumns } from "@/components/shared/masonry";
import type { BoardState } from "@/components/lab/board-spec";
import { cn } from "@/lib/utils";

import { Canvas, Ground } from "./canvas";
import { edgeScreenOf, EDGE_SCREEN_W } from "./screens";

export type WidthOption = "edge" | "contained" | "bleed";

/**
 * THE THREE GUTTERS, EACH THE REAL `MasonryColumns` UNTOUCHED: only the box
 * AROUND it changes. "edge" and "bleed" agree with today at every width below
 * the cap, so the difference only shows past it (or, for bleed, at a phone,
 * where the margin itself is the whole question) — the `edge-screen` knob
 * defaults there.
 */
const WRAP: Record<WidthOption, string> = {
  edge: "px-5",
  contained: "mx-auto max-w-[2200px] px-5",
  bleed: "px-0",
};

export function WidthShowcase({ option }: { option: WidthOption }) {
  return (
    <Ground>
      <div className={cn(WRAP[option])}>
        <div className="pointer-events-none" data-lab-specimen>
          <MasonryColumns items={GALLERY_ITEMS} />
        </div>
      </div>
    </Ground>
  );
}

export function widthPreview(state: BoardState, option: WidthOption) {
  const screen = edgeScreenOf(state["edge-screen"]);
  const w = EDGE_SCREEN_W[screen];
  return (
    <Canvas
      id={`width-${option}-${screen}`}
      w={w}
      h={screen === "375" ? 760 : 820}
      title={`${option}, ${w}px`}
    >
      <WidthShowcase option={option} />
    </Canvas>
  );
}
