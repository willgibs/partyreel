"use client";

import { useEffect, useState } from "react";

/**
 * LAW 3, made real: the spill takes its colour FROM the media it is lighting.
 *
 * The doctrine round's central experiment was whether that matters. It shipped
 * at round 1: before it, the glow was the one place on the site where colour
 * was INVENTED rather than photographed, which made it an exception to the
 * ratified identity ("media is the colour") dressed up as an expression of it.
 * Sampling makes it an argument for the identity instead.
 *
 * ── WHY THE SAMPLE IS HUE-ONLY ──
 * We keep the photograph's HUES and discard its lightness and chroma, pinning
 * both to the atmosphere register the ratified five already sit in (L 0.72,
 * C 0.15). That is not a shortcut, it is what makes the experiment readable:
 * sampled and fallback palettes then differ in exactly ONE variable, so a
 * side-by-side answers "do the photo's hues matter" rather than "is this one
 * brighter". It also stops a dark photo from producing a spill that is not
 * light, which would break law 4 by another route.
 *
 * Runs once per lamp, on a 32px thumbnail, and there is at most one lamp per
 * view. No dependency: OKLCH conversion is ~20 lines of published matrix math.
 */

/** A fifth of the wheel: enough that five hues cannot share one quadrant. */
const MIN_HUE_SEPARATION = 45;

