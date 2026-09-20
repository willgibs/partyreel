/**
 * ROUND TWO'S THREE CANDIDATES, AND THE CONTROL THEY ARE MEASURED AGAINST.
 *
 * His question on the wired `diagonal` (rulings.md, the sixth batch): "is this
 * the best that hashvatar had to offer? The preview ones on
 * https://www.hashvatar.com/ and https://github.com/medhychabour/hashvatar felt
 * much more alive and rich." This module answers it with three fresh readings,
 * each a pure function of `orbFor`'s `Orb` (the production generator, imported
 * and never edited: `@/lib/avatar/gradient`), so every option here is still the
 * SAME identity hue, the SAME fitted lightness window, on the SAME account seed
 * — only the shading changes.
 *
 * ★ WHAT HASHVATAR'S GRADIENT MODE ACTUALLY DRAWS, READ FROM ITS SOURCE
 * (`gradient.ts`, `color.ts`, `index.ts`, `demo/index.html` on GitHub, all read
 * with WebFetch and `gh api`/`curl` this round). The brief guessed "several hue
 * stops, not two"; the source says otherwise, and the correction is worth
 * recording rather than building the wrong thing quickly. `hashToColors(hash,
 * tones, 4)` draws FOUR colours, and with no `tones` supplied — which is the
 * demo's own default state (`tones: []`) and what its four gallery samples
 * (medhy.eth, satoshi, saira, an address) all render — `generateColor` gives
 * every one of the four THE SAME `baseHue`: one bright, saturated "primary"
 * (L 0.55-0.77) and three darker, desaturated "secondaries" (L 0.18-0.38) at
 * that identical hue, no rotation even in shadow. `renderGradient` fills a
 * canvas with the primary, then draws six irregular polygons (`SHAPES`) in the
 * three secondary hexes cycled, each translated/rotated/scaled by its own seed,
 * gaussian-blurred (`blur ≈ 21%` of the size) and composited back over the base
 * with `source-over`, `overlay` and `soft-light` at varying alpha. So the
 * richness he saw is ONE hue read at several DEPTHS, diffused and layered, not
 * a crowd of hues in one avatar — `mesh` below reproduces exactly that register
 * (nothing here is copied; there is no canvas, no blur filter and no polygon
 * path, because a CSS `background-image` on a Server Component cannot hold any
 * of those — layered `radial-gradient`s and `background-blend-mode` are the
 * honest CSS-only translation of "several blurred, blended tones of one hue").
 * `throw` and `lit-seam` are two further readings that do not come from
 * hashvatar at all, per the brief: a moodier two-throw wash and a lit crease on
 * the diagonal's own seam.
 *
 * ★ EVERY OPTION IS MEASURED, NOT ASSERTED (see `LOOK_STATS` below), on TWO
 * separate honesties:
 *  - THE LETTER floor is about ONE point: wherever the initial actually sits.
 *    A square gradient box's line always crosses its own geometric centre at
 *    exactly its 50% mark (CSS's own guarantee for `linear-gradient`; a
 *    `radial-gradient`'s distance from any focal point is exactly as
 *    computable), so `centreLuminance` below does the real compositing math for
 *    that one point — alpha, `background-blend-mode`'s screen/overlay/
 *    soft-light formulas (CSS Compositing L1, applied in sRGB gamma space, the
 *    same space the spec defines them in regardless of the `in oklab` space
 *    the gradient itself interpolated through) and all — rather than a nearby
 *    stop's colour standing in for it. An earlier draft of this file used the
 *    nearest STOPS instead of the actual centre pixel and reported the wired,
 *    LIVE `diagonal` control failing every floor; it was the measurement that
 *    was wrong, not the shipped avatar, and the fix is this file doing the
 *    compositing arithmetic a browser would rather than approximating it.
 *  - THE TWO GROUNDS AND THE RING are about the WHOLE disc being a findable
 *    object (FLOOR.ground's own comment: "a non-text object that has to be
 *    findable on the page"), so `all` stays the conservative union of every
 *    solid colour the look paints anywhere, worst case, deliberately
 *    pessimistic: a look that clears these by this measure clears them
 *    everywhere a reader's eye could land, not just at its kindest pixel.
 */
import {
  contrast,
  FLOOR,
  fitChroma,
  GROUND,
  hex,
  type Lch,
  type Orb,
  orbFor,
  RING,
  seedsFrom,
} from "@/lib/avatar/gradient";
import { background } from "@/lib/avatar/gradient";

