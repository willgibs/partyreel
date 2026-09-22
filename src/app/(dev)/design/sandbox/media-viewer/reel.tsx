"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { GLASS } from "@/lib/glass";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets } from "@/lib/reel/engine/assets";
import { type Orientation, reelDimensions } from "@/lib/reel/engine/constants";
import { fitClip } from "@/lib/reel/engine/framing";
import {
  drawReelFrame,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import { clipStartFrames, planFor } from "@/lib/reel/engine/timeline";
import { cn } from "@/lib/utils";

import {
  CLIP_SRC,
  REEL_MOMENT_SEC,
  REEL_SEED,
  REEL_STYLE,
  reelTakeOf,
} from "./fixtures";
import { SCREENS, type ScreenId } from "./page-parts";

/**
 * THE SECOND PLACE A PHOTOGRAPH OPENS FROM: THE LIVE REEL, PAUSED ON IT.
 *
 * `AlbumPage` is the page behind the viewer when a TILE was tapped; this is the
 * page behind it when the REEL was. It quotes the reel's own full-screen view at
 * rest, as `reel-view` draws it and the shipped guest overlay stands it: the
 * reel's near-black ground, the composition fitted inside a 16 px margin, the
 * engine's orientation following the screen (portrait in a hand, landscape at a
 * laptop, `reel-view.posture`'s recommendation), bare chrome (`reel-view.chrome`'s)
 * and Close in its own corner. Nothing on this board asks how the reel looks;
 * this is only the ground a photograph arrives from and goes back to.
 *
 * ★ REAL ENGINE PIXELS, DRAWN ONCE, NEVER A LIVE CANVAS IN A FRAME. A portalled
 * frame runs its JSX in the lab page's realm, so `CanvasReelPlayer` would reach
 * the lab page's `document` for its visibility and motion queries. So the one
 * frame this board needs is drawn with `drawReelFrame` directly, off the DOM,
 * and handed across as a data URL, which needs no realm at all (the precedent
 * is `reel-front/engine.ts`). The frame is the middle of the tapped photograph's
 * own hold: past its entrance and before the next clip's transition, which is
 * the moment a tap lands on it.
 *
 * ★ A VIDEO IS ITS OWN FRAME, NOT THE ENGINE'S. The engine draws a video from
 * its poster still, or from a window the live reel decodes on the device; this
 * fixture clip has no poster file, so the reel's picture of it is the clip's own
 * frame at the moment the reel was showing (`REEL_MOMENT_SEC`), framed by the
 * engine's own cover-or-fit policy (`fitClip`).
 */

/** The longest side the still is drawn at: sharp at a phone and at 1440. */
const MAX_DIM = 1280;

/** The reel view's own ground, quoted from `reel-view`'s surface. */
const REEL_GROUND = "bg-[oklch(0.09_0_0)]";

/** The margin the reel view keeps around the composition (`reel-view`'s `p-4`). */
const MARGIN = 16;

type Rect = { left: number; top: number; width: number; height: number };

export const orientationOf = (screen: ScreenId): Orientation =>
  screen === "375" ? "portrait" : "landscape";

/**
 * Where the composition sits on the screen. The frame IS the screen here (the
 * subtree is portalled into an iframe of exactly `SCREENS[screen]`), so the rect
 * is worked out from the screen's own size rather than laid out by CSS, which
 * cannot contain an aspect ratio inside a box whose both sides are bounded.
 */
function compositionRect(screen: ScreenId): Rect {
  const { w, h } = SCREENS[screen];
  const c = reelDimensions(orientationOf(screen));
  const aw = w - 2 * MARGIN;
  const ah = h - 2 * MARGIN;
  const k = Math.min(aw / c.width, ah / c.height);
  const width = c.width * k;
  const height = c.height * k;
  return {
    left: (w - width) / 2,
    top: (h - height) / 2,
    width,
    height,
  };
}

/**
 * Where the tapped photograph itself sits inside the composition: the whole
 * composition when the engine covers it (a portrait in a portrait reel), the
 * photograph contained in it when the engine fits it (a portrait in a landscape
 * reel). The same policy the engine draws with, so the flight out of the reel
 * starts where the reel really drew the picture.
 */
export function reelPhotoRect(screen: ScreenId, item: GridMedia): Rect {
  const frame = compositionRect(screen);
  const c = reelDimensions(orientationOf(screen));
  const mw = item.width ?? 0;
  const mh = item.height ?? 0;
  if (fitClip(mw || undefined, mh || undefined, c.width, c.height) === "cover")
    return frame;
  const k = Math.min(frame.width / mw, frame.height / mh);
  const width = mw * k;
  const height = mh * k;
  return {
    left: frame.left + (frame.width - width) / 2,
    top: frame.top + (frame.height - height) / 2,
    width,
    height,
  };
}

/* ── the one frame, drawn off the DOM ─────────────────────────────────────── */

const STILLS = new Map<string, string | null>();
const PENDING = new Map<string, Promise<string | null>>();

async function drawStill(
  item: GridMedia,
  orientation: Orientation,
): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const take = reelTakeOf(item);
  const props = buildReelProps({
    orderedIds: take.map((m) => m.id),
    byId: new Map(take.map((m) => [m.id, m])),
    styleId: REEL_STYLE,
    seed: REEL_SEED,
    orientation,
    coverMediaId: item.id,
  });
  const composition = reelDimensions(orientation);
  const ratio = Math.min(
    1,
    MAX_DIM / Math.max(composition.width, composition.height),
  );
  const w = Math.max(2, Math.round(composition.width * ratio));
  const h = Math.max(2, Math.round(composition.height * ratio));
  try {
    const assets = await loadReelAssets(props.clips, {
      ...resolveEngineStyle(props.styleId).assetNeeds(props),
      frame: { width: w, height: h },
      decode: sharedBitmapCache.decode,
    });
    const plan = planFor(props);
    const starts = clipStartFrames(plan);
    const own = starts[1] ?? plan.clips[0]?.durationInFrames ?? 2;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const env = makeScaledDrawEnv(composition);
    ctx.setTransform(w / composition.width, 0, 0, h / composition.height, 0, 0);
    drawReelFrame(ctx, Math.round(own / 2), props, assets, env);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas.toDataURL("image/webp", 0.86);
  } catch {
    // A capability gap (no 2d context, a still that would not decode): the
    // composition keeps its box on the reel's own ground, and says nothing false.
    return null;
  }
}

