import { defineExploration } from "@/components/lab/exploration";

/**
 * THE FALLING-IN, FIVE WAYS (2026-09-19; a fourth 2026-09-24; a fifth and the
 * album in rows 2026-09-28).
 *
 * Will, on the album page's hero: "I love the images falling into the album. I
 * was just curious to see maybe two to three variations of this concept to get
 * an idea of what the best version is. No specific direction on what
 * improvement means here yet." So this is one decision and nothing else, drawn
 * on the hero rather than argued: the shipped fall is one of the five.
 *
 * ★ EACH ONE IS A DIFFERENT ANSWER, NOT A DIFFERENT NUMBER. With no direction
 * on what improvement means, options a notch apart would waste the sitting, so
 * each varies on several axes at once: the arc of the fall, the size at birth
 * against the size at the landing, how often a photograph arrives and whether
 * it comes alone, and what happens at the moment it meets the album.
 * `stream-engine.test.ts` refuses two of the engine's four that draw the same
 * thing.
 *
 * ★ EVERY NUMBER UNDER A TILE IS MEASURED, never claimed: the caption on each
 * frame is the engine's own reading of the composition it is drawing (the
 * push's is read the same way, `push-engine.ts`), against the home hero's,
 * which is the reference Will named ("home hero currently feels perfect").
 *
 * ★ GRADED AGAINST THE PUSH, THE ALBUM'S ARRIVAL SINCE MILESTONE 29 (the
 * marketing refresh). The earlier rounds graded the falls against "a real
 * arrival grows into its column under a fading glow" (guest-shape r1,
 * guest-upload r1), which is what moved the recommendation from `glide` to
 * `cascade` and drew `bloom` for it. Milestone 29 replaced that grammar in both
 * albums with album-columns r2's `arrival=push` (album-rows `30ac9b74`,
 * album-window `eefe54d7`, `arrival.css`): a new photograph opens its row from
 * its left edge, clipped and never scaled, its neighbours gliding aside, and
 * only its glow fades. Against that, growing, shrinking and fading are all
 * things a real arrival no longer does, and none of the four reaches the album
 * at all: each is gone at its edge. So a fifth, `push`, is drawn for the
 * grammar itself: it goes in over the album's head, and the album's first row
 * opens for it.
 *
 * ★ AND THE ALBUM UNDER THEM IS THE ONE THE PRODUCT HAS. The shipped hero's
 * stage still draws `GuestMasonry`, which both albums dropped for the rows, so
 * every option now stands on the stage laid out in rows (`rows-hero.tsx`), and
 * the stage's swap is named in `lands` whichever fall wins. `glide` still ships
 * until he answers.
 */
export const ALBUM_MOTION = defineExploration({
  id: "album-motion",
  title: "Album motion",
  round: {
    n: 1,
    date: "2026-09-28",
    changed:
      "Re-graded against the push (album-columns r2's arrival=push, in both albums since milestone 29): a fifth fall, push, goes in over the album's head and opens its row; all five now stand on the album in rows, as the real one is. Bloom was drawn for the fade rule the push replaced. Glide still ships.",
  },
  context:
    "The album page's hero stands on the live guest album with photographs falling out of the room around the words into its top edge, which you asked for (`motion=stream`). This asks the one thing left open: which fall. The album itself now lays out in rows and takes a new photograph by opening its row, so every option is drawn on that album, over production's own falls.",
  // The two calls the push and its stage rest on, taken by the marketing
  // refresh on its own recommendation (its manifest's Questions).
  carried: [
    {
      id: "side",
      question: "Which side does the push draw its photographs from?",
      taken:
        "The head's only: a newest-first album opens top left, so every frame lands over the head; one born on the right would cross under the words to get there.",
      overrule:
        "Both sides, every frame still opening the head: balanced, but a right-hand photograph goes in on the right and reappears on the left.",
    },
    {
      id: "rows",
      question: "What does the stage's album lay out as?",
      taken:
        "The guest album's rows, laid plain: its rhythm leads a row now and then with a landscape at twice the height, which on a stage two rows tall is one photograph.",
      overrule:
        "The rhythm on, as a guest's album has it: now and then a single landscape fills the stage, and a push can open a double-height row.",
    },
  ],
  asks: [
    {
      id: "fall",
      label: "The fall",
      question:
        "Which of the five tells the album's real arrival truly on the hero?",
      context:
        "Since milestone 29 a new photograph opens its row from its left edge, clipped and never scaled, its neighbours gliding aside and only a glow fading (arrival=push). All five keep the home hero's pace; the live stage still draws masonry.",
      lands:
        "stream-engine.ts: SHIPPED for the first four, a push recipe with an arrival hook for the fifth; either way the hero's stage moves to the rows.",
      options: [
        {
          id: "glide",
          label: "Glide: a pair, sliding under the edge",
          means:
            "Two every 1250ms, born at 0.86 scale and barely growing, sliding under the edge and gone: nothing fades, as in the push, but the album never takes it in.",
        },
        {
          id: "gather",
          label: "Gather: drawn in and dissolving",
          means:
            "The same pair and clock, born larger (1.08) than it lands (0.74): it shrinks and dissolves at the edge, the two things a real arrival no longer does.",
        },
        {
          id: "cascade",
          label: "Cascade: one at a time, landing",
          means:
            "One every 625ms, grown 0.62 to 1.1, landing on the edge to hold and fade there: the grow-and-fade arrival the push replaced, told truest.",
        },
        {
          id: "bloom",
          label: "Bloom: arriving, lit from within",
          means:
            "One every 1875ms, grown furthest (0.5 to 1.15) and lit by the arrival's own glow, then fading on the edge: the glow is the push's; the growth and fade are not.",
        },
        {
          id: "push",
          label: "Push: it goes in and opens its row",
          means:
            "One every 1875ms, from the head's side only and never scaled; half through the edge over the head, the album's first row opens for it and only its glow fades.",
        },
      ],
      recommended: "push",
      because:
        "It is the album's own arrival, so the hero shows the album working rather than a picture of it: the photograph goes in, and the row opens for it clipped, never scaled, one glow at a time. Of the four before it, glide comes closest (nothing fades), but its album never changes.",
      overrule:
        "If the hero should stay symmetric with its album still, glide already ships: pairs from both sides, nothing under the words moving.",
    },
  ],
});
