import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE BRAND, ROUND TWO: WHICH AFTERGLOW? (the brand-r2 track, cut 2026-10-05
 * from desk 4's answer).
 *
 * Will picked Afterglow at desk 4 (`docs/reviews/brand.json`, round 1) with a
 * note that is this round's brief: polish it to world-class, never "a junior
 * designer told to build a rainbow app", mine Contact Sheet and Everyone's
 * Color for what would make it better, and above all solve paper ("it is very
 * tough to nail on anything light. It's washed out easily").
 *
 * ★ THREE TAKES, ONE COMPOSITION. Each take is a whole deck in round one's
 * order, and every slide is one shared drawing (`afterglow/slides/`) the take
 * fills with its own constructions (`afterglow/take.tsx`): its light in the
 * room and on paper, its icon's paper form, its paper stock, what carries the
 * light on a light page, its words. So the takes share the idea and differ in
 * a few load-bearing constructions, and the stage compares like with like.
 *
 * ★ EACH TAKE IS ONE ANSWER TO PAPER. Light only reads as light against
 * something darker, and white has nothing darker, so a glow on paper can only
 * add colour by taking brightness away: round one's pale stain. The way out is
 * never the pale middle. Aperture keeps the light in the dark (pieces of the
 * room on the page); Ink turns it into print (full-strength ink, small);
 * Cast lets it fall (a coloured shadow, darker than the page).
 *
 * ★ ROUND TWO'S POLISH, EVERY TAKE: no spectrum (the five house lamps light as
 * one dusk sky, never chips side by side), at most three hues a light, fewer
 * and larger lights, Will's v1 wordmark untouched.
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
  tracks: ["brand-r1", "brand-r2"],
  round: {
    n: 2,
    date: "2026-10-05",
    changed:
      "From your desk 4 pick: Afterglow as three complete takes, polished to a light page first, each keeping its light from washing out its own way.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-04",
      changed:
        "A new board from your brand note: three agency visions, each a whole system and six sketches, refined once from a creative director's fresh-eyes pass.",
    },
  ],
  opening: {
    about:
      "Afterglow, polished: three complete takes on the whole system, each answering how its light lives on a light page without washing out.",
    settled: [
      "Afterglow is the brand (your desk 4 pick): light, never paint; colour from the photographs, then the event's seed, then the house.",
      "Drawn only as a Ring, a Seam or a Bloom, one to a screen, still until something happens.",
      "Status is a point and its word (Standby half-lit with no hue, Ready, Fault); the room where photographs play, paper where people decide.",
      "Every take: no spectrum (the house lamps light as one warm glow, the house ember), at most three hues a light, your v1 wordmark.",
    ],
    earlier: [
      "Desk 4, you picked Afterglow: 'This feels so much more like a brand identity than just throwing Aurora everywhere.'",
      "'Remember this should feel polished, not like a junior designer was told to build a rainbow app. We are world-class tastemakers.'",
      "'While afterglow looks effortlessly beautiful on dark UI, it is very tough to nail on anything light. It's washed out easily.'",
      "'The other options (Contact Sheet and Everyone's Color) could be checked to see if those explorations offered any additional ideas.'",
    ],
  },
  terms: [
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
      term: "house ember",
      means:
        "Where there is no photograph and no seed: the house lamps lit as one glow, amber to coral, never side by side.",
    },
    {
      term: "pieces of the room",
      means:
        "Aperture's dark objects on a light page: the shutter's puck, the one lit plate, the foot's slab.",
    },
    {
      term: "ink mat",
      means:
        "Ink's form on paper: the one subject mounted on a solid mat of the album's one colour, never a tint.",
    },
    {
      term: "coloured shadow",
      means:
        "Cast's light on paper: the photograph's own colours falling down and right, darker than the page.",
    },
  ],
  carried: [
    {
      id: "house",
      question: "Where there is no photograph and no seed, what is the light?",
      taken:
        "The house ember in every take: the lamps lit as one glow from the top-left, amber to coral (a dusk sky to violet read as Instagram).",
      overrule:
        "Keep the five as separate lamps, as round one drew them, where there is no photograph.",
    },
    {
      id: "stock",
      question: "May a take change the paper it is printed on?",
      taken:
        "Yes: Aperture keeps production's gallery white, Ink argues a warm uncoated stock, Cast a neutral daylight white.",
      overrule:
        "Every take on production's paper, so only the light differs between them.",
    },
    {
      id: "retired",
      question: "Do Contact Sheet and Everyone's Color stay on the board?",
      taken:
        "No: retired with round one. What they offered lives inside the takes (the rebate's film edge, the warm stock, the seed's orb).",
      overrule: "Bring a deck back beside the takes for reference.",
    },
    {
      id: "wordmark",
      question: "Does any take redraw the wordmark?",
      taken:
        "No: your v1 stands in all three; the brand-marks board redraws it, if at all, after this pick.",
      overrule: "A take proposes its own wordmark now.",
    },
  ],
  asks: [
    {
      id: "take",
      label: "Which Afterglow",
      question:
        "Which Afterglow should every brand board after this one grow from?",
      where: ["Shared", "The brand", "Every surface"],
      when: "Before the brand marks, the signature across app and marketing, the page themes, demo framing and presence are drawn.",
      matters:
        "Each take answers paper its own way, the hard problem: how its light lives on a light page without washing out.",
      lands:
        "How the light is drawn in the room and on paper, what carries it on a light page, the icon's paper form and the paper stock.",
      context:
        "Each option is a take's deck of fourteen slides in round one's order, at a desk or on a phone (the Read on knob): the system first, then six touchpoints, every paper form drawn beside its room form. Press f to read a slide at its true size.",
      options: [
        {
          id: "aperture",
          label: "Aperture: light kept in pieces of the room",
          means:
            "On paper the light never touches the page: it lives in pieces of the room the page holds (the shutter's puck, a plate, the foot), as bright as in the room.",
          gains:
            "Light always reads as light; closest to production's own dark well, display and footer.",
          costs:
            "Paper pages carry dark objects: one lit plate a screen, so restraint is the craft.",
        },
        {
          id: "ink",
          label: "Ink: glows in the room, prints on paper",
          means:
            "One colour per album, its strongest light: a glow in the room; on paper printed solid, a rule, a band and an ink mat, never paler than ink.",
          gains:
            "The calmest room and an editorial paper: every album prints in its own colour, like stationery.",
          costs:
            "On paper the light turns to print, not light; one colour an album sets its other hues aside.",
        },
        {
          id: "cast",
          label: "Cast: falls on paper as coloured shadow",
          means:
            "The light is the photograph itself, blurred: a glow round it in the room; on paper a coloured shadow falling down and right, darker than the page.",
          gains:
            "The truest light: every part of a picture glows its own colour, on both grounds by one physics.",
          costs:
            "A coloured shadow can read as a drop shadow; it asks a careful hand on every new surface.",
        },
      ],
      recommended: "aperture",
      because:
        "Aperture: its light never changes, so it never washes out, and production half-does it; borrow Ink's printed rule where paper meets a photograph.",
      overrule:
        "If paper should feel printed rather than lit, Ink; if light should land on the page itself, Cast.",
      configs: [SCREEN],
    },
  ],
});
