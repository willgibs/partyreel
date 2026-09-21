import { defineExploration } from "@/components/lab/exploration";

/**
 * THE FALLING-IN, TWO OR THREE WAYS (2026-09-19).
 *
 * Will, on the album page's hero: "I love the images falling into the album. I
 * was just curious to see maybe two to three variations of this concept to get
 * an idea of what the best version is. No specific direction on what
 * improvement means here yet." So this is one decision and nothing else, drawn
 * on the WIRED hero rather than on a mock of it: the shipped version is one of
 * the three, and his pick is a one-word change to `SHIPPED` in
 * `stream-engine.ts`.
 *
 * ★ EACH ONE IS A DIFFERENT ANSWER, NOT A DIFFERENT NUMBER. With no direction
 * on what improvement means, three options a notch apart would waste the
 * sitting, so each varies on several axes at once: the arc of the fall, the
 * size at birth against the size at the landing, how often a photograph arrives
 * and whether it comes alone, and what happens at the moment it meets the
 * album. `stream-engine.test.ts` refuses two that draw the same thing.
 *
 * ★ EVERY NUMBER UNDER A TILE IS MEASURED, never claimed: the caption on each
 * frame is the engine's own reading of the composition it is drawing, against
 * the home hero's, which is the reference Will named ("home hero currently
 * feels perfect").
 *
 * ★ THE OVERTAKEN AUDIT'S REDRAW (2026-09-21). The premise that motivated
 * `glide`'s recommendation ("the ALBUM is what acts") predates a fact the
 * product has since ruled TWICE (guest-shape r1, guest-upload r1): a real
 * arrival grows into its column under a glow that fades, everywhere a
 * photograph lands. None of the engine's numbers changed (still out of this
 * lane's owns) and no option was added; all three are re-argued against that
 * shipped truth instead, and the honest read moves the recommendation from
 * `glide` to `cascade`, the one whose own numbers already grow-then-fade in
 * place. His to overrule either way; `glide` still ships until he answers.
 */
export const ALBUM_MOTION = defineExploration({
  id: "album-motion",
  title: "Album motion",
  round: {
    n: 1,
    date: "2026-09-21",
    changed:
      "The overtaken audit's redraw: the same three trips, re-argued against the arrival the product has ruled since (a photograph grows into its column under a fading glow), not the album's own agency. Cascade, not glide, now tells it truest; glide is still what ships.",
  },
  context:
    "The album page's hero now stands on the live guest album with photographs falling out of the room around the words and into its top edge, which you ruled in (`motion=stream`). This asks the one thing that was left open: which fall.",
  bible: [1, 13, 14, 22],
  asks: [
    {
      id: "fall",
      label: "The fall",
      question:
        "Which of the three tells the album's real arrival truly on the hero?",
      context:
        "All three are the same idea at the home hero's own speed. Since, the product ruled its own arrival everywhere a photograph lands: it grows into its column under a glow that fades (guest-shape r1, guest-upload r1).",
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
            "One every 625ms, alone: born smallest (0.62), grows to its biggest (1.1) landing, holds on the edge, and fades there. The real arrival's own shape.",
        },
      ],
      recommended: "cascade",
      because:
        "The ruled arrival grows into its column and fades under a glow, never slides away untouched. Cascade grows to its landing, alone, holds, and fades there: the truest telling; the other two either shrink or never fade in place.",
      overrule:
        "If the album's own AGENCY matters more than truthfulness to the real arrival, glide's own reading is what already ships today.",
    },
  ],
});
