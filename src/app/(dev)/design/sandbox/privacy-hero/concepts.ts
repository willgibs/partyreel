import { CANVAS, type Mode } from "@/components/lab";

/**
 * THE PRIVACY HERO, ROUND THREE: THREE NEW CONCEPTS, PURE DATA (2026-09-19);
 * A FOURTH ADDED BY THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21); THE REFRESH'S
 * OWN PASS (2026-09-24) MERGES TWO INTO ONE AND DRAWS A REAL FOURTH IN THE
 * SPACE THAT FREES.
 *
 * Round two flew photographs through a figure (`paths.ts`, deleted with this
 * round: "I don't really like this arrival animation as part of the
 * spiral/orbit"). Asked what next, Will: "Let's go with a totally different
 * concept... The actual privacy hero can take a different path, maybe more
 * fitting for its theme" (2026-09-19).
 *
 * ★ NOTHING HERE FLIES. Each concept sits still, or nearly still, and the
 * thing that moves is each one's own VISIBILITY: a breath, a turn taken, a
 * seal lifted, a clearing drifting across a photograph. That is the theme in
 * mechanism, not just in caption: privacy is who can see a thing right now,
 * not how fast it travels.
 *
 * ★ ACCESS AND SWEEP WERE ONE CONCEPT WEARING TWO TRANSITIONS, NOT TWO IDEAS
 * (the refresh, 2026-09-24). Both drew the exact same eight-and-six-tile grid
 * at the same cycle; the only difference was how a tile cleared, a crossfade
 * against the product's own pass of light. That is a finding, not a pair of
 * contenders (`docs/PROGRAM.md`: two options that land on the same answer are
 * a finding). `sweep` is the one that survives, because a tile handed over
 * the way the product now hands one over (`components/shared/arrival.css`,
 * `landing=sweep`, guest-upload r1) is more fitting for the theme than a
 * crossfade invented before that grammar existed; `access`'s geometry lives
 * on as `sweep`'s own (`accessTiles` below), and `veil` draws the fourth
 * concept in the slot that opened up.
 *
 * `field.ts`, `field-layer.tsx` and `field.css` stay in this directory only
 * because `album-page` still imports them for its own margins and motion
 * (round two's own docstring: "field.ts stays exactly where it was, because
 * album-page reads it"); nothing below reads them, and nothing below is read
 * by them.
 *
 * Pure: no React, no stylesheet, so `spec.ts` and `concepts.test.ts` (a node
 * test) can both import it, and the numbers a reviewer reads are the numbers
 * driving the picture rather than a hand-typed guess beside it.
 */

export type ConceptId = "aperture" | "sweep" | "seal" | "veil";
export const CONCEPTS: readonly ConceptId[] = [
  "aperture",
  "sweep",
  "seal",
  "veil",
];

/* ── A rectangle, and whether two of them miss ───────────────────────────── */

export type Rect = { x0: number; y0: number; x1: number; y1: number };

export const rectAround = (
  cx: number,
  cy: number,
  w: number,
  h: number,
): Rect => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });

/** Two boxes miss the moment either axis separates them. */
export const rectsClear = (a: Rect, b: Rect): boolean =>
  a.x1 <= b.x0 || a.x0 >= b.x1 || a.y1 <= b.y0 || a.y0 >= b.y1;

/**
 * THE LOCKUP'S INK, carried over from round two's measurement (`paths.ts`,
 * "measured to the ink on the rendered `PageHero` (scale `lg`, `text-title`)
 * with the privacy page's own words"): unchanged, because the copy, the
 * scale and the component are all unchanged this round. Re-measure if the
 * copy changes (bible 10: copy is open).
 */
export const LOCKUP: Record<Mode, { w: number; h: number; cy: number }> = {
  desktop: { w: 706, h: 346, cy: 497 },
  phone: { w: 300, h: 359, cy: 412 },
};

export const lockupRect = (mode: Mode): Rect => {
  const l = LOCKUP[mode];
  return rectAround(CANVAS[mode].w / 2, l.cy, l.w, l.h);
};

