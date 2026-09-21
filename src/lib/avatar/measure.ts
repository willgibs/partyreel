/**
 * THE EXACT COLOUR UNDER A CENTRED INITIAL: a small, purpose-built compositor
 * for `gradient.test.ts`'s contract, not a general CSS engine.
 *
 * ★ HOME (2026-09-20, `avatar-mesh-wiring`, `seed-avatar` r2 wired): this
 * compositor lived at `src/app/(dev)/design/sandbox/seed-avatar/looks.ts`
 * while the board was measuring `mesh` against the wired `diagonal`; the
 * board retires with its ruling (`docs/design/rulings.md`, "the closing
 * sitting's second batch"), and the measurement moves here so the production
 * contract can hold `background()`'s OWN `mesh` branch to the same standard
 * that picked it — the real composited pixel, not the coarser proxy
 * `gradient.test.ts` held every look to before this round
 * (`contrast(orb.ink, orb.body)`, which is exactly right for `flat` and
 * close enough for `orb`, but not what a reader's eye or a screen reader's
 * contrast checker actually meets at the centre of a two-stop `diagonal`
 * ramp or a four-layer blended `mesh`).
 *
 * ★ WHY A REAL COMPOSITOR, NOT THE NEAREST STOP. A square gradient box's line
 * always crosses its own geometric centre at exactly its 50% mark (CSS's own
 * guarantee for `linear-gradient`; a `radial-gradient`'s distance from any
 * focal point is exactly as computable), so this does the real compositing
 * arithmetic for that one point — alpha, `background-blend-mode`'s
 * `overlay`/`soft-light`/`normal` formulas (CSS Compositing Level 1, applied
 * in sRGB gamma space, the same space the spec defines them in regardless of
 * the `in oklab` space the gradient itself interpolated through) and all —
 * rather than a nearby stop's colour standing in for it. The board's own
 * first draft used the nearest STOPS instead and reported the wired, LIVE
 * `diagonal` control failing every floor; it was the measurement that was
 * wrong, not the shipped avatar, and the fix is doing the compositing
 * arithmetic a browser would rather than approximating it.
 *
 * ★ ONLY THE TWO LOOKS THIS FILE ACTUALLY COMPOSITES: `mesh` (what ships,
 * `ui/avatar.tsx`) and `diagonal` (what it replaced, kept as the built-in
 * comparison — the board's own framing was "100% clearing 4.5:1 against the
 * control's 76%", and `gradient.test.ts` reproduces that number for real
 * rather than quoting it). `orb`, `aurora` and `flat` never shipped and were
 * never held to this stricter measurement either round; every look
 * (including these three) still keeps the WEAKER guarantee
 * `gradient.test.ts` always held, `contrast(orb.ink, orb.body) >= FLOOR.letter`,
 * which `fitBody` enforces structurally regardless of which look paints it.
 */
import {
  diagonalStops,
  hex,
  type Lch,
  type Look,
  meshDepths,
  type Orb,
} from "./gradient";

/** The two looks measured pixel-for-pixel below. */
export type MeasuredLook = Extract<Look, "diagonal" | "mesh">;

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

/** CSS Compositing L1's blend functions, per channel, 0 to 1 in. `normal` is
 *  `Cs` itself (the blend result before the alpha-composite below) — the
 *  three `mesh` actually declares (`overlay, soft-light, normal, normal`,
 *  `blendMode` in `./gradient`); `diagonal` needs none of them. */
const BLEND: Record<string, (cb: number, cs: number) => number> = {
  normal: (_cb, cs) => cs,
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

/** A linear-gradient's colour at one t along its line (0 to 1); stops
 *  outside the declared range hold their nearest endpoint, same as CSS. Only
 *  ever called at t = 0.5 below (the box's own centre). */
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

/** A radial layer's alpha at one point: 1 at its focal point, 0 at `fade`
 *  (percent of its own ending-shape radius), linear between, per CSS. The
 *  colour never changes across the fade (modern engines interpolate TO
 *  `transparent` by holding the neighbouring stop's colour and dropping only
 *  its alpha). Only ever evaluated at the box centre (`qx = qy = 50`) below. */
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

/**
 * The WCAG relative luminance under a centred initial: (50, 50) on a square
 * box, composited bottom layer to top exactly as `background-image`'s own
 * list order and `background-blend-mode` would (the FIRST declared layer
 * paints on TOP). Reads `diagonalStops`/`meshDepths` straight from
 * `./gradient` rather than re-deriving them, so this can never quietly
 * describe a different picture than `background()` actually paints.
 */
export function centreLuminance(orb: Orb, look: MeasuredLook): number {
  if (look === "diagonal") {
    const [lit, far, deep] = diagonalStops(orb);
    return rgbLuminance(
      toRgb(
        alongLinear(
          [
            { t: 0, colour: lit },
            { t: 0.58, colour: far },
            { t: 1, colour: deep },
          ],
          0.5,
        ),
      ),
    );
  }

  // mesh: the base linear fill (bottom) is primary-to-body top to bottom, so
  // its own colour AT the box centre (y = 50%) is the two-stop lerp at
  // t = 0.5; then the mid, dark and primary radial pools composite up from
  // there in the SAME order `blendMode("mesh")` declares their blend modes
  // (overlay, soft-light, normal, normal, first-layer-is-first-in-the-list),
  // which read bottom to top as normal, soft-light, overlay.
  const { primary, secondaryDark, secondaryMid } = meshDepths(orb);
  const { light } = orb;
  let rgb = toRgb(
    alongLinear(
      [
        { t: 0, colour: primary },
        { t: 1, colour: orb.body },
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

/** WCAG contrast from two already-computed relative luminances, the usual
 *  (L1 + 0.05) / (L2 + 0.05) — `gradient.ts`'s own `contrast()` takes an
 *  `Lch` and computes `luminance()` itself, which `centreLuminance` above
 *  cannot honestly produce (a composited RGB triple has no single hue and
 *  chroma; round-tripping it back through the OKLCH fit matrices would
 *  invent one nothing painted), so this is the one-line version that takes
 *  the number instead. */
export function contrastFromLuminance(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
