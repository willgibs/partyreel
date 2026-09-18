import { defineExploration } from "@/components/lab/exploration";

/**
 * THE ALBUM PAGE'S HERO, ROUND FOUR (the heroes lane, 2026-09-18), as a new
 * question-first board: the album-hero board's round three ended on
 * `composition=none` and Will's answer to what comes next, verbatim: "Let's do
 * a round 4, home hero pace. ... I agree, but feel the area above and to the
 * sides of the H1 lockup will feel too empty with just the album beneath. Maybe
 * we can use a more subtle animation in some of the empty space to help the
 * hero feel more alive & full."
 *
 * ★ FOUR DECISIONS: the album under the words first, then what moves around
 * them and how the album is lit (both drawn on the album he picks), and where
 * the page's second light goes. Every option is the live page at 1440 and at
 * 375; the motion is graded against the home hero's pace, never capped.
 *
 * ★ THE NUMBERS IN THE WORDS ARE THE ENGINE'S: `margins.test.ts` holds each
 * motion's figures to what `margins.ts` measures.
 *
 * Pure data (registry.test.ts): the board route is a server page and reads
 * this for its header.
 */
export const ALBUM_PAGE = defineExploration({
  id: "album-page",
  title: "The album page's hero",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The album hero's fourth round as its own board: the album under the words, a subtle motion around them at the home hero's pace, the album's light and the page's second light, each drawn at 1440 and 375.",
  },
  bible: [1, 4, 11, 13, 14],
  asks: [
    {
      id: "visual",
      label: "The album",
      question: "Which album should sit under the headline?",
      context:
        "It sits at 896, the container's 4xl step nearest your 880, so the page takes no one-off width, and its foot fades out as you suggested. Both are the shipped components; only which one is the question.",
      options: [
        {
          id: "live",
          label: "The live album product",
          means:
            "The real guest album under the host's own header: the masonry, three columns at 896 and two at a phone, the Live now pill.",
        },
        {
          id: "filling",
          label: "Today's filling demo, widened",
          means:
            "The page's demo as it ships, one photograph landing at the top every beat and the rest sliding down, stretched to 896.",
        },
      ],
      recommended: "live",
      because:
        "It is what you asked for in round one, \"the actual live album product\", and a real album is the page's whole promise.",
      overrule:
        "If the hero's motion reads as more alive over a still album than over a filling one, the demo.",
      lands: "The visual under the album page's headline.",
    },
    {
      id: "motion",
      label: "The motion",
      question: "What should move in the space around the headline?",
      after: { ask: "visual" },
      context:
        "Three different kinds of motion for the empty space beside and above the words, each subtle beside the album and graded against the home hero, which you called perfect: frames leaving at 40 px a second, a pair every 1250 ms.",
      options: [
        {
          id: "stream",
          label: "Falling in",
          means:
            "Small photographs appear beside the words and glide down into the album's top edge: a pair every 1250 ms at the home hero's speed.",
        },
        {
          id: "arrivals",
          label: "Landing",
          means:
            "A loose scatter around the words where one photograph lands every 1250 ms and the oldest fades. Nothing travels.",
        },
        {
          id: "arch",
          label: "An arch",
          means:
            "Photographs rise out of the album on one side, pass over the words and sink back in on the other, a steady procession at 40 px a second.",
        },
      ],
      recommended: "stream",
      because:
        "It is the page's sentence drawn: every phone uploads into the same album. It pairs with the album by construction, which is what round three's compositions never did.",
      overrule: "If anything travelling beside the words is too much, landing.",
      lands: "The album page hero's backdrop.",
    },
    {
      id: "light",
      label: "The album's light",
      question: "How should the album be lit?",
      after: { ask: "visual" },
      context:
        "Today's lamp is a band the full width of the screen; the design system says a screen's light is a pool no wider than the screen. The album's foot fades out, so a pool sits under the fade and the photographs dissolve into it.",
      options: [
        {
          id: "pool",
          label: "A pool under the album",
          means:
            "The album's own colours pooled under its fading foot, never wider than the frame: the reel's recipe.",
        },
        {
          id: "none",
          label: "No light",
          means: "The album dissolves into the dark room.",
        },
        {
          id: "halo",
          label: "A halo behind the frame",
          means:
            "The Glow halo, lighting the frame from behind so its rim and chrome glow while the photographs stay clean.",
        },
      ],
      recommended: "pool",
      because:
        "It is the rule the design system already wrote for a screen's light, and the album's fade gives it somewhere to land.",
      overrule: "If the pool muddies the dissolve, none.",
      lands: "The album visual's light, replacing today's full-width ScreenLamp.",
    },
    {
      id: "second",
      label: "A second light",
      question: "Where should the page's second light go?",
      context:
        "The page has no chapter light today. Two places could take one: the dark chapter's floor, where it turns to paper, or the Everywhere section, lit from its open side. Drawn on the shipped sections, down to the cut.",
      options: [
        {
          id: "none",
          label: "None",
          means: "The album's own light is the page's only light.",
        },
        {
          id: "floor",
          label: "Rising from the chapter's floor",
          means:
            "The quality section lit from its bottom edge, where the dark chapter turns to paper.",
        },
        {
          id: "room",
          label: "The Everywhere section, from its open side",
          means:
            "A cast from the copy's side of the Everywhere section, falling away before it reaches the demo.",
        },
      ],
      recommended: "floor",
      because:
        "The cut to paper is the page's one hard edge, and light rising from it closes the dark chapter the way the home page's closer does.",
      overrule: "If the page should stay with one light, none.",
      lands: "A SectionLight on /features/album.",
    },
  ],
});
