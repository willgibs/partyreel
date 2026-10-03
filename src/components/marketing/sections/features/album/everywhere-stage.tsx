"use client";

import { useState } from "react";

import { BrowserFrame, PhoneShell } from "@/components/marketing/frames";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  EVERYWHERE_FIXTURES,
  EVERYWHERE_FRAME_H,
  EVERYWHERE_SEED_COUNT,
} from "./album-fill-fixtures";
import { AlbumFillGrid, type PeekRequest } from "./album-fill-grid";
import { EverywherePeek } from "./everywhere-peek";
import { useAlbumFill } from "./use-album-fill";

/**
 * LAND ONCE, SHOW UP EVERYWHERE: a laptop and a phone showing the same album,
 * and the same new photograph landing at the top of BOTH in the same instant.
 * That is the doorbell (src/lib/guest/use-gallery-doorbell.ts) made visible:
 * one upload, every open album, no refresh.
 *
 * Simultaneity is structural, not timed: ONE useAlbumFill feeds two grids, so
 * both commit in the same React pass and their FLIPs run in the same frame.
 * The phone takes two columns, the product's own default on a phone (two
 * photographs a row); the laptop takes the three the fixtures are authored on.
 * Quiet by design: no count line, no upload prelude, a slower beat, and a loop
 * bounded to four tiles a column so the DOM never grows.
 *
 * ★ THE EASTER EGG (`loose-ends` r1, `everywhere-pill=corner`): the newest tile
 * on each screen wears a small expand mark, and a press on any tile opens that
 * photograph in a small lightbox that says it is a demo and closes on any tap
 * (`everywhere-peek.tsx`). Pointer-only, so the stage stays `aria-hidden`: this
 * is decoration with a surprise in it, and a tab stop inside an aria-hidden
 * region would be worse than none. The loop holds still while the lightbox is
 * up, so the album is where the visitor left it when it closes.
 */
export function EverywhereStage() {
  const reduced = usePrefersReducedMotion();
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  // `peek` outlives `open`: the lightbox's exit still draws its photograph.
  const [peek, setPeek] = useState<PeekRequest | null>(null);
  const [open, setOpen] = useState(false);
  const view = useAlbumFill({
    fixtures: EVERYWHERE_FIXTURES,
    seedCount: EVERYWHERE_SEED_COUNT,
    paused: paused || open,
    reduced,
    beatMs: 1600,
    upload: false,
    loop: true,
    maxPerColumn: 4,
  });
  const openPeek = (request: PeekRequest) => {
    setPeek(request);
    setOpen(true);
  };

  return (
    <div
      ref={ref}
      aria-hidden
      className="flex items-end justify-center gap-4 [--fill-scale:0.62] sm:gap-5 sm:[--fill-scale:0.8]"
    >
      {/* The laptop takes the fixtures' three columns; the phone, the
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
          peek={openPeek}
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
          peek={openPeek}
          className="[--fill-scale:0.72] sm:[--fill-scale:0.9]"
        />
      </PhoneShell>
      <EverywherePeek peek={peek} open={open} onOpenChange={setOpen} />
    </div>
  );
}
