import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PRIVACY PAGE'S HERO, ROUND THREE: A NEW CONCEPT (2026-09-19).
 *
 * Round one (a turning nozzle of photographs) answered none. Round two (two
 * spiralling arms with a decaying trail) got a `?` on its own arrival: "I
 * don't really like this arrival animation as part of the spiral/orbit."
 * Asked what next, Will: "Let's go with a totally different concept... I
 * think we can say the image trail was a takeaway win from this. The actual
 * privacy hero can take a different path, maybe more fitting for its theme"
 * (docs/design/rulings.md, 2026-09-19).
 *
 * ★ "MORE FITTING FOR ITS THEME" IS THE BRIEF, SO THE MECHANISM CHANGES, NOT
 * JUST THE FIGURE. Both earlier rounds flew photographs through a shape;
 * both are the "images fly around" language the home hero, the album hero
 * and the river already speak. This round's three concepts share nothing
 * with either: no card is ever born, travels or dies. Each sits still, or
 * nearly still, and the thing that moves is its own VISIBILITY, because
 * privacy is who can see a thing right now, not how fast a picture moves.
 * `paths.ts` (the spiral figure) and `paths.test.ts` left with round two;
 * `field.ts`, `field-layer.tsx` and `field.css` stay only because
 * `album-page` still imports them for its own margins and motion.
 *
 * ★ ONE ASK, BECAUSE THIS IS A CONCEPT PICK, NOT A REFINEMENT. Round two's
 * five decisions tuned one mechanism's dimensions; this round has no
 * mechanism yet, so the question is which of three, not how fast or how
 * close. `concepts.ts` holds every number this ask states, and
 * `concepts.test.ts` holds this file's prose to it.
 */
export const PRIVACY_HERO = defineExploration({
  id: "privacy-hero",
  title: "The privacy page's hero",
  round: {
    n: 3,
    date: "2026-09-19",
    changed:
      'Round two\'s spiral field is gone: "I don\'t really like this arrival animation as part of the spiral/orbit." Asked what next: "Let\'s go with a totally different concept... more fitting for its theme." Three concepts, none of them flying photographs, built on what privacy means instead.',
  },
  bible: [1, 13, 14, 22],
  context:
    "Round one (a turning nozzle) answered none; round two (two spiralling arms with a trail) answered a question mark on its arrival. The page ships PageHero with no backdrop on purpose, the site's quietest: a concept has to earn its place against that, so all three here sit still, or nearly still, and the thing that moves is each one's own visibility rather than its position.",
  asks: [
    {
      id: "concept",
      label: "The concept",
      question: "Which concept should carry the privacy page's hero?",
      context:
        "Behind the same words, the same PageHero, the same actions: three mechanisms, none of them a photograph in flight. Each is a small, still composition where visibility itself is what moves. Drawn at 1440 and 375.",
      options: [
        {
          id: "aperture",
          label: "The aperture",
          means:
            "A blurred photograph breathes behind the words with a hairline ring: 360 to 430px, 12 to 20% opacity, one breath every 10 seconds. The calmest of the three.",
        },
        {
          id: "access",
          label: "The access grid",
          means:
            "8 small tiles flank the words, frosted at rest. One clears to full colour for 0.64s and fades back over 0.77s, in turn, a circuit every 6.4s. The most literal.",
        },
        {
          id: "seal",
          label: "The sealed cards",
          means:
            "3 photographs rest under a drawn cover at the page's foot. One lifts from 55% to 8% covered for 0.36s, in turn, every 2.4 seconds. The most tactile.",
        },
      ],
      recommended: "access",
      because:
        "It says the theme in one glance rather than in a caption: most of the grid stays frosted and one tile takes its turn to clear, which is curation itself, who can open the album right now. It stays alive without a single photograph ever leaving its place.",
      overrule:
        "If eight tiles reads as more machinery than the quiet page wants, the three sealed cards say the same thing in fewer moving parts.",
      lands:
        "The privacy page's first screen: what sits behind the words, on a laptop and a phone.",
    },
  ],
});
