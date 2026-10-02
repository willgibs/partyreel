import type { CSSProperties } from "react";

/**
 * THE PRIVACY HERO'S LENS, PURE DATA (privacy-hero r4, his pick `veil=lens`,
 * wired 2026-10-02): "This feels like a far cleaner design."
 *
 * One clear round pane glides round the page's words and rests on one thing at
 * a time, in the veil the lightbox lays behind an open photograph (`glass-behind`'s
 * numbers, `--glass-behind-*`). It rests on things, never on a face, and never on
 * the words. Every number the picture runs on lives here, so a rest or a size has
 * one home; `privacy-lens.css` holds the structure and reads these as custom
 * properties, and `privacy-lens.test.ts` holds the numbers to what the sheet draws.
 *
 * ★ THE REST PLACES ARE BANDS, NOT PIXELS. The board drew two canvases (1440 by
 * 930, 375 by 760) and the page has every width between and beyond, so a pixel
 * table could only be right at the two it was drawn on. What the board's rests
 * really were is a place in a band: the pane sits in the free band ABOVE the words
 * or BELOW them, a gap clear of the hero's edge (the header above, the foot
 * below), at a share of the screen's width. The hero's padding IS those bands
 * (`bandPx`: the pane's diameter plus a gap each side), so the words can never be
 * under a rest at any width or any copy: the band is the section's own padding and
 * the lockup sits in what is left. At the picked canvases this reproduces the
 * board's rests (1440: 288 and 1152 across at 194, 806 and 403 at 800; 375: the
 * four corners of the screen) and its hero heights (930 and 762).
 *
 * ★ TWO REACHES, ONE SET OF NODES. The words span the narrow screens nearly edge
 * to edge and sit in the middle of the wide ones, so the rests differ: at the
 * phone they stand at the screen's edges (the two climbs between them pass beside
 * the eyebrow, not behind it), and from `WIDE_MIN_PX` they are the board's four
 * round the words. Both reaches ride the same elements; only the keyframes the
 * sheet picks differ.
 *
 * ★ THE PHOTOGRAPH IS THE ONE THING TO SWAP. It is a media-manifest id (bible 9),
 * a stand-in until the one still asked for lands (the Handoff's asset row: 2880 by
 * 1860, people toward the middle where the words sit, small bright things in the
 * top and bottom thirds where a pane rests). The bands are the page's, so the
 * swap changes `PRIVACY_STILL` and nothing else.
 */
export const PRIVACY_STILL = "wedding-toast";

export type Reach = "wide" | "narrow";
export const REACHES: readonly Reach[] = ["narrow", "wide"];

/** The width the wide reach starts at (Tailwind's `sm`); the sheet's media query says the same number. */
export const WIDE_MIN_PX = 640;

export type Side = "top" | "bottom";
/** One place the pane settles: its centre `u` of the way across the screen, in the band above or below the words. */
export type Rest = { u: number; side: Side };

/**
 * In the order it visits them. The wide reach is the board's four round the
 * words (the lights and the window above, the table and the flowers below); the
 * narrow reach is the board's phone rectangle, each rest at an edge of the screen.
 */
export const REST_PLACES: Record<Reach, readonly Rest[]> = {
  wide: [
    { u: 0.2, side: "top" },
    { u: 0.8, side: "top" },
    { u: 0.56, side: "bottom" },
    { u: 0.28, side: "bottom" },
  ],
  narrow: [
    { u: 0.187, side: "top" },
    { u: 0.813, side: "top" },
    { u: 0.813, side: "bottom" },
    { u: 0.187, side: "bottom" },
  ],
};

/**
 * THE PANE'S SIZE AND ITS GAPS, as functions of the screen's width: the board's
 * two sizes (240 at 1440, 124 at 375) joined by a line and held outside them, and
 * the gap round the pane in its band easing the other way (24 at 375, 10 at 1440:
 * the board's phone left air round its rests, its laptop did not). Same numbers
 * as CSS (`lensCss`) and as TS (`lensDiameter`), held equal by the test.
 */
export const LENS = {
  dMinPx: 124,
  dMaxPx: 240,
  gapMinPx: 10,
  gapMaxPx: 24,
  fromPx: 375,
  toPx: 1440,
  /** The pane's own edge from the screen's side, so a rest never touches it, px. */
  edgePx: 8,
  /** How long it settles on each rest, ms. */
  restMs: 2400,
  /** Its glide speed on the board's canvases, px a second; a long glide takes longer rather than rushing. */
  pxPerS: { wide: 420, narrow: 190 } as Record<Reach, number>,
  /** No glide is shorter than this, ms. */
  minGlideMs: 1100,
};

const lerp = (w: number, a: number, b: number) =>
  a + ((b - a) * (w - LENS.fromPx)) / (LENS.toPx - LENS.fromPx);
