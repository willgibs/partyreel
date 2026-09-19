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

import { propsFor, REEL, STYLES } from "./fixtures";

/**
 * THE FOURTEEN LOOKS, DRAWN ONCE, AS STILLS.
 *
 * ★ REAL ENGINE PIXELS, NOT A RE-TYPED RECIPE. Every reel frame on this board
 * is `drawReelFrame` over the fixture clips: the same draw the live player runs
 * and the encoder steps, so a style's grade, its composition and its watermark
 * are the style's own and not a specimen's idea of them. A hand-drawn thumb
 * would be exactly the failure `publish-light.tsx` names: a board showing a
 * look production never had.
 *
 * ★ AND DRAWN ONCE FOR THE WHOLE BOARD, WHICH IS WHY IT IS A STILL. The step
 * MOUNTS every option of a decision at the same moment and hides all but one
 * (step.tsx), so a wall of fourteen live canvases and a rail of fourteen would
 * be twenty-eight players on one stage before the room's own is counted. The
 * shipped Studio protects itself by mounting the wall only while its sheet is
 * open; a board cannot. So the engine runs here ONCE per style, into an
 * offscreen canvas, and every option is handed the resulting image. It is also
 * what makes `lab:demo` trustworthy: a still stage compares as still, and the
 * difference a capture sees is the difference between two layouts.
 *
 * The frame and the size are the shipped rail's: frame 45, ~1.9s in, past the
 * opening transition so each still carries the style's grade AND its
 * composition character; the thumbs at a 320 px long edge (the rail asks 216
 * for a 64 px thumb, and this board draws some of them far bigger).
 *
 * Nothing here decodes on a timer, plays a clock, presigns, uploads or encodes.
 */

const THUMB_FRAME = 45;
const THUMB_CLIPS = 4;
const THUMB_MAX = 320;
/** The room's own reel, big enough for a frame that grows to fill a laptop. */
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
      // The shared cache: fifteen draws over one clip set cost one decode set.
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
  /** styleId to a data url, filling in as each draw lands. */
  byStyle: ReadonlyMap<string, string>;
  /** The room's reel at the host's own style, big. */
  hero: string | null;
};

/**
 * ★ ONE RENDER PASS PER SESSION, SHARED BY EVERY OPTION. The promise is a
 * module singleton, so the eight decisions and their twenty-four options draw
 * the engine fifteen times between them rather than fifteen times each.
 */
let PASS: Promise<Stills> | null = null;

function startPass(): Promise<Stills> {
  if (PASS) return PASS;
  PASS = (async () => {
    const byStyle = new Map<string, string>();
    // Sequential on purpose: fifteen parallel decodes on one main thread is how
    // a board arrives at its capture still blank.
    for (const style of STYLES) {
      const url = await renderStill(
        propsFor(style.id, { clips: THUMB_CLIPS }),
        THUMB_FRAME,
        THUMB_MAX,
      );
      if (url) byStyle.set(style.id, url);
    }
    const hero = await renderStill(
      propsFor(REEL.styleId),
      THUMB_FRAME,
      HERO_MAX,
    );
    return { byStyle, hero };
  })();
  return PASS;
}

/** Subscribes the board to the one pass. Empty until it lands; never throws. */
export function useStills(): Stills {
  const [stills, setStills] = useState<Stills>({
    byStyle: new Map(),
    hero: null,
  });
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
 * ONE REEL FRAME on the screen, at whatever box the caller gives it.
 *
 * The placeholder holds the exact 9:16 geometry, so a still landing never
 * shifts a layout an option is being judged on (the shipped StyleThumb's rule).
 */
export function ReelStill({
  src,
  className,
  style,
  label,
}: {
  src: string | null;
  className?: string;
  style?: CSSProperties;
  /** What this frame IS, for a reader with images off and for the tree. */
  label?: string;
}) {
  return (
    <div
      data-rs-reel
      className={cn(
        "relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-[oklch(0.16_0_0)]",
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