/** sRGB (0-255) -> OKLCH. The standard Björn Ottosson transform. */
export function srgbToOklch(
  r: number,
  g: number,
  b: number,
): { l: number; c: number; h: number } {
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.sqrt(A * A + Bb * Bb);
  let h = (Math.atan2(Bb, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

/**
 * THE REGISTER a sampled hue is normalised into. Two of them, because a ground
 * changes what "light" means.
 *
 * On a dark ground, light ADDS: a mid-light wash lifts the surface and reads
 * luminous. On near-white paper the same wash DARKENS what it covers, and a
 * warm mid-light cast over white does not read as light at all, it reads as
 * stain. Will caught this on the paper probe, where a foliage photo sampled to
 * five hues between 34 and 158 degrees and the card looked dirty rather than
 * lit. The fix is not less colour, it is a lighter, calmer register that sits
 * near the paper's own lightness.
 */
export const SPILL_REGISTER = {
  dark: { l: 0.72, c: 0.15 },
  paper: { l: 0.88, c: 0.08 },
} as const;

export type SpillRegister = keyof typeof SPILL_REGISTER;

/**
 * Pick `count` well-separated hues out of raw RGBA pixels, weighted by how much
 * of the image carries them and how colourful they are.
 *
 * Pure and exported so the bucketing is unit-testable without a canvas.
 */
export function pickSpillHues(
  pixels: Uint8ClampedArray,
  count = 5,
  minSeparation = MIN_HUE_SEPARATION,
): { hue: number; weight: number }[] {
  // 24 buckets = 15 degrees each: fine enough to keep teal and green apart,
  // coarse enough that noise in one leaf does not become a "colour".
  const BUCKETS = 24;
  const weight = new Array<number>(BUCKETS).fill(0);
  const hueSum = new Array<number>(BUCKETS).fill(0);

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue; // transparent
    const { l, c, h } = srgbToOklch(pixels[i], pixels[i + 1], pixels[i + 2]);
    // Near-black and near-white pixels have unstable hue and would drag the
    // result toward whatever noise their channels carry. A photograph's actual
    // colour lives in the midtones.
    if (l < 0.18 || l > 0.95) continue;
    if (c < 0.02) continue;
    const b = Math.min(BUCKETS - 1, Math.floor((h / 360) * BUCKETS));
    // Chroma-weighted: a small saturated highlight says more about a scene's
    // colour than a large desaturated wall.
    const w = c;
    weight[b] += w;
    hueSum[b] += h * w;
  }

  const ranked = weight
    .map((w, b) => ({ w, hue: w > 0 ? hueSum[b] / w : b * (360 / BUCKETS) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w);

  const out: { hue: number; weight: number }[] = [];
  for (const cand of ranked) {
    if (out.length >= count) break;
    // Keep the set a spread of light rather than five neighbours. 25 degrees
    // was too lax: a foliage photograph returned 34/68/97/130/158, five hues
    // inside one quadrant, which composites to mud. A fifth of the wheel forces
    // the set to actually span.
    const tooClose = out.some((o) => {
      const d = Math.abs(o.hue - cand.hue);
      return Math.min(d, 360 - d) < minSeparation;
    });
    if (!tooClose) out.push({ hue: cand.hue, weight: cand.w });
  }
  // A monochrome photograph legitimately yields fewer than `count` hues, and a
  // strict separation makes that more common. Fan the remainder out AROUND the
  // wheel rather than crowding the last one, so a single-hue image still
  // produces a spread instead of five neighbours.
  const step = 360 / count;
  for (let i = out.length; out.length > 0 && out.length < count; i++) {
    out.push({
      hue: (out[0].hue + step * i) % 360,
      weight: out[0].weight * 0.5,
    });
  }
  return out;
}

export function huesToSpillColors(
  hues: { hue: number }[],
  register: SpillRegister = "dark",
): string[] {
  const { l, c } = SPILL_REGISTER[register];
  return hues.map((h) => `oklch(${l} ${c} ${h.hue.toFixed(1)})`);
}

/**
 * ★★ SAME-ORIGIN ONLY, AND THAT EXCLUDES OUR REAL MEDIA (recorded at the glow
 * merge, 2026-08-31). This draws the image to a canvas and calls getImageData,
 * and it sets no crossOrigin. Every guest photo and video is presigned against
 * *.r2.cloudflarestorage.com (src/lib/r2/client.ts), a DIFFERENT ORIGIN, so the
 * canvas taints, getImageData throws SecurityError, and the catch below returns
 * the fallback five. That failure is SILENT by construction: no console error,
 * no failing test, no tell beyond "the colours look generic", which means law 3
 * would quietly stop being true on exactly the surfaces that have real media.
 * The lab never caught it because every specimen samples marketingImage(...),
 * which Next serves same-origin.
 *
 * ★ AND THE FIX IS MUCH SMALLER THAN THIS FILE USED TO CLAIM (round 1,
 * 2026-09-01). The note here, and the ROADMAP, both listed the R2 CORS rule as
 * work still to do. It is already live and already proven in production: the
 * reel's canvas engine CORS-fetches presigned R2 media, decodes it, draws it
 * and reads the canvas back on every export -- strictly more than this hook
 * needs -- via decodeImage() in src/lib/reel/engine/assets.ts. A tainted canvas
 * would throw at encode time, and it does not.
 *
 * So the guest-media unblock is: swap the loader for that same decodeImage and
 * point it at previewUrl (the ~16KB client-generated WebP already presigned for
 * every row, which is what the tiles serve and what covers video posters too).
 * Reuse it rather than setting crossOrigin by hand -- its `cache: "no-store"`
 * is load-bearing, because a plain <img> tile fetches the same URL with no
 * Origin, R2 answers without ACAO and without Vary: Origin, and a later CORS
 * fetch reads the poisoned entry (see uploads-and-r2.md).
 *
 * Storing a palette on the media row is still possible but is now the EXPENSIVE
 * option, not the better one: no server-side image decode exists anywhere in
 * this stack, media has no palette column, and the insert path is a locked-down
 * SECURITY DEFINER RPC whose signature would have to change.
 *
 * Marketing surfaces are unaffected and sample correctly today.
 *
 * Sample same-origin media into a spill palette. Returns null until it resolves
 * (callers fall back to the ratified five, which is law 3's no-media branch, so
 * there is never an unlit frame).
 *
 * Takes MORE THAN ONE source on purpose. A hero wall is eight photographs, and
 * sampling only the first produces light that is honest about one tile and
 * arbitrary about the rest, which is precisely the criticism law 3 exists to
 * answer. Every source is drawn into one small canvas as a strip, so "the
 * wall's colour" is a single read over all of it rather than an average of
 * separate reads.
 */
/**
 * The shared sample: draw every source into one 32px strip and read it back.
 *
 * A STRIP, not an average of separate reads: a wall of photographs is ONE lamp,
 * so its hues come from all of it at once, weighted by how much chroma each
 * tile actually contributes. Averaging per-image palettes would give a tile in
 * the corner the same vote as the one filling the frame.
 */
function paletteFromImages(
  images: CanvasImageSource[],
  register: SpillRegister,
): string[] | null {
  const CELL = 32;
  const canvas = document.createElement("canvas");
  canvas.width = CELL * images.length;
  canvas.height = CELL;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) return null;
  images.forEach((img, i) => {
    ctx.drawImage(img, i * CELL, 0, CELL, CELL);
  });
  const data = ctx.getImageData(0, 0, canvas.width, CELL).data;
  return huesToSpillColors(pickSpillHues(data, 5), register);
}

/** Run work off the critical path, with a fallback where rIC is unavailable. */
function whenIdle(fn: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout: 1200 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 200);
  return () => clearTimeout(id);
}

/**
 * Sample from URLs. The LAB's form: a board has no rendered <img> to read, only
 * marketingImage(...) strings, so it fetches its own copies.
 *
 * ★ PRODUCTION SHOULD USE useSampledPaletteFromDom INSTEAD. On a real page the
 * images are already in the DOM and already decoded, and this form re-fetches
 * the ORIGINALS: next/image serves /_next/image?url=..., a different URL, so
 * nothing here is a cache hit. On the home page's wall that is ~1.05 MB of
 * full-resolution JPEG requested purely to read 32x32 of each.
 */
export function useSampledPalette(
  src: string | readonly string[] | null,
  register: SpillRegister = "dark",
): string[] | null {
  // Keyed by the src that produced it, so switching lamps DERIVES null during
  // render instead of resetting state inside the effect (the repo's
  // react-hooks lint bans setState-in-effect sync resets; the
  // adjust-state-during-render pattern is the house answer).
  const [state, setState] = useState<{ key: string; colors: string[] } | null>(
    null,
  );
  const sources = src == null ? [] : typeof src === "string" ? [src] : [...src];
  const key = sources.join("|");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const list = key.split("|");
    Promise.all(
      list.map((one) => {
        const img = new Image();
        img.decoding = "async";
        img.src = one;
        return img.decode().then(() => img);
      }),
    )
      .then((images) => {
        if (cancelled) return;
        const colors = paletteFromImages(images, register);
        if (colors) setState({ key, colors });
      })
      .catch(() => {
        // A decode failure is not an error state for a decorative layer: the
        // fallback palette is already correct. See the CROSS-ORIGIN note in
        // this file's header for the one failure this silence hides.
      });
    return () => {
      cancelled = true;
    };
  }, [key, register]);

  return state && state.key === key ? state.colors : null;
}