/**
 * ★ EVERY STATIC ELEMENT BELOW IS PLACED CLEAR OF THE LOCKUP BY CONSTRUCTION,
 * never by a collision solve: `concepts.test.ts` holds every one of them to
 * `rectsClear` against `lockupRect`, so a retune that drifts a tile under the
 * words turns the test red instead of reaching Will as a clipped word.
 */

/* ── Aperture: one breathing circle, centred behind the words ───────────── */

export const APERTURE = {
  /** The blurred photograph's diameter, px. */
  washPx: { desktop: 860, phone: 480 } as Record<Mode, number>,
  blurPx: { desktop: 56, phone: 32 } as Record<Mode, number>,
  /** [low, high] opacity the wash breathes between. */
  opacity: [0.12, 0.2] as const,
  /** [low, high] diameter the hairline ring breathes between, px. */
  ring: {
    desktop: [360, 430],
    phone: [190, 225],
  } as Record<Mode, readonly [number, number]>,
  ringStrokePx: 1,
  /** One full breath (small to big to small), ms. */
  cycleMs: 10_000,
};

/** The wash and the ring share the lockup's own centre: the same point the
 *  words sit on, so the glow reads as coming from behind them. Legibility is
 *  the scrim (`.apr-scrim`, concepts.css), never a hope about opacity alone. */
export const apertureCentre = (mode: Mode) => ({
  x: CANVAS[mode].w / 2,
  y: LOCKUP[mode].cy,
});

/* ── The grid: eight (six at a phone) tiles, one taking its turn to clear.
 * Kept as `ACCESS` for its geometry alone (`accessTiles` below): the concept
 * built on a crossfade retired in the refresh (2026-09-24, see the file
 * header), and `sweep` is now the only concept this grid carries. ───────── */

export const ACCESS = {
  tiles: { desktop: 8, phone: 6 } as Record<Mode, number>,
  sizePx: { desktop: 84, phone: 64 } as Record<Mode, number>,
  /** Every tile runs the SAME animation, offset by a multiple of `stepMs`
   *  (`animation-delay: calc(var(--acc-i) * -stepMs)`), which is what turns
   *  eight identical tiles into a rotation with no per-tile keyframe. */
  cycleMs: 6400,
  stepMs: 800,
  /** Fully clear, ms. */
  holdMs: 640,
  /** Clear back to frosted, ms. */
  fadeMs: 770,
  frosted: { grayscale: 1, blurPx: 2, opacity: 0.4 },
};

/**
 * Two side columns at a laptop (4 tiles each, clear of the lockup on the x
 * axis alone: a column's whole x-range sits outside it, so no y-placement
 * could ever collide). Two rows at a phone (3 tiles each, clear on the y
 * axis instead: the phone lockup is nearly the full column's width, so the
 * rows sit above and below it, exactly the "strips" round two's phone
 * question found for the same reason).
 */
export function accessTiles(mode: Mode): { x: number; y: number }[] {
  const size = ACCESS.sizePx[mode];
  const edge = 56;
  if (mode === "desktop") {
    const leftX = edge + size / 2;
    const rightX = CANVAS.desktop.w - edge - size / 2;
    const ys = [120, 350, 580, 810];
    return [
      ...ys.map((y) => ({ x: leftX, y })),
      ...ys.map((y) => ({ x: rightX, y })),
    ];
  }
  const topY = 100;
  const bottomY = 692;
  const xs = [edge, CANVAS.phone.w / 2, CANVAS.phone.w - edge];
  return [
    ...xs.map((x) => ({ x, y: topY })),
    ...xs.map((x) => ({ x, y: bottomY })),
  ];
}

