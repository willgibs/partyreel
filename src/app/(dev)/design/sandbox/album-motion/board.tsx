"use client";

import { useCallback, useRef } from "react";

import { ExplorationBoard, Frame } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { AlbumStreamPause } from "@/components/shared/album-stream/album-stream";
import {
  GAP,
  STAGE,
  STREAMS,
  type Variant,
} from "@/components/shared/album-stream/stream-engine";

import { useFrameFilter } from "./frame-filter";
import { PUSH } from "./push-engine";
import { PushHero, RowsHero } from "./rows-hero";
import { ALBUM_MOTION } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: each option is the album page's hero at 1440
 * and again at 375, in real viewports (a `Frame`, because the headline's step is
 * a `vw` clamp and a narrow div would draw the desktop's at both).
 *
 * ★ THE FALLS ARE PRODUCTION'S, THE ALBUM IS THE ONE THE PRODUCT HAS NOW. The
 * first four are the shipped `AlbumStream` under its lab-only `variant`, so a
 * pick among them is still a one-word change to `SHIPPED` in the engine; the
 * fifth, `push`, is the board's own layer on the engine's pace and geometry
 * (`push-engine.ts` says why it cannot be a recipe until it is picked). All
 * five stand on the hero recomposed over the album in rows (`rows-hero.tsx`),
 * because the shipped hero's stage still draws the masonry the album left.
 *
 * ★ THE PAUSE CROSSES THE FRAME BY CONTEXT. The step hides the options it is not
 * showing with `data-paused` in THIS document; the stream runs in the frame's,
 * whose DOM ancestors stop at its own body. Context does cross a portal, so the
 * reader is handed down and the loop holds its CLOCK on it: an un-held clock
 * teleports the composition on the way back from a hidden option, and the push's
 * album, whose arrivals ride that clock, holds still with it.
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

type Fall = Variant | "push";

/** What each frame's caption reads: the engine's own measure of its field. */
const captionOf = (fall: Fall, bp: "lg" | "base") =>
  fall === "push" ? PUSH[bp].caption : STREAMS[fall][bp].caption;

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

function HeroScreens({ fall }: { fall: Fall }) {
  const { host, isPaused } = useHostPause();
  return (
    <AlbumStreamPause.Provider value={isPaused}>
      <div ref={host} className="flex min-w-0 flex-col gap-6">
        {(["desktop", "phone"] as const).map((mode) => (
          <Frame
            key={mode}
            id={`alm-${mode}-${fall}`}
            w={mode === "desktop" ? 1440 : 375}
            h={heightOf(mode)}
            title={mode === "desktop" ? "1440" : "375"}
            caption={captionOf(fall, mode === "desktop" ? "lg" : "base")}
          >
            <Page fall={fall} />
          </Frame>
        ))}
      </div>
    </AlbumStreamPause.Provider>
  );
}

/** The real page's first screen: the cinema skin, the header, the hero. */
function Page({ fall }: { fall: Fall }) {
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
      {fall === "push" ? <PushHero /> : <RowsHero variant={fall} />}
    </div>
  );
}

const PREVIEWS: PreviewsFor<typeof ALBUM_MOTION> = {
  "fall.glide": <HeroScreens fall="glide" />,
  "fall.gather": <HeroScreens fall="gather" />,
  "fall.cascade": <HeroScreens fall="cascade" />,
  "fall.bloom": <HeroScreens fall="bloom" />,
  "fall.push": <HeroScreens fall="push" />,
};

export function AlbumMotionBoard() {
  return <ExplorationBoard spec={ALBUM_MOTION} previews={PREVIEWS} />;
}