/**
 * The engine's frame of `item`, or undefined while it is being drawn and null
 * when it could not be. One draw per item and orientation for the whole board.
 *
 * ★ THE KEY RIDES THE STATE, so a knob that flips the orientation under a
 * mounted page reads the new frame from the cache at once rather than showing
 * the old one until an effect catches up, and nothing sets state inside an
 * effect's own body (the compiler's rule): the only write is the promise's.
 */
function useReelStill(item: GridMedia, orientation: Orientation) {
  const key = `${item.id}:${orientation}`;
  const [drawn, setDrawn] = useState<{ key: string; url: string | null }>();
  useEffect(() => {
    if (STILLS.has(key)) return;
    let alive = true;
    let pending = PENDING.get(key);
    if (!pending) {
      pending = drawStill(item, orientation).then((url) => {
        STILLS.set(key, url);
        PENDING.delete(key);
        return url;
      });
      PENDING.set(key, pending);
    }
    void pending.then((url) => {
      if (alive) setDrawn({ key, url });
    });
    return () => {
      alive = false;
    };
  }, [key, item, orientation]);
  if (STILLS.has(key)) return STILLS.get(key) ?? null;
  return drawn?.key === key ? drawn.url : undefined;
}

/* ── the page ────────────────────────────────────────────────────────────── */

const px = (r: Rect): CSSProperties => ({
  left: r.left,
  top: r.top,
  width: r.width,
  height: r.height,
});

/**
 * The reel's full-screen view at rest, paused on `item`, as the page behind the
 * viewer. `data-mv-lit` marks the photograph's own rect inside the composition,
 * which is the box `grow` flies out of and `wayout=down` puts it back into,
 * exactly as it marks the tapped tile on the album page.
 */
export function ReelPage({
  screen,
  item,
  pageClass,
  children,
}: {
  screen: ScreenId;
  item: GridMedia;
  /** `mv-returning` lights the frame a dismissing photograph is heading for. */
  pageClass?: string;
  /** Whatever stands over the reel: the viewer, in one of its shapes. */
  children?: ReactNode;
}) {
  const orientation = orientationOf(screen);
  const still = useReelStill(item, orientation);
  const frame = compositionRect(screen);
  const photo = reelPhotoRect(screen, item);
  const c = reelDimensions(orientation);
  const cover =
    fitClip(item.width ?? undefined, item.height ?? undefined, c.width, c.height) ===
    "cover";

  return (
    <div
      data-mv-origin="reel"
      className={cn("relative min-h-dvh overflow-hidden", REEL_GROUND, pageClass)}
    >
      <div
        data-mv-reel-frame
        className="absolute overflow-hidden"
        style={px(frame)}
      >
        {item.type === "video" ? (
          // The clip at the reel's moment, framed the way the engine frames it.
          <video
            src={`${CLIP_SRC}#t=${REEL_MOMENT_SEC}`}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className={cn(
              "size-full select-none",
              cover ? "object-cover" : "object-contain",
            )}
          />
        ) : still ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL the engine drew, not a served asset
          <img
            src={still}
            alt=""
            draggable={false}
            className="size-full select-none"
          />
        ) : null}
      </div>
      {/* The photograph's own rect inside the composition: what a flight
          measures, and what a return lights. Drawn nothing, marks everything. */}
      <span
        aria-hidden
        data-mv-lit=""
        className="pointer-events-none absolute"
        style={px(photo)}
      />
      {/* The reel view's Close, in its own corner, quoted from `reel-view`. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-3 right-3 z-30 flex size-9 items-center justify-center rounded-full text-white/85",
          GLASS,
        )}
      >
        <X className="size-4" />
      </span>
      {children}
    </div>
  );
}
