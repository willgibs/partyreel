import { type Control, defineExploration } from "@/components/lab/exploration";

/**
 * THE HUB'S CARDS, ROUND FIVE (the event-header-r5 track, cut 2026-10-05).
 *
 * Round four's answer: the doors are the cards over the seam (wired by
 * `event-header-wiring` in parallel), and "let's carry this version forward,
 * but run another exploration to see what some of your ideas of polish look
 * like". So one decision: which polish the cards take.
 *
 * ★ ONE DECISION, THREE TAKES, EACH ONE DESIGNER'S BEST IDEA (never a
 * caricature drawn to stand apart; overlap is welcome): `keys`, `seam` and
 * `points`, each whole in its own file on one row and fold (`card-kit.tsx`).
 * Each answers every axis the brief named: what a card holds and how its
 * count reads, light and depth at rest and when something waits, the fold
 * into pills and back, a phone's reach, a tablet, reduced motion. A fourth,
 * glass, was drawn and cut at the fresh-eyes pass: over the cover's scrim its
 * frost cannot show, so in the room it landed on the keys' answer, and on
 * paper it read as a dark slab (two takes on one answer are a finding).
 *
 * ★ IN AFTERGLOW'S LANGUAGE (Will's desk-4 pick, relayed mid-round): a
 * waiting count is the standby point and its word, half lit in the ground's
 * ink with no hue and no glow; colour is only the screen's one light, sampled
 * from its photographs, never a painted badge; and paper must hold as well as
 * the room ("very tough to nail on anything light"), so every take is drawn
 * on both grounds side by side.
 *
 * ★ THE CALLS G1, G2 AND G4 ARE DRAWN IN EVERY TAKE, AS CARRIED: See it as a
 * guest opens an inert phone over the dimmed hub; Review and Guests open in
 * Settings' own panel, a room's link opens another room in it, the reel full
 * screen; Settings' count is plain, never a status, and paused uploads read
 * Paused. The press and the focus are identity's (shrink and the halo).
 *
 * ★ EVERY FRAME IS PRODUCTION'S HUB, NOT A PICTURE OF IT: the app's bar, the
 * album's own head, the code, the checklist, the album's section header, the
 * rooms' panel and every room are production's components; the cards are
 * drawn beside them in identity's wired atoms.
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

/** Tonight two doors wait on her; the week before Settings has steps left; the week after, uploads paused. */
const MOMENT: Control = {
  id: "moment",
  label: "The moment",
  options: [
    { id: "tonight", label: "Tonight, the party on" },
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

export const EVENT_HEADER = defineExploration({
  id: "event-header",
  title: "The event headers",
  surface: "host",
  desk: 20,
  lives: [
    "docs/systems/host-app.md",
    "src/app/(app)/dashboard/[eventId]/page.tsx",
    "src/components/app/event-feed/event-hub-head.tsx",
    "src/components/app/event-feed/event-cards-row.tsx",
    "src/components/app/event-feed/room-card.ts",
    "src/components/app/event-feed/reel-card.tsx",
  ],
  round: {
    n: 5,
    date: "2026-10-05",
    changed:
      "Round five: three polished takes on the cards you picked, each one designer's best idea in Afterglow's language: the house's keys, the cover's own light between the doors, and each count on its glyph. Both grounds side by side, and a tablet.",
  },
  history: [
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
    "Round five, on the hub as built: the cover, its strip, the code, the album and every room are production's; only the cards are redrawn, in Afterglow's grammar. Each take is drawn in the room and on paper side by side, both live; every caption is read off its frame.",
  opening: {
    about:
      "Round five of the hub's doors: the cards over the seam you picked, polished three ways in Afterglow's language, each a whole take you could ship.",
    settled: [
      "The doors are the cards over the seam, your round-four pick, being wired now: every take here is a polish of them.",
      "Afterglow is the brand (desk 4): a waiting count is its standby point and word, with no hue; colour is only the screen's one light.",
      "The press and the focus are identity's: a card shrinks under the finger and wears the halo on a key.",
      "Every room opens over the hub (wired): Review and Guests in Settings' panel, the reel full screen, As a guest an inert phone.",
      "The code's corner keeps today's amber count until the brand's polish round reaches it.",
    ],
    earlier: [
      "Desk 4, on Afterglow: 'very tough to nail on anything light. It's washed out easily.' Every take stands on paper beside the room.",
      "And: 'polished, not like a junior designer was told to build a rainbow app.'",
      "Round four, on the cards: 'more pronounced than the glass capsule, without shouting like the quiet windows'.",
      "'Let's carry this version forward, but run another exploration to see what some of your ideas of polish look like.'",
      "Round three, for glass: 'stacking the counts on the icons as badges'.",
      "Round two: 'a very apple tv UI-esque way… gradient overlay fades, cards covering seams'.",
    ],
  },
  terms: [
    {
      term: "hub",
      means:
        "Maya's own page for her event: the cover, the cards into her rooms, the checklist and the album.",
    },
    {
      term: "seam",
      means:
        "Where the cover's photograph meets the page under it; in Afterglow, also the light born there.",
    },
    {
      term: "band",
      means:
        "What the cards fold into once she scrolls past the cover: a line of pills held under the app's bar.",
    },
    {
      term: "standby point",
      means:
        "Afterglow's waiting state: a small hard-edged point, half lit in the ground's ink, beside its word. No hue.",
    },
    {
      term: "one light",
      means:
        "Afterglow's rule: a screen has at most one light, a Ring, a Seam or a Bloom, sampled from its photographs.",
    },
    {
      term: "key",
      means:
        "The house's button since identity: a face lit from above, machined at its edges, standing a pixel proud.",
    },
    {
      term: "badge",
      means:
        "A count on a glyph's corner, the way an app's icon carries its unread number: here in ink, never a hue.",
    },
    {
      term: "tile",
      means:
        "A card at a tablet's width: its glyph over its words, since five across are too narrow for both side by side.",
    },
  ],
  carried: [
    {
      id: "band-ends",
      question: "Where does everything stand in the band once the cards fold?",
      taken:
        "The cover's face at its left end, the code (a pill like the doors) at its right end where the cover's code stood, the doors in its middle.",
      overrule:
        "Round four's band: the doors packed after the face, the white code chip following the last door.",
    },
    {
      id: "band-ground",
      question: "What does the band stand on once the cards fold?",
      taken:
        "The app bar's own material, its ground over a blur and a hairline, tight to the pills: the bar's second row.",
      overrule:
        "Round four's veil: the page's ground fading into the album under the pills.",
    },
    {
      id: "reel-ink",
      question: "Does the reel's glyph keep its violet?",
      taken:
        "No: every glyph is ink, the reel's too, since Afterglow paints no hue on a control.",
      overrule: "The reel keeps production's violet, on its glyph alone.",
    },
    {
      id: "standby-still",
      question: "Does the standby point breathe on the hub's cards?",
      taken:
        "It holds still: a host keeps her hub open all night, and two points beating for hours would pull her eye off the album.",
      overrule: "It breathes, as Afterglow's standby does, every 2.4 seconds.",
    },
    {
      id: "tablet-tiles",
      question: "How do five cards stand at a tablet's width (640 to 1088)?",
      taken:
        "As tiles, five across: each glyph over its words and its count in the corner, the long names where a tile has 130px.",
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
        "Paused, the uploads' own word, plain and never a status, in place of the door's word; the code's corner keeps its pause.",
      overrule:
        "The door's word stays (Private · You let in) and only the code's corner says paused.",
    },
  ],
  asks: [
    {
      id: "cards",
      label: "The cards' polish",
      question: "Which polish should the cards over the seam take?",
      where: ["Host", "Her event's hub", "The cards"],
      when: "Tonight 8 uploads wait in Review and 2 people at her door; the week before Settings has steps left; the week after, uploads paused.",
      matters:
        "She presses them all night, so they must read at a glance, feel like the product, and stay one press away.",
      lands:
        "The hub's cards at rest and folded into the band, at a desk, a tablet and in a hand, in the room and on paper.",
      context:
        "Each take in the room and on paper, both live: scroll and the cards fold into the band, press one and its room opens. Screen adds a tablet, where a card is a tile; Moment the week before and after; Scroll starts in the album.",
      options: [
        {
          id: "keys",
          label: "Keys: the house's own keys",
          means:
            "Each card a key, as every button now is: lit from above, its glyph sunk in a well, a waiting door its point, word and number; an open room's key stays down.",
          gains:
            "Of a piece with every button in the product, and achromatic, so paper holds as well as the room.",
          costs:
            "No light of the brand's on the doors: the most product of the three, the least Afterglow.",
        },
        {
          id: "seam",
          label: "Seam: the cover's own light between the doors",
          means:
            "Afterglow's Seam as the hub's one light: the photograph ends on an edge lit in its own colour, and the cards stand across it, the light showing between them.",
          gains:
            "The brand made real on her busiest screen: the event's own light, crisp on paper too.",
          costs:
            "The light belongs to the cover: stuck, the band is plain, and it needs a sampler built.",
        },
        {
          id: "points",
          label: "Points: each count rides its glyph",
          means:
            "The count a badge in ink on the glyph's shoulder, the state its line, '◐ WAITING'. On a phone one row of five, then a tab bar at the foot.",
          gains:
            "The calmest cards, the album highest on a phone, and stuck doors under her thumb.",
          costs:
            "A badge is smaller than a card's number; the phone's tab bar covers the album's foot.",
        },
      ],
      recommended: "seam",
      because:
        "Afterglow's own light on her most-pressed doors, crisp on paper too; borrow Points' phone, one row and the tab bar under her thumb.",
      overrule:
        "If the doors should be the product's hardware, keys; if the count belongs on the glyph, points.",
      configs: [SCREEN, MOMENT, SCROLL],
    },
  ],
});
