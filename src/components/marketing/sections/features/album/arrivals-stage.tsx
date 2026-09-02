"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { ScreenLamp } from "@/components/marketing/system/screen-lamp";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { HERO_FIXTURES, HERO_FRAME_H, HERO_SEED_COUNT } from "./album-fill-fixtures";
import { AlbumFillGrid } from "./album-fill-grid";
import { useAlbumFill } from "./use-album-fill";

/**
 * THE HERO'S STAGE: the album fills from the top.
 *
 * The page's one lamp wraps the frame (screen-lamp.tsx), OUTSIDE the keyed
 * subtree, so Replay remounts the fill and never re-samples the light or
 * flashes it back to the house five. The fill clock rides useAmbientPause:
 * it starts when the stage is actually seen, halts off-screen or in a hidden
 * tab, and resumes from where it stopped. Reduced motion shows the full album.
 *
 * `--fill-scale` shrinks every authored height on a phone, where three columns
 * at 375px would otherwise be tall portrait crops; the frame's clip scales
 * with it so the fixtures' overfill invariant holds at every width.
 */
export function ArrivalsStage() {
  const reduced = usePrefersReducedMotion();
  const { ref: stageRef, paused } = useAmbientPause<HTMLDivElement>();
  const [runId, setRunId] = useState(0);

  return (
    <div
      ref={stageRef}
      className="mx-auto mt-12 max-w-3xl [--fill-scale:0.58] sm:mt-16 sm:[--fill-scale:0.8] md:[--fill-scale:1]"
    >
      <ScreenLamp limit={HERO_SEED_COUNT}>
        <div aria-hidden>
          <BrowserFrame label="partyreel.com/a/maya-and-jay">
            <HeroAlbum key={runId} paused={paused} reduced={reduced} />
          </BrowserFrame>
        </div>
      </ScreenLamp>

      {/* The status row: the live pill (the product's own green state, feedback
          colour as STATE) and Replay, off the media. `relative` so it paints
          over the lamp's field. */}
      <div className="relative mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <LiveDot paused={paused} />
          Filling live
        </span>
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-card px-3 text-xs font-medium text-muted-foreground transition-[transform,color] duration-150 hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
      </div>
    </div>
  );
}

function HeroAlbum({ paused, reduced }: { paused: boolean; reduced: boolean }) {
  const view = useAlbumFill({
    fixtures: HERO_FIXTURES,
    seedCount: HERO_SEED_COUNT,
    paused,
    reduced,
    beatMs: 800,
  });
  return (
    <AlbumFillGrid
      view={view}
      cols={3}
      frameHeight={HERO_FRAME_H}
      sizes="(min-width: 640px) 232px, 33vw"
      reduced={reduced}
    />
  );
}

/** --success stays the dot's colour: feedback state, not decoration. The ping
 *  is an infinite loop, so it honours the ambient pause by unmounting. */
function LiveDot({ paused }: { paused: boolean }) {
  return (
    <span className="relative flex size-2">
      {!paused && (
        <span className="absolute inset-0 animate-ping rounded-full bg-success/60 motion-reduce:hidden" />
      )}
      <span className="relative size-2 rounded-full bg-success" />
    </span>
  );
}
