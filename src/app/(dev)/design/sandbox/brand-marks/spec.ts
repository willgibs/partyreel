import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * THE MARKS, ROUND TWO: THE ICON MADE BESPOKE (the brand-marks-r2 track, cut
 * 2026-10-07 from Will's round one batch, `docs/reviews/brand-marks.json`).
 *
 * Round one's wordmark, plate and status picks are wired (brand-marks-wiring),
 * so they leave the asks and stand in the opening as settled. His icon pick
 * came with the round's brief: the ember Ring carries as the working version
 * (production's now, `src/lib/brand/ring.ts`, drawn here as itself), and he
 * would like it "filling the ring with more design to feel more bespoke to
 * our brand rather than identifying with a circle alone."
 *
 * ★ ONE FOCUSED ASK, BECAUSE THE ICON STANDS ALONE: nothing on a page
 * composes with it, so it is decided by itself, its takes drawn where an
 * icon lives and beside the wordmark it travels with.
 *
 * ★ THREE TAKES, PUSHED APART, TODAY'S RING THE REFERENCE: what the ring
 * holds (the party's mirror ball; the reel the name is), and what it is made
 * of (one swing of a sparkler's light), so the three answer differently what
 * the icon says: the party, the moment, the name. Each keeps the brand's
 * rules: one light, the house ember, key-lit from the top-left; drawn only as
 * a Ring; the house's, never an event's. A helper drew each take whole, a
 * creative director's fresh-eyes pass named what each still broke, and one
 * refinement landed every note (the ball's lit facets one crescent at the
 * key, never a dotted ring; the sparkler's loop a swing crossing its own
 * start, never today's ring; the reel's windows one light, never a palette).
 *
 * ★ EVERY OPTION IS ITS ANSWER'S OWN SIZE: an icon is a few files (the
 * favicon, the touch and maskable icons, the press kit's marks), so each take
 * is drawn at the sizes those files are, in the places they are seen.
 *
 * ★ ASKS NOTHING ANOTHER BOARD ASKS: the wordmark, the plate and the status
 * set are round one's answers (wired this wave); where the light lives across
 * the app is the signature board's; how a photo-less event is lit is the
 * event page board's.
 */
export const BRAND_MARKS = defineExploration({
  id: "brand-marks",
  title: "The brand's marks",
  surface: "shared",
  desk: 6,
  lives: [
    "src/app/icon.svg",
    "src/app/apple-icon.png",
    "src/app/favicon.ico",
    "src/app/manifest.ts",
    "public/icons/",
    "src/components/shared/logo.tsx",
    "src/lib/brand/",
    "src/lib/reel/engine/canvas2d.ts",
    "kit/logo/",
  ],
  tracks: ["brand-marks-r1", "brand-marks-r2"],
  round: {
    n: 2,
    date: "2026-10-07",
    changed:
      "From your round one batch: your wordmark, the plate and the status set are built, and the ember Ring ships everywhere an icon lives. The icon asked again: three bespoke takes on that Ring beside it.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-06",
      changed:
        "A new board from brand r2's Aperture: the wordmark, the icon, the plate and the status set on production's surfaces. You picked your v1 finished, the ember Ring, the room's own black and a status set with amber.",
    },
  ],
  context:
    "Round two, one decision: which Ring is the icon. Every take is drawn at the sizes it ships (1024, 180, 32 and 16, in the room and on paper), on a phone's home screen at night and by day, in a launcher's round mask, and beside production's wordmark as the press kit sets them, in one colour over footage too. Every number under a frame is read off it.",
  opening: {
    about:
      "Round two: the icon made bespoke. Three takes on the ember Ring you picked, each more of Partyreel than a circle, beside it as the reference.",
    settled: [
      "The icon is the Ring: the shutter's dark puck in a ring of light, the album's own Add drawn as a mark, lit by the house ember.",
      "The ember Ring now ships everywhere an icon lives, as the working version: the reference here, drawn as itself.",
      "The icon is the house's, never an event's light; the wordmark stands alone in the bars and the foot.",
      "Your round one picks are built: your v1 wordmark finished, the room's own black on paper, a status set with amber.",
    ],
    earlier: [
      "Round one, the icon: 'filling the ring with more design to feel more bespoke to our brand rather than identifying with a circle alone.'",
      "'However, we can carry this as the working version.'",
      "The wordmark: 'at any size, it still packs a bit of a punch ... present as a singular group ... rather than feel spaced out.'",
      "Desk 4: 'not like a junior designer was told to build a rainbow app. We are world-class tastemakers.'",
    ],
  },
  terms: [
    {
      term: "Ring",
      means:
        "The icon: the shutter's dark puck inside a ring of light, the album's own Add drawn as a mark.",
    },
    {
      term: "house ember",
      means:
        "The light where there is no photograph: the warm house lamps lit as one glow, amber to coral.",
    },
    {
      term: "puck",
      means:
        "The dark disc inside the Ring: the face of the shutter guests press to add photos.",
    },
    {
      term: "key",
      means:
        "The one lamp the brand lights everything by, at the top-left: the Ring is brightest there.",
    },
    {
      term: "long exposure",
      means:
        "A photograph whose shutter stays open, so a moving light is drawn as a line.",
    },
    {
      term: "round mask",
      means:
        "The circle a launcher cuts every icon to, as most Android phones do.",
    },
  ],
  carried: [
    {
      id: "word-alone",
      question: "Does a press kit lock the icon to the wordmark?",
      taken:
        "No: side by side, each on its own tile, as the kit has it; the word alone in the bars and the foot.",
      overrule:
        "A lockup, the Ring then the word, for a press kit and a mail's head.",
    },
    {
      id: "mono",
      question: "Does the icon need a form in one colour?",
      taken:
        "Yes, drawn for each take: the press kit's mono mark, and a reel's watermark over footage.",
      overrule: "The tile only; footage wears the wordmark alone.",
    },
    {
      id: "appearances",
      question: "Are the phone's tinted and dark looks asked here?",
      taken:
        "No: the pick's wiring draws them from its own light; this round asks the drawing.",
      overrule: "Each take drawn tinted and dark before you pick.",
    },
  ],
  asks: [
    {
      id: "icon",
      label: "The icon",
      question:
        "Which Ring should sign Partyreel on a home screen, among tabs and in a launcher's mask?",
      where: ["Shared", "The icon", "A home screen"],
      when: "A host saves Partyreel to her home screen; a guest keeps the album open in a tab among a dozen others.",
      matters:
        "It is the one mark that holds the light, and a circle alone says nothing of a party, an album or its guests.",
      lands:
        "The favicon, the home-screen and app icons, the manifest's maskable icon, the press kit's marks and a reel's watermark.",
      context:
        "Each take at the sizes it ships (1024, 180, 32, 16) in the room and on paper, on a home screen at night and by day, in a launcher's round mask, and beside production's wordmark as the press kit sets them.",
      options: [
        {
          id: "ember",
          label: "As today: the key-lit Ring",
          means:
            "The puck in its ring, lit from the top-left by the house ember and spent to an ember red at the bottom-right: the working version.",
          gains:
            "Calm and warm, a whole ring at every size, and already shipping.",
          costs: "A circle alone: nothing in it says party, album or guests.",
        },
        {
          id: "mirrorball",
          label: "The Ring holds a mirror ball",
          means:
            "The puck becomes the party's mirror ball: near-black facets, a crescent of them catching the house ember at the key.",
          gains:
            "The party's own object, caught in the brand's one light: the most festive, and rich from 60 up.",
          costs:
            "In a tab only a few lit pixels say ball; small, in one colour, it nears a button.",
        },
        {
          id: "sparkler",
          label: "The Ring drawn by a sparkler",
          means:
            "The ring is one swing of a sparkler, as a long exposure catches it: in thin, once round, and over its own start in a white-hot head.",
          gains:
            "The party's own light, the ring drawn by hand: the most alive, a gesture, never a circle alone.",
          costs:
            "Nothing fills the ring; in a tab the swing is a hooked loop, its sparks gone.",
        },
        {
          id: "reel",
          label: "The Ring holds a reel",
          means:
            "The puck becomes a reel, five windows round its hub, the house ember shining through them from behind: the name, drawn.",
          gains:
            "Says Partyreel by itself: the boldest from a tab to a poster, and in one colour too.",
          costs:
            "The stock film-reel glyph: it says video (and Instagram's Reels) before photos or a party.",
        },
      ],
      recommended: "reel",
      today: "ember",
      because:
        "The reel fills the ring with the name, lit the brand's one way, and alone holds as one bold group from a tab to a poster.",
      overrule:
        "Party before name: the mirror ball; the ring itself the gesture: the sparkler; if a reel reads as video first, today's Ring.",
      configs: [SCREEN],
    },
  ],
});
