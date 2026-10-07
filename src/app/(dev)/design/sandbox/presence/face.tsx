"use client";

import "./face.css";

import { type CSSProperties, useMemo } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  background,
  blendMode,
  contrast,
  css,
  fitChroma,
  FLOOR,
  GROUND,
  inkFor,
  type Lch,
  type Orb,
  orbFor,
  seedsFrom,
} from "@/lib/avatar/gradient";
import { cn } from "@/lib/utils";

import { lampColor } from "./light";

/** How a face with no photograph is coloured (the `colour` decision): production's wheel, one warm arc, or lit. */
export type Palette = "wheel" | "warm" | "lit";

/**
 * ONE FACE: production's `Avatar` on its seed (the wheel, as built), or the
 * same person drawn from the house ember's own arc (`warm`), or LIT: a disc of
 * the room with her own hue as light falling into it, from where her orb's
 * light sits, and her initial standing in that light.
 *
 * ★ ONE PERSON, ONE SEED, EVERY PALETTE: each draws from production's own
 * hashing (`seedsFrom`, `orbFor`), so her light sits where it sits on her
 * wheel face and only the colour's mapping or its register changes.
 */
export function Face({
  seed,
  name,
  palette,
  size,
  className,
  initial,
}: {
  seed: string;
  name: string;
  palette: Palette;
  size: "sm" | "default" | "lg" | "xl";
  className?: string;
  initial?: string;
}) {
  // Both fits are bisections (the legible window, the gamut), so a row that
  // re-renders on every beat of its ring or pointer does not redo them.
  const warm = useMemo(
    () => (palette === "warm" ? emberOrb(seed) : null),
    [palette, seed],
  );
  const lit = useMemo(
    () => (palette === "lit" ? litLight(seed) : null),
    [palette, seed],
  );
  const letter = name.slice(0, 1);

  if (warm)
    return (
      <Avatar
        size={size}
        className={className}
        data-pr-warm=""
        style={{
          backgroundImage: background(warm, "mesh"),
          backgroundBlendMode: blendMode("mesh"),
        }}
      >
        <AvatarFallback
          className={cn("bg-transparent", initial)}
          style={{ color: css(warm.ink) }}
        >
          {letter}
        </AvatarFallback>
      </Avatar>
    );
  if (lit)
    return (
      <Avatar
        size={size}
        className={cn("pr-lit", className)}
        data-pr-lit=""
        style={lit}
      >
        <AvatarFallback
          className={cn("pr-lit-initial bg-transparent font-medium", initial)}
        >
          {letter}
        </AvatarFallback>
      </Avatar>
    );
  return (
    <Avatar size={size} seed={seed} className={className}>
      <AvatarFallback className={initial}>{letter}</AvatarFallback>
    </Avatar>
  );
}

/**
 * A SEED'S ORB IN A PALETTE: production's own (`orbFor`) for the wheel and
 * for lit (which lights her wheel hue), the ember's for warm. A party's seed
 * reads it too (`seed.tsx`), so a new party's light follows the colour answer
 * as its guests' faces do.
 */
export function orbOf(seed: string, palette: Palette): Orb {
  return palette === "warm" ? emberOrb(seed) : orbFor(seed);
}

/* ── warm: her own colour from the house ember's arc ──────────────────────── */

/**
 * THE EMBER ARC, in oklch degrees: rose at 4, through crimson, scarlet and
 * coral, to amber at 66, the house ember's own family (amber to coral, its
 * deep end red) carried one step toward rose. (Drawn from 356, its first
 * faces read hot pink once the mesh's lit pool lay over them.)
 *
 * ★ WHY NOT THE GENERATOR'S OWN `warm` (8 to 118): a face's body is fitted
 * dark enough to carry a near-white initial (about L 0.52), and at that depth
 * every hue past about 66 reads brown, then olive; half of a crowd drawn from
 * 8 to 118 lands there. So the arc stops where amber is still amber at that
 * depth, and starts where rose is still rose, never magenta (amber through
 * rose to violet is the Instagram gradient brand r2 retired).
 */
const EMBER = { from: 4, span: 62 } as const;

/**
 * HER PLACE ON THE EMBER: the same first draw production turns into a hue
 * (`seedsFrom`), mapped onto the arc; her depth rides the arc as the ember
 * does (rose deeper, amber brighter, since a yellow needs more light to stay
 * itself) with a little of her own (the sixth draw, which the mesh never
 * reads), so two neighbours a few degrees apart still part by depth.
 */
