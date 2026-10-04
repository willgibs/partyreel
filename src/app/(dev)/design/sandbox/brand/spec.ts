import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE BRAND, ROUND ONE: WHAT THE AGENCY RETURNED (the brand-r1 track, cut
 * 2026-10-04).
 *
 * Will's note of 2026-10-04 (in the manifest, verbatim): the warning amber
 * reads as the brand's colour and a dull one; the aurora is meant to be the
 * foundation of the visual identity but its use is half-baked; the logo is a
 * v1 with no icon; the hashvatar is the one thing that already feels right on
 * a screen with no media. No brand system sits above those, so every surface
 * invents its own. This board is the highest step: three cohesive visions,
 * each a complete system drawn by its own agency team, then one pick that
 * shapes every brand board after it (the marks, the aurora, the page themes,
 * the hero, presence).
 *
 * ★ A DECK PER VISION, ONE ORDER FOR ALL THREE (`deck/contract.ts`): the
 * system first (the idea, the marks, color and status, the signature, the
 * screens without media, type and motion, dark and light), then six
 * touchpoints as sketches captioned "to judge the system, not the design".
 * The applied boards come after the pick and are not drawn here early.
 *
 * ★ NOTHING HERE IS PRODUCTION: every slide is drawn in the board's own
 * folder, on the bootstrap stills and production's own hashvatar generator.
 */
export const BRAND = defineExploration({
  id: "brand",
  title: "The brand",
  surface: "shared",
  desk: 5,
  lives: [
    "docs/systems/design-system.md",
    "src/app/globals.css",
    "src/components/shared/logo.tsx",
    "src/lib/brand/wordmark.ts",
    "src/lib/avatar/gradient.ts",
    "public/icons/",
  ],
  tracks: ["brand-r1"],
  round: {
    n: 1,
    date: "2026-10-04",
    changed:
      "A new board from your brand note: three agency visions, each a whole system and six sketches.",
  },
  opening: {
    about:
      "Partyreel's brand, as three agency visions: each a whole system (marks, color, the aurora's role, type, motion, pages) and six sketches.",
    settled: [
      "The chrome stays achromatic: no brand hue is painted on a control.",
      "The five house lamps stay as light, re-keyable, never removed.",
      "The hashvatar is the atmosphere of a screen with no media.",
    ],
    earlier: [
      "Your note: 'we should not present with that warning color feeling like our brand color.'",
      "'the aurora is meant to be the foundation of our brand visual identity.'",
      "'partyreel still has no real brand visual identity yet as a whole.'",
    ],
  },
  asks: [
    {
      id: "vision",
      label: "The vision",
      question: "Which vision should Partyreel's brand grow from?",
      where: ["Shared", "The brand", "Every surface"],
      when: "Before the marks, the aurora, the page themes and the hero are each drawn on a board of their own.",
      matters:
        "Every brand board after this one is drawn inside the vision you pick.",
      lands:
        "The positioning, the marks, the palette and status set, the signature and the dark or light pages.",
      context:
        "Each option is an agency's deck of fourteen slides: the system first, then six touchpoints as sketches, on real photographs.",
      options: [
        {
          id: "afterglow",
          label: "Afterglow",
          means: "Stand-in until the team's deck lands.",
          gains: "Stand-in.",
          costs: "Stand-in.",
        },
        {
          id: "contact-sheet",
          label: "Contact Sheet",
          means: "Stand-in until the team's deck lands.",
          gains: "Stand-in.",
          costs: "Stand-in.",
        },
        {
          id: "everyone",
          label: "Everyone's Color",
          means: "Stand-in until the team's deck lands.",
          gains: "Stand-in.",
          costs: "Stand-in.",
        },
      ],
      recommended: "afterglow",
      because: "Stand-in until the creative director's pass.",
      configs: [SCREEN],
    },
  ],
});