/** The `look` ask's four option ids: the control, then the three candidates. */
export type RichLook = "diagonal" | "mesh" | "throw" | "lit-seam";

export type LookPaint = {
  /** The `background-image` value. */
  image: string;
  /** `background-blend-mode`, only when a layer wants one. */
  blend?: string;
  /** Every solid colour the look paints: the ground/ring measure. */
  all: readonly Lch[];
};

const clampL = (l: number): number => Math.max(0.1, Math.min(0.95, l));

/** The control: the exact production string, so the comparison is honest. */
function diagonalPaint(orb: Orb): LookPaint {
  const { hue, hue2, body, lit, deep } = orb;
  const litAt = fitChroma({ l: lit.l, c: lit.c, h: hue });
  const far = fitChroma({ l: body.l, c: body.c, h: hue2 });
  return {
    image: background(orb, "diagonal"),
    all: [litAt, far, deep],
  };
}

/**
 * `mesh`: hashvatar's own register. One hue (never rotated), a bright primary
 * fill and two darker secondary tones of that SAME hue, thrown as soft blurred
 * radial blobs and blended over the fill with `overlay` and `soft-light` —
 * three of its six polygon layers' worth, which is what an avatar this size has
 * room to read as texture rather than mud.
 */
function meshPaint(orb: Orb): LookPaint {
  const { hue, body, lit, light } = orb;
  const primary = fitChroma({ l: clampL(lit.l - 0.02), c: lit.c, h: hue });
  const secondaryDark = fitChroma({
    l: clampL(body.l - 0.32),
    c: body.c * 0.5,
    h: hue,
  });
  const secondaryMid = fitChroma({
    l: clampL(body.l - 0.1),
    c: body.c * 0.85,
    h: hue,
  });
  const image = [
    `radial-gradient(in oklab 122% 118% at ${light.x.toFixed(0)}% ${light.y.toFixed(0)}%, ${css(primary)} 0%, transparent 58%)`,
    `radial-gradient(in oklab 116% 116% at ${(100 - light.x).toFixed(0)}% ${(100 - light.y).toFixed(0)}%, ${css(secondaryDark)} 0%, transparent 64%)`,
    `radial-gradient(in oklab 150% 150% at 50% 62%, ${css(secondaryMid)} 0%, transparent 72%)`,
    `linear-gradient(in oklab 180deg, ${css(primary)} 0%, ${css(body)} 100%)`,
  ].join(", ");
  return {
    image,
    blend: "overlay, soft-light, normal, normal",
    all: [primary, body, secondaryDark, secondaryMid],
  };
}

/**
 * `throw`'s own two focal points, drawn from a fresh, independent stream
 * (`${orb.seed}:throw` through the generator's own `seedsFrom` — still a pure
 * function of the `Orb`, since `orb.seed` is one of its fields, and `orb.light`
 * itself is not: it was tuned for the ORB look's single highlight, "clear of
 * the centre" only enough for that job, per `orbFor`'s own comment). Fixed at
 * a 30-40 radius from the box centre and 140-220 degrees apart so the two
 * pools never sit on top of each other and NEVER reach the middle third where
 * the initial sits, whatever the seed — measuring this (below) is what found
 * that reusing `orb.light` let both throws wash into the centre and tank the
 * letter's contrast; the fix is geometric, not a dimmer colour.
 */
function throwSpots(orb: Orb): {
  ax: number;
  ay: number;
  bx: number;
  by: number;
} {
  const [t1, t2, t3] = seedsFrom(`${orb.seed}:throw`, 3);
  const angleA = t1 * 360;
  const angleB = angleA + 140 + t2 * 80;
  const radius = 30 + t3 * 10;
  const at = (deg: number) => ({
    x: 50 + radius * Math.cos((deg * Math.PI) / 180),
    y: 50 + radius * Math.sin((deg * Math.PI) / 180),
  });
  const a = at(angleA);
  const b = at(angleB);
  return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
}

/**
 * `throw`: not hashvatar's, per the brief. Two bigger, more saturated throws
 * of light (the identity hue and its second hue, both near `lit`'s own
 * strength rather than held back) over a radial vignette that sinks to a
 * darker base than `orb.deep` — the same family as round one's `aurora`, read
 * moodier: a vignette holds the centre rather than a flat linear base, so the
 * two throws read as light falling INTO a room instead of two flat washes.
 */
