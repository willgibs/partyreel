/**
 * Round 4 of the identity exploration. Instrument Serif is still the leaning
 * favorite; this slate answers Will's three asks: (B) the multi-weight
 * Instruments Serif fork he found (built from source + vendored, REAL weight
 * instead of option A's synthetic stroke), (C) an all-caps condensed register
 * (the MasterClass look), and (D) Noto Serif Display (the display cut of
 * Google's Noto). A's size calibration also bumps 0.58 -> 0.60.
 *
 * If none of the new variations beats A, the call is: continue with
 * Instrument Serif into Phase 2 and fine-tune sizing in the built UI.
 */
export type FontOptionId =
  | "instrument"
  | "instruments-weighted"
  | "condensed-caps"
  | "noto"
  | "inter";

export type FontOption = {
  id: FontOptionId;
  letter: "A" | "B" | "C" | "D" | "E";
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
      "The benchmark: the official single-weight face, size bumped again (0.60) with the hairline-stroke weight treatment.",
    wrapperClass: "font-opt-instrument",
  },
  {
    id: "instruments-weighted",
    letter: "B",
    name: "Instruments Serif (weighted fork)",
    blurb:
      "Eli Heuer's OFL fork with a real weight axis (400-900), built from source and self-hosted. Shown at 600: true drawn weight instead of a synthetic stroke.",
    wrapperClass: "font-opt-instruments",
  },
  {
    id: "condensed-caps",
    letter: "C",
    name: "Condensed caps (Oswald)",
    blurb:
      "The MasterClass register: tall condensed grotesk, all caps, open tracking. Editorial in a completely different way; serifs leave the building.",
    wrapperClass: "font-opt-oswald",
  },
  {
    id: "noto",
    letter: "D",
    name: "Noto Serif Display",
    blurb:
      "The display cut of Google's Noto family: classical proportions, full weight range, enormous language coverage as a side benefit.",
    wrapperClass: "font-opt-noto",
  },
  {
    id: "inter",
    letter: "E",
    name: "Inter (control)",
    blurb:
      "Inter everywhere, display included: the baseline to beat. If a face above does not clearly beat this, it is not earning its load time.",
    wrapperClass: "font-opt-inter",
  },
];

export function getFontOption(id: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.id === id);
}
