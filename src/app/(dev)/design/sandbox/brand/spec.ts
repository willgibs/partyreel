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
 * ★ THE ROUND'S METHOD (the brief's): each vision by its own agency team, a
 * brand designer for the system and an application designer for the six
 * touchpoints; then one creative director who saw only the brief and the
 * captures answered "of each direction, what is its best version?", and the
 * lane refined each deck once from that answer. The three answer one question
 * underneath: what gives Partyreel its colour (the photographs' light, paper
 * and prints, or the guests).
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
      "A new board from your brand note: three agency visions, each a whole system and six sketches, refined once from a creative director's fresh-eyes pass.",
  },
  opening: {
    about:
      "Partyreel's brand as three agency visions, each a whole system (marks, color, status, signature, type, pages) and six sketches on real photographs.",
    settled: [
      "The chrome stays achromatic: no brand hue is painted on a control.",
      "The five house lamps stay as light, re-keyable, never removed.",
      "The hashvatar is the atmosphere of a screen with no media.",
      "The touchpoints are sketches: the marks, the aurora, the page themes, the hero and presence each get a board after your pick.",
    ],
    earlier: [
      "Your note: 'we should not present with that warning color feeling like our brand color.'",
      "'the aurora is meant to be the foundation of our brand visual identity.'",
      "'if we hired a $60k branding agency, what would they return? our logo is barely v1, no icon.'",
    ],
  },
  terms: [
    {
      term: "hashvatar",
      means:
        "Production's seeded avatar colour: one hue for each person, read at several soft depths.",
    },
    {
      term: "Ring",
      means:
        "Afterglow's light round what adds a photograph (the shutter), which is also its icon.",
    },
    {
      term: "Seam",
      means:
        "Afterglow's light born where a photograph or a section ends and the ground begins.",
    },
    {
      term: "Bloom",
      means:
        "Afterglow's light behind the one live subject of a screen, such as the code or the reel.",
    },
    {
      term: "film edge",
      means:
        "The small type along a film's edge, frame numbers and names: Contact Sheet prints every event's own.",
    },
    {
      term: "latent image",
      means:
        "A seeded colour inside a print's border: the photograph about to be, before any photo lands.",
    },
    {
      term: "seeded orb",
      means:
        "One guest's own colour as a sphere, from the hashvatar: Everyone's Color's material.",
    },
  ],
  carried: [
    {
      id: "photos",
      question: "Which photographs do the decks draw on?",
      taken:
        "The twelve bootstrap stills every board uses: the brief's fixtures folder is landscapes outside git, which the alias cannot serve.",
      overrule:
        "Put real party fixtures in the repo now, or redraw once the Higgsfield set lands.",
    },
    {
      id: "wordmark",
      question: "Does Afterglow keep your v1 wordmark?",
      taken:
        "Yes, untouched: that team honoured your drawing and gave the light to the icon. The other two draw their own.",
      overrule:
        "Afterglow draws its own wordmark too, on the brand-marks board.",
    },
    {
      id: "faces",
      question: "May a vision change the loud face?",
      taken:
        "Yes, as an agency would: Afterglow keeps Urbanist, Contact Sheet proposes Bricolage Grotesque, Everyone's Color Fraunces.",
      overrule:
        "Every vision keeps Urbanist, and only the system around it differs.",
    },
  ],
  asks: [
    {
      id: "vision",
      label: "The vision",
      question: "Which vision should Partyreel's brand grow from?",
      where: ["Shared", "The brand", "Every surface"],
      when: "Before the marks, the aurora, the page themes, the hero and presence are each drawn on a board of their own.",
      matters:
        "Each answers what gives Partyreel its colour: the photographs' light, paper and prints, or the guests.",
      lands:
        "The positioning, the marks, the palette and status set, the signature, and which pages are dark or light.",
      context:
        "Each option is an agency's deck of fourteen slides, at a desk or on a phone (the Read on knob): the system first, then six touchpoints as sketches on real photographs. Press f to read a slide at its true size.",
      options: [
        {
          id: "afterglow",
          label: "Afterglow: the photos' own light is the brand",
          means:
            "All colour is the light the photographs give off, as a Ring, a Seam or a Bloom, one per screen; the seed glows first; the icon is the lit Add.",
          gains:
            "Keeps the aurora as the foundation, with rules: every album wears its own light.",
          costs:
            "Needs a real per-photo sampler; the brand rests on light and form, with no hue to own.",
        },
        {
          id: "contact-sheet",
          label: "Contact Sheet: prints on paper, each credited",
          means:
            "No brand hue: warm paper, deep ink and every event's own film edge; a photo is a print, status a photo lab's marks; the room is for the reel.",
          gains:
            "The photographs are always the brightest thing, and the edge credits every frame.",
          costs:
            "The aurora becomes the latent image; paper and type carry the brand alone.",
        },
        {
          id: "everyone",
          label: "Everyone's Color: guests' colors are the brand",
          means:
            "Every guest is a seeded orb and an event wears its people: grey chrome, outlined status tags, a soft black serif, paper pages, the room for pictures.",
          gains:
            "Every empty screen feels social and alive, and no photograph is ever touched.",
          costs:
            "Retires the aurora as the signature; its colour is wherever the seeds land.",
        },
      ],
      recommended: "afterglow",
      because:
        "The one vision that keeps the aurora as the foundation you named, gives it a source and rules, and makes the icon the product's own Add.",
      overrule:
        "If the brand should be the people, Everyone's Color; if paper and type, Contact Sheet.",
      configs: [SCREEN],
    },
  ],
});
