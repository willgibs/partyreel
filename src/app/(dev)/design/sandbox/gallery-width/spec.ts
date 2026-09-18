import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * HOW WIDE A GALLERY RUNS ON A LAPTOP AND A DESKTOP (2026-09-18).
 *
 * Will, asked whether to widen the guest album to 880: "I currently dislike how
 * we're restricting the width of the gallery (both in app and real guest event
 * pages) on larger screens. For laptops, desktops, etc., it makes way more
 * sense to use the full width for galleries to show more images." And before
 * the board: "we'd keep image tiles to a smaller size and add more columns. Not
 * go wide and keep 2 col."
 *
 * So the tile is the first decision and everything else follows it: a tile size
 * is a question on its own, while a width only means something once the tile is
 * known (a wide window of 300 px tiles and a wide window of 180 px tiles are
 * different albums). Where the words sit is asked once the album has left
 * their column, because that is when it becomes visible; the host's galleries
 * come last because they only have a question once the guest's album runs
 * wide. The phone is not asked: it keeps its two columns under every option.
 */

/**
 * THE WINDOW, one knob every decision shares, so one frame is on screen at a
 * time and each is a real window at 1:1 (manifest: "a `configs` knob for the
 * window keeps one frame on screen at a time"). 1512 by default: the options
 * part visibly there, and it is the big laptop most reviews happen on.
 */
const WINDOW: Control = {
  id: "window",
  label: "Window",
  options: [
    { id: "1280", label: "1280, a laptop" },
    { id: "1512", label: "1512, a big laptop" },
    { id: "1920", label: "1920, a desktop" },
  ],
  default: "1512",
};

const DRAFT = defineExploration({
  id: "gallery-width",
  title: "Gallery width",
  round: {
    n: 1,
    date: "2026-09-18",
    changed:
      "The first round: how big a tile is, how far the album runs, where the words sit over it and whether the host's galleries follow, each drawn as the real page at 1280, 1512 and 1920.",
  },
  context:
    "The guest album is capped at 632 px and two columns on every screen, and the host's gallery at 1280 and three. Will wants galleries to use the width they are given with small tiles and more columns; the words above them keep their readable column.",
  asks: [
    {
      id: "tile",
      label: "The tile size",
      question: "How big should a photo tile be on a laptop and a desktop?",
      context:
        "Today the guest album is two columns everywhere, so a tile is about 314 px on any laptop or desktop. Here a tile keeps about one size and the columns follow the window; each option names them at 1280, 1512 and 1920.",
      lands:
        "The column width both galleries use from 640 px up, in place of today's fixed two columns (three on the host's page).",
      options: [
        {
          id: "180",
          label: "About 180 px: 7, 8 and 10 columns",
          means:
            "A phone's own tile, pixel for pixel. The most photographs on a screen, and a face in a group shot gets small.",
        },
        {
          id: "240",
          label: "About 240 px: 5, 6 and 8 columns",
          means:
            "The size a phone's tile looks in the hand, seen from a laptop's distance, so faces read the way guests already read them.",
        },
        {
          id: "300",
          label: "About 300 px: 4, 5 and 6 columns",
          means:
            "Today's tile, kept, with the columns added around it. The fewest photographs on a screen and the most detail in each.",
        },
      ],
      recommended: "240",
      because:
        "It reads a face at a glance: from a laptop's distance a 240 px tile looks the size a guest's phone shows one, which is the size every guest already reads faces at, and a desktop still gets eight columns.",
      overrule:
        "If most albums are group shots and wide rooms, 300 keeps the faces in them legible where 240 starts to lose them.",
      configs: [WINDOW],
    },
    {
      id: "width",
      label: "The gallery's width",
      question: "How far across a big screen should the gallery run?",
      context:
        "The words stay in today's column; only the photographs go wide. Drawn at the tile size you picked. At 1280 the two nearly match, so flip the window to 1512 or 1920 to see them part.",
      lands:
        "Whether the guest page's gallery leaves today's 632 px column for the window's edges or for the app's 1280 container.",
      options: [
        {
          id: "full",
          label: "The full window",
          means:
            "The album runs to 20 px from each edge: every window gets every column it can hold, and a desktop shows the most photographs.",
        },
        {
          id: "container",
          label: "The app's 1280 column, centred",
          means:
            "The album stops growing at 1280. A bigger screen keeps the same columns and gains empty margins either side.",
        },
      ],
      recommended: "full",
      because:
        "A gallery is the one thing on the page that gets better with every column, and it is the reason the page is open: at 1920 the full window holds eight columns of 240 where the capped album holds five.",
      overrule:
        "If an album of a few dozen photographs looks thin spread across a 1920 screen, the 1280 column keeps it together.",
      after: { ask: "tile" },
      configs: [WINDOW],
    },
    {
      id: "words",
      label: "Where the words sit",
      question:
        "Where should the event's name and buttons sit above a wide album?",
      context:
        "The name, the byline and the buttons keep today's 632 px column, centred because the page used to be only that column. Drawn at your tile and width; the gap between the two grows with the window.",
      lands:
        "Where the guest page's readable column sits from 640 px up; on the phone it already fills the width, so nothing moves there.",
      options: [
        {
          id: "edge",
          label: "At the album's left edge",
          means:
            "The logo, the name, the buttons and the photographs share one left line, the way a photo app reads; the room to the right of the words stays open.",
        },
        {
          id: "centre",
          label: "Centred, as today",
          means:
            "The words stay in the middle of the page with the album spread beneath them, which reads more like a printed title page than an app.",
        },
      ],
      recommended: "edge",
      because:
        "The header is left-aligned by ruling, and centred over a wide album its first letter lands in the middle of the page, lined up with nothing above or below it. At the edge the page reads down one line.",
      overrule:
        "If an event should open like an occasion rather than a tool, the centred column gives it a title page.",
      after: { ask: "width" },
      configs: [WINDOW],
    },
    {
      id: "host",
      label: "The host's galleries",
      question: "Should the host's galleries follow the guest album's rule?",
      context:
        "The host's event page holds the same album in the app's 1280 column, three across today. Under the guest's rule its Gallery runs to the window's edges and its words go where the guest's went.",
      lands:
        "The host's galleries (the event's, the review queue, the reel grid, Uploads, Likes); with the words at the edge, the app's header and column too.",
      options: [
        {
          id: "same",
          label: "The guest album's rule",
          means:
            "The host's album runs to the window's edges and the page lines up the way the guest's does, so a host sees as many photographs at once as a guest.",
        },
        {
          id: "own",
          label: "Their own: the app's 1280 column",
          means:
            "The app keeps one centred column for everything; its galleries take the tile size and add columns up to 1280, then stop.",
        },
      ],
      recommended: "same",
      because:
        "A host sorting two hundred photographs needs the columns more than a guest browsing them, and the request named the app as well as the guest page. One rule for every gallery is also one fewer to keep.",
      overrule:
        "If a working page reads better held in one centred column like the rest of the app, the column keeps it.",
      after: { ask: "width", option: "full" },
      configs: [WINDOW],
    },
  ],
});

/**
 * ★ ONE WINDOW KNOB, NOT FOUR. `defineExploration` flattens every decision's
 * `configs` into the board's controls, so a knob the decisions share arrives
 * once per decision: the dock would draw it four times and React would warn
 * about the duplicate key. Each decision keeps it on its strip (that is what
 * `configs` is for); the board declares it once. A finding for the
 * constructor, which could dedupe by id itself.
 */
export const GALLERY_WIDTH: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
