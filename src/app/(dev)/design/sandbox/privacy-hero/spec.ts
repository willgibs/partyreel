import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PRIVACY PAGE'S HERO, ROUND THREE: A NEW CONCEPT (2026-09-19); A FOURTH
 * ADDED BY THE OVERTAKEN AUDIT'S RESHAPE (2026-09-21); TWO OF THOSE FOUR
 * MERGED AND A REAL FOURTH DRAWN IN THEIR PLACE BY THE REFRESH (2026-09-24).
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
 * ★ SWEEP ANSWERED "MORE FITTING FOR ITS THEME" WITH THE PRODUCT'S OWN
 * MECHANISM OVER AN INVENTED ONE. By the time the overtaken audit reopened
 * this board, the product had its own arrival grammar, one pass of light
 * across a tile (`landing=sweep`, guest-upload r1); `sweep` built the access
 * grid's clearing from that instead of a bespoke crossfade.
 *
 * ★ THE REFRESH'S OWN PASS (2026-09-24): ACCESS AND SWEEP WERE ONE CONCEPT,
 * NOT TWO. Both drew the exact same eight-and-six-tile grid at the same
 * cycle, differing only in how a tile cleared; that is a finding, not a pair
 * of real contenders. `access` retires (its geometry lives on as `sweep`'s
 * own), and `veil` draws a genuinely different fourth mechanism in the slot
 * that opens up: a single photograph, never wholly visible at once, with a
 * small clearing drifting across it rather than many tiles taking turns.
 */
export const PRIVACY_HERO = defineExploration({
  id: "privacy-hero",
  title: "The privacy page's hero",
  round: {
    n: 3,
    date: "2026-09-24",
    changed:
      "access and sweep drew the same grid twice, differing only in how a tile cleared; access retires and veil takes its place: one photograph, never wholly visible, with a clearing drifting across it. sweep still leads on product consistency; veil is the fresh, purely thematic case.",
  },
  context:
    "Round one (a turning nozzle) answered none; round two (two spiralling arms with a trail) answered a question mark on its arrival. The page ships PageHero with no backdrop on purpose, the site's quietest: a concept has to earn its place against that, so every one here sits still, or nearly still, and the thing that moves is each one's own visibility rather than its position.",
  asks: [
    {
      id: "concept",
      label: "The concept",
      question: "Which concept should carry the privacy page's hero?",
      context:
        "Three mechanisms show a photograph or tiles becoming visible; veil, added in the refresh, is the one where a single photograph is never wholly visible at once. The product's own arrival is one pass of light on a tile (guest-upload r1).",
      options: [
        {
          id: "aperture",
          label: "The aperture",
          means:
            "A blurred photograph breathes behind the words with a hairline ring: 360 to 430px, 12 to 20% opacity, one breath every 10 seconds. The calmest of the four.",
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
        {
          id: "veil",
          label: "The veil",
          means:
            "One photograph, blurred 44px at 55% opacity always. A 230px clearing drifts, never settling: one full drift every 9 seconds. Never the whole photo at once.",
        },
      ],
      recommended: "sweep",
      because:
        "Sweep is built entirely from what the product now ships, Crystal's own frost and its real arrival pass, rather than an invented tween; that consistency is why it still leads. Veil is the fresh case: the only mechanism where privacy is one photograph's own surface, not a grid of many.",
      overrule:
        "If one photograph's own privacy reads truer than a grid's, veil is the more thematic pick; aperture or seal are the calmer, more tactile holds.",
      lands:
        "The privacy page's first screen: what sits behind the words, on a laptop and a phone.",
    },
  ],
});
