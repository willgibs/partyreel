import { defineExploration } from "@/components/lab/exploration";

import {
  BIG_SCREEN,
  EDGE_SCREEN,
  LAYOUT_SCREEN,
  LAYOUT_SIZE,
  PHONE_SCREEN,
} from "./screens";

/**
 * THE ALBUM'S COLUMN RULE, EXPLORED AFRESH (2026-09-24; widened the same day
 * on the Orchestrator's own review: the layout question itself, first, and a
 * real fourth direction wherever one exists).
 *
 * `gallery-width` (2026-09-19) ruled the shape every album grid still shares: a
 * declared column WIDTH, never a count, so a wider window shows more
 * photographs rather than bigger ones. That rule is sound and nothing here
 * argues it. But it settled the MIDDLE of the range and left both ends open:
 * what a laptop-sized window does was measured and named ("5, 6 and 8
 * columns"), the biggest screens and the smallest phones were not. Every board
 * since has drawn the rule as finished, which is exactly why nobody has looked
 * at either end since.
 *
 * Six decisions, each a real fixture album (`sandbox/gallery-fixtures.ts`) on
 * the real `MasonryColumns`: whether masonry is even the right layout, how
 * wide the album's own box runs, what the biggest screens do once the column
 * count would otherwise climb forever, what a phone bigger than an iPhone
 * earns, whether hosting and guesting should share one size preference, and
 * whether the control itself stays three steps. Every option under `width`,
 * `scale` and `phone` is the one balancing algorithm `gallery-width` ruled
 * (oldest-first into the shortest column), fed a different width; `layout`
 * is the one place that algorithm itself is a real, drawn alternative.
 */
