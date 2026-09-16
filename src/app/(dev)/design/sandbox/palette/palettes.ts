import {
  ACCENT_BY_ID,
  DARK_BY_ID,
  LIGHT_BY_ID,
  accentFor,
  type Accent,
  type AccentId,
  type AccentMode,
  type DarkId,
  type DarkSet,
  type LightId,
  type LightSet,
  type Pair,
} from "./registers";

/**
 * THE CATALOG (round seven, the cool round, 2026-09-16).
 *
 * ★ WHY THIS FILE EXISTS. Rounds one to five built a MACHINE: six dark sets,
 * five light sets, four accents and five switches. Will read it and said so
 * ("it almost feels like I'm reading a PhD on color theory... a dozen polished
 * variants with preview palettes with some demo UI to config & compare would've
 * been far more helpful"). A configuration space is not a choice. A CATALOG is:
 * twelve finished answers with names, each one complete, each one pickable.
 *
 * So this file is the curation layer over `registers.ts`, and nothing else. It
 * invents no value: every palette is one dark set plus one light set plus the
 * one accent it declares, all of them argued and pinned by `registers.test.ts`.
 *
 * ★ THE CARD'S ARGUMENT IS NOT HERE, and that is the one-fact-one-home rule
 * doing its work. Round six carried a `why` on every palette which was word for
 * word the candidate's `rationale` in spec.ts, two copies of one sentence held
 * equal by a test. The spec is where the review scanner reads it, so the spec
 * is its home; what stays here is `pairs`, the accent config's own line, which
 * nothing else says.
 *
 * ★ ROUND SEVEN LEANED THE WHOLE CATALOG COOL, which is Will's ruling a few
 * questions into his first sitting: "I'm a much bigger fan of the cooler gray
 * direction in slate, studio, and reel... Many of the warmer tones feel like
 * they'd clash with a colorful mix of photos. Slate could even be less blue,
 * but I'd like more cool gray options." So nine of the twelve are cool, three
 * are the controls every cool card is read against (Today, Ladder at chroma
 * zero, and Ember kept as the one warm comparison), and the warm light side
 * left the board with Press and Daylight.
 *
 * ★ AND THE ACCENT BECAME A CONFIG. Every palette declares the ONE hue that
 * would pair with its grey; the board's switch decides whether any of them is
 * worn. That is what retired Gallery and Signal: with the accent off by
 * default, "the palette with no accent" is every palette, and a card whose only
 * claim was its hue is not a card.
 *
 * ★ THE RULE FOR ADDING ONE. A palette earns a row only if a reviewer could
 * prefer it FOR A REASON he could say out loud: a blacker ground, less of the
 * cool, a white card on a grey page, the smallest possible change. Two rows
 * that differ only in a number are one row, and two that differ only in the
 * accent are now one row as well. Fewer than eight is not a catalog and more
 * than sixteen is a wall, which is why twelve is the standing size.
 */
export type PaletteDef = {
  /** The ledger's token, and the dock's option id. */
  id: string;
  /** One word, the name on the card and in the dock. */
  name: string;
  dark: DarkId;
  light: LightId;
  /**
   * THE ONE ACCENT THIS PALETTE DECLARES: the hue chosen for this grey, at the
   * accent's only jobs (the primary action, the focus ring, the live dot). It
   * is worn only while the board's accent switch is on, which is why no palette
   * may declare `ink`: off is the switch's job, not a palette's.
   */
  accent: Exclude<AccentId, "ink">;
  /** One line: why THAT hue for THIS grey. Read on the card and in the ask. */
  pairs: string;
  /**
   * Whether the set-apart panel is its own ground. Every proposal says yes;
   * Today says no, because today it is `--muted` at six alphas of a token that
   * also does hover.
   */
  mat: boolean;
  recommended?: boolean;
};

