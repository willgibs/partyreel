import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./screens";

/**
 * THE ALBUM'S ROWS, ROUND TWO (2026-09-25): three questions the justified
 * rows raise, drawn on the real engine.
 *
 * Round one is answered (`docs/reviews/album-columns.json`) and built as an
 * engine and an opt-in layout (`lib/shared/album-rows.ts`, `layout="rows"` on
 * the one grid): justified rows, because rows insert the way people expect,
 * keep clean row lines and fit portrait and landscape alike; no row ever short
 * of the right edge, which was his one worry about them; the album running to
 * the window's edge; steps counted as photos per row, three through a tablet
 * and never more than eight at a desk, where a wider screen grows the
 * photographs instead; one size shared by hosting and guesting; a control of
 * a few fixed steps rather than a pixel slider. Production switches surface by
 * surface in a later lane, so nothing a guest or host sees changes yet.
 *
 * ★ ROUND ONE'S FRAMES RETIRED, NOT KEPT. Their gutter maths padded twice
 * (full rows overran by 40px; the ceiling drew seven at 2560), so they were
 * pictures of the wrong numbers; git has them.
 *
 * ★ HIS MOSAIC NOTE RETURNS AS RHYTHM. "The large images being random in flow,
 * not most liked, so they change as new images upload": steps counted per row
 * made the mosaic fallback unnecessary, so the random feature he described is
 * asked on its own, on the rows he picked.
 *
 * The nearest open asks elsewhere (`host-curation.queue`, how a waiting photo
 * shows in Review; `media-viewer.mine`, the own-item mark) are not asked here.
 */
