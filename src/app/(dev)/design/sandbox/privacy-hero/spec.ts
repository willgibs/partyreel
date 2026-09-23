import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PRIVACY PAGE'S HERO, ROUND THREE: A NEW CONCEPT (2026-09-19); A FOURTH
 * ADDED BY THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21).
 *
 * Round one (a turning nozzle of photographs) answered none. Round two (two
 * spiralling arms with a decaying trail) got a `?` on its own arrival: "I
 * don't really like this arrival animation as part of the spiral/orbit."
 * Asked what next, Will: "Let's go with a totally different concept... I
 * think we can say the image trail was a takeaway win from this. The actual
 * privacy hero can take a different path, maybe more fitting for its theme"
 * (2026-09-19).
 *
 * ★ "MORE FITTING FOR ITS THEME" IS THE BRIEF, SO THE MECHANISM CHANGES, NOT
 * JUST THE FIGURE. Both earlier rounds flew photographs through a shape;
 * both are the "images fly around" language the home hero, the album hero
 * and the river already speak. This round's concepts share nothing with
 * either: no card is ever born, travels or dies. Each sits still, or nearly
 * still, and the thing that moves is its own VISIBILITY, because privacy is
 * who can see a thing right now, not how fast a picture moves. `paths.ts`
 * (the spiral figure) and `paths.test.ts` left with round two; `field.ts`,
 * `field-layer.tsx` and `field.css` stay only because `album-page` still
 * imports them for its own margins and motion.
 *
 * ★ ONE ASK, BECAUSE THIS IS A CONCEPT PICK, NOT A REFINEMENT. Round two's
 * five decisions tuned one mechanism's dimensions; this round has no
 * mechanism yet, so the question is which concept, not how fast or how
 * close. `concepts.ts` holds every number this ask states, and
 * `concepts.test.ts` holds this file's prose to it.
 *
 * ★ THE FOURTH CONCEPT IS THE RESHAPE ITSELF, NOT DECORATION ON TOP OF IT.
 * By the time the overtaken audit reopened this board, three things this
 * round could only imagine had shipped: a named glass material (Crystal,
 * glass r2), copy running over bespoke pictures in motion (the welcome tour,
 * app-door r2), and the product's own arrival grammar, one pass of light
 * across a tile (`landing=sweep`, guest-upload r1). `sweep` builds the
 * access grid's clearing from that last one instead of a bespoke crossfade,
 * which is what "more fitting for its theme" now has to mean: not just still
 * over flying, but the product's own mechanism over an invented one.
 */
export const PRIVACY_HERO = defineExploration({
  id: "privacy-hero",
  title: "The privacy page's hero",
  round: {
    n: 3,
    date: "2026-09-21",
    changed:
      "The overtaken audit's reshape adds a fourth concept, sweep: the access grid cleared by the product's own arrival sweep (guest-upload r1) rather than a bespoke crossfade, now recommended over access. The three from 19 Sep stand; none of them flew photographs.",
  },
  bible: [1, 13, 14, 22],
  context:
    "Round one (a turning nozzle) answered none; round two (two spiralling arms with a trail) answered a question mark on its arrival. The page ships PageHero with no backdrop on purpose, the site's quietest: a concept has to earn its place against that, so every one here sits still, or nearly still, and the thing that moves is each one's own visibility rather than its position.",
  asks: [
    {
      id: "concept",
      label: "The concept",
      question: "Which concept should carry the privacy page's hero?",
      context:
        "Four mechanisms, none a photograph in flight. Frosted is a named material now (Crystal, glass r2); the tour runs words over bespoke pictures (app-door r2); the product has its own arrival, one pass of light on a tile (guest-upload r1).",
      options: [
        {
          id: "aperture",
          label: "The aperture",
          means:
            "A blurred photograph breathes behind the words with a hairline ring: 360 to 430px, 12 to 20% opacity, one breath every 10 seconds. The calmest of the four.",
        },
        {
          id: "access",
          label: "The access grid",
          means:
            "8 small tiles flank the words, frosted at rest. One clears to full colour for 0.64s and fades back over 0.77s, in turn, a circuit every 6.4s. The most literal.",
        },
        {
          id: "sweep",
          label: "The sweep",
          means:
            "8 small tiles flank the words, frosted at rest. One clears in a single 0.9s pass of light, in turn, a circuit every 6.4s. The product's own arrival, not a fade.",
        },
        {
          id: "seal",
          label: "The sealed cards",
          means:
            "3 photographs rest under a drawn cover at the page's foot. One lifts from 55% to 8% covered for 0.36s, in turn, every 2.4 seconds. The most tactile.",
        },
      ],
      recommended: "sweep",
      because:
        "It is the one concept built entirely from what the product now ships: Crystal's own frost, and the exact pass of light a real arrival wears (guest-upload r1), rather than a tween invented before that grammar existed. Access said the theme right; sweep says it in the product's own words.",
      overrule:
        "If eight tiles clearing on their own timing reads calmer than a pass borrowed from a live moment, access is the quieter hold; seal is still the most tactile.",
      lands:
        "The privacy page's first screen: what sits behind the words, on a laptop and a phone.",
    },
  ],
});
