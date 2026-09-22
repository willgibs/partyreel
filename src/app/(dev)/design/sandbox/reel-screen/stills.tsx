"use client";

import { useEffect, useState } from "react";

import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets } from "@/lib/reel/engine/assets";
import { reelDimensions } from "@/lib/reel/engine/constants";
import {
  drawReelFrame,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { cn } from "@/lib/utils";

import { clipMidFrame, wallProps } from "./fixtures";

/**
 * THE WALL'S PICTURES, DRAWN BY THE REAL ENGINE, ONCE.
 *
 * ★ REAL ENGINE PIXELS, NEVER A RE-TYPED RECIPE. Every reel frame on this board
 * is `drawReelFrame` over the fixture clips: the same draw the live player runs
 * and the encoder steps, at the engine's own LANDSCAPE composition (1920 by
 * 1080), which is this board's stage exactly. A hand-picked photograph behind a
 * corner code would be a board arguing about a wall production never had.
 *
 * ★ AND DRAWN ONCE FOR THE WHOLE BOARD, WHICH IS WHY THESE ARE STILLS. The step
 * MOUNTS every option of a decision at the same moment and hides all but one
 * (step.tsx), and the board page draws eight sections at once, so live canvases
 * everywhere would be two dozen 1920-wide rAF loops on one stage. Seven of the
 * eight decisions are about FURNITURE over a moving picture, and furniture is
 * judged honestly against a held frame. The one decision that is about MOTION
 * (`pacing`) gets real running players, three of them and no more (`wall.tsx`).
 *
 * ★ THE RASTER IS SMALLER THAN THE COMPOSITION, ON PURPOSE. The styles never
 * learn they are small: the env reports COMPOSITION space and one pre-scale
 * squeezes the draw onto the backing store (the shipped thumb path). So the
 * grade, the letterbox, the vignette and the Ken-Burns framing are the style's
 * own at any size, and the still costs a fraction of a full 1920 raster.
 *
 * Nothing here decodes on a timer, presigns, uploads or encodes.
 */

/** The long edge each still is rasterized at: sharp on the 1920 wall, cheap to hold. */
const STILL_MAX = 1440;

/**
 * The frames this board asks for, as CLIP INDICES rather than seconds: a hold is
 * a knob on this board, and the middle of clip four is the same photograph at
 * every pace, held alone rather than caught in a dissolve (`clipMidFrame`).
 */
const AT = {
  /** The picture nearly every decision sits over. */
  now: 4,
  /** A different photograph, for the beat where a fresh one has just landed. */
  fresh: 7,
  /** The reel's opening shot, for the Start plate drawn as its own first frame. */
  first: 0,
  /** Two more of the album, for the idle option that simply shows stills slowly. */
  idleA: 1,
  idleB: 9,
} as const;

export type StillId = keyof typeof AT;

/** One still: the engine's own frame at the wall's composition, as a data url. */
async function renderStill(
  props: ReelProps,
  frame: number,
  maxDim: number,
): Promise<string | null> {
  const composition = reelDimensions(props.orientation);
  const longest = Math.max(composition.width, composition.height);
  const ratio = Math.min(1, maxDim / longest);
  const w = Math.max(2, Math.round(composition.width * ratio));
  const h = Math.max(2, Math.round(composition.height * ratio));
  try {
    const assets = await loadReelAssets(props.clips, {
      ...resolveEngineStyle(props.styleId).assetNeeds(props),
      // A reduced frame normalizes its washes to itself, exactly as a thumb does.
      frame: { width: w, height: h },
      // The shared cache: five draws over one clip set cost one decode set.
      decode: sharedBitmapCache.decode,
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const env = makeScaledDrawEnv(composition);
    ctx.setTransform(w / composition.width, 0, 0, h / composition.height, 0, 0);
    drawReelFrame(ctx, frame, props, assets, env);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas.toDataURL("image/webp", 0.86);
  } catch {
    // A capability gap or a fixture that would not decode: the caller draws its
    // placeholder, which holds the same box, so nothing shifts.
    return null;
  }
}

export type Stills = Readonly<Partial<Record<StillId, string>>>;

/**
 * ★ ONE RENDER PASS PER SESSION, SHARED BY EVERY DECISION. The promise is a
 * module singleton, so eight decisions and their twenty-four options draw the
 * engine five times between them rather than five times each.
 */
let PASS: Promise<Stills> | null = null;

function startPass(): Promise<Stills> {
  if (PASS) return PASS;
  PASS = (async () => {
    const out: Partial<Record<StillId, string>> = {};
    const props = wallProps({ hold: "wall" });
    // Sequential on purpose: five parallel decodes on one main thread is how a
    // board arrives at its capture blank.
    for (const id of Object.keys(AT) as StillId[]) {
      const url = await renderStill(props, clipMidFrame(AT[id], props), STILL_MAX);
      if (url) out[id] = url;
    }
    return out;
  })();
  return PASS;
}

/** Subscribes a preview to the one pass. Empty until it lands; never throws. */
export function useStills(): Stills {
  const [stills, setStills] = useState<Stills>({});
  useEffect(() => {
    let alive = true;
    void startPass().then((s) => {
      if (alive) setStills(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  return stills;
}

/**
 * ONE REEL FRAME, FULL BLEED, at whatever box the caller gives it.
 *
 * The placeholder holds the exact 16:9 geometry and the style's own background,
 * so a still landing never shifts a layout a decision is being judged on.
 */
export function WallStill({
  id,
  className,
  label,
}: {
  id: StillId;
  className?: string;
  /** What this frame IS, for a reader with images off and for the tree. */
  label?: string;
}) {
  const src = useStills()[id] ?? null;
  return (
    <div
      data-rsc-still=""
      className={cn("absolute inset-0 bg-[#07080a]", className)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
        <img src={src} alt={label ?? ""} className="size-full object-cover" />
      ) : null}
    </div>
  );
}
