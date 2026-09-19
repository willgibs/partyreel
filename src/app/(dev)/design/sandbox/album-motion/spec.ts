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
 */
export const ALBUM_MOTION = defineExploration({
  id: "album-motion",
  title: "Album motion",
  round: {
    n: 1,
    date: "2026-09-19",
    changed:
      "The first round: three ways for a photograph to reach the album, each drawn on the live /features/album hero at 1440 and again at 375.",
  },
  context:
    "The album page's hero now stands on the live guest album with photographs falling out of the room around the words and into its top edge, which you ruled in (`motion=stream`). This asks the one thing that was left open: which fall.",
  bible: [1, 13, 14, 22],
  asks: [
    {
      id: "fall",
      label: "The fall",
      question:
        "Which way should a photograph reach the album on the album page's hero?",
      context:
        "All three are the same idea at the home hero's own speed, on the real page: photographs appear beside the words at 1440, or in the strip under them at 375, and travel to the album's edge. What differs is the trip and the arrival.",
      lands:
        "The album page's hero, and the engine's shipped default, which is the one line that changes.",
      options: [
        {
          id: "glide",
          label: "Glide: a pair, sliding under the edge",
          means:
            "Two every 1250 ms, one a side, falling almost straight and tucking in late. Each slides under the album's edge and is gone: the album took it. This is live now.",
        },
        {
          id: "gather",
          label: "Gather: drawn in and dissolving",
          means:
            "The same pair and clock, born LARGER than it lands and shrinking as it goes, so it recedes INTO the album and dissolves at the edge rather than passing under.",
        },
        {
          id: "cascade",
          label: "Cascade: one at a time, landing",
          means:
            "One every 625 ms, alternating sides: as many arrive, never two at once. Smallest at birth, biggest at the end, and it LANDS on the edge and fades where it sits.",
        },
      ],
      recommended: "glide",
      because:
        "It is the only one where the ALBUM is what acts. Sliding under the edge and being gone says the album took the photograph; dissolving says the photograph gave up, and landing and fading says it arrived somewhere else. The page is about an album that fills itself.",
      overrule:
        "If the hero reads as too busy at a glance, cascade is the calmest of the three: one photograph at a time, and each one's whole trip is followable.",
    },
  ],
});