/**
 * ── Sweep: the access grid, cleared by the product's own arrival (new,
 * the overtaken audit's reshape, 2026-09-21) ───────────────────────────────
 *
 * The same eight-and-six-tile grid `accessTiles` already solved: this concept
 * changes only HOW a tile clears, from a bespoke crossfade to the one pass of
 * light the product now uses for an arrival of its own (`data-landed` in
 * `components/shared/arrival.css`, `landing=sweep`, guest-upload r1). A
 * curated tile does not just fade into view here, it is HANDED OVER, the
 * same way a photograph you just sent is.
 *
 * ★ THE PASS ITSELF IS THE SHIPPED NUMBER, HELD BY HAND. `ARRIVAL_SWEEP_MS`
 * (`lib/shared/arrival.ts`) is 900; this module stays pure (no React, so
 * `concepts.test.ts` can import it in Node) and does not import that "use
 * client" file just for one constant, so `sweepMs` below is the same number,
 * written down rather than imported, and this comment is what keeps the two
 * from drifting apart. Everything else about the rotation (the grid, the
 * cycle, the step, the frosted rest state) is `ACCESS`'s own, reused rather
 * than re-solved, because the layout is not what this concept changes.
 */
export const SWEEP = {
  tiles: ACCESS.tiles,
  sizePx: ACCESS.sizePx,
  cycleMs: ACCESS.cycleMs,
  stepMs: ACCESS.stepMs,
  /** The pass itself, ms: ARRIVAL_SWEEP_MS in lib/shared/arrival.ts. */
  sweepMs: 900,
  frosted: ACCESS.frosted,
};

/* ── Seal: a few photographs under a cover, one lifting at a time ───────── */

export const SEAL = {
  cards: { desktop: 3, phone: 2 } as Record<Mode, number>,
  size: {
    desktop: { w: 130, h: 163 },
    phone: { w: 96, h: 120 },
  } as Record<Mode, { w: number; h: number }>,
  /** One card's own loop; `stepMs(mode)` below divides it by the card count,
   *  so N cards always land exactly one open at a time in rotation. */
  cycleMs: 7200,
  /** Fully open (the cover at `openPct`), ms. */
  openMs: 360,
  /** Open back to sealed, ms. */
  closeMs: 720,
  /** The cover's height, percent of the card, at rest and at its turn. */
  sealedPct: 55,
  openPct: 8,
};

export const sealStepMs = (mode: Mode) => SEAL.cycleMs / SEAL.cards[mode];

/** A row along the page's foot, centred as a group, clear of the lockup on
 *  the y axis (the row sits entirely below it, at every screen this draws). */
export function sealCards(mode: Mode): { x: number; y: number }[] {
  const { w } = SEAL.size[mode];
  const gap = mode === "desktop" ? 48 : 40;
  const n = SEAL.cards[mode];
  const total = n * w + (n - 1) * gap;
  const startX = (CANVAS[mode].w - total) / 2 + w / 2;
  const y = mode === "desktop" ? 800 : 680;
  return Array.from({ length: n }, (_, i) => ({
    x: startX + i * (w + gap),
    y,
  }));
}

/**
 * ── Veil: one photograph, mostly hidden, a soft clearing drifting across it
 * (the refresh's own fourth concept, 2026-09-24) ────────────────────────────
 *
 * The other three all show a WHOLE tile or photograph and vary how much of it
 * or how many of them: this is the one where a single photograph is never
 * fully visible at once. It is blurred and dim everywhere, all the time, and
 * a small soft-edged window of full clarity drifts slowly over it, never
 * settling, never showing the whole picture. Where the grid asks "who can see
 * this right now" of many tiles, veil asks it of ONE photograph's own
 * surface: privacy as a clearing that moves rather than a door that opens.
 *
 * ★ THE SAME FOOTPRINT AS APERTURE, ON PURPOSE. `washPx` is `APERTURE.washPx`
 * outright: both concepts are one circle centred on the lockup's own middle,
 * so this needs no new collision math (`concepts.test.ts`'s aperture-ring
 * check already holds the footprint clear of the words) and a scrim
 * identical in shape to `.apr-scrim` keeps the words legible over it exactly
 * the same way. What changes is what happens INSIDE that circle.
 */
export const VEIL = {
  washPx: APERTURE.washPx,
  blurPx: { desktop: 44, phone: 26 } as Record<Mode, number>,
  /** The blurred base's own opacity: always partly visible, never fully. */
  baseOpacity: 0.55,
  /** The clear window's diameter, px: small enough that most of the
   *  photograph stays hidden at any one instant. */
  portholePx: { desktop: 230, phone: 140 } as Record<Mode, number>,
  /** One full drift through every waypoint and back, ms. */
  cycleMs: 9000,
};
