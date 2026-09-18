import { CANVAS, type Mode } from "@/components/lab/stage";

import {
  factsOf,
  lifeMs,
  type Path,
  poolFor,
  scriptedPointer,
  type TrailSpec,
} from "./trail-engine";

/**
 * THE OPTIONS, AS NUMBERS (the image-trail lane, 2026-09-18).
 *
 * ★ EVERY FIGURE THE BOARD'S WORDS STATE IS READ OFF THIS FILE, and
 * `looks.test.ts` holds each one to what the engine measures, so a retune turns
 * a test red rather than leaving a tile that says one thing and draws another.
 * The tile-sign bug reached Will once and it is not reaching him twice.
 *
 * ★ A PHONE IS NOT A SMALL DESKTOP. Only two numbers swap: the card's size and
 * the density that follows it, because both are a share of the column rather
 * than a pixel count. The decay, the slide and the lag are the same clocks at
 * both, which is what keeps one answer from Will covering both screens.
 */

export { CANVAS, type Mode };

/* ── Density: the travel between births ──────────────────────────────────── */

export const DENSITIES = ["d60", "d100", "d140"] as const;
export type Density = (typeof DENSITIES)[number];

/** px of travel between one photograph and the next, at 1440. Demo one runs
 *  100; Will asked round one for more density than it had. */
export const DENSITY: Record<Density, number> = {
  d60: 60,
  d100: 100,
  d140: 140,
};

/* ── The decay: how a photograph goes ────────────────────────────────────── */

export const DECAYS = ["quick", "linger", "long"] as const;
export type Decay = (typeof DECAYS)[number];

type DecaySpec = Pick<TrailSpec, "holdMs" | "fadeMs" | "shrinkMs" | "endScale">;

/**
 * The three clocks. The fade and the shrink are deliberately NOT the same
 * length: a photograph that is nearly gone in size while it is still bright
 * reads as travelling away from the reader, and one that dims at its full size
 * reads as a light being turned down. The long option is the one that slows the
 * shrink most, which is why it also keeps the most of itself at the end.
 */
export const DECAY: Record<Decay, DecaySpec> = {
  quick: { holdMs: 180, fadeMs: 720, shrinkMs: 700, endScale: 0.2 },
  linger: { holdMs: 260, fadeMs: 1140, shrinkMs: 1000, endScale: 0.24 },
  long: { holdMs: 340, fadeMs: 1660, shrinkMs: 1700, endScale: 0.34 },
};

/* ── The entrance ────────────────────────────────────────────────────────── */

export const ENTRANCES = ["slide", "drift", "flick"] as const;
export type EntranceId = (typeof ENTRANCES)[number];

/* ── The size ────────────────────────────────────────────────────────────── */

export const SIZES = ["s180", "s240", "s300"] as const;
export type SizeId = (typeof SIZES)[number];

/** The card's WIDTH at 1440, and what it becomes at 375. A phone's card is a
 *  share of its column rather than the desktop number shrunk by the viewport
 *  ratio, which would leave a thumbnail nobody can read a face in. */
export const SIZE: Record<SizeId, Record<Mode, number>> = {
  s180: { desktop: 180, phone: 100 },
  s240: { desktop: 240, phone: 132 },
  s300: { desktop: 300, phone: 164 },
};

/* ── At a phone ──────────────────────────────────────────────────────────── */

export const PHONES = ["touch", "walks", "still", "none"] as const;
export type PhoneId = (typeof PHONES)[number];

/* ── The homes, and the words each one has to stay off ───────────────────── */

export type HomeId = "privacy" | "close" | "notfound" | "bank";

/** Which ground each home stands on, for the board's own words. */
export const GROUND: Record<HomeId, "cinema" | "paper"> = {
  privacy: "cinema",
  close: "cinema",
  notfound: "paper",
  bank: "cinema",
};

/**
 * ★ EVERY HOME'S LOCKUP, MEASURED ON THE RENDERED BLOCK rather than reasoned
 * about: the union of the painted lines in each frame, read off the live board
 * at 1440 and 375 (2026-09-18). It is the box the trail fades inside, so a
 * photograph never sits on top of a line of type (`shy`, trail-engine.ts).
 * `bank` has no words, so it has no box and the trail runs whole. Re-measure if
 * a page's copy changes: copy is open (bible 21).
 */
