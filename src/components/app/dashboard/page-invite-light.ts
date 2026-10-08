import {
  chromaOf,
  type EdgeLight,
  HOUSE_LIGHT,
  intensityOf,
  unOlive,
} from "@/components/app/event-feed/event-hub-head-edge";
import { css, fitChroma, orbFor } from "@/lib/avatar/gradient";
import { srgbToOklch } from "@/lib/shared/sampled-palette";

/**
 * THE LIGHT OF HER PAGE'S INVITATION, READ FROM HER OWN PHOTOGRAPHS (`account-moments` r2, `invite=plate`; the board's
 * `invite-plate.tsx`, ported with its numbers). Pure, so every rule here is read in a node test; the decode and the
 * canvas are `page-invite-read.ts`'s.
 *
 * ★ A KEY AND ITS FILL, AS A PHOTOGRAPHER LIGHTS: her photographs (up to six, read as one strip) are weighed by colour
 * family, the heaviest family is the KEY and the heaviest a quarter turn or more from it is the ANSWER: two hues, never a
 * spectrum (a plate lit by every colour she photographed is the rainbow creeping back in, `threeAtMost`'s own words).
 * With no photograph to read it is her seed (her avatar's own hue), and with no seed the house ember (`HOUSE_LIGHT`):
 * Afterglow's ladder, in code.
 *
 * ★ THE BODY FALLS AWAY FROM YELLOW. Light whose alpha alone falls goes brown in the dark (a dim amber IS brown), so a
 * warm body falls through the key's own deeper neighbour (her amber through the peach of her roses), still inside its
 * family. A dim blue is still blue, so a cool light keeps its hue.
 */

/** What lights the plate, and where it came from (her photographs, then her seed, then the house). */
export type Lit = {
  /** The Seam's own light: its glow and its lit edge, six hues left to right. */
  edge: EdgeLight;
  /** The hues its body falls through, sixth for sixth. */
  fall: readonly number[];
  /** The strength of its right-hand pool: 1 where that pool is the key's own, less where it is the answer. */
  fill: number;
  from: "photographs" | "seed" | "house";
};

/** How wide each photograph is read: the sampler's own 32px, one cell a photograph. */
export const CELL = 32;

/** A family's reach: hues within it are one colour (production's `threeAtMost` reach). */
const FAMILY = 40;

/** How far the answer stands from the key: a quarter turn, so the two read as two lights, never a blend. */
const ANSWER = 90;

/** The least share of her light an answer carries: a hue she barely photographed is not her light. */
const ANSWER_SHARE = 0.1;

/**
 * ★ A FILL IS LIT BY ITS SHARE, NEVER AS BRIGHT AS ITS KEY: half strength, and the rest only as her photographs carry it
 * (an answer as heavy as its key would reach `FILL_MOST`), so a cool answer is a kiss at the right, never a second spotlight.
 */
const FILL_LEAST = 0.5;
const FILL_MOST = 0.85;

/** How far a gold light's body drifts as it falls: half a family's reach at most, so it is still the key's own colour. */
const FALL = 20;

/** The hue every warm light's fall drifts away from. */
const YELLOW = 95;

/**
 * THE BODY'S REGISTER: Afterglow's Bloom in the room (the deck's `room`, quoted, never retuned here), a step deeper and
 * richer than the Seam's own glow, with the yellows lifted so a gold light stays gold.
 */
const BODY = { l: 0.72, lift: 0.09, c: 0.15, floor: 0.13 } as const;

/** The house's chroma where it is the seed's hue that lights the plate (the room's full strength). */
const SEED_CHROMA = 0.15;

const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

const angle = (x: number, y: number) =>
  ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

/** How far a hue sits toward yellow, 0 to 1 (production's `yellowness`, which the edge module keeps to itself). */
export const yellowness = (h: number) =>
  Math.max(0, Math.cos(((gap(h, YELLOW) / 70) * Math.PI) / 2));

/** A warm light's body falls through its deeper neighbour; a cool one keeps its hue. */
export function deepen(h: number): number {
  const step = FALL * yellowness(h);
  return (h + (h < YELLOW ? -step : step) + 360) % 360;
}

/** A colour family of her photographs: its hue (the chroma-weighted mean) and its weight. */
export type Family = { hue: number; weight: number };