export const ALBUM_COLUMNS = defineExploration({
  id: "album-columns",
  title: "Album rows",
  round: {
    n: 2,
    date: "2026-09-25",
    changed:
      "Round two, on the real rows engine: round one's picks are built (rows that always fill the width, steps as photos per row, eight at most, a third from 480, one shared size) and its frames retire. Three asks: the arrival, the steps' face, the rhythm.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-24",
      changed:
        "First round, widened same-day: the layout question itself now opens the board, and control/phone each carry the real fourth direction they had (pinch, a single-column feed).",
    },
  ],
  context:
    "Round one's picks, built: justified rows, and your gap question answered: every row fills the width, the oldest too, and an arrival re-breaks only the rows beside it (never more than four). Steps count photos per row, never pixels: about 2 on a phone, 3 through a tablet, 8 at most at a desk, where a wider screen grows the photos. One shared size. Everything below is the real rows engine over the lab's album; your mosaic note returns as the rhythm.",
  carried: [
    {
      id: "step-counts",
      question: "How many photos a row does each step hold?",
      taken:
        "Phone 1, 1.5, 2, 3, 4; tablet 2 to 5; a small laptop 2.5 to 6.5; a desk 3, 4, 5, 6, 8. The middle step is the default everywhere.",
      overrule:
        "Any count is one number in one table (ROW_CLASSES); the steps stay distinct as long as each one rises.",
    },
    {
      id: "unmeasured",
      question:
        "What shape does a photo with no dimensions take, and what crops?",
      taken:
        "A square, as masonry gives it. From 1:2 to 2.4:1 lays whole; a panorama or a sliver past either edge crops to it.",
      overrule: "Each is one constant in tile-aspect.ts.",
    },
    {
      id: "oldest-row",
      question: "Where do an album's leftover photos go?",
      taken:
        "Into the oldest row, which fills the width like every row but may stand up to a third taller. Too few to fill one row sit centred.",
      overrule:
        "The slack can be spread across every row instead; it is one constant in the engine.",
    },
  ],
  asks: [
    {
      id: "arrival",
      label: "The arrival",
      question: "How should a new photo enter the rows?",
      context:
        "Uploads arrive every few seconds. Each lands at the head and re-breaks the rows beside it (never more than four; the rows below keep every photo). The glow marks it in all four; only how it enters, and whether rows glide, differs.",
      options: [
        {
          id: "rise",
          label: "Rise, and the rows glide",
          means:
            "Today's entrance: the photo fades up in its place, glowing, while the rows it joined glide to their new widths.",
        },
        {
          id: "push",
          label: "Push in",
          means:
            "The row opens: the photo is revealed from its left edge while its neighbours glide aside on the same beat. Nothing fades; it reads as inserted.",
        },
        {
          id: "beats",
          label: "Make room, then land",
          means:
            "Two beats: the rows glide first and leave its space empty, then the photo rises into it. The clearest about what moved, and the slowest.",
        },
        {
          id: "snap",
          label: "Snap, and only the glow",
          means:
            "The rows re-break at once, with no glide and no entrance; the glow alone says which photo is new. The calmest, and the hardest to follow.",
        },
      ],
      recommended: "push",
      because:
        "It shows the one thing rows do that columns never could, and the reason you gave for picking them: the row opens and the photo goes in. The glow still marks it, and the rows below never move.",
      overrule:
        "If an arrival should read exactly as it does today, rise keeps today's entrance and only adds the glide.",
      lands:
        "How a photo arrives live on every album surface (the guest's album, the host's feed) once each switches to rows.",
      configs: [SCREEN],
    },
    {
      id: "steps",
      label: "The size steps",
      question:
        "What should the five size steps look like, and do phones get them?",
      context:
        "Five fixed steps, counted in photos per row so each stays distinct at any width: 1 to 4 on a phone, 3 to 8 at a desk. A phone has no size control today; rows can give it real steps. Press, pinch or ctrl-scroll: each album re-lays.",
      options: [
        {
          id: "menu",
          label: "A stepped slider in View",
          means:
            "Five stops on a slider inside the View menu the album already has, on every screen, phones included. Nothing new on the page.",
        },
        {
          id: "segments",
          label: "Five segments beside View",
          means:
            "Always in sight at a desk, each segment drawn as the photos a row it holds. A phone keeps about two a row and no control, as today.",
        },
        {
          id: "pinch",
          label: "Pinch, nothing on screen",
          means:
            "Pinch a touch screen or trackpad (or ctrl and scroll) to step through the five; a count shows while you pinch. Nothing to find or explain.",
        },
        {
          id: "both",
          label: "The slider, and pinch too",
          means:
            "The View menu's slider on every screen, and pinch as the shortcut wherever there is a touch screen or a trackpad.",
        },
      ],
      recommended: "both",
      because:
        "The slider is the stepped control you asked for, in the menu that already holds size, so nothing new crowds the album; pinch is what a phone and a trackpad reach for first, and it lands on the same five steps.",
      overrule:
        "If the menu is too far away for something used this often, segments keep the steps in sight at a desk.",
      lands:
        "The View menu's size group on the guest album and the host feed, the five steps in the size cookie, and whether a phone gets them.",
      configs: [SCREEN],
    },
    {
      id: "rhythm",
      label: "The rhythm",
      question:
        "Should the rows stay plain, or break now and then for a feature?",
      context:
        "Your mosaic note: a few photos bigger, random, never most-liked. A coin per visit picks them, so they hold while you look, a new upload gets the same chance and likes never count. On a phone both features are a landscape alone.",
      options: [
        {
          id: "plain",
          label: "Plain rows",
          means:
            "Every row at the step's height, none special: the calmest page, and the most photos on a screen.",
        },
        {
          id: "double",
          label: "Now and then, a taller row",
          means:
            "About one row in eight stands up to twice as tall, led by a landscape with a photo or two beside it. Nothing is cropped.",
        },
        {
          id: "solo",
          label: "Now and then, one across",
          means:
            "About one row in eight is a single landscape across the whole width, cropped to a wide band at a desk. The boldest.",
        },
      ],
      recommended: "double",
      because:
        "It gives the album the pulse your mosaic note asked for without cropping anyone's photo or playing favourites, and on a phone it is simply a landscape given its own row.",
      overrule:
        "If an album should read as one even wall, plain rows are the calm answer; if features should be unmissable, one across.",
      lands:
        "Whether the album's rows ever break their rhythm, on every album surface.",
      configs: [SCREEN],
    },
  ],
});