export const ALBUM_COLUMNS = defineExploration({
  id: "album-columns",
  title: "Album columns",
  round: {
    n: 1,
    date: "2026-09-24",
    changed:
      "First round, widened same-day: the layout question itself now opens the board, and control/phone each carry the real fourth direction they had (pinch, a single-column feed).",
  },
  context:
    "The shared masonry (`src/components/shared/masonry.tsx`) is one grid behind the guest album, the host's feed, the recovery bin and the personal feeds: a declared column width with a 220px floor above 640px, two fixed columns below it, and a three-step control that sets the floor. `gallery-width` ruled the middle of that range; this board treats nothing about it as decided, including the layout itself.",
  bible: [1, 2, 3, 6],
  asks: [
    {
      id: "layout",
      label: "The layout itself",
      question: "Should the album lay out in masonry columns, or a real different way?",
      context:
        "Masonry (today) balances natural-ratio photographs into height-matched columns. Three other real ways to fill a width exist: equal-height rows, a uniform grid (already built, for the Reel) and a mosaic that features a few.",
      lands:
        "The grid every album, host feed and marketing stage is built from, underneath every other decision here.",
      configs: [LAYOUT_SCREEN, LAYOUT_SIZE],
      options: [
        {
          id: "masonry",
          label: "Masonry: natural columns",
          means:
            "Today. Real ratios, height-balanced columns, nothing cropped; the live arrival (a photo grows into its column, nothing else moves) depends on this shape.",
        },
        {
          id: "justified",
          label: "Justified: equal rows, nothing cropped",
          means:
            "Rows pack at one target height, each stretched to the exact width (Flickr's algorithm): a cleaner edge, but a new arrival reflows every row after it.",
        },
        {
          id: "uniform",
          label: "Uniform: one fixed shape, cropped",
          means:
            "The Reel and Review queue's own grid, real and already built; tried for the album once already and ruled out (`gallery`, 2026-09-19).",
        },
        {
          id: "mosaic",
          label: "Mosaic: a few photos get more room",
          means:
            "The three most-liked span a bigger cell, the rest pack in around them: lively, but it crops, and it plays favourites among a guest's own photographs.",
        },
      ],
      recommended: "masonry",
      today: "masonry",
      because:
        "The live-arrival grammar (a photograph grows into its own column and nothing else moves, ruled since guest-shape/guest-upload) is built on masonry's own column assignment; justified's row membership would reflow under it, and uniform was already tried and ruled out for this exact spot.",
      overrule:
        "If a cleaner right edge matters more than the arrival staying local, justified is the stronger look and the arrival grammar is the thing to redesign.",
    },
    {
      id: "width",
      label: "Album width",
      question: "How wide should the album run at the window's edges?",
      context:
        "Today the album ignores the window's width: a fixed 20px gutter each side, photographs fill the rest (`width=full`, 2026-09-19). The words above it keep a narrow reading column, lined up on the same edge.",
      lands:
        "The gutter every guest album, host feed and marketing album stage shares.",
      configs: [EDGE_SCREEN],
      options: [
        {
          id: "edge",
          label: "Edge: a fixed 20px gutter, no cap",
          means:
            "Today. The album runs to the window at every size; only a 20px margin holds it off the glass, at a phone and a cinema display alike.",
        },
        {
          id: "contained",
          label: "Contained: a wide cap, then it stops",
          means:
            "The album grows with the window to about 2200px, then holds there and centres, leaving calm margin either side on the biggest screens.",
        },
        {
          id: "bleed",
          label: "Bleed: no gutter at all",
          means:
            "The margin goes to zero everywhere, phone included: photographs run truly edge to edge, touching the glass.",
        },
      ],
      recommended: "edge",
      today: "edge",
      because:
        "The 20px edge already lines the album up with the words above it, and lets a bigger window show more photographs rather than bigger ones (bible 6: the media is the colour).",
      overrule:
        "If the biggest screens read as thin and scattered, contained is the fix; for a native camera-roll feel on a phone, bleed is.",
    },
    {
      id: "scale",
      label: "The scale ceiling",
      question:
        "On the biggest screens, should the album keep adding columns forever, or grow the tiles instead past a point?",
      context:
        "The column floor is one constant, 220px, above 640px (`gallery-width`, 2026-09-19): 8 columns at 1920, but 11 at 2560 and about 15 at 3440. Nothing stops a tile reading smaller as the monitor grows.",
      lands:
        "The `--album-column` floor's own formula, read by every masonry grid in the product.",
      configs: [BIG_SCREEN],
      options: [
        {
          id: "unlimited",
          label: "Unlimited: the same 220px floor, forever",
          means:
            "Today. Every extra inch of window becomes another column; a 3440px monitor gets roughly fifteen of them.",
        },
        {
          id: "grows",
          label: "Grows: the floor steps up past 1920",
          means:
            "220px to 1920, then 260, then 300 beyond 2560: columns keep coming but more slowly, and each one stays a comfortable size.",
        },
        {
          id: "ceiling",
          label: "Ceiling: never more than 8 columns",
          means:
            "Below 8 columns, today's rule exactly. Past it, the floor grows to fill the row instead: 8 columns, wider each time, however wide the screen.",
        },
      ],
      recommended: "grows",
      today: "unlimited",
      because:
        "Fifteen columns at 3440 reads as a wall of postage stamps, not a party; growing the floor keeps the tile-in-the-hand feeling (`tile=240`, 2026-09-19) all the way to a cinema display.",
      overrule:
        "If more, smaller photographs is genuinely the goal at any size, unlimited is the honest answer and stays as it is.",
    },
    {
      id: "phone",
      label: "The phone's columns",
      question:
        "Below 640px, does every phone get exactly two columns, or does a bigger one earn a third?",
      context:
        "The width rule starts at 640px; under it, a fixed floor forces exactly two columns from a 320px phone to a 639px tablet alike (`gallery-width`: 220 at 375 would collapse the album to one).",
      lands: "The phone floor in `masonry.tsx`, read below 640px.",
      configs: [PHONE_SCREEN],
      options: [
        {
          id: "fixed-two",
          label: "Fixed: two columns, every phone",
          means:
            "Today. A 375px phone and a 600px one see the same two-column album.",
        },
        {
          id: "scales",
          label: "Scales: the same rule, a lower floor",
          means:
            "A ~160px floor takes over below 640 too: two columns hold until roughly 530px, then a third joins.",
        },
        {
          id: "step-three",
          label: "A step: three columns from 480px",
          means:
            "One more breakpoint rather than a continuous rule: two columns to 479px, three from 480 to 639.",
        },
        {
          id: "single-column",
          label: "One column: a feed",
          means:
            "A deliberate style, not a width fallback: every phone, always one column, full-width photographs in a single scroll.",
        },
      ],
      recommended: "fixed-two",
      today: "fixed-two",
      because:
        "A 160px tile is a small target mid-scroll, and the phone's whole case for two columns was a tile that reads at arm's length, not a grid that reads at a desk.",
      overrule:
        "If a big-phone guest audience is real, step-three earns space back; if the album should read as a story rather than a grid, single-column is the bolder move.",
    },
    {
      id: "scope",
      label: "One preference, or two",
      question:
        "Should hosting and guesting share one tile-size preference, or hold their own?",
      context:
        'One cookie, `pr_tile_size`, written at `path: "/"` by both the host dashboard and every guest album (`tile-size-cookie.ts`). The same browser carries one size into both roles today, decided by nobody.',
      lands:
        "`TILE_SIZE_COOKIE` in `tile-size-cookie.ts`, and the two Server Actions that write it.",
      options: [
        {
          id: "shared",
          label: "Shared: one size, every album",
          means:
            "Today. Set Large moderating your own event, and the next album you visit as a guest opens Large too.",
        },
        {
          id: "split",
          label: "Split: a host size and a guest size",
          means:
            "Two cookies, one per role. Moderating dense never resizes the album you scroll as a guest, or back.",
        },
        {
          id: "shared-defaults",
          label: "Shared, but the first visit differs",
          means:
            "Still one cookie once touched, so a deliberate choice still follows you; only the untouched, first-ever default differs by role.",
        },
      ],
      recommended: "split",
      today: "shared",
      because:
        "A host scanning to moderate and a guest admiring a friend's wedding are different jobs on the same device, and today's coupling is an accident of one shared helper, not a decision anyone made.",
      overrule:
        "If 'my size, wherever I am' is the more legible model for the rare person who is both, shared is one fewer setting to explain and stays as it is.",
    },
    {
      id: "control",
      label: "The control's form",
      question:
        "Does the tile-size control stay three fixed steps, or become something else?",
      context:
        "Small, Medium and Large today (180/240/300px), one radio group inside the View menu, on both the guest album and the host feed.",
      lands:
        "`TILE_SIZES` in `tile-size-cookie.ts`, and the View menu's Tile size group.",
      options: [
        {
          id: "three-step",
          label: "Three steps: Small, Medium, Large",
          means:
            "Today. Three named sizes, quick to reach for and easy to describe to someone else.",
        },
        {
          id: "slider",
          label: "A slider: drag to any size",
          means:
            "One continuous drag from about 160px to 340px; finer control, no names to reach for.",
        },
        {
          id: "five-step",
          label: "Five steps, still named",
          means:
            "XS through XL: closer to the slider's range without giving up a nameable, reachable step.",
        },
        {
          id: "pinch",
          label: "Pinch to resize (touch)",
          means:
            "The Photos app's gesture: two fingers on a touch album, or a trackpad pinch at a desk. No steps, no track to drag, just the size changing under your fingers.",
        },
      ],
      recommended: "three-step",
      today: "three-step",
      because:
        "A photo grid barely feels different between two steps 20px apart, so the slider's extra precision buys little; three named sizes stay quick to reach for and easy to describe.",
      overrule:
        "Landing between two steps wanting a size neither offers earns five-step or the slider; a mostly-touch guest audience earns pinch, the more native gesture there.",
    },
  ],
});
