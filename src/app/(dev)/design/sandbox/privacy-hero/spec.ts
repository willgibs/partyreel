import { defineExploration } from "@/components/lab/exploration";

import { PHOTO } from "./knobs";

/**
 * THE PRIVACY PAGE'S HERO, ROUND FOUR: THE VEIL, AS DRAWN AND THREE WAYS
 * FURTHER (2026-09-29).
 *
 * Round three answered `concept=veil` (docs/reviews/privacy-hero.json): "This
 * feels super bespoke to 'privacy', where it's only revealing what it wants
 * to. Really cool concept. Would love to keep this original plus 3
 * variations to nail it." The sealed cards are out ("Don't like the sealed
 * cards at all"); the sweep and the aperture are banked for other surfaces
 * (ROADMAP's line on the runners-up names the commit their code stands in).
 *
 * ★ ONE ASK, BECAUSE HE ASKED FOR ONE PICK: the original and three variations
 * of it, each a whole veil (what the clearing is, how it moves, what sits
 * under it, what it is made of: `veils.ts` has the table). An option that
 * moved one of those four would be a tuning of the original, not a
 * contender; the three here each move three or four at once.
 *
 * ★ THE ORIGINAL IS DRAWN AS IT STANDS, and its costs are measured as they
 * are: its window draws square (`veils.ts`, DRIFT) and drifts behind the
 * words, where the frames measure the subhead under 2:1 at its worst. The
 * variations keep every place they settle clear of the words by construction
 * (`veils.test.ts`) and pass behind them only under the scrim; every line of
 * the lockup holds 7:1 or better over each variation's whole loop, and the
 * header's nav 5.5:1, at both widths and on both photographs (the manifest's
 * Handoff has the numbers).
 *
 * `veils.test.ts` holds every number these options state to `veils.ts`.
 */
