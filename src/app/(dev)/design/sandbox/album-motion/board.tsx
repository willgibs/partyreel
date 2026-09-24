"use client";

import { useCallback, useRef } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { ArrivalsHero } from "@/components/marketing/sections/features/album/arrivals-hero";
import { AlbumStreamPause } from "@/components/shared/album-stream/album-stream";
import {
  GAP,
  STAGE,
  STREAMS,
  type Variant,
} from "@/components/shared/album-stream/stream-engine";

import { useFrameFilter } from "./frame-filter";
import { ALBUM_MOTION } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option is the SHIPPED album hero at 1440
 * and again at 375, in real viewports (a `Frame`, because the headline's step is
 * a `vw` clamp and a narrow div would draw the desktop's at both).
 *
 * ★ IT IS THE PRODUCTION COMPONENT, NOT A COPY OF IT. `ArrivalsHero` takes a
 * lab-only `variant` and everything else about the three tiles is identical,
 * because it IS the same file: whatever he picks is already wired, and the pick
 * is a one-word change to `SHIPPED` in the engine.
 *
 * ★ THE PAUSE CROSSES THE FRAME BY CONTEXT. The step hides the options it is not
 * showing with `data-paused` in THIS document; the stream runs in the frame's,
 * whose DOM ancestors stop at its own body. Context does cross a portal, so the
 * reader is handed down and the loop holds its CLOCK on it: an un-held clock
 * teleports the composition on the way back from a hidden option.
 */

/** The hero's own height per width, plus the header's band it sits under: the
 *  lockup, the gap the stream falls through, the album, and the floor its light
 *  pools on. Read off the engine so a retune moves the frame with the page. */
const HEADER = 64;
const LOCKUP = { desktop: 502, phone: 374 } as const;
const heightOf = (mode: "desktop" | "phone") => {
  const bp = mode === "desktop" ? "lg" : "base";
  return HEADER + LOCKUP[mode] + GAP[bp] + STAGE[bp].h + STAGE[bp].floor + 24;
};

/** The host's own pause reader: this document's ancestors, and the tab. */
function useHostPause() {
  const host = useRef<HTMLDivElement | null>(null);
  const isPaused = useCallback(
    () =>
      document.hidden || Boolean(host.current?.closest('[data-paused="true"]')),
    [],
  );
  return { host, isPaused };
}

function HeroScreens({ variant }: { variant: Variant }) {
  const { host, isPaused } = useHostPause();
  return (
    <AlbumStreamPause.Provider value={isPaused}>
      <div ref={host} className="flex min-w-0 flex-col gap-6">
        {(["desktop", "phone"] as const).map((mode) => (
          <Frame
            key={mode}
            id={`alm-${mode}-${variant}`}
            w={mode === "desktop" ? 1440 : 375}
            h={heightOf(mode)}
            title={mode === "desktop" ? "1440" : "375"}
            caption={
              STREAMS[variant][mode === "desktop" ? "lg" : "base"].caption
            }
          >
            <Page variant={variant} />
          </Frame>
        ))}
      </div>
    </AlbumStreamPause.Provider>
  );
}

/** The real page's first screen: the cinema skin, the header, the hero. */
function Page({ variant }: { variant: Variant }) {
  const root = useRef<HTMLDivElement | null>(null);
  useFrameFilter(root);
  return (
    <div
      ref={root}
      className="dark flex flex-col bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
      // A press inside a preview is looking, not leaving.
      onClickCapture={(e) => {
        if ((e.target as Element).closest?.("a[href]")) e.preventDefault();
      }}
    >
      <MarketingHeader skin="cinema" />
      <ArrivalsHero variant={variant} />
    </div>
  );
}

const PREVIEWS: PreviewsFor<typeof ALBUM_MOTION> = {
  "fall.glide": <HeroScreens variant="glide" />,
  "fall.gather": <HeroScreens variant="gather" />,
  "fall.cascade": <HeroScreens variant="cascade" />,
  "fall.bloom": <HeroScreens variant="bloom" />,
};

export function AlbumMotionBoard() {
  return <ExplorationBoard spec={ALBUM_MOTION} previews={PREVIEWS} />;
}