const between = (v: number, a: number, b: number) =>
  Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));

export const lensDiameter = (w: number) =>
  between(lerp(w, LENS.dMinPx, LENS.dMaxPx), LENS.dMinPx, LENS.dMaxPx);
export const lensGap = (w: number) =>
  between(lerp(w, LENS.gapMaxPx, LENS.gapMinPx), LENS.gapMinPx, LENS.gapMaxPx);
/** One free band above and one below the words: the pane and a gap each side. */
export const bandPx = (w: number) => lensDiameter(w) + 2 * lensGap(w);

/** The site header's height over the hero (`--mkt-header-h`, 4rem): nothing settles under the nav. */
export const HEADER_PX = 64;

/**
 * The hero's natural height at a width, given the lockup's own height (what the
 * header, the two bands and the words add up to; the hero is at least a screen
 * tall, so a taller screen only widens the bands).
 */
export const heroHeightPx = (w: number, lockupPx: number) =>
  HEADER_PX + 2 * bandPx(w) + lockupPx;

/* ── The same numbers as CSS ─────────────────────────────────────────────── */

const n = (v: number) => +v.toFixed(5);
const slope = (a: number, b: number) => n((b - a) / (LENS.toPx - LENS.fromPx));

/** `--pvl-d`: the diameter, a clamped line through the screen's width. */
export const DIAMETER_CSS = `clamp(${LENS.dMinPx}px, calc(${LENS.dMinPx}px + (100vw - ${LENS.fromPx}px) * ${slope(LENS.dMinPx, LENS.dMaxPx)}), ${LENS.dMaxPx}px)`;
/** `--pvl-gap`: the air round the pane in its band. */
export const GAP_CSS = `clamp(${LENS.gapMinPx}px, calc(${LENS.gapMaxPx}px + (100vw - ${LENS.fromPx}px) * ${slope(LENS.gapMaxPx, LENS.gapMinPx)}), ${LENS.gapMaxPx}px)`;

/* ── The path: where it rests, and how long each glide takes ─────────────── */

export type Stop = {
  /** The share of the cycle this stop is reached at, 0 to 1. */
  at: number;
  /** The rest it holds or leaves from. */
  rest: Rest;
  /** True where a glide leaves this stop (its segment eases); false for a hold. */
  leaves: boolean;
};

/**
 * THE PANE'S NOMINAL CANVASES, where the board timed its glides: the centres of
 * its rests in px, so a glide takes as long here as it did on the board. On the
 * real page the distances vary with the screen and the timeline does not (one set
 * of keyframes per reach, never one per size), so a bigger screen glides faster,
 * which is what keeps a glide about two seconds at every width.
 */
export const NOMINAL: Record<Reach, { w: number; h: number }> = {
  wide: { w: 1440, h: 930 },
  narrow: { w: 375, h: 762 },
};

/** A rest's centre on its nominal canvas, px. */
export function restCentre(reach: Reach, rest: Rest) {
  const { w, h } = NOMINAL[reach];
  const d = lensDiameter(w);
  const gap = lensGap(w);
  return {
    x: rest.u * w,
    y: rest.side === "top" ? HEADER_PX + gap + d / 2 : h - gap - d / 2,
  };
}

/**
 * THE TIMELINE, A PURE FUNCTION OF THE REST PLACES: it settles `restMs` on
 * each, then glides to the next at the reach's speed (a long glide takes longer
 * rather than rushing: an even pace reads as calm), with a floor so a short hop
 * still eases. The loop closes on the first rest.
 */
export function lensPath(reach: Reach): {
  stops: Stop[];
  cycleMs: number;
  glidesMs: number[];
} {
  const rests = REST_PLACES[reach];
  const centres = rests.map((r) => restCentre(reach, r));
  const glidesMs = centres.map((a, i) => {
    const b = centres[(i + 1) % centres.length];
    const ms = (Math.hypot(b.x - a.x, b.y - a.y) / LENS.pxPerS[reach]) * 1000;
    return Math.round(Math.max(LENS.minGlideMs, ms) / 10) * 10;
  });
  const cycleMs =
    rests.length * LENS.restMs + glidesMs.reduce((s, g) => s + g, 0);
  const stops: Stop[] = [];
  let t = 0;
  rests.forEach((rest, i) => {
    stops.push({ at: t / cycleMs, rest, leaves: false });
    t += LENS.restMs;
    stops.push({ at: t / cycleMs, rest, leaves: true });
    t += glidesMs[i];
  });
  stops.push({ at: 1, rest: rests[0], leaves: false });
  return { stops, cycleMs, glidesMs };
}

/* ── The keyframes, written from the numbers above ───────────────────────── */

/** The house's in-out curve for a glide (the same S a settle uses). */
export const GLIDE_EASE = "cubic-bezier(0.45, 0, 0.2, 1)";

