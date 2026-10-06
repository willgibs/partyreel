import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * THE HUB'S CARDS, ROUND SIX (the event-header-r6 track, cut 2026-10-06).
 *
 * Round five's answer picked no take and set two notes and a check: "Is seam
 * implemented here correctly? I see a streak of horizontal brightness behind
 * the cards"; the count as a badge on the glyph (points' idea, capped at
 * 99+); and colour back for a count that needs her, since the code's corner
 * kept its amber while the cards lost theirs.
 *
 * ★ FIRST THE SEAM, MADE AFTERGLOW'S (a correction, never an ask): drawn under
 * every option (`seam.tsx`), the edge's own colours at the brand's reach, the
 * cards standing on the cover's foot so nothing pressed stands in the light;
 * on paper brand r2's three forms, a knob (his open ask on the brand board).
 *
 * ★ THEN TWO ASKS, ONE BEHIND THE OTHER: how the card carries its count on its
 * glyph (`cards.tsx`), then, drawn on the card he picks, the colour of a count
 * that needs her, offered at its source: one status token the cards and the
 * code's corner share (`cards.css`), one option answering within the hueless
 * set, so colour is weighed against the brand's own answer.
 *
 * ★ EVERY FRAME IS PRODUCTION'S HUB, NOT A PICTURE OF IT: the app's bar, the
 * album's own head, the code, the checklist, the album's section header, the
 * rooms' panel and every room are production's components; the cards and the
 * Seam are drawn beside them in identity's wired atoms.
 */

/** A host runs her party from her laptop first; the tablet and the phone are on the knob. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "1440", label: "1440, a laptop" },
    { id: "820", label: "820, a tablet" },
    { id: "375", label: "375, a phone" },
  ],
  default: "1440",
};

/** Tonight two doors wait on her; at its peak a badge reaches 99+; the week before, steps left; the week after, paused. */
const MOMENT: Control = {
  id: "moment",
  label: "The moment",
  options: [
    { id: "tonight", label: "Tonight, the party on" },
    { id: "peak", label: "Tonight at its peak, 99+" },
    { id: "before", label: "The week before" },
    { id: "after", label: "The week after, paused" },
  ],
  default: "tonight",
};

/** Where she is on the page: both grounds open on the first screen, or already scrolled into the album. */
const SCROLL: Control = {
  id: "scroll",
  label: "Scroll",
  options: [
    { id: "rest", label: "The first screen" },
    { id: "album", label: "Scrolled into the album" },
  ],
  default: "rest",
};

/** How the Seam lives on paper: brand r2's three takes, his open ask there, drawn here as a knob. */
const PAPER: Control = {
  id: "paper",
  label: "The Seam on paper",
  options: [
    { id: "aperture", label: "Aperture: a strip of the room" },
    { id: "ink", label: "Ink: a printed rule and credits" },
    { id: "cast", label: "Cast: a coloured shadow" },
  ],
  default: "aperture",
};