/**
 * HER COLOUR FAMILIES, heaviest first: every midtone pixel's hue in 15° buckets weighted by its chroma (the sampler's
 * own reading, `pickSpillHues`), the buckets gathered heaviest first into families within `FAMILY`. A bucket joins a
 * family by its own hue, so a family is a colour she photographed, never an average of two.
 */
export function familiesOf(px: Uint8ClampedArray): Family[] {
  const buckets = Array.from({ length: 24 }, () => ({ x: 0, y: 0, w: 0 }));
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const { l, c, h } = srgbToOklch(px[i], px[i + 1], px[i + 2]);
    // Near-black and near-white have no hue of their own; a grey's is noise.
    if (l < 0.18 || l > 0.95 || c < 0.02) continue;
    const b = buckets[Math.min(23, Math.floor(h / 15))];
    const r = (h * Math.PI) / 180;
    b.w += c;
    b.x += c * Math.cos(r);
    b.y += c * Math.sin(r);
  }
  const families: { x: number; y: number; w: number }[] = [];
  for (const b of buckets.filter((b) => b.w > 0).sort((a, b) => b.w - a.w)) {
    const hue = angle(b.x, b.y);
    const near = families.find((f) => gap(angle(f.x, f.y), hue) < FAMILY);
    if (near) {
      near.x += b.x;
      near.y += b.y;
      near.w += b.w;
    } else families.push({ ...b });
  }
  return families
    .map((f) => ({ hue: angle(f.x, f.y), weight: f.w }))
    .sort((a, b) => b.weight - a.weight);
}

/** A light of one hue: the key alone, along the whole edge. */
export function single(hue: number, c: number, from: Lit["from"]): Lit {
  return {
    edge: { hues: Array(6).fill(hue), c },
    fall: Array(6).fill(deepen(hue)),
    fill: 1,
    from,
  };
}

/**
 * THE LIGHT FROM HER FAMILIES: the key along the edge from the left (where Afterglow's key always stands), its answer
 * over the last third. Six sixths, the Seam's own count: the pools stand at a quarter, the middle and four fifths, so
 * the key lights two of them and the answer one. Null where she photographed no colour at all.
 */
export function lightOf(families: readonly Family[], c: number): Lit | null {
  const [key] = families;
  if (!key) return null;
  const total = families.reduce((sum, f) => sum + f.weight, 0);
  const answer = families.find(
    (f) => gap(f.hue, key.hue) >= ANSWER && f.weight / total >= ANSWER_SHARE,
  );
  if (!answer) return single(key.hue, c, "photographs");
  const sixths = [key, key, key, key, answer, answer];
  return {
    edge: { hues: sixths.map((f) => f.hue), c },
    fall: sixths.map((f) => deepen(f.hue)),
    fill: Math.min(
      FILL_MOST,
      FILL_LEAST + FILL_LEAST * (answer.weight / key.weight),
    ),
    from: "photographs",
  };
}

/** The house ember, where there is neither a photograph nor a seed to light the plate. */
export function houseLit(): Lit {
  return {
    edge: HOUSE_LIGHT,
    fall: HOUSE_LIGHT.hues.map(deepen),
    fill: 1,
    from: "house",
  };
}

/**
 * AFTERGLOW'S LADDER: her photographs' light (the strip's pixels, one cell each), then her seed's, then the house's.
 * A strip that holds no colour (a grey roll of film) falls to the seed like no strip at all.
 */
export function litFrom(px: Uint8ClampedArray | null, seed: string): Lit {
  const own = px ? lightOf(familiesOf(px), chromaOf(intensityOf(px))) : null;
  if (own) return own;
  // Her avatar's own hue, at the room's full strength.
  if (seed) return single(orbFor(seed).hue, SEED_CHROMA, "seed");
  return houseLit();
}

/**
 * The body's band, left to right: each sixth's fall at the centre of its share, blended in oklab (`edgeBand`'s way, the
 * hub's own), in the Bloom's register lifted toward yellow so a gold light stays gold, and never olive.
 */
export function bodyBand(fall: readonly number[], c: number): string {
  const stops = fall.map((h, i) => {
    const hue = unOlive(h);
    const tone = fitChroma({
      l: Math.min(0.95, BODY.l + BODY.lift * yellowness(hue)),
      c: Math.min(BODY.c, Math.max(BODY.floor, c)),
      h: hue,
    });
    return `${css(tone)} ${(((i + 0.5) / fall.length) * 100).toFixed(1)}%`;
  });
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}
