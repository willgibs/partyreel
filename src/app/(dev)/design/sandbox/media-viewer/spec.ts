import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * WHAT A PHOTOGRAPH OPENS AS, ROUND THREE: THE OWN-ITEM MARK, AGAIN.
 *
 * Round one's eight are built (`media-viewer-wiring`), so its frames retired
 * with this round; git has them. Round two asked `mine` alone and Will took
 * the ring with a doubt of his own (`docs/reviews/media-viewer.json`): "I can
 * already see that neighboring uploads from the same user would have
 * overlapping rings, but this is far less intrusive than the glass dot or
 * worded corner. Curious if you could solve it even better... If not, we'll
 * scratch and go nothing at all. Simply use a filter to find yours."
 *
 * ★ HE WAS RIGHT, AND ROUND TWO COULD NOT HAVE SHOWN IT. Its ring was
 * `ring-2 ring-offset-2`: a 2px band of the ground and 2px of ink OUTSIDE the
 * tile, 4px in all, exactly the album's 4px gutter, so two neighbours' rings
 * met in the middle of it. And the board spaced this guest's photographs
 * every ninth tile, so no two ever stood side by side. Uploads arrive in
 * bursts; round three draws one, on the real rows (the album's layout from
 * here on, `album-columns`), and keeps every mark inside the tile.
 *
 * The standing filter (View's Showing: Everyone's / Yours) and the viewer's
 * own "You" credit are unmoved by every option; only what a tile of hers
 * wears at rest changes.
 */

/** The screen: phone first, as every round of this board. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/**
 * THE GROUND, forced inside the frame rather than left to the lab's theme: a
 * mark drawn in the page's inks is a different line on paper than in the
 * dark room, and both are asked about.
 */
const GROUND: Control = {
  id: "ground",
  label: "Ground",
  options: [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
  ],
  default: "light",
};

export const MEDIA_VIEWER = defineExploration({
  id: "media-viewer",
  title: "Opening a photograph",
  round: {
    n: 3,
    date: "2026-09-25",
    changed:
      "Round three: mine again, on the real rows, with her photos arriving as uploads do, a pick of five side by side at the head. Round two's ring sat outside the tile, as wide as the gutter, so neighbours met; every mark here stays inside.",
  },
  history: [
    {
      n: 2,
      date: "2026-09-24",
      changed:
        "One ask, mine, the grid's own-item mark; round one's eight answered and wired. He took the ring, doubting it: neighbours from one guest would run together.",
    },
    {
      n: 1,
      date: "2026-09-22",
      changed:
        "Eight decisions on the viewer, drawn from a tile and from the live reel: the opening, what it holds, the credit, the next one, close up, video, the way out, the link.",
    },
  ],
  context:
    "Maya and Jay's wedding as Priya sees it a moment after her pick of five landed: the album's head on the real rows at the middle step, three singles of hers further down, one of the five a clip. Every mark is a line of the page's ink on a band of its ground, so it reads over a white sky or a black dance floor, light and dark, and never as an arrival's white light. View's Yours filter is the same under all four.",
  carried: [
    {
      id: "mark-ink",
      question: "What is a mark drawn in?",
      taken:
        "The page's ink: a line on a band of the ground, inside the tile. It reads on any photo in both themes and is never the white light an arrival already means.",
      overrule:
        "White light with a halo, like the play mark, would match the tile's other marks and read as an arrival rim that never fades.",
    },
    {
      id: "run-rows",
      question: "When a burst wraps, one outline per row or one joined shape?",
      taken:
        "One per row: joined across the row break it becomes a staircase that reads as a selection, and each row still reads as part of one pick.",
      overrule:
        "Joined, a burst is one shape however it wraps, drawn the way a text selection crosses lines; the rows already know where every break falls.",
    },
  ],
  asks: [
    {
      id: "mine",
      label: "The own-item mark",
      question: "How should the album mark the photos that are yours?",
      context:
        "Your note on the ring: it intrudes least, but neighbouring uploads would run together. They do: uploads land in bursts, so five of hers stand side by side here and wrap. Every mark stays inside her tiles.",
      options: [
        {
          id: "inset",
          label: "A ring inside each tile",
          means:
            "Round two's ring moved inside the edge: each of hers framed on its own, two neighbours two rings with the 4px gutter between. The busiest on a burst.",
        },
        {
          id: "run",
          label: "One outline round each run",
          means:
            "Hers side by side in a row share one outline, the gutters between them bridged: a burst reads as one group, a single as one framed photo.",
        },
        {
          id: "baseline",
          label: "An underline under each run",
          means:
            "A line along the bottom edge, joined under hers side by side. The lightest mark that still groups a burst; the top and sides stay clear.",
        },
        {
          id: "none",
          label: "Nothing on the tiles",
          means:
            "No mark at all: View's Showing (Everyone's or Yours) finds them, drawn open here. Once open, the viewer still credits yours as You.",
        },
      ],
      recommended: "run",
      because:
        "Uploads arrive in bursts, and a burst is one moment: one outline says so, where a ring apiece stacks frames side by side. A single still reads as one framed photo, and an outline never takes in a tile that is not hers.",
      overrule:
        "If one outline is still more than an album should carry, the underline groups a burst with a single line; nothing at all leaves it to View.",
      lands:
        "What a guest's own photos wear on the album she is a guest of; the host's grid keeps its own marks.",
      tile: "phone",
      configs: [SCREEN, GROUND],
    },
  ],
});
