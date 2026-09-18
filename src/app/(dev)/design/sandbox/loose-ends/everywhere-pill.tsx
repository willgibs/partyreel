"use client";

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
 * addition: `pill` overlays a small affordance on the top tile of each grid
 * (the newest arrival lands there by construction: `AlbumFillGrid` renders
 * newest-first per column). `AlbumFillGrid` and `useAlbumFill` are the
 * shipped hooks, imported unchanged; only the composition around them is
 * copied, to add the overlay.
 *
 * `useAmbientPause` is dropped for the same reason as the phone's screen
 * cycle: a lab board is a side-by-side comparison and never pauses on its
 * own (frame.tsx), so `paused` is a flat `false` here rather than an
 * IntersectionObserver whose root would have to cross the board's own iframe.
 *
 * ★ "HOVER" IS SHOWN REVEALED, NEVER GATED ON A REAL :hover. A still capture
 * (this board's own verification, and every reviewer who does not happen to
 * rest a cursor there) can never see an opacity that only lifts on pointer
 * entry, so the option that ships hover-gated is drawn here in the state it
 * would reveal, which is the only state there is anything to judge. It is
 * also its own shape (a wider pill, the opposite corner) rather than a
 * fainter copy of "corner", so a still capture tells the two apart too.
 */

function PillMark({ pill }: { pill: "none" | "corner" | "hover" }) {
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
      className="pointer-events-none absolute right-1.5 bottom-1.5 z-10 flex items-center gap-1 rounded-full bg-black/65 py-1 pr-2 pl-1.5 text-[10px] leading-none font-medium text-white backdrop-blur-sm"
    >
      <Maximize2 className="size-2.5" strokeWidth={2.5} />
      Open
    </span>
  );
}

function GridWithPill({
  pill,
  children,
}: {
  pill: "none" | "corner" | "hover";
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
  pill: "none" | "corner" | "hover";
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
