"use client";

import { type CSSProperties, type ReactNode, useRef } from "react";

import type { GridMedia } from "@/components/app/media-grid";
import { GuestMasonry } from "@/components/guest/guest-masonry";
import { BrowserFrame } from "@/components/marketing/frames";
import {
  HERO_FIXTURES,
  HERO_FRAME_H,
  HERO_SEED_COUNT,
} from "@/components/marketing/sections/features/album/album-fill-fixtures";
import { AlbumFillGrid } from "@/components/marketing/sections/features/album/album-fill-grid";
import { useAlbumFill } from "@/components/marketing/sections/features/album/use-album-fill";
import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { Glow } from "@/components/shared/glow";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useSampledPaletteFromDom } from "@/lib/shared/sampled-palette";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import type { Mode } from "../privacy-hero/field";

/**
 * THE ALBUM UNDER THE HEADLINE, AND ITS LIGHT (the heroes lane, 2026-09-18).
 *
 * ★ 896, NOT 880. Will ruled 880 on the album hero's width step; the site's
 * container scale has `max-w-4xl` (896) as its nearest step, so the column
 * takes that and the page gains no one-off width. At 375 it is the column less
 * the page's gutter, which is what the product ships on a phone.
 *
 * ★ ITS FOOT FADES OUT (his note on the width: "If this width makes the
 * dashboard visual too tall, we can fade out the bottom. May look better either
 * way."). The frame is clipped to a height and dissolves over its last third,
 * so the album reads as endless rather than as a box with a floor.
 *
 * ★ BOTH ALBUMS ARE THE SHIPPED COMPONENTS, COMPOSED. The live album is
 * `GuestMasonry` under the host's own header (bible 4: a guest surface is the
 * host's, so no Partyreel mark inside the frame), the shape album-hero's round
 * three drew; the filling demo is the page's own `useAlbumFill` and
 * `AlbumFillGrid`, widened. The masonry's column count is set from the outside
 * (page.css), never by editing the product: three columns at 896, two at a
 * phone, the direction of Will's gallery note ("keep image tiles to a smaller
 * size and add more columns").
 */

export type Visual = "live" | "filling";
export type AlbumLight = "pool" | "none" | "halo";

/** The column, its visible height and how much of that dissolves. */
export const ALBUM: Record<Mode, { w: number; h: number; fade: number }> = {
  desktop: { w: 896, h: 600, fade: 240 },
  phone: { w: 343, h: 430, fade: 170 },
};

/** How far the pool reaches below the album's dissolve, px. */
export const POOL_H: Record<Mode, number> = { desktop: 300, phone: 200 };

/** The stand-in album: the twelve manifest photographs at their real
 *  dimensions, so the masonry lays them out as it lays out a guest's. */
const ITEMS: GridMedia[] = [...STREAM_FRAMES, ...STREAM_FRAMES.slice(0, 6)].map(
  (id, i) => {
    const img = marketingImage(id);
    return {
      id: `apg-${id}-${i}`,
      type: "photo",
      url: img.src,
      width: img.width,
      height: img.height,
    } satisfies GridMedia;
  },
);

/** The demo event the whole site already uses (arrivals-stage.tsx ships it). */
const EVENT = {
  name: "Maya & Jay",
  host: "Maya",
  date: "14 June 2026",
  photos: 142,
  guests: 23,
  url: "partyreel.com/a/maya-and-jay",
} as const;

function LiveAlbum({ mode }: { mode: Mode }) {
  const phone = mode === "phone";
  return (
    <BrowserFrame label={EVENT.url} className="apg-frame">
      <div
        className={`flex flex-wrap items-end justify-between gap-3 ${phone ? "px-1 pt-1 pb-4" : "px-2 pt-2 pb-5"}`}
      >
        <div className="min-w-0">
          <p
            className={`font-heading leading-snug text-balance ${phone ? "text-[22px]" : "text-[28px]"}`}
          >
            {EVENT.name}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              <span className="text-muted-foreground/70">Hosted by </span>
              <span className="font-medium text-foreground">{EVENT.host}</span>
            </span>
            <span aria-hidden className="text-muted-foreground/50">
              ·
            </span>
            <span>{EVENT.date}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {EVENT.photos} photos &amp; videos from {EVENT.guests} guests
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          Live now
        </span>
      </div>
      <div
        className="apg-grid"
        style={{ "--apg-cols": phone ? 2 : 3 } as CSSProperties}
      >
        <GuestMasonry items={ITEMS} />
      </div>
    </BrowserFrame>
  );
}

