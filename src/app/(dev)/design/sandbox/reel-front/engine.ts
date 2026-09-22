"use client";

import { useEffect, useState } from "react";

import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets, type ReelAssets } from "@/lib/reel/engine/assets";
import { reelDimensions } from "@/lib/reel/engine/constants";
import {
  drawReelFrame,
  engineStyleDuration,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import type { ReelProps } from "@/lib/reel/engine/reel-types";

import { propsFor } from "./fixtures";

/**
 * REAL ENGINE PIXELS, RENDERED ONCE, NEVER A LIVE CANVAS INSIDE A FRAME.
 *
 * `Frame`'s portalled scenes (`frame.tsx`) run their JSX in THIS module's own
 * realm and only their DOM lands in the iframe's document (`createPortal`), so
 * a component that reaches for a bare `document`/`window`/`IntersectionObserver`
 * — exactly what `CanvasReelPlayer` does for its visibility gating and its
 * reduced-motion query — would attach to the LAB PAGE's globals, not the
 * scene's. `reel-studio`'s own `stills.tsx` (git show 90f29be4, retired
 * unreviewed at this round's cut) solved this the only safe way: draw with
 * `drawReelFrame` directly, off-DOM, and hand the result across the portal
 * boundary as a plain string. A `<img src>` and a CSS crossfade need no realm
 * at all, so that is what plays everywhere motion is judged here.
 *
 * ★ ONE DECODE, THEN SIX SYNCHRONOUS DRAWS (found running `lab:demo`: two hub
 * options landed as the same picture because the pass was still empty at
 * capture). `loadReelAssets` decodes and builds the clip set's washes ONCE, at
 * one size; `drawReelFrame(ctx, frameNumber, props, assets, env)` takes the
 * timeline position SEPARATELY and is a synchronous canvas op, so the six
 * frames cost one await, not six. Rendering them sequentially in reel-studio's
 * own precedent guarded against fifteen STYLES worth of full asset loads on
 * one thread; this board has one style and one already-shared decode, so the
 * remaining cost is six cheap draws, done back to back once the assets land.
 * State updates as each frame is pushed, so a slow first paint still shows a
 * still as early as possible rather than holding out for the whole set.
 */

const FRAME_COUNT = 6;
const MAX_DIM = 480;

/** The frame the "framed still" and "one still" depictions lock to: past the
 *  opening transition, so it carries the style's grade and composition. */
export const HERO_FRAME_INDEX = 2;

function drawOne(
  props: ReelProps,
  frame: number,
  assets: ReelAssets,
  w: number,
  h: number,
  composition: { width: number; height: number },
): string | null {
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
}

export type EngineFrames = {
  /** Data URLs, landing as each draw finishes. Empty until the first arrives. */
  frames: string[];
  /** The frame this take's grade first reads as fully "in" its composition. */
  heroIndex: number;
};

type Listener = (frames: string[]) => void;
let CACHE: string[] = [];
let STARTED = false;
const LISTENERS = new Set<Listener>();

function notify() {
  for (const l of LISTENERS) l([...CACHE]);
}

function startPass() {
  if (STARTED) return;
  STARTED = true;
  void (async () => {
    const props = propsFor();
    const composition = reelDimensions(props.orientation);
    const longest = Math.max(composition.width, composition.height);
    const ratio = Math.min(1, MAX_DIM / longest);
    const w = Math.max(2, Math.round(composition.width * ratio));
    const h = Math.max(2, Math.round(composition.height * ratio));
    try {
      const assets = await loadReelAssets(props.clips, {
        ...resolveEngineStyle(props.styleId).assetNeeds(props),
        frame: { width: w, height: h },
        decode: sharedBitmapCache.decode,
      });
      const duration = Math.max(1, engineStyleDuration(props.styleId, props));
      const frameNumbers = Array.from({ length: FRAME_COUNT }, (_, i) =>
        Math.round((i * (duration - 1)) / (FRAME_COUNT - 1)),
      );
      for (const f of frameNumbers) {
        const url = drawOne(props, f, assets, w, h, composition);
        if (url) {
          CACHE = [...CACHE, url];
          notify();
        }
      }
    } catch {
      // A capability gap (no 2d context, a fixture that would not decode):
      // every caller's placeholder holds the same box; CACHE just stays empty.
    }
  })();
}

/**
 * Subscribes to the one render pass. Never throws.
 *
 * ★ THE LAZY INITIALIZER, NOT A CORRECTIVE setState IN THE EFFECT
 * (`react-hooks/set-state-in-effect`). A later section approaching the same
 * cache after an earlier one already finished the pass must not render one
 * frame empty before catching up: reading `CACHE` in `useState`'s initializer
 * answers that at the FIRST render instead, and nothing can race it, since no
 * promise callback runs between this render and the effect below committing
 * (JS has one thread; `startPass`'s `await`s cannot land in that gap).
 */
export function useEngineFrames(): EngineFrames {
  const [frames, setFrames] = useState<string[]>(() => [...CACHE]);
  useEffect(() => {
    LISTENERS.add(setFrames);
    startPass();
    return () => {
      LISTENERS.delete(setFrames);
    };
  }, []);
  return { frames, heroIndex: Math.min(HERO_FRAME_INDEX, frames.length - 1) };
}