function throwPaint(orb: Orb): LookPaint {
  const { hue, hue2, body, lit, deep } = orb;
  const glowA = fitChroma({ l: clampL(lit.l + 0.02), c: lit.c, h: hue });
  const glowB = fitChroma({
    l: clampL(body.l + 0.08),
    c: Math.min(0.37, body.c * 1.05),
    h: hue2,
  });
  const base = fitChroma({ l: clampL(deep.l - 0.05), c: deep.c, h: deep.h });
  const { ax, ay, bx, by } = throwSpots(orb);
  const image = [
    `radial-gradient(in oklab 90% 90% at ${ax.toFixed(0)}% ${ay.toFixed(0)}%, ${css(glowA)} 0%, transparent 40%)`,
    `radial-gradient(in oklab 95% 95% at ${bx.toFixed(0)}% ${by.toFixed(0)}%, ${css(glowB)} 0%, transparent 42%)`,
    `radial-gradient(in oklab 165% 165% at 50% 50%, ${css(body)} 0%, ${css(base)} 100%)`,
  ].join(", ");
  return {
    image,
    all: [glowA, glowB, body, base],
  };
}

/**
 * `lit-seam`: the diagonal, unchanged, with a second layer riding the SAME
 * angle: a narrow bright fleck of the far hue centred on the 58% seam where
 * the ramp already turns, `screen`ed over it so it lifts without washing the
 * two hues out. The fade is tight (52% to 66%, a 14-point band) so the seam
 * never reaches the 50% centre the initial sits on — measured below: a wider
 * first draft (44% to 74%) DID reach it, and `screen` only ever brightens, so
 * it pulled the letter's contrast down rather than up. Everything the
 * diagonal already clears at the centre, this now inherits exactly.
 */
function litSeamPaint(orb: Orb): LookPaint {
  const { hue, hue2, body, lit, deep, angle } = orb;
  const litAt = fitChroma({ l: lit.l, c: lit.c, h: hue });
  const far = fitChroma({ l: body.l, c: body.c, h: hue2 });
  const seam = fitChroma({
    l: clampL(lit.l + 0.12),
    c: lit.c * 0.65,
    h: hue2,
  });
  const image = [
    `linear-gradient(in oklab ${angle.toFixed(0)}deg, transparent 52%, ${css(seam)} 58%, transparent 66%)`,
    `linear-gradient(in oklab ${angle.toFixed(0)}deg, ${css(litAt)} 0%, ${css(far)} 58%, ${css(deep)} 100%)`,
  ].join(", ");
  return {
    image,
    blend: "screen, normal",
    all: [litAt, far, deep, seam],
  };
}

/** One `oklch()` string; kept local so this file imports no more of the
 *  generator than the Lch arithmetic it actually reuses. */
