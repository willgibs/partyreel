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

import { fillIds, propsFor, STYLES } from "./fixtures";
import type { FillId, Maker } from "./fixtures";

/**
 * EVERY CLIP FRAME ON THIS BOARD IS THE REAL ENGINE, DRAWN ONCE PER KEY.
 *
 * ★ REAL PIXELS, NOT A RE-TYPED RECIPE. `drawReelFrame` over the fixture
 * moments: the draw the live player runs and the encoder steps, so a look's
 * grade, its composition and the free mark are the engine's own. The mark is
 * stamped in the DISPATCH layer (engine/registry.ts), so the only honest way to
 * draw a free event's clip is to let the engine stamp it.
 *
 * ★ A STILL, BECAUSE THE STEP MOUNTS EVERY OPTION AT ONCE (step.tsx). Three
 * whole creators at two sizes, each with fourteen look tiles, would be dozens
 * of live canvases; the shipped composer survives its own wall only by
 * mounting it while the sheet is open, and a board cannot. So each distinct
 * picture renders ONCE into an offscreen canvas and every frame that shows it
 * is handed the image. A still stage also compares as still in `lab:demo`.
 *
 * ★ LAZY AND KEYED, WHERE ROUND ONE DREW ONE FIXED PASS. The knobs now move the
 * picture itself (the look a clip wears, the fill it starts from, the free
 * mark), so a still is keyed by what it shows and drawn the first time a frame
 * asks for it. One queue, SEQUENTIAL on purpose: parallel decodes on one main
 * thread are how a board arrives at its capture still blank. The shared bitmap
 * cache makes every draw after the first cost a draw, not a decode.
 *
 * Nothing here decodes on a timer, plays a clock, presigns, uploads or encodes.
 */

/** Frame 45, about 1.9s in: past the opening transition, so a still carries the
 *  look's grade AND its composition character (the shipped rail's own frame). */
const FRAME = 45;
const THUMB_CLIPS = 4;
const THUMB_MAX = 320;
/** The clip's own frame, big enough to fill a laptop's height crisply. */
const HERO_MAX = 760;

export type StillSpec = {
  style: string;
  fill: FillId;
  maker?: Maker;
  /** The free event's mark, stamped by the engine. */
  mark?: boolean;
  size: "thumb" | "hero";
};

async function renderStill(
  props: ReelProps,
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
      decode: sharedBitmapCache.decode,
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // The styles never learn they are small: the env reports COMPOSITION space
    // and one pre-scale squeezes the draw onto the backing store.
    const env = makeScaledDrawEnv(composition);
    ctx.setTransform(w / composition.width, 0, 0, h / composition.height, 0, 0);
    drawReelFrame(ctx, FRAME, props, assets, env);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas.toDataURL("image/webp", 0.86);
  } catch {
    // A capability gap or a fixture that would not decode: the caller draws its
    // placeholder, which holds the same box, so nothing shifts.
    return null;
  }
}

/** Who is making it changes the members of "Only mine" and nothing else, so
 *  every other fill shares one picture between the guest and the host. */
const keyOf = (s: StillSpec) =>
  `${s.size}:${s.style}:${s.fill}:${s.fill === "mine" ? (s.maker ?? "guest") : "any"}:${s.mark ? "mark" : "clean"}`;

/** One promise per picture, for the whole session: every option and every
 *  frame asking for the same still shares one draw. */
const CACHE = new Map<string, Promise<string | null>>();
let QUEUE: Promise<unknown> = Promise.resolve();

function request(spec: StillSpec): Promise<string | null> {
  const key = keyOf(spec);
  const hit = CACHE.get(key);
  if (hit) return hit;
  const ids = fillIds(spec.fill, spec.maker);
  const job = QUEUE.then(() =>
    renderStill(
      spec.size === "thumb"
        ? propsFor(spec.style, { ids, clips: THUMB_CLIPS })
        : propsFor(spec.style, { ids, watermark: spec.mark }),
      spec.size === "thumb" ? THUMB_MAX : HERO_MAX,
    ),
  );
  QUEUE = job.catch(() => null);
  CACHE.set(key, job);
  return job;
}

/** One still, or null until it lands. Never throws. */
export function useStill(spec: StillSpec): string | null {
  const key = keyOf(spec);
  const [got, setGot] = useState<{ key: string; src: string | null }>();
  useEffect(() => {
    let alive = true;
    void request(spec).then((src) => {
      if (alive) setGot({ key, src });
    });
    return () => {
      alive = false;
    };
    // `spec` is fully described by `key`; a fresh object literal each render
    // must not re-request the same picture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return got?.key === key ? got.src : null;
}

/**
 * The fourteen looks, each HER clip (the fill she is on) through that look,
 * landing one by one in catalog order. A tile holds its box until its still
 * arrives, so nothing shifts under a reader.
 */
export function useLookThumbs(
  fill: FillId,
  maker: Maker,
): ReadonlyMap<string, string> {
  const tag = `${fill}:${maker}`;
  const [got, setGot] = useState<{
    tag: string;
    thumbs: ReadonlyMap<string, string>;
  }>();
  useEffect(() => {
    let alive = true;
    const thumbs = new Map<string, string>();
    for (const s of STYLES) {
      void request({ style: s.id, fill, maker, size: "thumb" }).then((src) => {
        if (!alive || !src) return;
        thumbs.set(s.id, src);
        setGot({ tag, thumbs: new Map(thumbs) });
      });
    }
    return () => {
      alive = false;
    };
  }, [tag, fill, maker]);
  return got?.tag === tag ? got.thumbs : EMPTY;
}

const EMPTY: ReadonlyMap<string, string> = new Map();

/**
 * ONE CLIP FRAME on the screen, at whatever box the caller gives it. The
 * placeholder holds the exact geometry, so a still landing never shifts a
 * layout an option is being judged on (the shipped StyleThumb's own rule).
 */
export function ClipStill({
  src,
  className,
  style,
  label,
  rounded = "rounded-xl",
  role = "hero",
}: {
  src: string | null;
  className?: string;
  style?: CSSProperties;
  /** What this frame IS, for a reader with images off and for the tree. */
  label?: string;
  rounded?: string;
  /** The clip itself, or one look's tile: the readers measure only the clip. */
  role?: "hero" | "look";
}) {
  return (
    <div
      data-rc-clip={role}
      className={cn(
        "relative aspect-[9/16] w-full overflow-hidden bg-[oklch(0.16_0_0)]",
        rounded,
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