/**
 * A REST'S CENTRE ACROSS, as a length: its share of the box's width, kept the
 * pane's own radius and an edge from either side so a narrow screen never clips
 * it. `%` is the box the transform sits on: the track (the whole stage) for the
 * pane, and the view (the whole stage too) for the photograph inside it.
 */
const centreX = (u: number) =>
  `clamp(var(--pvl-edge), ${n(u * 100)}%, calc(100% - var(--pvl-edge)))`;

/**
 * THE PANE'S TRANSFORM AT A REST, and the photograph's against it: the pane's
 * top-left corner is where its centre minus its radius lands (the header and a
 * gap down in the top band; a gap and a diameter up from the foot in the bottom
 * one), and the photograph inside moves the opposite way by exactly as much, so
 * what the pane shows is always the part of the photograph behind it. Both are
 * transforms, so the compositor runs them with no paint, and both share one clock
 * and one curve, so they cannot drift apart mid-glide.
 */
export function restTransforms(rest: Rest): { pane: string; view: string } {
  const cx = centreX(rest.u);
  const x = `calc(${cx} - var(--pvl-d) / 2)`;
  const xBack = `calc(var(--pvl-d) / 2 - ${cx})`;
  const y =
    rest.side === "top"
      ? "calc(var(--pvl-hdr) + var(--pvl-gap))"
      : "calc(100% - var(--pvl-gap) - var(--pvl-d))";
  const yBack =
    rest.side === "top"
      ? "calc(0px - var(--pvl-hdr) - var(--pvl-gap))"
      : "calc(var(--pvl-gap) + var(--pvl-d) - 100%)";
  return {
    pane: `translate(${x}, ${y})`,
    view: `translate(${xBack}, ${yBack})`,
  };
}

/** The keyframe names the sheet's two reaches use. */
export const keyframeNames = (reach: Reach) => ({
  pane: `pvl-lens-${reach}`,
  view: `pvl-lens-${reach}-view`,
});

/**
 * THE PANE'S TWO KEYFRAME SETS FOR A REACH: the pane to each rest, and the
 * photograph inside it the opposite way, on one timeline.
 */
export function lensKeyframes(reach: Reach): string {
  const { stops } = lensPath(reach);
  const names = keyframeNames(reach);
  const pct = (v: number) => `${(v * 100).toFixed(3)}%`;
  const block = (which: "pane" | "view") =>
    stops
      .map(
        (s) =>
          `${pct(s.at)}{transform:${restTransforms(s.rest)[which]};animation-timing-function:${s.leaves ? GLIDE_EASE : "linear"}}`,
      )
      .join("");
  return `@keyframes ${names.pane}{${block("pane")}}@keyframes ${names.view}{${block("view")}}`;
}

/** Both reaches' keyframes, the one block the stage writes. */
export const LENS_KEYFRAMES = REACHES.map(lensKeyframes).join("");

/**
 * THE CUSTOM PROPERTIES THE HERO AND ITS STAGE READ: the pane's sizes (the hero's
 * padding is the bands, so they sit on the section), each reach's clock and the
 * transforms it rests at (the reduced-motion picture: the pane parked on its first
 * rest), and the names of its keyframes.
 */
export function lensVars(): CSSProperties {
  const vars: Record<string, string> = {
    "--pvl-hdr": "var(--mkt-header-h, 4rem)",
    "--pvl-d": DIAMETER_CSS,
    "--pvl-gap": GAP_CSS,
    "--pvl-band": "calc(var(--pvl-d) + 2 * var(--pvl-gap))",
    "--pvl-edge": `calc(var(--pvl-d) / 2 + ${LENS.edgePx}px)`,
  };
  for (const reach of REACHES) {
    const first = REST_PLACES[reach][0];
    vars[`--pvl-cycle-${reach}`] = `${lensPath(reach).cycleMs}ms`;
    vars[`--pvl-rest-${reach}`] = restTransforms(first).pane;
    vars[`--pvl-rest-view-${reach}`] = restTransforms(first).view;
    vars[`--pvl-name-${reach}`] = keyframeNames(reach).pane;
    vars[`--pvl-name-view-${reach}`] = keyframeNames(reach).view;
  }
  return vars as CSSProperties;
}

/**
 * THE STILL'S `sizes`, TWICE. The pane's photograph is sharp and covers the hero,
 * so it renders at the screen's width or, on a screen taller than the photograph
 * is wide, at the hero's height times the photograph's aspect (about 1.5 to 1.55;
 * the hero is at least a screen tall). The veil's is blurred 28px and dimmed, past
 * recognising anything, so it asks for a small candidate (less to fetch and decode,
 * and the hero's largest image paints sooner). Both come from the media
 * manifest's one id.
 */
export const PANE_SIZES = "max(100vw, 160svh)";
export const VEIL_SIZES = "40vw";
