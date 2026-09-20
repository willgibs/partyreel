import { defineExploration } from "@/components/lab/exploration";

/**
 * THE PRICING PAGE, ROUND TWO (2026-09-20): "Find your plan size" and the
 * phone row, by name (docs/design/rulings.md, the sixth batch, verbatim):
 * `fit` "Could use a bit of a redesign to feel more polished, but definitely
 * the most engaging option. I think Higgsfield does a good job of their 'find
 * the best plan for you' (explore https://higgsfield.ai/pricing in code and
 * visually) where they show a designed plan card as the result in a frame to
 * the right, with the config in the left half. Would like to see a couple
 * more explorations of this 'Find your plan size' component."; `phone` "This
 * sounds cool, but I think the demo is broken, so I can't actually see it
 * live. Would like to prove it in the lab before passing the
 * library/production, so may need to correct this and add it back to the
 * board."
 *
 * Round one's other six decisions are ruled and wired (`pricing-wiring`,
 * 58f7acbd): the page opens on paper over the plans, Free and Pro stand side
 * by side with Pro's own slider inside its card, the Event Pass is a wide
 * ticket beneath (one photograph, the pair's own StatRow), the tiles-to-table
 * run is one dark room with the band killed, and the FAQ is six questions
 * folded. None of that is reopened here; both new asks are drawn on that real
 * shipped pair and ticket, never a redrawing of them.
 */

export const PRICING_PAGE = defineExploration({
  id: "pricing-page",
  title: "The pricing page",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round two, two decisions: what the Find your size block should be (the wall, Higgsfield's configurator-and-result shape, or cutting it for the Pro card's own slider), and what the plans do at 375 now that the swipe demo is repaired and proven with lab:demo.",
  },
  context:
    "Six of round one's eight decisions are wired (pricing-wiring, 58f7acbd): paper opening, Free/Pro side by side with Pro's own slider, the Event Pass a wide ticket, one dark room to the table, six FAQ items. Two stayed open, both re-asked here on that real pair and ticket.",
  bible: [1, 5, 18, 21, 22],
  asks: [
    {
      id: "fit",
      label: "Find your size",
      question: "What should the Find your size block be?",
      context:
        "The wall (a slider filling a small album) is today's ratified V1, the most engaging option, but Will asked to see it explored further: Higgsfield's shape, a configurator left and a designed plan card as the live result right.",
      options: [
        {
          id: "wall",
          label: "Today: the slider and the filling wall",
          means:
            "Drag a storage slider and a small album fills on the real gallery grammar; a text receipt names the plan, its price and a runner-up.",
        },
        {
          id: "split",
          label: "A configurator left, a designed card right",
          means:
            "The same slider and switches sit in a recessed panel on the left; the right half holds one elevated, photographed plan card as the live result.",
        },
        {
          id: "inline",
          label: "Cut it: the wall is gone",
          means:
            "No separate section at all. Pro's own slider, already inside its card, and the StatRow beneath it are the whole answer.",
        },
      ],
      recommended: "split",
      because:
        "The wall already works (his own 'most engaging'); a designed result card in a frame is the one thing it does not have, and that is exactly the redesign he asked to see explored.",
      overrule:
        "If the album-fill delight is the point rather than a tidier configurator, the wall keeps that delight and split trades some of it for a calmer frame.",
      lands:
        "calculator.tsx, and whether the page keeps a second, separate size-teaching section at all.",
    },
    {
      id: "phone",
      label: "The page in a hand",
      question: "What should the plans do at 375, now that the demo works?",
      context:
        "Free, Pro and the Event Pass, all real. Stacking runs three cards plus a ticket before the next section; last round's swipe pick had an unproven demo, so it returns here, repaired and pressed end to end with lab:demo.",
      options: [
        {
          id: "stack",
          label: "Today: one card under another",
          means:
            "The pair's own grid collapses to one column below lg, then the ticket underneath it, exactly as production ships.",
        },
        {
          id: "swipe",
          label: "A swipe row, one card at a time",
          means:
            "Free, Pro and the Pass become a snapping row with the next card peeking at the edge; the cadence toggle stays above it.",
        },
        {
          id: "tabs",
          label: "Two tabs: one event, hosting again",
          means:
            "Free and the Pass sit under one tab, Pro alone under the other, so a visitor opens only the side they are weighing.",
        },
      ],
      recommended: "swipe",
      because:
        "It is the fastest way to compare three prices in one gesture; the only reason it did not ship last round was an unproven demo, now fixed in the sandbox and pressed by lab:demo.",
      overrule:
        "If a phone visitor must see every plan with no gesture at all, tabs says so out loud and stack is the safest of the three.",
      lands:
        "How the plan block lays out below sm, in plans.tsx's given Free, Pro and Pass.",
    },
  ],
});
