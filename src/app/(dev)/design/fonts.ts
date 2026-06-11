/**
 * Round 3 of the identity exploration. Instrument Serif is the WORKING
 * favorite (not final), with one hard-won lesson baked in: its native
 * rendered size runs visibly smaller than Inter at the same CSS font-size
 * (small x-height for its em box). The fix is systematic, not per-use:
 * every display face carries a one-time `font-size-adjust` calibration in
 * its `.font-opt-*` block (design.css) that normalizes apparent size to
 * Inter's x-height, so standardized heading scales need NO fine adjustment.
 * Phase 2 inherits this as a per-face calibration token in the type scale.
 *
 * The round-2 grotesks + softer serifs didn't land; this slate explores
 * Instrument's high-contrast-display-serif neighborhood instead. Inter
 * stays as the control.
 */
export type FontOptionId =
  | "instrument"
  | "gloock"
  | "dm-serif"
  | "prata"
  | "playfair"
  | "inter";

export type FontOption = {
  id: FontOptionId;
  letter: "A" | "B" | "C" | "D" | "E" | "F";
  /** The display face name, shown as the option title. */
  name: string;
  blurb: string;
  /** The design.css class that maps --font-heading + display tuning. */
  wrapperClass: string;
};

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "instrument",
    letter: "A",
    name: "Instrument Serif",
    blurb:
      "The working favorite: light fashion-editorial serif, single weight. Now size-calibrated so it sits correctly in a standard heading scale.",
    wrapperClass: "font-opt-instrument",
  },
  {
    id: "gloock",
    letter: "B",
    name: "Gloock",
    blurb:
      "A high-contrast display serif with sharper, darker strokes. Instrument's vibe with more presence per glyph.",
    wrapperClass: "font-opt-gloock",
  },
  {
    id: "dm-serif",
    letter: "C",
    name: "DM Serif Display",
    blurb:
      "Rounder and friendlier than Instrument while staying editorial. The most approachable of the slate.",
    wrapperClass: "font-opt-dmserif",
  },
  {
    id: "prata",
    letter: "D",
    name: "Prata",
    blurb:
      "A Didone-leaning single-weight serif: thin hairlines, formal elegance. The most luxurious read.",
    wrapperClass: "font-opt-prata",
  },
  {
    id: "playfair",
    letter: "E",
    name: "Playfair Display",
    blurb:
      "The classic high-contrast display serif, variable weight. More traditional than Instrument; a known quantity.",
    wrapperClass: "font-opt-playfair",
  },
  {
    id: "inter",
    letter: "F",
    name: "Inter (control)",
    blurb:
      "Inter everywhere, display included: the baseline to beat. If a serif above does not clearly beat this, it is not earning its load time.",
    wrapperClass: "font-opt-inter",
  },
];

export function getFontOption(id: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.id === id);
}
