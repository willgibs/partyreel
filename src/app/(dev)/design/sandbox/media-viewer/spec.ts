import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PHOTOGRAPH OPENS AS, ROUND TWO: THE OWN-ITEM MARK.
 *
 * Round one's eight decisions are answered (`docs/reviews/media-viewer.json`,
 * 2026-09-24) and are landing on the real component via `media-viewer-wiring`
 * at the same time as this round: the opening grows out of where it was, the
 * credit is face-led, the actions sit in a floating capsule, the neighbours
 * peek at the edges, pinch reaches close, a video plays muted with a scrubber,
 * the way out is a swipe down or a blank tap, and Share sends the file with
 * Save reaching the phone's Photos library first. None of that is reopened
 * here; round one's own preview code stands, unimported, in `board-r1.tsx`
 * (`site-chrome`'s own precedent at its round two).
 *
 * ★ ONE SURVIVING QUESTION, HIS OWN NOTE ON `holds`: "Don't love our 'own
 * photo' marker or placement." `mine` is that note, cut narrower than it
 * reads at first: not the floating action capsule (his own pick, shipped),
 * but the OTHER own-item mark, the one on the GRID (`masonry.tsx`'s
 * `MineMark`, the top-left glass dot that also toggles the Yours filter),
 * which the open viewer itself no longer carries at all — inside it, the
 * credit already reads "You" on your own item (`media-viewer-wiring`'s own
 * call), so this ask is the grid's mark alone.
 */

/**
 * THE SCREEN, the knob this round's one ask still shares. 375 by default,
 * everywhere: this is still the phone-first board.
 */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

const DRAFT = defineExploration({
  id: "media-viewer",
  title: "Opening a photograph",
  round: {
    n: 2,
    date: "2026-09-24",
    changed:
      "Round two: one ask, mine, the grid's own-item mark. Round one's eight are answered and landing via media-viewer-wiring; none reopened here.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-22",
      changed:
        "Rechecked against the identity and reel rounds: a photograph opens from a tile or the live reel, so the opening, a video and the way out are drawn from both; every credit is drawn on the identity model; the link is asked beside the reel's own address.",
    },
  ],
  context:
    "The grid behind the viewer, the same twenty-six item wedding, at 375 with 1440 on the knob. Every option marks the same three tiles this device added; the standing Yours filter and the viewer's own credit are unmoved by any of them.",
  bible: [1, 4, 14, 15, 18],
  asks: [
    {
      id: "mine",
      label: "The own-item mark",
      question: "What shape and place should the grid's own-item mark take?",
      context:
        'His note: "Don\'t love our own photo marker or placement." Today\'s is a top-left dot toggling Yours. The viewer already credits your item "You"; this is the grid\'s mark alone.',
      options: [
        {
          id: "dot",
          label: "The glass dot, as shipped",
          means:
            "Unlabeled, top-left, a tap toggles the standing Yours filter. Legible only once a guest has already found and tried it.",
        },
        {
          id: "label",
          label: "The same corner, worded",
          means:
            'The same top-left slot, a small "Yours" pill in place of the dot: legible cold, no tap needed to learn what it means.',
        },
        {
          id: "ring",
          label: "A ring round the whole tile",
          means:
            "No corner glyph at all: a soft accent ring on every tile that is yours. The standing Yours control keeps the filter.",
        },
        {
          id: "none",
          label: "Nothing on the tile at all",
          means:
            'The grid carries no mark; the standing Yours control still filters, and the viewer\'s own "You" still credits it once open.',
        },
      ],
      recommended: "ring",
      because:
        "It answers both halves of his note at once: no ambiguous glyph to decode, and no corner at all, since the mark rides the whole tile rather than the corner he dislikes.",
      overrule:
        "If a guest scans a big album fast, the worded pill costs the least change from today's shape and still reads with no legend.",
      lands:
        "Whether the grid keeps a per-tile mark at all, and if so, whether it lives in a corner or on the whole tile.",
      tile: "phone",
      configs: [SCREEN],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT.
 * `defineExploration` flattens every decision's `configs` into the board's
 * controls; one ask still means one declaration is enough, and the dedupe is
 * kept so a third ask never draws SCREEN twice by accident.
 */
export const MEDIA_VIEWER: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