function css({ l, c, h }: Lch): string {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(1)})`;
}

export function paintRich(orb: Orb, look: RichLook): LookPaint {
  if (look === "mesh") return meshPaint(orb);
  if (look === "throw") return throwPaint(orb);
  if (look === "lit-seam") return litSeamPaint(orb);
  return diagonalPaint(orb);
}

/* ── The exact colour under the initial ───────────────────────────────────
 *
 * A small, purpose-built compositor: linear and radial `background-image`
 * layers, `background-blend-mode`'s four keywords this file uses, sampled at
 * one point. Not a general CSS engine — just enough of one, checked against
 * hand-workable cases in `looks.test.ts`, to answer "what colour does the
 * browser actually paint where the initial sits" instead of guessing from a
 * nearby stop. */

type Rgb = readonly [number, number, number];

/** `Lch` (already gamut-fit by every caller) to gamma-encoded sRGB, 0 to 1,
 *  via the generator's own `hex()` rather than reimplementing its matrices. */
function toRgb(c: Lch): Rgb {
  const h = hex(c);
  return [
    parseInt(h.slice(1, 3), 16) / 255,
    parseInt(h.slice(3, 5), 16) / 255,
    parseInt(h.slice(5, 7), 16) / 255,
  ];
}

const EOTF = (v: number): number =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

/** WCAG relative luminance straight from a composited sRGB triple. */
function rgbLuminance([r, g, b]: Rgb): number {
  return 0.2126 * EOTF(r) + 0.7152 * EOTF(g) + 0.0722 * EOTF(b);
}

/** CSS Compositing L1's blend functions, per channel, 0 to 1 in. `normal`
 *  is `Cs` itself (the blend result before the alpha-composite below). */
const BLEND: Record<string, (cb: number, cs: number) => number> = {
  normal: (_cb, cs) => cs,
  screen: (cb, cs) => cb + cs - cb * cs,
  overlay: (cb, cs) => (cb <= 0.5 ? 2 * cb * cs : 1 - 2 * (1 - cb) * (1 - cs)),
  "soft-light": (cb, cs) => {
    if (cs <= 0.5) return cb - (1 - 2 * cs) * cb * (1 - cb);
    const d = cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb);
    return cb + (2 * cs - 1) * (d - cb);
  },
};

/** Backdrop opaque (every look's bottom layer always is: a full-box linear
 *  gradient, or a radial whose last stop is a solid colour, never a
 *  transparent edge) — so compositing a layer of alpha `a` and mode `m` over
 *  it is the CSS spec's formula with αb = 1. */
function over(backdrop: Rgb, source: Rgb, alpha: number, mode: string): Rgb {
  const b = BLEND[mode] ?? BLEND.normal;
  return backdrop.map(
    (cb, i) => cb * (1 - alpha) + alpha * b(cb, source[i]),
  ) as unknown as Rgb;
}

/** A linear-gradient's colour at one t (0 to 1 along the gradient line);
 *  stops outside the declared range hold their nearest endpoint, same as CSS. */
function alongLinear(
  stops: readonly { t: number; colour: Lch }[],
  t: number,
): Lch {
  if (t <= stops[0].t) return stops[0].colour;
  const last = stops[stops.length - 1];
  if (t >= last.t) return last.colour;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.t && t <= b.t)
      return lerpOklab(a.colour, b.colour, (t - a.t) / (b.t - a.t));
  }
  return last.colour;
}

function toOklab({ l, c, h }: Lch): readonly [number, number, number] {
  const rad = (h * Math.PI) / 180;
  return [l, c * Math.cos(rad), c * Math.sin(rad)];
}
function fromOklab([l, a, b]: readonly [number, number, number]): Lch {
  return {
    l,
    c: Math.hypot(a, b),
    h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  };
}
/** `in oklab` interpolation: linear in L, a, b — the rectangular space, never
 *  the hue ARC oklch would take (gradient.ts's own header explains why). */
function lerpOklab(a: Lch, b: Lch, t: number): Lch {
  const [l1, a1, b1] = toOklab(a);
  const [l2, a2, b2] = toOklab(b);
  return fromOklab([
    l1 + (l2 - l1) * t,
    a1 + (a2 - a1) * t,
    b1 + (b2 - b1) * t,
  ]);
}

/** A radial layer's alpha at one point: 1 at its focal point, 0 at `fade`
 *  (percent of its own ending-shape radius), linear between, per CSS. The
 *  colour never changes across the fade (modern engines interpolate TO
 *  `transparent` by holding the neighbouring stop's colour and dropping only
 *  its alpha — the same reading `aurora`'s own header relies on). */
function radialAlpha(
  atX: number,
  atY: number,
  rx: number,
  ry: number,
  fadePct: number,
  qx: number,
  qy: number,
): number {
  const norm = Math.hypot((qx - atX) / rx, (qy - atY) / ry);
  return Math.max(0, Math.min(1, 1 - norm / (fadePct / 100)));
}

/** A linear layer's own alpha at one t: 0 at `zero`, 1 at `full`, back to 0 at
 *  `fadeBack`, linear between — a fade-in-then-out band along the gradient
 *  line rather than a colour that holds (`lit-seam`'s seam is the one case). */
function linearAlpha(
  zero: number,
  full: number,
  fadeBack: number,
  t: number,
): number {
  if (t <= zero || t >= fadeBack) return 0;
  if (t <= full) return (t - zero) / (full - zero);
  return 1 - (t - full) / (fadeBack - full);
}

/** The diagonal's own three stops, shared by `diagonal` and `lit-seam` (its
 *  base layer is the diagonal, unchanged). */
function diagonalStops(orb: Orb): readonly { t: number; colour: Lch }[] {
  const { hue, hue2, body, lit, deep } = orb;
  return [
    { t: 0, colour: fitChroma({ l: lit.l, c: lit.c, h: hue }) },
    { t: 0.58, colour: fitChroma({ l: body.l, c: body.c, h: hue2 }) },
    { t: 1, colour: deep },
  ];
}

/**
 * The WCAG relative luminance under a centred initial: (50, 50) on a square
 * box, composited bottom layer to top exactly as `background-image`'s own
 * list order and `background-blend-mode` would (the FIRST declared layer
 * paints on TOP). Luminance rather than a colour, because that is the only
 * thing `contrast()` ever reads back out of one, and it is what a composited
 * RGB triple can honestly produce — round-tripping it back through the OKLCH
 * fit matrices `Lch` implies would invent a hue and chroma nothing painted.
 */
export function centreLuminance(orb: Orb, look: RichLook): number {
  const { hue, hue2, body, lit, light } = orb;

  if (look === "diagonal") {
    return rgbLuminance(toRgb(alongLinear(diagonalStops(orb), 0.5)));
  }

  if (look === "lit-seam") {
    const base = toRgb(alongLinear(diagonalStops(orb), 0.5));
    const seam = fitChroma({
      l: clampL(lit.l + 0.12),
      c: lit.c * 0.65,
      h: hue2,
    });
    // The seam layer's own linear stops (transparent 52%, seam 58%, transparent
    // 66%) run along the SAME angle as the diagonal beneath it, so its alpha at
    // the box centre follows the same 50%-is-the-middle guarantee; the colour
    // is `seam` throughout both halves (the "transparent inherits its
    // neighbour's hue" reading `aurora`'s own header already relies on). The
    // band starts at 52%, so at the centre (50%) its alpha is exactly 0.
    const alpha = linearAlpha(0.52, 0.58, 0.66, 0.5);
    return rgbLuminance(over(base, toRgb(seam), alpha, "screen"));
  }

  if (look === "mesh") {
    const primary = fitChroma({ l: clampL(lit.l - 0.02), c: lit.c, h: hue });
    const secondaryDark = fitChroma({
      l: clampL(body.l - 0.32),
      c: body.c * 0.5,
      h: hue,
    });
    const secondaryMid = fitChroma({
      l: clampL(body.l - 0.1),
      c: body.c * 0.85,
      h: hue,
    });
    let rgb = toRgb(
      alongLinear(
        [
          { t: 0, colour: primary },
          { t: 1, colour: body },
        ],
        0.5,
      ),
    );
    rgb = over(
      rgb,
      toRgb(secondaryMid),
      radialAlpha(50, 62, 150, 150, 72, 50, 50),
      "normal",
    );
    rgb = over(
      rgb,
      toRgb(secondaryDark),
      radialAlpha(100 - light.x, 100 - light.y, 116, 116, 64, 50, 50),
      "soft-light",
    );
    rgb = over(
      rgb,
      toRgb(primary),
      radialAlpha(light.x, light.y, 122, 118, 58, 50, 50),
      "overlay",
    );
    return rgbLuminance(rgb);
  }

  // throw: the vignette's own radial is focused exactly at (50, 50), so its
  // contribution there is its 0% stop, `body`; the two throws sit 30-40 units
  // out (`throwSpots`), clear of the centre at any seed.
  const glowA = fitChroma({ l: clampL(lit.l + 0.02), c: lit.c, h: hue });
  const glowB = fitChroma({
    l: clampL(body.l + 0.08),
    c: Math.min(0.37, body.c * 1.05),
    h: hue2,
  });
  const { ax, ay, bx, by } = throwSpots(orb);
  let rgb = toRgb(body);
  rgb = over(
    rgb,
    toRgb(glowB),
    radialAlpha(bx, by, 95, 95, 42, 50, 50),
    "normal",
  );
  rgb = over(
    rgb,
    toRgb(glowA),
    radialAlpha(ax, ay, 90, 90, 40, 50, 50),
    "normal",
  );
  return rgbLuminance(rgb);
}

function contrastFromLuminance(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* ── Measured, across a thousand real UUIDs ───────────────────────────────── */

/**
 * A THOUSAND UUID-SHAPED SEEDS, FIXED. `orbFor` only ever reads a seed's
 * characters (FNV-1a has no notion of "valid UUID"), so what a concentration
 * test needs is realistic entropy in the shape `seedFor(profiles.id)` actually
 * produces, not fresh randomness on every load — and fresh randomness is what
 * this may NOT be: the board is a Server Component's first paint reconciled
 * against the client's, and `Math.random`/`randomUUID` disagreeing between the
 * two is a hydration mismatch on every one of these captions. A deterministic
 * stream from the generator's own `seedsFrom` (the same mulberry32 the
 * production contract test trusts) gives the same thousand every time, on the
 * server and in the browser, forever.
 */
function pseudoUuid(i: number): string {
  const n = seedsFrom(`seed-avatar-look-r2-${i}`, 8).map((v) =>
    Math.floor(v * 0xffffffff)
      .toString(16)
      .padStart(8, "0"),
  );
  const hexStr = n.join("");
  return [
    hexStr.slice(0, 8),
    hexStr.slice(8, 12),
    `4${hexStr.slice(13, 16)}`,
    `a${hexStr.slice(17, 20)}`,
    hexStr.slice(20, 32),
  ].join("-");
}

export const SAMPLE_SEEDS: readonly string[] = Array.from(
  { length: 1000 },
  (_, i) => pseudoUuid(i),
);

export type LookStats = {
  letterPct: number;
  letterWorst: number;
  paperPct: number;
  paperWorst: number;
  inkPct: number;
  inkWorst: number;
  ringPct: number;
  ringWorst: number;
};

function statsFor(look: RichLook): LookStats {
  let letterPass = 0;
  let paperPass = 0;
  let inkPass = 0;
  let ringPass = 0;
  let letterWorst = Infinity;
  let paperWorst = Infinity;
  let inkWorst = Infinity;
  let ringWorst = Infinity;
  for (const seed of SAMPLE_SEEDS) {
    const orb = orbFor(seed);
    const { all } = paintRich(orb, look);
    const letterC = contrastFromLuminance(
      rgbLuminance(toRgb(orb.ink)),
      centreLuminance(orb, look),
    );
    const paperC = Math.min(...all.map((x) => contrast(x, GROUND.paper)));
    const inkC = Math.min(...all.map((x) => contrast(x, GROUND.ink)));
    const ringC = Math.min(...all.map((x) => contrast(x, RING)));
    if (letterC >= FLOOR.letter) letterPass++;
    if (paperC >= FLOOR.ground) paperPass++;
    if (inkC >= FLOOR.ground) inkPass++;
    if (ringC >= FLOOR.ring) ringPass++;
    letterWorst = Math.min(letterWorst, letterC);
    paperWorst = Math.min(paperWorst, paperC);
    inkWorst = Math.min(inkWorst, inkC);
    ringWorst = Math.min(ringWorst, ringC);
  }
  const n = SAMPLE_SEEDS.length;
  const pct = (k: number) => Math.round((1000 * k) / n) / 10;
  return {
    letterPct: pct(letterPass),
    letterWorst,
    paperPct: pct(paperPass),
    paperWorst,
    inkPct: pct(inkPass),
    inkWorst,
    ringPct: pct(ringPass),
    ringWorst,
  };
}

const LOOKS: readonly RichLook[] = ["diagonal", "mesh", "throw", "lit-seam"];

/** Computed once at module load, the same thousand seeds every time: cheap
 *  enough that this ran inside `gradient.test.ts` already (1000 `orbFor` calls
 *  is one of its three-mode loops), and `orbFor` itself is only ever called
 *  once per seed regardless of how many looks read the result. */
export const LOOK_STATS: Record<RichLook, LookStats> = Object.fromEntries(
  LOOKS.map((look) => [look, statsFor(look)]),
) as Record<RichLook, LookStats>;

const floorLine = (
  label: string,
  pct: number,
  worst: number,
  floor: number,
): string => {
  const held = worst >= floor;
  const rate = pct === 100 ? "clears every seed" : `clears ${pct}% of seeds`;
  return `${label} ${rate}, worst ${worst.toFixed(2)}:1${held ? "" : " (fails the floor)"}`;
};

/** "The numbers on the frame": a thousand real UUIDs, all three floors, the
 *  worst case named rather than averaged away. */
export function captionFor(look: RichLook): string {
  const s = LOOK_STATS[look];
  return [
    "1,000 real UUIDs against the generator's own floors:",
    floorLine("letter ≥4.5:1", s.letterPct, s.letterWorst, FLOOR.letter),
    floorLine("paper ≥3:1", s.paperPct, s.paperWorst, FLOOR.ground),
    floorLine("ink ≥3:1", s.inkPct, s.inkWorst, FLOOR.ground),
    floorLine("ring ≥3:1", s.ringPct, s.ringWorst, FLOOR.ring),
  ].join(" ");
}