export const LOCKUP: Record<
  HomeId,
  Record<Mode, { cx: number; cy: number; hx: number; hy: number }> | null
> = {
  privacy: {
    desktop: { cx: 720, cy: 497, hx: 384, hy: 173 },
    phone: { cx: 188, cy: 412, hx: 172, hy: 180 },
  },
  close: {
    desktop: { cx: 720, cy: 465, hx: 336, hy: 141 },
    phone: { cx: 188, cy: 380, hx: 172, hy: 141 },
  },
  notfound: {
    desktop: { cx: 720, cy: 523, hx: 224, hy: 158 },
    phone: { cx: 188, cy: 438, hx: 164, hy: 194 },
  },
  bank: null,
};

/**
 * How faint a photograph goes over the words, and how much of it has to be over
 * them to get there. A fifth is where the type reads cleanly at every size in
 * the lockup (the eyebrow decides it: small and muted, and the casualty in the
 * first capture of this board) while the photograph is still visibly there,
 * which is what makes it read as passing BEHIND the words rather than as being
 * switched off. A third of a card's area is the coverage that means "this one
 * is over the headline" rather than "this one is near it".
 */
export const SHY = { floor: 0.22, cover: 0.34 } as const;

/* ── One look, assembled ─────────────────────────────────────────────────── */

export type Look = {
  density: Density;
  decay: Decay;
  entrance: EntranceId;
  size: SizeId;
};

export const DEFAULT_LOOK: Look = {
  density: "d60",
  decay: "linger",
  entrance: "slide",
  size: "s240",
};

/**
 * The slide, which is the pace of the chase rather than of the trail. Demo one
 * runs 0.9 s; ours is a touch shorter so a dense trail does not have six
 * photographs still travelling at once, which reads as sliding rather than as
 * photographs being put down.
 */
export const SLIDE_MS = 760;

/** The lag, per 60th of a second. Demo one's 0.1 is right and this is why: any
 *  faster and the card is born under the cursor, so there is no chase to watch;
 *  any slower and it is born off the far side of the screen. */
export const LAG = 0.1;

export function specOf(
  look: Look,
  mode: Mode,
  home: HomeId = "privacy",
): TrailSpec {
  const size = SIZE[look.size][mode];
  const words = LOCKUP[home]?.[mode];
  // Density is stated at 1440 and scales with the card, so "half a photograph
  // apart" means the same thing on both screens.
  const scale = size / SIZE[look.size].desktop;
  const base: TrailSpec = {
    density: Math.round(DENSITY[look.density] * scale),
    size,
    slideMs: SLIDE_MS,
    ...DECAY[look.decay],
    entrance: look.entrance,
    lag: LAG,
    pool: 8,
    keeper: true,
    shy: words ? { ...words, ...SHY } : undefined,
  };
  // The ring is derived from the life and the density rather than typed, so a
  // longer decay or a denser trail pays for its own nodes.
  return { ...base, pool: poolFor(base, mode === "phone" ? 700 : 1100) };
}

/** The scripted hand every capture, still and `lab:demo` press uses. */
export const scriptFor = (mode: Mode): Path =>
  scriptedPointer(CANVAS[mode].w, CANVAS[mode].h);

/**
 * The moment the still is frozen at: past one whole life, so the composition a
 * reader meets is a trail in flight with its tail already decaying, never a
 * trail still filling up from nothing.
 */
export const stillAt = (look: Look, mode: Mode) =>
  Math.round(lifeMs(specOf(look, mode)) * 2.4);

/** What a look costs, measured on the scripted hand it will be drawn with. */
export function facts(look: Look, mode: Mode, home: HomeId = "privacy") {
  const spec = specOf(look, mode, home);
  const f = factsOf(spec, [scriptFor(mode)], 14_000, CANVAS[mode]);
  return { ...f, life: lifeMs(spec), size: spec.size, density: spec.density };
}
