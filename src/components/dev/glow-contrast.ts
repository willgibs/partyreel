/**
 * The contrast instrument for the spill boards.
 *
 * WHY THIS EXISTS: footer-contract.test.ts pins the ink slab's token
 * REDECLARATIONS as source text, not measured ratios, so a colour wash that
 * lifts the ground passes every test in the repo while quietly eating the
 * headroom those pins were written to protect. --gallery-muted sits at 5.37:1
 * on the slab against a 4.5:1 floor; that is barely one stop of room, and the
 * shipped seam glow already runs its base at 0.62.
 *
 * The maths is analytic rather than screen-scraped on purpose: the engine's
 * stops are known, so the WORST case (a text run sitting under the peak of the
 * brightest blob, base and band both at full) is computable exactly, and it is
 * reproducible in a test. Reading pixels back would only ever sample whichever
 * frame happened to be on screen.
 *
 * All of it is standard published maths: the OKLab inverse transform and the
 * WCAG 2.x relative-luminance and contrast-ratio definitions.
 */

export type Rgb = { r: number; g: number; b: number };

/** OKLCH -> sRGB (0-255), clamped to gamut by channel. */
export function oklchToSrgb(L: number, C: number, H: number): Rgb {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const bb = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const enc = (v: number) => {
    const x = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(x * 255)));
  };
  return { r: enc(lr), g: enc(lg), b: enc(lb) };
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const ch = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Source-over composite of `fg` at `alpha` onto `bg`. */
export function compositeOver(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  const a = Math.max(0, Math.min(1, alpha));
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  };
}

/** Parse the `oklch(L C H)` form the palettes are written in. */
export function parseOklch(value: string): Rgb | null {
  const m = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(value);
  if (!m) return null;
  return oklchToSrgb(Number(m[1]), Number(m[2]), Number(m[3]));
}

export type GroundReport = {
  /** The ground once the spill has been laid over it. */
  lit: Rgb;
  /** Ratio of the surface's body text against that lit ground. */
  bodyRatio: number;
  /** Ratio of the surface's muted text against that lit ground. */
  mutedRatio: number;
  /** Which palette entry produced the worst result. */
  worstColor: string;
  /** The effective alpha this report was computed at. */
  alpha: number;
};

/**
 * The alpha a text run actually meets, which is NOT the layer opacity.
 *
 * Three multipliers stack, and skipping any of them produces a number that
 * looks alarming and is not true. Modelling only the layer opacity says the
 * shipped footer fails AA, which it plainly does not:
 *
 *   peakStop      the highest alpha any single stop reaches in the colour
 *                 field (the engine's brightest blob mixes at 62%), and only
 *                 at that blob's exact centre;
 *   layerOpacity  --glw-base, plus --glw-strength again where the travelling
 *                 band happens to be overlapping the base;
 *   coverage      the container mask's alpha where the text sits. This is the
 *                 big one. A seam masks to transparent well before the layer
 *                 ends, so text a little way down the surface meets a small
 *                 fraction of the light at the edge.
 */
export function effectiveAlpha(opts: {
  peakStop?: number;
  layerOpacity: number;
  coverage: number;
}): number {
  const peak = opts.peakStop ?? 0.62;
  return Math.max(0, Math.min(1, peak * opts.layerOpacity * opts.coverage));
}

/**
 * A seam's mask alpha at a given depth. The engine ramps `#000` at the edge to
 * transparent at 72% of the layer's height, so this is where a text run sitting
 * `depthPx` below the seam actually falls on that ramp.
 */
export function seamCoverage(depthPx: number, layerHeightPx: number): number {
  const end = layerHeightPx * 0.72;
  if (depthPx >= end) return 0;
  return 1 - depthPx / end;
}

/**
 * Worst hue in a palette, laid over a ground at a given effective alpha.
 * Returns the ratios the R8 WCAG-AA pass will care about.
 */
export function worstCaseGround(
  ground: string,
  body: string,
  muted: string,
  palette: readonly string[],
  alpha: number,
): GroundReport | null {
  const bg = parseOklch(ground);
  const fgBody = parseOklch(body);
  const fgMuted = parseOklch(muted);
  if (!bg || !fgBody || !fgMuted) return null;

  let worst: GroundReport | null = null;
  for (const entry of palette) {
    const hue = parseOklch(entry);
    if (!hue) continue;
    const lit = compositeOver(hue, alpha, bg);
    const report: GroundReport = {
      lit,
      bodyRatio: contrastRatio(fgBody, lit),
      mutedRatio: contrastRatio(fgMuted, lit),
      worstColor: entry,
      alpha,
    };
    if (!worst || report.mutedRatio < worst.mutedRatio) worst = report;
  }
  return worst;
}

/**
 * The number the board actually needs: the effective alpha at which muted text
 * crosses the 4.5:1 floor on this ground. Says where the ceiling IS, rather
 * than leaving R8 to discover it.
 */
export function alphaAtAaFloor(
  ground: string,
  muted: string,
  palette: readonly string[],
  floor = 4.5,
): number {
  for (let a = 0; a <= 1.0001; a += 0.005) {
    const r = worstCaseGround(ground, muted, muted, palette, a);
    if (r && r.mutedRatio < floor) return Number(a.toFixed(3));
  }
  return 1;
}
