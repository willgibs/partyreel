"use client";

import { useEffect, useState } from "react";

import { buildReelProps } from "@/lib/reel/build-reel-props";
import { sharedBitmapCache } from "@/lib/reel/engine/asset-cache";
import { loadReelAssets } from "@/lib/reel/engine/assets";
import { type Orientation, reelDimensions } from "@/lib/reel/engine/constants";
import { planReel } from "@/lib/reel/engine/layout";
import {
  drawReelFrame,
  makeScaledDrawEnv,
  resolveEngineStyle,
} from "@/lib/reel/engine/registry";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import type { ThemeId } from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

import { BY_ID, MOODS, TAKE, TAKE_IDS } from "./fixtures";

/**
 * EVERY REEL FRAME ON THIS BOARD IS THE REAL ENGINE'S, DRAWN ONCE.
 *
 * ★ REAL ENGINE PIXELS, NEVER A RETYPED RECIPE, AND NEVER A RAW PHOTOGRAPH
 * STANDING IN FOR A FRAME. An album photograph behind the view's chrome is a
 * picture of a slideshow, not of the reel: no grade, no framing, no mood.
 * Every view, screen and mood swatch here is
 * `drawReelFrame` over the reel's own take (`TAKE_IDS`), the same draw the live
 * player runs.
 *
 * ★ DRAWN ONCE, OFF-DOM, HANDED ACROSS AS A STRING. A `Frame` portals its JSX
 * from THIS realm into the iframe's document, so a live canvas player reaching
 * for `document` or `IntersectionObserver` would attach to the lab page's
 * globals. A data url needs no realm at all. The pass is a module singleton:
 * every question and option here draws the engine ten times between them, not
 * ten times each.
 *
 * ★ THE MIDDLE OF A CLIP'S HOLD, NEVER A CLOCK TIME. A still picked by the clock
 * lands in a dissolve: clips overlap by their
 * transition frames, so the middle of a hold is the one place a single
 * photograph is on screen alone.
 */

/**
 * The look every view wears while its chrome is judged: Sunset, full bleed. The
 * engine on this tree still draws Cinematic's letterbox in landscape, which
 * would put a laptop view's corners over black bars; the reel round's build
 * fills every mood edge to edge in landscape, which Sunset already shows.
 */
export const VIEW_STYLE = "golden";
const SEED = 41_726;

function propsFor(opts: {
  orientation: Orientation;
  styleId?: string;
  clips?: number;
}): ReelProps {
  return buildReelProps({
    orderedIds: opts.clips ? TAKE_IDS.slice(0, opts.clips) : TAKE_IDS,
    byId: BY_ID,
    styleId: opts.styleId ?? VIEW_STYLE,
    seed: SEED,
    orientation: opts.orientation,
    coverMediaId: null,
    // The live reel is never capped and never marked.
    lengthSeconds: null,
    watermark: false,
  });
}

/** The frame in the middle of clip `index`'s hold, read off the engine's own plan. */
function clipMidFrame(index: number, props: ReelProps): number {
  const plan = planReel(props);
  const n = plan.clips.length;
  if (n === 0) return 0;
  const k = ((index % n) + n) % n;
  let start = 0;
  for (let i = 0; i < k; i++) {
    start +=
      plan.clips[i].durationInFrames - (plan.gaps[i]?.durationInFrames ?? 0);
  }
  return Math.round(start + plan.clips[k].durationInFrames / 2);
}

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
    // A capability gap or a fixture that would not decode: the caller's
    // placeholder holds the same box, so nothing shifts.
    return null;
  }
}

export type StillId = "landscape" | "portrait" | `mood-${ThemeId}`;
export type Stills = Readonly<Partial<Record<StillId, string>>>;

type Listener = (s: Stills) => void;
let CACHE: Stills = {};
let STARTED = false;
const LISTENERS = new Set<Listener>();

function publish(next: Stills) {
  CACHE = next;
  for (const l of LISTENERS) l(CACHE);
}

/** The clip every mood swatch sits on: the take's fourth, held alone. */
const AT = 3;

/**
 * ★ A CLIP THAT FILLS ITS POSTURE. The engine fits a photograph whose shape
 * fights the composition over a blurred backdrop (its own honest fill), so a
 * landscape photograph in the portrait view drew a band across the middle of a
 * phone. `posture=follow` is "full-bleed, the composition following the
 * viewport", so each view sits on the take's first clip, from the fourth on,
 * whose own shape matches it: the same engine, the reel's own order.
 */
function clipFor(orientation: Orientation): number {
  const fits = (w: number, h: number) =>
    orientation === "landscape" ? w > h : h > w;
  for (let i = AT; i < TAKE.length; i++) {
    const { width, height } = TAKE[i];
    if (width && height && fits(width, height)) return i;
  }
  return AT;
}

function startPass() {
  if (STARTED) return;
  STARTED = true;
  void (async () => {
    // Sequential on purpose: parallel decodes on one main thread is how a board
    // reaches its capture blank. The two views first, because five of the
    // seven questions draw one.
    for (const orientation of ["landscape", "portrait"] as const) {
      const props = propsFor({ orientation });
      const url = await renderStill(
        props,
        clipMidFrame(clipFor(orientation), props),
        1440,
      );
      if (url) publish({ ...CACHE, [orientation]: url });
    }
    // The eight moods over ONE photograph, so the swatches differ in the grade
    // and the framing alone. Four clips is enough for the hold to be the
    // mood's own and cheap to plan.
    for (const mood of MOODS) {
      const props = propsFor({
        orientation: "landscape",
        styleId: mood.id,
        clips: 4,
      });
      const url = await renderStill(props, clipMidFrame(AT, props), 360);
      if (url) publish({ ...CACHE, [`mood-${mood.id}`]: url });
    }
  })();
}

/**
 * Subscribes a preview to the one pass. Empty until it lands; never throws.
 * ★ THE LAZY INITIALIZER READS THE CACHE, so a section that mounts after the
 * pass finished paints its frame on the first render instead of one empty one.
 */
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
 * placeholder holds the box on the style's own near-black, so a frame landing
 * never shifts a layout a decision is judged on.
 */
export function EngineStill({
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
      data-rh-still={id}
      className={cn("absolute inset-0 bg-[#07080a]", className)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a data url the engine just drew
        <img src={src} alt={label ?? ""} className="size-full object-cover" />
      ) : null}
    </div>
  );
}