function FillingAlbum({ mode }: { mode: Mode }) {
  const reduced = usePrefersReducedMotion();
  const view = useAlbumFill({
    fixtures: HERO_FIXTURES,
    seedCount: HERO_SEED_COUNT,
    paused: false,
    reduced,
    beatMs: 800,
  });
  const phone = mode === "phone";
  return (
    <BrowserFrame label={EVENT.url} className="apg-frame">
      {/* Today's demo, widened: the page's own fill clock and grid, its three
          columns stretched to the new column's width. */}
      {/* Scaled so the grid is at least as tall as the album's clip: the
          frame must run into the dissolve rather than end above it. */}
      <div
        style={{ "--fill-scale": phone ? 1 : 1.45 } as CSSProperties}
      >
        <AlbumFillGrid
          view={view}
          cols={phone ? 2 : 3}
          frameHeight={HERO_FRAME_H}
          sizes={phone ? "170px" : "300px"}
          reduced={reduced}
        />
      </div>
    </BrowserFrame>
  );
}

/**
 * ★ A SCREEN'S LIGHT IS A POOL NO WIDER THAN THE SCREEN (design-system.md), and
 * today's `ScreenLamp` is a 220 px band the full width of the viewport, which is
 * what Will called wrong. This is the reel's recipe (`reel-screen-lamp.tsx`):
 * a seam in a box exactly the frame's width, windowed by an ellipse anchored on
 * the frame's centre line, sampled from the photographs it lights. Here the
 * frame has no floor, it dissolves, so the pool sits UNDER the dissolve and the
 * album fades into its own light.
 */
function Pool({ mode, colors }: { mode: Mode; colors?: readonly string[] }) {
  const a = ALBUM[mode];
  return (
    <div
      aria-hidden
      className="apg-pool pointer-events-none absolute inset-x-0 -z-10"
      // Its brightest edge sits at the foot of the dissolve, where the album
      // has gone, so the photographs fade INTO the light rather than the light
      // being hidden behind them.
      style={{ top: a.h - a.fade * 0.18, height: POOL_H[mode] }}
    >
      <Glow
        shape="seam"
        drive="mask"
        colors={colors}
        vars={{
          "--glw-dur": "var(--spill-cadence)",
          "--glw-h": `${POOL_H[mode] - 20}px`,
          "--glw-strength": "0.8",
          "--glw-base": "0.95",
        }}
      />
    </div>
  );
}

/**
 * ★ THE HALO LIGHTS AN OBJECT FROM BEHIND, ITS FACE CLEAN, and never a button
 * (Will's fence, 2026-09-17). The frame's own card is lifted off it and put
 * under the halo, so the wash climbs its rim and chrome while the photographs,
 * which are opaque, stay exactly as they are.
 */
function Halo({
  colors,
  children,
}: {
  colors?: readonly string[];
  children: ReactNode;
}) {
  return (
    <div
      className="apg-halo relative isolate overflow-hidden rounded-2xl"
      style={{ "--glw-radius": "var(--radius-2xl)" } as CSSProperties}
    >
      <Glow
        shape="halo"
        colors={colors}
        vars={{
          "--glw-blur": "22px",
          "--glw-core": "38%",
          "--glw-strength": "0.9",
          "--glw-base": "0.75",
          "--glw-dur": "var(--spill-cadence)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function AlbumStage({
  mode,
  visual,
  light,
}: {
  mode: Mode;
  visual: Visual;
  light: AlbumLight;
}) {
  const a = ALBUM[mode];
  const host = useRef<HTMLDivElement | null>(null);
  // The pool's colour is the album's own (law 3), read off the photographs it
  // lights once they have painted; the house five stand in until then.
  const colors = useSampledPaletteFromDom(host, { limit: 6 });
  const album =
    visual === "live" ? <LiveAlbum mode={mode} /> : <FillingAlbum mode={mode} />;

  return (
    <div
      ref={host}
      aria-hidden
      data-apg-light={light}
      className="apg-stage relative isolate mx-auto w-full"
      style={
        {
          maxWidth: a.w,
          "--apg-h": `${a.h}px`,
          "--apg-fade": `${a.fade}px`,
        } as CSSProperties
      }
    >
      {light === "pool" && <Pool mode={mode} colors={colors ?? undefined} />}
      <div className="apg-clip">
        {light === "halo" ? (
          <Halo colors={colors ?? undefined}>{album}</Halo>
        ) : (
          album
        )}
      </div>
    </div>
  );
}
