"use client";

import { BrowserFrame, PhoneShell } from "@/components/marketing/frames";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  EVERYWHERE_FIXTURES,
  EVERYWHERE_FRAME_H,
  EVERYWHERE_SEED_COUNT,
} from "./album-fill-fixtures";
import { AlbumFillGrid } from "./album-fill-grid";
import { useAlbumFill } from "./use-album-fill";

/**
 * LAND ONCE, SHOW UP EVERYWHERE: a laptop and a phone showing the same album,
 * and the same new photograph landing at the top of BOTH in the same instant.
 * That is the doorbell (src/lib/guest/use-gallery-doorbell.ts) made visible:
 * one upload, every open album, no refresh.
 *
 * Simultaneity is structural, not timed: ONE useAlbumFill feeds two grids, so
 * both commit in the same React pass and their FLIPs run in the same frame.
 * The phone takes the product's two columns (guest-masonry is `columns-2`);
 * the laptop keeps the hero's three. Quiet by design: no lamp, no count line,
 * no Replay, no upload prelude, a slower beat, and a loop bounded to four
 * tiles a column so the DOM never grows.
 */
export function EverywhereStage() {
  const reduced = usePrefersReducedMotion();
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const view = useAlbumFill({
    fixtures: EVERYWHERE_FIXTURES,
    seedCount: EVERYWHERE_SEED_COUNT,
    paused,
    reduced,
    beatMs: 1600,
    upload: false,
    loop: true,
    maxPerColumn: 4,
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className="flex items-end justify-center gap-4 [--fill-scale:0.62] sm:gap-5 sm:[--fill-scale:0.8]"
    >
      {/* The laptop keeps the hero's three columns; the phone takes the
          product's two. The pair is sized so the phone reads as a phone (its
          screen about a third of the laptop's) rather than a sliver: at the
          split's ~640px the laptop is ~420 and the phone ~190. */}
      <BrowserFrame
        label="partyreel.com/a/maya-and-jay"
        className="min-w-0 flex-1 sm:max-w-[420px]"
      >
        <AlbumFillGrid
          view={view}
          cols={3}
          frameHeight={EVERYWHERE_FRAME_H}
          gap={4}
          showCount={false}
          sizes="140px"
          reduced={reduced}
        />
      </BrowserFrame>
      <PhoneShell
        className="w-[150px] shrink-0 sm:w-[190px]"
        screenClassName="p-2"
      >
        <AlbumFillGrid
          view={view}
          cols={2}
          frameHeight={EVERYWHERE_FRAME_H + 56}
          gap={3}
          showCount={false}
          sizes="90px"
          reduced={reduced}
          className="[--fill-scale:0.72] sm:[--fill-scale:0.9]"
        />
      </PhoneShell>
    </div>
  );
}