export const PALETTES: PaletteDef[] = [
  {
    id: "today",
    name: "Today",
    dark: "today",
    light: "today",
    accent: "blue",
    pairs:
      "The save blue, because it is the only hue already in the system and Today's whole claim is that nothing new is needed.",
    mat: false,
  },
  {
    id: "ladder",
    name: "Ladder",
    dark: "ladder",
    light: "paper",
    accent: "flare",
    pairs:
      "Flare, because a dead neutral chrome is the one ground that can carry the loudest hue on the board without arguing with it.",
    mat: true,
  },
  {
    id: "ember",
    name: "Ember",
    dark: "ember",
    light: "paper",
    accent: "flare",
    pairs:
      "Flare, at 330: the only hue that agrees with a warm room instead of fighting it.",
    mat: true,
  },
  {
    id: "onyx",
    name: "Onyx",
    dark: "onyx",
    light: "pearl",
    accent: "teal",
    pairs:
      "Teal, because a barely-tinted chrome has nothing for a hue to clash with, and teal is the farthest thing on the wheel from every state colour.",
    mat: true,
  },
  {
    id: "graphite",
    name: "Graphite",
    dark: "graphite",
    light: "pearl",
    accent: "teal",
    pairs:
      "Teal, at 86 degrees from the hue the greys are tinted with, so the accent can never be read as part of the chrome.",
    mat: true,
    recommended: true,
  },
  {
    id: "steel",
    name: "Steel",
    dark: "steel",
    light: "pearl",
    accent: "flare",
    pairs:
      "Flare, because a strongly cool chrome is the one that most wants a warm counterweight at the primary action.",
    mat: true,
  },
  {
    id: "pitch",
    name: "Pitch",
    dark: "pitch",
    light: "mist",
    accent: "teal",
    pairs:
      "Teal, which is the one hue that still reads at full strength against a true black ground without glowing.",
    mat: true,
  },
  {
    id: "mist",
    name: "Mist",
    dark: "graphite",
    light: "mist",
    accent: "violet",
    pairs:
      "The reel's violet, the closest declaration to the chrome's own 286: the card that shows what an accent inside the grey's own family looks like.",
    mat: true,
  },
  {
    id: "slate",
    name: "Slate",
    dark: "slate",
    light: "pearl",
    accent: "teal",
    pairs:
      "Teal, because Slate's old accent was the save blue and a blue accent on a blue-ish grey is what made the whole thing read blue.",
    mat: true,
  },
  {
    id: "reel",
    name: "Reel",
    dark: "slate",
    light: "paper",
    accent: "violet",
    pairs:
      "Violet, at 300: the hue the host already presses to add a clip to the reel, promoted to the brand.",
    mat: true,
  },
  {
    id: "studio",
    name: "Studio",
    dark: "room",
    light: "bright",
    accent: "violet",
    pairs:
      "Violet, because a set with no chroma anywhere can afford the most saturated declaration on the board.",
    mat: true,
  },
  {
    id: "dusk",
    name: "Dusk",
    dark: "graphite",
    light: "today",
    accent: "teal",
    pairs:
      "Teal, kept the same as Graphite's, because the only difference between these two cards should be the light side.",
    mat: true,
  },
];

export const PALETTE_BY_ID = Object.fromEntries(
  PALETTES.map((p) => [p.id, p]),
) as Record<string, PaletteDef>;

/** The one this board would rule, which is what the verdict names. */
export const RECOMMENDED_PALETTE =
  PALETTES.find((p) => p.recommended) ?? PALETTES[0];

/** A palette's parts, resolved. Every renderer and the paste read this, so the
 *  board can never show one thing and paste another. */
export type ResolvedPalette = {
  def: PaletteDef;
  pair: Pair;
  darkSet: DarkSet;
  lightSet: LightSet;
  /** What the palette DECLARES, whatever the switch says. */
  declared: Accent;
  /** What it WEARS under the switch: its own, or none. */
  accent: Accent;
};

export function resolvePalette(
  id: string,
  accentMode: AccentMode = "none",
): ResolvedPalette {
  const def = PALETTE_BY_ID[id] ?? RECOMMENDED_PALETTE;
  const darkSet = DARK_BY_ID[def.dark];
  const lightSet = LIGHT_BY_ID[def.light];
  return {
    def,
    darkSet,
    lightSet,
    declared: ACCENT_BY_ID[def.accent],
    accent: accentFor(def, accentMode),
    pair: { dark: darkSet, light: lightSet },
  };
}

/** The dock's options, from this one list. The ask's twelve options are written
 *  out in `spec.ts` instead, because the desk's review scanner reads a spec as
 *  TEXT rather than importing it, and a computed `options` reads as an ask with
 *  no answers at all (it did: lab-review.test.ts caught it). `registers.test.ts`
 *  pins the two lists equal, id for id and label for label, so the duplication
 *  can never drift. */
export const PALETTE_OPTIONS = PALETTES.map((p) => ({
  id: p.id,
  label: p.name,
}));
