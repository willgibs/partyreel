import { defineExploration } from "@/components/lab/exploration";

/**
 * THE FALLING-IN, NOW FOUR WAYS (2026-09-19; a fourth added 2026-09-24).
 *
 * Will, on the album page's hero: "I love the images falling into the album. I
 * was just curious to see maybe two to three variations of this concept to get
 * an idea of what the best version is. No specific direction on what
 * improvement means here yet." So this is one decision and nothing else, drawn
 * on the WIRED hero rather than on a mock of it: the shipped version is one of
 * the four, and his pick is a one-word change to `SHIPPED` in
 * `stream-engine.ts`.
 *
 * ★ EACH ONE IS A DIFFERENT ANSWER, NOT A DIFFERENT NUMBER. With no direction
 * on what improvement means, options a notch apart would waste the sitting, so
 * each varies on several axes at once: the arc of the fall, the size at birth
 * against the size at the landing, how often a photograph arrives and whether
 * it comes alone, and what happens at the moment it meets the album.
 * `stream-engine.test.ts` refuses two that draw the same thing.
 *
 * ★ EVERY NUMBER UNDER A TILE IS MEASURED, never claimed: the caption on each
 * frame is the engine's own reading of the composition it is drawing, against
 * the home hero's, which is the reference Will named ("home hero currently
 * feels perfect").
 *
 * ★ THE OVERTAKEN AUDIT'S REDRAW (2026-09-21). The premise that motivated
 * `glide`'s recommendation ("the ALBUM is what acts") predates a fact the
 * product has since answered TWICE (guest-shape r1, guest-upload r1): a real
 * arrival grows into its column under a glow that fades, everywhere a
 * photograph lands. The three original trips were re-argued against that
 * shipped truth, and the honest read moved the recommendation from `glide` to
 * `cascade`, the one whose own numbers already grow-then-fade in place.
 *
 * ★ THE REFRESH'S OWN PASS (2026-09-24): A FOURTH, DRAWN FOR THE FADE RULE
 * RATHER THAN A RESCORE. Flipping the recommendation between three trips that
 * all predate the fade rule answers "which reads truest of these three", not
 * "what does a fall built for the rule actually look like". `bloom` is that
 * build: born smaller and grown larger by its landing than any of the other
 * three, on a slower beat that gives each arrival room to be noticed, holding
 * longest before it fades, and lit by the same glow a real tile wears
 * (`arrival.css`'s rim and wash, ridden on the frame's own opacity rather than
 * animated a second time). His to overrule either way; `glide` still ships
 * until he answers.
 */
export const ALBUM_MOTION = defineExploration({
  id: "album-motion",
  title: "Album motion",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "A fourth option, bloom, built for the fade rule rather than a rescore: born smaller and grown larger than any of the first three, holding longest, lit by the product's own arrival glow. Cascade stood truest among the first three; bloom now tells it fullest. glide is still what ships.",
  },
  context:
    "The album page's hero now stands on the live guest album with photographs falling out of the room around the words and into its top edge, which you asked for (`motion=stream`). This asks the one thing that was left open: which fall.",
  asks: [
    {
      id: "fall",
      label: "The fall",
      question:
        "Which of the four tells the album's real arrival truly on the hero?",
      context:
        "All four share the home hero's own speed. Since, a photograph's real arrival everywhere it lands grows into its column under a fading glow (guest-shape r1, guest-upload r1); bloom is drawn for that rule, not re-scored against it.",
      lands:
        "The album page's hero, and the engine's shipped default, which is the one line that changes.",
      options: [
        {
          id: "glide",
          label: "Glide: a pair, sliding under the edge",
          means:
            "Two every 1250ms, falling almost straight, born at 0.86 scale and barely growing to 1. Slides under the edge with no fade: gone, not handed over.",
        },
        {
          id: "gather",
          label: "Gather: drawn in and dissolving",
          means:
            "The same pair and clock, born LARGER (1.08) than it lands (0.74): it shrinks, not grows, dissolving at the edge over its last stretch.",
        },
        {
          id: "cascade",
          label: "Cascade: one at a time, landing",
          means:
            "One every 625ms, alone: born smallest (0.62), grows to its biggest (1.1) landing, holds on the edge, and fades there. The truest of the first three.",
        },
        {
          id: "bloom",
          label: "Bloom: arriving, lit from within",
          means:
            "One every 1875ms, the slowest of the four: born and grown furthest of all (0.5 to 1.15), holding longest, glowing where it lands like a real tile.",
        },
      ],
      recommended: "bloom",
      because:
        "The rule is grow into place under a glow that fades. Cascade already told the shape truest of the first three; bloom adds the glow itself plus the widest birth-to-landing growth and the longest hold, so the arrival reads as a moment, not a blip.",
      overrule:
        "If the album's own agency matters more than the real arrival, glide already ships today; if a lit tile is too much, cascade keeps the growth with no glow.",
    },
  ],
});
