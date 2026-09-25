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

import { clipMidFrame, FIRST_PHOTO, screenProps } from "./fixtures";

/**
 * THE SCREEN'S PICTURES, DRAWN BY THE REAL ENGINE, ONCE.
 *
 * ★ REAL ENGINE PIXELS, NEVER A RETYPED RECIPE. Every reel frame on this board
 * is `drawReelFrame` over the reel's own take: the same draw the live player
 * runs, at the engine's own LANDSCAPE composition (1920 by 1080), which is this
 * board's stage exactly.
 *
 * ★ DRAWN ONCE, OFF-DOM, HANDED ACROSS AS A STRING. A `Frame` portals its JSX
 * from this realm into the iframe's document, so a live canvas player would
 * reach for the lab page's own globals; a data url needs no realm at all.
 * Every question here is about a plate, an empty screen or the dock, each
 * judged against a held frame, so two stills are the whole of the engine this
 * board needs.
 *
 * ★ THE RASTER IS SMALLER THAN THE COMPOSITION, ON PURPOSE. The env reports
 * COMPOSITION space and one pre-scale squeezes the draw onto the backing store
 * (the shipped thumb path), so the grade and the framing are the style's own
 * at any size.
 */

const STILL_MAX = 1440;

export type StillId = "first" | "idle";

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
      frame: { width: w, height: h },
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

type Listener = (s: Stills) => void;
let CACHE: Stills = {};
let STARTED = false;
const LISTENERS = new Set<Listener>();

function publish(next: Stills) {
  CACHE = next;
  for (const l of LISTENERS) l(CACHE);
}

function startPass() {
  if (STARTED) return;
  STARTED = true;
  void (async () => {
    // The reel's opening shot, held alone: the Start plate drawn as its own
    // first frame.
    const take = screenProps();
    const first = await renderStill(take, clipMidFrame(0, take), STILL_MAX);
    if (first) publish({ ...CACHE, first });
    // The one photograph there is, as a reel of one: what the screen would
    // hold before the second arrives.
    const one = screenProps({ only: FIRST_PHOTO });
    const idle = await renderStill(one, clipMidFrame(0, one), STILL_MAX);
    if (idle) publish({ ...CACHE, idle });
  })();
}

/** Subscribes a preview to the one pass. Empty until it lands; never throws. */
export function useStills(): Stills {
  const [stills, setStills] = useState<Stills>(() => CACHE);
  useEffect(() => {
    LISTENERS.add(setStills);
    startPass();
    return () => {
      LISTENERS.delete(setStills);
    };
  }, []);
  return stills;
}

/**
 * ONE REEL FRAME, FULL BLEED, at whatever box the caller gives it. The
 * placeholder holds the exact 16:9 box on the style's own near-black, so a
 * still landing never shifts a layout a decision is being judged on.
 */
export function ScreenStill({
  id,
  className,
  label,
}: {
  id: StillId;
  className?: string;
  label?: string;
}) {
  const src = useStills()[id] ?? null;
  return (
    <div
      data-rsc-still={id}
      className={cn("absolute inset-0 bg-[#07080a]", className)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
        <img src={src} alt={label ?? ""} className="size-full object-cover" />
      ) : null}
    </div>
  );
}