function emberOrb(seed: string): Orb {
  const [t = 0, chroma = 0, , , , own = 0.5] = seedsFrom(seed, 6);
  const hue = (EMBER.from + t * EMBER.span) % 360;
  // ★ THE WHOLE LEGIBLE WINDOW, WINE TO APRICOT (the creative director's pass:
  // drawn at one lightness, alternating crimson and orange read as candy at
  // twice the size and a wall of red as a crowd): rose sits at the window's
  // deep end and amber at its light end, her own draw spreading her across it.
  const depth = Math.min(
    0.95,
    Math.max(0.05, 0.1 + 0.7 * t + (own - 0.5) * 0.3),
  );
  // ★ A QUARTER LESS CHROMA THAN THE FIRST DRAW, so a crowd is a party in warm
  // light, never candy; a little above production's floor, since a warm hue
  // drawn soft is brown.
  const body = legibleBody(hue, (0.15 + chroma * 0.07) * 0.76, depth);
  return {
    // Her light where her wheel face has it, the same draws (production's own orb).
    ...orbFor(seed),
    hue,
    body,
    // The lit pole a step up from the body, as `orbFor` steps it, so `mesh` reads the same depths.
    lit: fitChroma({
      l: Math.min(0.88, body.l + 0.215),
      c: body.c * 0.92,
      h: hue,
    }),
    ink: inkFor(hue),
  };
}

/** The lightness a bisection finds: the lowest that passes, or the highest that still does. */
function edge(passes: (l: number) => boolean, want: "lowest" | "highest") {
  let lo = 0.3;
  let hi = 0.8;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (passes(mid) === (want === "lowest")) hi = mid;
    else lo = mid;
  }
  return want === "lowest" ? hi : lo;
}

/**
 * PRODUCTION'S LEGIBILITY RULE, READ THROUGH ITS EXPORTS (`fitBody` keeps its
 * own window private): a body no dimmer than 3:1 on the dark theme's ground
 * and no brighter than 4.5:1 under the near-white initial, the gamut clamp
 * inside every probe; `depth` places her in that window (production sits at
 * its middle) and the chroma steps down a fifth where it closes.
 */
function legibleBody(hue: number, chroma: number, depth: number): Lch {
  const ink = inkFor(hue);
  for (let attempt = 0; attempt < 6; attempt++) {
    const at = (l: number): Lch =>
      fitChroma({ l, c: chroma * Math.pow(0.8, attempt), h: hue });
    const floor = edge(
      (l) => contrast(at(l), GROUND.ink) >= FLOOR.ground,
      "lowest",
    );
    const ceiling = edge(
      (l) => contrast(ink, at(l)) >= FLOOR.letter,
      "highest",
    );
    if (ceiling > floor) return at(floor + (ceiling - floor) * depth);
  }
  // A black disc would be a silent wrong answer: production's own refusal.
  throw new Error(`no legible body at hue ${hue}`);
}

/* ── lit: her hue as light in a piece of the room ─────────────────────────── */

type Vars = CSSProperties & Record<`--${string}`, string>;

/**
 * HER LIGHT, AS `face.css` DRAWS IT: her hue at three depths in the room's
 * register (`lampColor`: light born bright, never olive), the point just past
 * the rim it falls in from (the direction her orb's light sits in, so the same
 * person is lit from the same side on every surface), and the way her
 * initial's shadow falls (away from it).
 *
 * ★ THE SOURCE STANDS OUTSIDE THE DISC: a light inside it is a highlight, and
 * a highlight makes a ball (Aperture's "flat, never a glossy ball"); from just
 * past the rim it is light falling across a piece of the room.
 */
function litLight(seed: string): Vars {
  const o = orbFor(seed);
  // ★ STEERED A LITTLE TOWARD THE TOP: in a row each face's left quarter is
  // under the face before it, so a light from far left lit only what is hidden.
  const dx = (o.light.x - 50) * 0.7;
  const dy = o.light.y - 50;
  const m = Math.hypot(dx, dy) || 1;
  const ux = dx / m;
  const uy = dy / m;
  return {
    "--pr-lit": lampColor({ h: o.hue, w: 1, dl: 0.07 }),
    "--pr-lit-body": lampColor({ h: o.hue, w: 1 }),
    // The far side cools a few degrees and dims, as `orbFor`'s shadow does.
    "--pr-lit-deep": lampColor({ h: (o.hue + 346) % 360, w: 1, dl: -0.1 }),
    // A little past the rim (the disc's radius is 50): far enough to leave no highlight inside it.
    "--pr-lit-x": `${(50 + ux * 56).toFixed(1)}%`,
    "--pr-lit-y": `${(50 + uy * 56).toFixed(1)}%`,
    "--pr-lit-ink": `oklch(0.975 0.02 ${Math.round(o.hue)})`,
    "--pr-lit-sx": `${(-ux * 0.06).toFixed(3)}em`,
    "--pr-lit-sy": `${(-uy * 0.06).toFixed(3)}em`,
  };
}
