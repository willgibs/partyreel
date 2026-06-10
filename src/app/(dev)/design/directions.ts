/**
 * The three V1 identity directions (program Phase 1). Each is a complete visual
 * hypothesis: a scoped token sheet in design.css (`wrapperClass`), a display
 * face loaded in the (dev) layout, and a motion personality. The screens render
 * identically-structured markup inside each wrapper so the ONLY variable is the
 * direction itself.
 *
 * Set composition (Will, 2026-06-10): TWO monochrome directions + ONE accent.
 * Brand color reads loud next to photographs, and Partyreel always has
 * photographs; in A and B `--brand` maps to the foreground so anything
 * accent-tinted renders as ink and the media is the only color on the page.
 * Even in C the accent never rides inline iconography (CTA + punctuation
 * only). That "nothing loud" stance is general policy regardless of winner.
 */
export type DirectionId = "monochrome" | "night" | "celebration";

export type Direction = {
  id: DirectionId;
  /** Letter label used in the index + screenshot pack (A/B/C). */
  letter: "A" | "B" | "C";
  name: string;
  tagline: string;
  /** The design.css scope class carrying the full token sheet. */
  wrapperClass: string;
  /** True when the direction's primary mode is dark (affects shell chrome). */
  leadsDark: boolean;
  /** False for the monochrome directions: no accent exists at all. */
  hasAccent: boolean;
  /** One-line motion personality, shown on the specimen page. */
  motion: string;
};

export const DIRECTIONS: Direction[] = [
  {
    id: "monochrome",
    letter: "A",
    name: "Monochrome Editorial",
    tagline:
      "Light paper, serif display, pure black and white chrome. The photos are the only color on the page.",
    wrapperClass: "dir-monochrome",
    leadsDark: false,
    hasAccent: false,
    motion: "Crisp and near-instant. 150-200ms, strong ease-out, zero bounce.",
  },
  {
    id: "night",
    letter: "B",
    name: "Monochrome Night",
    tagline:
      "Dark-first glass, still pure black and white. Against near-black, the media becomes the light source.",
    wrapperClass: "dir-night",
    leadsDark: true,
    hasAccent: false,
    motion: "Smooth blur-masked crossfades at 200-260ms.",
  },
  {
    id: "celebration",
    letter: "C",
    name: "Warm Celebration",
    tagline:
      "The single accent exploration: golden-amber warmth, soft layered depth, rounded geometry.",
    wrapperClass: "dir-celebration",
    leadsDark: false,
    hasAccent: true,
    motion:
      "Soft settles at 220-280ms with one celebratory moment reserved for upload success.",
  },
];

export function getDirection(id: string): Direction | undefined {
  return DIRECTIONS.find((d) => d.id === id);
}
