"use client";

import { useEffect, useState, type CSSProperties } from "react";

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

import { CUT, FILLS, fillIds, GUEST_POOL, propsFor, STYLES } from "./fixtures";
import type { FillId } from "./fixtures";

/**
 * EVERY REEL FRAME ON THIS BOARD IS THE REAL ENGINE, DRAWN ONCE.
 *
 * ★ REAL PIXELS, NOT A RE-TYPED RECIPE. `drawReelFrame` over the fixture
 * clips: the same draw the live player runs and the encoder steps, so a look's
 * grade, its composition and its free mark are the engine's own and not a
 * specimen's idea of them. The mark in particular is stamped in the DISPATCH
 * layer (engine/registry.ts, "no style may ever export unmarked"), so the only
 * honest way to ask `mark` is to let the engine stamp it: every marked frame
 * here carries it exactly where the file will.
 *
 * ★ AND DRAWN ONCE FOR THE WHOLE BOARD, WHICH IS WHY IT IS A STILL. The step
 * MOUNTS every option of a decision at the same moment and hides all but one
 * (step.tsx), so `looks` alone would be three walls of fourteen live canvases
 * before the room's own player is counted. The shipped composer protects
 * itself by mounting its wall only while the sheet is open; a board cannot. So
 * the engine runs ONCE per artifact here, into an offscreen canvas, and every
 * option is handed the resulting image. It is what makes `lab:demo`
 * trustworthy too: a still stage compares as still, so the difference a
 * capture sees is the difference between two layouts.
 *
 * Nothing here decodes on a timer, plays a clock, presigns, uploads or encodes.
 */

/** Frame 45, about 1.9s in: past the opening transition, so a still carries the
 *  look's grade AND its composition character (the shipped rail's own frame). */
const THUMB_FRAME = 45;
const THUMB_CLIPS = 4;
const THUMB_MAX = 320;
/** The creator's own cut, big enough for a frame that grows to fill a laptop. */
const HERO_MAX = 760;

/** One still: the engine's own frame, as a data url. */
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
      // The shared cache: eighteen draws over one clip set cost one decode set.
      decode: sharedBitmapCache.decode,
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // The styles never learn they are small: the env reports COMPOSITION space
    // and one pre-scale squeezes the draw onto the backing store (the player's
    // own thumb path, copied because this one is offscreen).
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

export type Stills = {
  /** styleId to a data url: the fourteen looks, each of HER clips. */
  byStyle: ReadonlyMap<string, string>;
  /** The cut at each fill, big: what the creator's own frame is showing. */
  byFill: ReadonlyMap<FillId, string>;
  /** The same cut with the free mark the engine stamps, for `mark`. */
  marked: string | null;
};

const EMPTY: Stills = {
  byStyle: new Map(),
  byFill: new Map(),
  marked: null,
};

/**
 * ★ ONE RENDER PASS PER SESSION, SHARED BY EVERY OPTION. The promise is a
 * module singleton, so nine decisions and their twenty-seven options draw the
 * engine eighteen times between them rather than eighteen times each.
 */
let PASS: Promise<Stills> | null = null;

function startPass(): Promise<Stills> {
  if (PASS) return PASS;
  PASS = (async () => {
    const byStyle = new Map<string, string>();
    // Sequential on purpose: eighteen parallel decodes on one main thread is
    // how a board arrives at its capture still blank.
    for (const style of STYLES) {
      const url = await renderStill(
        propsFor(style.id, { clips: THUMB_CLIPS }),
        THUMB_FRAME,
        THUMB_MAX,
      );
      if (url) byStyle.set(style.id, url);
    }
    const byFill = new Map<FillId, string>();
    for (const fill of FILLS) {
      const ids = fillIds(fill, GUEST_POOL);
      const url = await renderStill(
        propsFor(CUT.styleId, { ids }),
        THUMB_FRAME,
        HERO_MAX,
      );
      if (url) byFill.set(fill, url);
    }
    const marked = await renderStill(
      propsFor(CUT.styleId, { watermark: true }),
      THUMB_FRAME,
      HERO_MAX,
    );
    return { byStyle, byFill, marked };
  })();
  return PASS;
}

/** Subscribes the board to the one pass. Empty until it lands; never throws. */
export function useStills(): Stills {
  const [stills, setStills] = useState<Stills>(EMPTY);
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
 * ONE CUT FRAME on the screen, at whatever box the caller gives it.
 *
 * The placeholder holds the exact geometry, so a still landing never shifts a
 * layout an option is being judged on (the shipped StyleThumb's own rule).
 */
export function CutStill({
  src,
  landscape,
  className,
  style,
  label,
}: {
  src: string | null;
  landscape?: boolean;
  className?: string;
  style?: CSSProperties;
  /** What this frame IS, for a reader with images off and for the tree. */
  label?: string;
}) {
  return (
    <div
      data-rc-cut
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-[oklch(0.16_0_0)]",
        landscape ? "aspect-[16/9]" : "aspect-[9/16]",
        className,
      )}
      style={style}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
        <img src={src} alt={label ?? ""} className="size-full object-cover" />
      ) : null}
    </div>
  );
}
