"use client";

import { useEffect, useState } from "react";

/**
 * LAW 3, made real: the spill takes its colour FROM the media it is lighting.
 *
 * The doctrine round's central experiment is whether that matters. Today the
 * glow is the one place on the site where colour is INVENTED rather than
 * photographed, which makes it an exception to the ratified identity ("media
 * is the colour") dressed up as an expression of it. Sampling makes it an
 * argument for the identity instead.
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

/** The register every spill colour is normalised into (the ratified five sit here). */
const SPILL_L = 0.72;
const SPILL_C = 0.15;

/**
 * Pick `count` well-separated hues out of raw RGBA pixels, weighted by how much
 * of the image carries them and how colourful they are.
 *
 * Pure and exported so the bucketing is unit-testable without a canvas.
 */
export function pickSpillHues(
  pixels: Uint8ClampedArray,
  count = 5,
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
    // Keep the set legible as a spread of light rather than five shades of the
    // same hue: reject anything within 25 degrees of one already taken.
    const tooClose = out.some((o) => {
      const d = Math.abs(o.hue - cand.hue);
      return Math.min(d, 360 - d) < 25;
    });
    if (!tooClose) out.push({ hue: cand.hue, weight: cand.w });
  }
  // A monochrome photograph legitimately yields fewer than `count` hues. Fan
  // the last one out rather than returning a short array, so the engine always
  // gets five inputs and the caller never branches.
  while (out.length > 0 && out.length < count) {
    const last = out[out.length - 1];
    out.push({ hue: (last.hue + 34) % 360, weight: last.weight * 0.6 });
  }
  return out;
}

export function huesToSpillColors(hues: { hue: number }[]): string[] {
  return hues.map((h) => `oklch(${SPILL_L} ${SPILL_C} ${h.hue.toFixed(1)})`);
}

/**
 * Sample a same-origin image into a spill palette. Returns null until it
 * resolves (callers fall back to the ratified five, which is law 3's
 * no-media branch, so there is never an unlit frame).
 */
export function useSampledPalette(src: string | null): string[] | null {
  // Keyed by the src that produced it, so switching lamps DERIVES null during
  // render instead of resetting state inside the effect (the repo's
  // react-hooks lint bans setState-in-effect sync resets; the
  // adjust-state-during-render pattern is the house answer).
  const [state, setState] = useState<{ src: string; colors: string[] } | null>(
    null,
  );

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img
      .decode()
      .then(() => {
        if (cancelled) return;
        const N = 32;
        const canvas = document.createElement("canvas");
        canvas.width = N;
        canvas.height = N;
        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, N, N);
        const data = ctx.getImageData(0, 0, N, N).data;
        setState({ src, colors: huesToSpillColors(pickSpillHues(data, 5)) });
      })
      .catch(() => {
        // A decode failure is not an error state for a decorative layer: the
        // fallback palette is already correct.
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return state && state.src === src ? state.colors : null;
}