export const EVENT_HEADER = defineExploration({
  id: "event-header",
  title: "The event headers",
  surface: "host",
  desk: 20,
  lives: [
    "docs/systems/host-app.md",
    "src/app/globals.css",
    "src/app/(app)/dashboard/[eventId]/page.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/event-cards-row.tsx",
    "src/components/app/event-feed/room-card.ts",
    "src/components/app/event-feed/reel-card.tsx",
    "src/components/app/share/event-code-door.tsx",
  ],
  round: {
    n: 6,
    date: "2026-10-06",
    changed:
      "Round six: the Seam rebuilt as Afterglow's own (the edge's colours at the brand's reach, past the cards), then your notes as two asks: how a card carries its count on its glyph, and the colour of a count that needs you.",
  },
  history: [
    {
      n: 5,
      date: "2026-10-05",
      changed:
        "Three polished takes on the cards. You picked none: asked whether the seam was right, liked each count as a badge on its glyph (capped at 99+), and asked for colour back where a count needs you.",
    },
    {
      n: 4,
      date: "2026-10-04",
      changed:
        "The three doors again, each refined with its sticky form. You picked the cards over the seam, 'more pronounced than the glass capsule, without shouting', and asked for ideas of polish.",
    },
    {
      n: 3,
      date: "2026-10-03",
      changed:
        "The facts free of a timeline beside three new ideas, and each door refined with its sticky form. You picked the strip (wired) and asked for all three doors again, leaning glass.",
    },
    {
      n: 2,
      date: "2026-10-03",
      changed:
        "The hub's facts four ways, its doors three and how a room opens. You picked the strip on one condition, asked for each door again, and picked every room over the hub (wired).",
    },
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Both heads redrawn whole for Maya & Jay's wedding. You picked the cover for guests, the same cover for the hub, and the shutter, all built.",
    },
  ],
  context:
    "Round six, on the hub as built: the cover, its strip, the code, the album and every room are production's; the cards and the Seam are redrawn. Every frame is drawn in the room and on paper side by side, both live: scroll and the cards fold into pills, press one and its room opens. Every caption is read off its frame.",
  opening: {
    about:
      "Round six of the hub's doors: the Seam rebuilt as Afterglow draws it, then your notes: each count riding its glyph, and colour back where a count needs you.",
    settled: [
      "The cards and their fold into pills under the bar (round four's pick); every room opens over the hub; the press and the focus are identity's.",
      "Afterglow is the brand: one light to a screen, a Ring, a Seam or a Bloom; a status is a solid point and its word, never a glow.",
      "Seam, corrected: it reaches 120px at a desk and 72 in a hand at full strength, the brand's own; round five's was a tenth of that, a quarter as strong.",
      "Seam, corrected: the edge's own colours, sixth by sixth, pooled in three soft ellipses and crossing with each photograph; round five drew one lamp as a bar.",
      "Seam, corrected: the cards stand on the cover's foot, the light falling past them; round five laid it under the cards, a streak in their gaps.",
      "Seam, corrected: the cover's scrim lifts at its foot, so the edge the light is born at is seen; round five's lay under 76% black.",
      "Seam, corrected: on paper no light at all, brand r2's forms on the Paper knob (that ask stays on the brand board); and the fold no longer flashes it.",
    ],
    earlier: [
      "Round five: 'Is seam implemented here correctly? I see a streak of horizontal brightness behind the cards, only a few pixels tall.'",
      "And: 'add the count as a badge on the card icons (option 3)… Can max at 99+ so it never overflows into card title.'",
      "And: 'for counts that need attention… use some sort of color to draw the eye… else it's really easy for the bland counts to be scrolled past.'",
      "Round four, on the cards: 'more pronounced than the glass capsule, without shouting'.",
      "Round three: 'don't love our yellow color, makes the page feel dull.'",
      "Desk 4, on Afterglow: 'very tough to nail on anything light. It's washed out easily.'",
    ],
  },
  terms: [
    {
      term: "hub",
      means:
        "Maya's own page for her event: the cover, the cards into her rooms, the checklist and the album.",
    },
    {
      term: "Seam",
      means:
        "Afterglow's light born where the cover's photograph ends, in the edge's own colours, spent before anything pressed.",
    },
    {
      term: "pills",
      means:
        "What the cards fold into once she scrolls past the cover: a line of small doors held under the app's bar.",
    },
    {
      term: "badge",
      means:
        "A count on a glyph's shoulder, the way an app's icon carries its unread number.",
    },
    {
      term: "status token",
      means:
        "One named colour for 'needs you', worn by every waiting count, so the cards and the code can never disagree.",
    },
    {
      term: "one light",
      means:
        "Afterglow's rule: a screen has at most one light (here the Seam); a status colour is a solid mark, never a light.",
    },
  ],
  carried: [
    {
      id: "cards-on-cover",
      question: "Where do the cards stand, now the light must fall past them?",
      taken:
        "On the cover's foot, the photograph running on under them to its edge, the Seam falling into the page below, the album past it.",
      overrule:
        "Under the light: the cover ends, the Seam falls, and the cards stand in the page after it.",
    },
    {
      id: "hand-row",
      question: "How do the five cards stand in a hand?",
      taken:
        "One row of five tiles, each its glyph, the count on it and its short word (round five's points), so the cover keeps its words.",
      overrule: "Production's two by two, the guest's view the width under it.",
    },
    {
      id: "cap-home",
      question: "Where does '99+' live?",
      taken:
        "In the badge alone: the card's accessible name and the room keep the whole number ('Review: 140 waiting').",
      overrule: "Every count capped, the accessible name included.",
    },
    {
      id: "band-ends",
      question: "Where does everything stand in the band once the cards fold?",
      taken:
        "The cover's face at its left end, the code (a pill like the doors) at its right end where the cover's code stood, the doors in its middle.",
      overrule:
        "Round four's band: the doors packed after the face, the white code chip following the last door.",
    },
    {
      id: "reel-ink",
      question: "Does the reel's glyph keep its violet?",
      taken:
        "No: every glyph is ink, the reel's too, since Afterglow paints no hue on a control.",
      overrule: "The reel keeps production's violet, on its glyph alone.",
    },
    {
      id: "tablet-tiles",
      question: "How do five cards stand at a tablet's width (640 to 1088)?",
      taken:
        "As tiles, five across: each glyph and its count over its words, the long names where a tile has 130px.",
      overrule: "Two rows, three over two, each card as wide as a desk's.",
    },
    {
      id: "reduced-fold",
      question: "What does the fold do under reduced motion?",
      taken:
        "It dissolves: the new form develops in place over 150ms and nothing travels.",
      overrule: "It snaps at once, as round four drew it.",
    },
    {
      id: "settings-paused",
      question: "What does Settings' card say while uploads are paused?",
      taken:
        "Paused, the uploads' own word, plain and never a status, a quiet pause on its glyph; the code's corner keeps its pause.",
      overrule:
        "The door's word stays (Private · You let in) and only the code's corner says paused.",
    },
  ],
  asks: [
    {
      id: "card",
      label: "The count on the glyph",
      question: "How should each card carry its count on its glyph?",
      where: ["Host", "Her event's hub", "The cards"],
      when: "Tonight 8 uploads wait in Review and 2 people at her door; at its peak 140 and 12; the week before, Settings has steps left.",
      matters:
        "She runs the night from these: a title and its count must read in one glance, and a count that needs her must never be missed.",
      lands:
        "The hub's five cards at rest and folded into pills, at a desk, a tablet and in a hand, in the room and on paper.",
      context:
        "Each card in the room and on paper, both live: scroll and they fold into pills, press one and its room opens. Moment's peak shows the cap (99+); Screen a tablet's tiles and a hand's one row; Paper how the Seam lives on paper.",
      options: [
        {
          id: "shoulder",
          label: "Shoulder: a badge where it matters",
          means:
            "The count a badge on the glyph's shoulder, only where it needs her or is hers to act on; every other glyph bare, its line its words.",
          gains:
            "Your note as asked: title and count in one glance, and only the two that need her carry a mark.",
          costs:
            "The other cards' numbers (31 guests) stay in their lines, so the row reads two ways.",
        },
        {
          id: "ring",
          label: "Ring: a ring round the glyph",
          means:
            "Where something needs her the glyph wears a ring of the token and the count hangs as a tab at its foot, as a story ring says something new waits inside.",
          gains:
            "A waiting card reads across a room as a ring of colour, its count still tied to its glyph.",
          costs:
            "A ring and a tab are two marks where a badge is one, and a ring drawn in ink is quieter.",
        },
        {
          id: "numeral",
          label: "Numeral: the count takes the glyph's place",
          means:
            "Where something waits the count stands large on a lit disc, the glyph moved to its shoulder; the glyph comes back once she is caught up.",
          gains:
            "The biggest read across a room: a card that needs her changes its face, not just a corner.",
          costs:
            "The door is known by its title while it waits, and a 99+ is small in a 40px disc.",
        },
      ],
      recommended: "shoulder",
      because:
        "Your badge, only where it means something: the eye goes to the two cards that need her, and the rest stay calm.",
      overrule:
        "If a waiting glyph should read from across a room, ring; if a waiting card should change its whole face, numeral.",
      configs: [SCREEN, MOMENT, SCROLL, PAPER],
    },
    {
      id: "attention",
      label: "A count that needs her",
      after: { ask: "card" },
      question:
        "What colour should a count that needs her wear, on the cards and the code alike?",
      where: ["Host", "Her event's hub", "Counts that need her"],
      when: "Tonight 2 people wait at her door and 8 uploads in Review: the cards' badges and the code's corner both count them.",
      matters:
        "A bland count is scrolled past while a guest waits at the door; a loud one turns a party into an alarm.",
      lands:
        "One status token, 'needs you', worn by every waiting count: the cards, their pills and the code's corner, on both grounds.",
      context:
        "Drawn on the card you picked (Shoulder until you do), in the room and on paper, both live. The code's corner wears the same status token as the cards, so the two always agree. Moment's peak shows 99+.",
      options: [
        {
          id: "ink",
          label: "Ink: full-lit, with no hue",
          means:
            "Afterglow's set as it stands: a waiting count is the ink at full strength, white in the room and black on paper. Nothing added to one light.",
          gains:
            "The brand's own answer: no new colour, and one light to a screen by construction.",
          costs:
            "No colour at all: on a busy night it can be the bland count you scrolled past.",
        },
        {
          id: "tally",
          label: "Tally: the camera's red",
          means:
            "The camera's tally, the red the palette already holds (the live mark's), solid and hard-edged: a status colour, never a light, so the Seam stays the one.",
          gains:
            "The eye goes straight to it, as to every phone's badge, and the palette gains no hue.",
          costs:
            "Red also means live and failed, so two waiting guests read a little like an error.",
        },
        {
          id: "cue",
          label: "Cue: a new blue for 'needs you'",
          means:
            "A status of its own beside Standby, Ready and Fault: a cool blue no photograph's warm light and no other state wears, solid, never a glow.",
          gains:
            "Draws the eye with no alarm, never taken for a fault or for the event's light.",
          costs:
            "A new hue in the palette, and blue reads 'unread' more than 'act now'.",
        },
      ],
      recommended: "tally",
      because:
        "The colour every badge already means 'act on this' in, at no new hue; solid and small, so the Seam stays the screen's one light.",
      overrule:
        "If the brand's hueless set should hold, ink; if red should only ever mean failed, cue.",
      configs: [SCREEN, MOMENT, SCROLL, PAPER],
    },
  ],
});