/**
 * Sample from the DOM: read the <img> elements the page has ALREADY painted.
 *
 * This is the production form, and the difference is not a micro-optimisation.
 * drawImage() on a live HTMLImageElement reuses the bitmap the browser already
 * decoded, so a lamp costs ZERO new bytes, ZERO new requests and ZERO extra
 * decodes. The URL form above costs a megabyte on the home page's wall.
 *
 * It is also more honest about law 3. The light becomes the colour of what the
 * visitor is actually looking at, rather than of a list of ids that happens to
 * be nearby in the source.
 *
 * ★ NEVER CALLS img.decode(). A wall mixes eager and lazy tiles; decode() on a
 * `loading="lazy"` element forces the fetch it was deliberately deferring, so
 * the lamp would undo the page's own loading strategy to colour itself. Only
 * already-complete images are read, and incomplete ones are awaited with a
 * one-shot `load` listener instead.
 *
 * ★ DOES NOT SOLVE THE R2 TAINT. Same-origin by construction for next/image
 * output (/_next/image is always same-origin), which is a real robustness gain
 * over passing URLs. But a guest photo rendered straight from a presigned R2
 * URL still taints the canvas exactly as before, so this does not close the
 * guest-media prerequisite. See the CROSS-ORIGIN note in the header.
 */
export function useSampledPaletteFromDom(
  ref: { current: HTMLElement | null },
  opts: {
    /** Read at most this many images (the wall samples its eager run). */
    limit?: number;
    register?: SpillRegister;
    /** Skip entirely below this viewport width, canvas work included. */
    minWidth?: number;
  } = {},
): string[] | null {
  const { limit, register = "dark", minWidth } = opts;
  const [colors, setColors] = useState<string[] | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    // Read at EFFECT time, never during render: a render-time matchMedia is a
    // hydration mismatch waiting to happen.
    if (minWidth && !window.matchMedia(`(min-width: ${minWidth}px)`).matches) {
      return;
    }

    let cancelled = false;
    const imgs = [...host.querySelectorAll("img")].slice(
      0,
      limit ?? Number.POSITIVE_INFINITY,
    );
    if (!imgs.length) return;

    let cancelIdle: (() => void) | null = null;
    const sample = () => {
      if (cancelled) return;
      const ready = imgs.filter((i) => i.complete && i.naturalWidth > 0);
      if (!ready.length) return;
      try {
        const next = paletteFromImages(ready, register);
        if (next && !cancelled) setColors(next);
      } catch {
        // Tainted canvas or a dead 2d context: the fallback five are already
        // correct, and the lamp is lit either way.
      }
    };
    const schedule = () => {
      cancelIdle?.();
      cancelIdle = whenIdle(sample);
    };

    schedule();
    // Anything still loading re-runs the sample once it lands, so a wall whose
    // eager tiles have not painted yet still ends up sampled rather than stuck
    // on the fallback.
    const pending = imgs.filter((i) => !i.complete);
    for (const img of pending)
      img.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      cancelIdle?.();
      for (const img of pending) img.removeEventListener("load", schedule);
    };
  }, [ref, limit, register, minWidth]);

  return colors;
}
