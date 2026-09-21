"use client";

// This board's own sheet, no keyframe collision with any other
// (src/app/keyframe-uniqueness.test.ts reads every sheet under the lab).
import "./everywhere-pill.css";

import { Maximize2 } from "lucide-react";
import type { ReactNode } from "react";

import { AlbumFillGrid } from "@/components/marketing/sections/features/album/album-fill-grid";
import {
  EVERYWHERE_FIXTURES,
  EVERYWHERE_FRAME_H,
  EVERYWHERE_SEED_COUNT,
} from "@/components/marketing/sections/features/album/album-fill-fixtures";
import { useAlbumFill } from "@/components/marketing/sections/features/album/use-album-fill";
import { BrowserFrame, PhoneShell } from "@/components/marketing/frames";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

/**
 * DECISION 6: THE LIGHTBOX PILL, a copy of everywhere-stage.tsx with ONE
 * addition: `pill` overlays a small mark on the top tile of each grid (the
 * newest arrival lands there by construction: `AlbumFillGrid` renders
 * newest-first per column). `AlbumFillGrid` and `useAlbumFill` are the
 * shipped hooks, imported unchanged; only the composition around them is
 * copied, to add the overlay.
 *
 * `useAmbientPause` is dropped for the same reason as the phone's screen
 * cycle: a lab board is a side-by-side comparison and never pauses on its
 * own (frame.tsx), so `paused` is a flat `false` here rather than an
 * IntersectionObserver whose root would have to cross the board's own iframe.
 *
 * ★ "HOVER" IS GONE (the overtaken audit's reshape, 2026-09-21): ruled a
 * desk verb (app-vocabulary r1), a fiction on the phone half of this very
 * stage. `sweep` replaces it: the product's own arrival mark
 * (`everywhere-pill.css`, quoting components/shared/arrival.css), looped
 * here rather than played once, because nothing on a demo stage ever really
 * lands. Looped is also why it needs no "shown revealed" workaround the way
 * hover did: a still capture catches it mid-pass more often than not, and
 * missing it once is the same honest gap a live reviewer would see too.
 */

function PillMark({ pill }: { pill: "none" | "corner" | "sweep" }) {
  if (pill === "none") return null;
  if (pill === "corner")
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute top-1.5 left-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
      >
        <Maximize2 className="size-2.5" strokeWidth={2.5} />
      </span>
    );
  return (
    <span
      aria-hidden
      className="evp-sweep pointer-events-none absolute top-1.5 left-1.5 z-10 h-5 w-9 overflow-hidden rounded-full bg-black/55"
    />
  );
}

function GridWithPill({
  pill,
  children,
}: {
  pill: "none" | "corner" | "sweep";
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <PillMark pill={pill} />
      {children}
    </div>
  );
}

export function EverywherePill({
  pill,
}: {
  pill: "none" | "corner" | "sweep";
}) {
  const reduced = usePrefersReducedMotion();
  const view = useAlbumFill({
    fixtures: EVERYWHERE_FIXTURES,
    seedCount: EVERYWHERE_SEED_COUNT,
    paused: false,
    reduced,
    beatMs: 1600,
    upload: false,
    loop: true,
    maxPerColumn: 4,
  });

  return (
    // EverywhereSection sits before the album page's first PaperChapter, in
    // the cinema route group's forced-dark default — forced here too, never
    // left to the lab's own ambient theme (see chart-cast.tsx's note).
    // `data-mkt`/`data-mkt-skin` scope the marketing grammar (album-page's
    // and privacy-hero's own board copies carry the same pair).
    <div
      className="dark bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
    >
      <div
        aria-hidden
        className="mx-auto flex w-full max-w-xl items-end justify-center gap-4 px-5 py-10 [--fill-scale:0.62] sm:gap-5 sm:px-6 sm:[--fill-scale:0.8]"
      >
        <BrowserFrame
          label="partyreel.com/a/maya-and-jay"
          className="min-w-0 flex-1 sm:max-w-[420px]"
        >
          <GridWithPill pill={pill}>
            <AlbumFillGrid
              view={view}
              cols={3}
              frameHeight={EVERYWHERE_FRAME_H}
              gap={4}
              showCount={false}
              sizes="140px"
              reduced={reduced}
            />
          </GridWithPill>
        </BrowserFrame>
        <PhoneShell
          className="w-[150px] shrink-0 sm:w-[190px]"
          screenClassName="p-2"
        >
          <GridWithPill pill={pill}>
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
          </GridWithPill>
        </PhoneShell>
      </div>
    </div>
  );
}