export const PRIVACY_HERO = defineExploration({
  id: "privacy-hero",
  title: "The privacy page's hero",
  surface: "marketing",
  desk: 40,
  lives: [
    "src/app/(marketing)/(cinema)/features/privacy/page.tsx",
    "src/components/marketing/system/page-hero.tsx",
  ],
  round: {
    n: 4,
    date: "2026-09-29",
    changed:
      "From your pick of the veil: the original as drawn and three veils further (a lens that rests on things, a beam across a succession of photographs, glimpses that open in place), all on one photograph. The sealed cards are gone; the sweep and the aperture are banked.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-18",
      changed:
        "A turning nozzle of photographs: none felt right, it wanted more density and speed, and the decaying trail meant the trailing images.",
    },
    {
      n: 2,
      date: "2026-09-19",
      changed:
        "Two spiralling arms with a trail: the arrival as part of the spiral wasn't liked, and the next round went to a different concept.",
    },
    {
      n: 3,
      date: "2026-09-24",
      changed:
        "Four still concepts whose visibility moved: the veil won; the sweep and the aperture were banked for other surfaces, the sealed cards dropped.",
    },
  ],
  context:
    "Round one's nozzle answered none and round two's spiral a question mark on its arrival; round three drew four still concepts whose visibility moved, and the veil won. Each option here answers the veil's four questions together: what the clearing is, how it moves, what sits under it, what the veil is made of. The original is drawn as it stands; the variations settle only clear of the words and pass behind them only under a shade of the page's dark.",
  opening: {
    about:
      "The privacy page's first screen: what sits behind its words. Round three picked the veil, a photograph that only shows what it wants to.",
    settled: [
      "The veil is the concept, your round three pick; this round asks which veil: the original as drawn, or one of three further.",
      "The header, the words and the buttons are the page's own, unchanged; only what sits behind them differs.",
      "The sealed cards are out; the sweep and the aperture are banked for other surfaces.",
      "Each variation keeps the words at 7:1 or better and the nav at 5.5:1 over its whole loop, measured on the frames.",
    ],
    earlier: [
      "'This feels super bespoke to privacy, where it's only revealing what it wants to.'",
      "'Would love to keep this original plus 3 variations to nail it.'",
      "Round two: the arrival as part of the spiral wasn't liked. Round one: none felt right.",
    ],
  },
  terms: [
    {
      term: "veil",
      means:
        "What covers the photograph so only part of it shows at once: a blur, a darker glass, or the dark.",
    },
    {
      term: "lightbox",
      means:
        "The app's full-screen view of one photograph, which dims and blurs the album behind it.",
    },
    {
      term: "grain",
      means: "A fine film-like speckle laid over the dark, as a print has.",
    },
  ],
  carried: [
    {
      id: "as-drawn",
      question: "Does the original stay exactly as round three drew it?",
      taken:
        "Yes: its window, which draws square on screen, and its path behind the words, with what that costs measured as it is.",
      overrule:
        "Round its window and keep it off the words, and the original becomes a fifth veil rather than the one you picked.",
    },
    {
      id: "photograph",
      question: "Which photograph sits under the four veils?",
      taken:
        "One for all four, a toast under string lights: round three's crowd is soft smoke wherever a clearing lands.",
      overrule:
        "Set the knob to round three's crowd, and the original shows exactly as you picked it.",
    },
  ],
  asks: [
    {
      id: "veil",
      label: "The veil",
      question: "Which veil should sit behind the privacy page's words?",
      where: ["Marketing", "The privacy page", "Its first screen"],
      when: "A host deciding who will see a wedding's photographs opens the privacy page, before reading a word of it.",
      matters:
        "It is the trust page's first answer: a photograph that shows only what it chooses, with the words still easy to read.",
      context:
        "Each option is the page's first screen at 1440 and 375, the real header and words over the veil, looping as it would ship; reduced motion gets one still. Every caption is read off its frame. The knob swaps the photograph under all four.",
      options: [
        {
          id: "drift",
          label: "The drift, as drawn",
          means:
            "Round three's veil, unchanged: one photograph in an 860px disc, blurred 44px at 55%, and a 230px window of clarity drifting over it every 9 seconds.",
          gains:
            "The one you picked, exactly: one photograph, never wholly shown, always moving.",
          costs:
            "Its window drifts behind the words: at its worst the subhead reads under 2:1.",
        },
        {
          id: "lens",
          label: "The lens",
          means:
            "One clear 240px pane glides round the words and rests 2.4 seconds on one thing at a time, in the veil the lightbox lays behind an open photograph.",
          gains:
            "It chooses what it shows: the lights, the flowers, the table; never a face, never the words.",
          costs:
            "It needs a photograph with something worth a rest at each of its four places.",
        },
        {
          id: "beam",
          label: "The beam",
          means:
            "A tall soft beam of clarity crosses a darkened photograph under grain in 9 seconds, then the next of 3 photographs takes its turn.",
          gains:
            "The most cinematic: a slow light across the room, a different moment of the night each pass.",
          costs:
            "It shows whatever it crosses, faces included, and dims as it passes behind the words.",
        },
        {
          id: "glimpse",
          label: "The glimpses",
          means:
            "Nothing travels: soft spots 220 to 260px across open in place one after another, every 2.4 seconds, clear of the words, and close again.",
          gains:
            "The calmest, on the original's own blurred veil spread across the whole screen.",
          costs:
            "The softest reveal: each glimpse is feathered and brief, so nothing is ever quite sharp.",
        },
      ],
      recommended: "lens",
      because:
        "The lens keeps what you liked, a photograph showing only what it chooses, and it chooses: things, never faces or the words, in the app's own veil.",
      overrule:
        "If the veil should never stop moving, the beam; if nothing should travel at all, the glimpses.",
      lands:
        "What sits behind the privacy page's words on a laptop and a phone, and how it moves.",
      configs: [PHOTO],
    },
  ],
});
