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
        const CELL = 32;
        const canvas = document.createElement("canvas");
        canvas.width = CELL * images.length;
        canvas.height = CELL;
        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) return;
        images.forEach((img, i) => {
          ctx.drawImage(img, i * CELL, 0, CELL, CELL);
        });
        const data = ctx.getImageData(0, 0, canvas.width, CELL).data;
        setState({
          key,
          colors: huesToSpillColors(pickSpillHues(data, 5), register),
        });
      })
      .catch(() => {
        // A decode failure is not an error state for a decorative layer: the
        // fallback palette is already correct.
      });
    return () => {
      cancelled = true;
    };
  }, [key, register]);

  return state && state.key === key ? state.colors : null;
}
