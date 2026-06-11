/**
 * Round 2 of the identity exploration: MONOCHROME WON (both modes), so the
 * system is now fixed and TYPE is the variable. Each option swaps only the
 * display face on the locked mono token sheet; body text stays Inter in every
 * option except F, the Inter-everywhere control. The `.font-*` classes in
 * design.css carry per-face tracking/weight tuning (a serif and a grotesk
 * want different optical compensation at display sizes).
 */
export type FontOptionId =
  | "fraunces"
  | "instrument"
  | "newsreader"
  | "space-grotesk"
  | "geist"
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
    id: "fraunces",
    letter: "A",
    name: "Fraunces",
    blurb:
      "The round-1 editorial serif: warm, characterful, a little literary. Photos feel like a magazine feature.",
    wrapperClass: "font-opt-fraunces",
  },
  {
    id: "instrument",
    letter: "B",
    name: "Instrument Serif",
    blurb:
      "A lighter, fashion-editorial serif in a single weight. Sharper and more modern than Fraunces, quieter on the page.",
    wrapperClass: "font-opt-instrument",
  },
  {
    id: "newsreader",
    letter: "C",
    name: "Newsreader",
    blurb:
      "A literary news serif with optical sizing. Softer rhythm, reads warm without leaning vintage.",
    wrapperClass: "font-opt-newsreader",
  },
  {
    id: "space-grotesk",
    letter: "D",
    name: "Space Grotesk",
    blurb:
      "The round-1 night face: a technical grotesk with personality in the details. Crisp against both paper and glass.",
    wrapperClass: "font-opt-space",
  },
  {
    id: "geist",
    letter: "E",
    name: "Geist",
    blurb:
      "A Swiss-modern grotesk built for interfaces. The most neutral option: the photos do absolutely all the talking.",
    wrapperClass: "font-opt-geist",
  },
  {
    id: "inter",
    letter: "F",
    name: "Inter (control)",
    blurb:
      "Inter everywhere, display included: the baseline to beat. If a face above does not clearly beat this, it is not earning its load time.",
    wrapperClass: "font-opt-inter",
  },
];

export function getFontOption(id: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.id === id);
}
