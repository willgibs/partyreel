import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE ROUNDING BOARD, AS DATA (round seven, the stepped review, 2026-09-16).
 *
 * ★ THE BOARD IS ONE PICK AND FOUR FOLLOW-UPS, AND IT SAYS SO IN ITS SHAPE.
 * Round six returned six finished families; nothing about them moved this
 * round. What moved is the ASKING. Six variants of one thing are decided by one
 * pick, so `catalog.mode` is `pick-one`, the `family` ask records the winner
 * (its options are the six cards plus "None of these", which clears the board
 * and is the right preview of none), and one real page underneath wears
 * whatever card is being pressed. The four questions a family does not settle
 * became steps of their own, each on ONE specimen with every answer drawn: the
 * buttons, the seven corner steps, the two nobody uses, and the album's gap.
 * The `calls` section that stacked all four, its tables of arithmetic and its
 * four-paragraph argument left with the reshape. No number moved.
 *
 * ★ THE SIX ARE WRITTEN OUT HERE, NEVER MAPPED, AND THAT IS NOT LAZINESS ABOUT
 * DRY. `pnpm lab:review` reads a spec as TEXT rather than importing it (so a
 * board's asks and cards can be validated with no build step), and it resolves
 * `candidates: ITEMS` exactly ONE HOP to a const array in this file: a `.map`
 * over `candidates.ts` would read as a catalog with no cards at all and every
 * ruling on one would be refused. The numbers live in `candidates.ts`, the
 * WORDS live here, and `families.test.ts` pins the two lists equal id for id.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 */
const ITEMS: readonly Candidate<
  "catalog" | "pages" | "buttons" | "steps" | "rungs" | "album" | "compare"
>[] = [
  {
    id: "a",
    name: "A, today",
    one: "The site exactly as it ships: a 2px card, an 8px menu, a 3px photograph.",
    verdict: "kill",
    facts: [
      ["Surfaces", "2px"],
      ["Menus", "8px"],
      ["Photographs", "3px, 3px gap"],
      ["Buttons", "16px, 8x the surface"],
    ],
    lands: "Nothing: every corner token in theme.css stays where it ships.",
    rationale:
      "The one to come back to: a ruling of A is a ruling to change no line.",
  },
  {
    id: "b",
    name: "B, square",
    one: "Bible 8 taken at its word: cards and photographs square, menus alone stay round.",
    verdict: "refine",
    facts: [
      ["Surfaces", "0px"],
      ["Menus", "6px"],
      ["Photographs", "0px, 3px gap"],
      ["Buttons", "16px, against a square card"],
    ],
    lands:
      "A square card and a square photograph; the floating layer alone stays round, at 6.",
    rationale:
      "The honest version of the claim A only asserts. Deliberate on a dark chapter, unfinished on paper, which is the half that needs work.",
  },
  {
    id: "c",
    name: "C, soft",
    one: "Surfaces come up to meet the buttons: a corner you can see, with the button still the roundest thing on screen.",
    verdict: "ship",
    recommended: true,
    facts: [
      ["Surfaces", "8px"],
      ["Menus", "12px"],
      ["Photographs", "4px, 4px gap"],
      ["Buttons", "16px, 2x the surface"],
    ],
    lands:
      "An 8px card, a 12px menu, a 4px photograph and the 4px gap it pins.",
    rationale:
      "The contrast narrows from eight to one down to two and survives, the photograph keeps its edges, and a card finally has a corner.",
  },
  {
    id: "d",
    name: "D, one family",
    one: "One shape for everything: cards, menus and buttons all read alike, with size alone telling them apart.",
    verdict: "kill",
    facts: [
      ["Surfaces", "14px"],
      ["Menus", "14px"],
      ["Photographs", "6px, 6px gap"],
      ["Buttons", "16px, 1.1x the surface"],
    ],
    lands: "One 14px corner for the card and the menu, and a 6px photograph.",
    rationale:
      "The simplest to state and the one that gives up the most: at 14 the card out-rounds the button, which is bible 8 upside down.",
  },
  {
    id: "e",
    name: "E, print",
    one: "Soft chrome around square photographs: a print in a mat. The one family that moves the two apart.",
    verdict: "refine",
    facts: [
      ["Surfaces", "10px"],
      ["Menus", "14px"],
      ["Photographs", "0px, 3px gap"],
      ["Buttons", "16px, 1.6x the surface"],
    ],
    lands:
      "A 10px card and a 14px menu around a square photograph, which closes the album's gap by deletion.",
    rationale:
      "A corner crops the image, so the chrome softens and the photograph does not. It also closes the album's gap: a square tile cannot open a hole.",
  },
  {
    id: "f",
    name: "F, half a step",
    one: "The smallest change you can see: a 6px card, a 10px menu, the photograph left exactly where it is.",
    verdict: "refine",
    facts: [
      ["Surfaces", "6px"],
      ["Menus", "10px"],
      ["Photographs", "3px, 3px gap"],
      ["Buttons", "16px, 2.7x the surface"],
    ],
    lands:
      "A 6px card and a 10px menu; the photograph and its 3px gap do not move, so no sweep.",
    rationale:
      "The photograph does not move, so the fifty-two hand-written 3px corners keep agreeing and a ruling costs no sweep.",
  },
];

export const ROUNDING = defineBoard({
  id: "rounding",
  title: "The rounding",

  question:
    "How round should the corners be: cards and panels, the menus and dialogs over them, photographs in a grid, and the buttons?",

  round: {
    n: 7,
    date: "2026-09-16",
    changed:
      "Reshaped as a walk: one pick from six cards or none, then the buttons, the seven corner steps, the two nobody uses and the album's gap, each on one specimen with every answer drawn beside it. No number moved.",
  },
  history: [
    {
      n: 6,
      date: "2026-09-16",
      changed:
        "Rebuilt as a catalog: six whole families, each a card carrying one piece of the app at 1:1 beside a real 375 screen. Two are new, seven parts became five.",
    },
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "The five asks rewritten so a stranger can answer them where they meet them, and the board moved onto the kit's template.",
    },
  ],
  context:
    "Five rounds built a machine rather than a choice: three independent axes, five switches and a lettered part for each, so an answer had to be assembled by a reader rather than proposed by the board. Every measurement behind it stands. What changed is that somebody chose: six of the reachable states are finished families with names, and the rest is collapsed underneath them.",

  verdict: {
    recommendation:
      "C, soft: an 8px card, a 12px menu, a 4px photograph, with the button left where it ships.",
    because:
      "At 8px a card finally has a corner you can see, and a 16px button is still twice as round, so a control still reads as the pressable thing. What is broken is not the button: it is a 44px marketing button wearing a 40px one's corner, and a guest sheet taking its corner from a button.",
    overrule:
      "If a photograph may not be cropped by a corner, E, print is C with the photograph at zero and nothing else moved.",
  },

  /**
   * ★ THE WINNER COMES FIRST, because the other four questions are read at
   * whatever corner the card sets: the seven steps are multiples of it, and the
   * album's hole only opens above 3. The walk is this list's own order.
   */
  asks: [
    {
      id: "family",
      question: "Which family of corners should the whole site wear?",
      context:
        "Six finished sets, each naming every corner at once: the card, the menu over it, the photograph in a grid, and the gap between photographs. The strip on a card is that family at a phone's own pixels. Press a card to wear it on the real page below.",
      options: [
        {
          id: "c",
          label: "C, soft",
          means:
            "An 8px card, a 12px menu, a 4px photograph. The button stays where it ships and is still twice as round as the card.",
        },
        {
          id: "e",
          label: "E, print",
          means:
            "A 10px card and a 14px menu around a square photograph, like a print in a mat. The one family that moves the two apart.",
        },
        {
          id: "f",
          label: "F, half a step",
          means:
            "A 6px card and a 10px menu. The photograph does not move, so the fifty-two hand-written corners keep agreeing.",
        },
        {
          id: "b",
          label: "B, square",
          means:
            "Cards and photographs square, the menu alone left round at 6. Bible 8 taken at its word.",
        },
        {
          id: "d",
          label: "D, one family",
          means:
            "One 14px corner for cards and menus alike, with size alone telling them apart. The card out-rounds the button.",
        },
        {
          id: "a",
          label: "A, today",
          means:
            "The site exactly as it ships: a 2px card, an 8px menu, a 3px photograph. A ruling of A changes no line.",
        },
        {
          id: "none",
          label: "None of these",
          means:
            "New directions. Say in the note what the six are missing, and the next round starts from that instead of from a card.",
        },
      ],
      recommended: "c",
      evidence: "catalog",
      control: "family",
      lands:
        "Four tokens on :root in src/app/theme.css: the surface, the floating layer, the photograph, and the gap it pins.",
      strip: ["page", "canvas"],
    },
    {
      id: "actions",
      question: "How round should buttons be?",
      context:
        "A button takes its corner from its own height: 16px on a 40px one. It is the one shape meant to read as pressable, so it is ruled apart from the families. Two things wear the same token and should not: the 44px marketing button, and the sheet that greets every guest, drawn under the row.",
      options: [
        {
          id: "today",
          label: "Today, 0.4 of the height",
          means:
            "Buttons keep what they ship with: 16px on a 40px button, 12.8 on the small one the app uses everywhere.",
        },
        {
          id: "pill",
          label: "A full pill",
          means:
            "A half circle at every height, which is the one rung the odd 44px button cannot fall off. The guest door goes with it.",
        },
        {
          id: "quiet",
          label: "Quiet, 0.2 of the height",
          means:
            "Half of today: 8px on a 40px button, which is the same shape as a card under C and F.",
        },
      ],
      recommended: "today",
      because:
        "The roundness is not what is broken. What is broken is a 44px button wearing a 40px one's corner, and a sheet taking its corner from a button at all.",
      evidence: "buttons",
      control: "action",
      lands:
        "The three action tokens in theme.css, a cta size on Button, and the guest door moved onto the floating layer.",
    },
    {
      id: "ladder",
      question: "Which sizes should the seven corner steps climb in?",
      context:
        "Above the card's corner sits a ladder of seven sizes, from a tooltip's arrow up to a badge, each a multiple of it. The multipliers were picked when a card was 2px, where all seven land within 4px of each other. Once a card is 8px they spread, and a plan card is either 12 or 14.4.",
      options: [
        {
          id: "stock",
          label: "The steps as they are today",
          means:
            "0.6, 0.8, 1, 1.4, 1.8, 2.2 and 2.6 of the card's corner, which is what theme.css ships.",
        },
        {
          id: "quarters",
          label: "Even quarters, 0.5 up to 2",
          means:
            "0.5, 0.75, 1, 1.25, 1.5, 1.75, 2. A plan card lands at 12 rather than 14.4, and a badge stops at twice the card.",
        },
      ],
      recommended: "quarters",
      because:
        "At today's 2px card the two ladders are within half a pixel of each other, so nothing moves now. Once a card is round, a quarter is a step a person can hold in their head.",
      evidence: "steps",
      control: "ladder",
      lands:
        "The seven multipliers in theme.css's @theme inline block, one line a step. No token reaches them.",
    },
    {
      id: "dead-rungs",
      question: "Should the two largest corner steps be deleted?",
      context:
        "The top two steps have three uses in the product between them: one marketing panel on /features/sharing, and the Badge, which wants a full pill and borrows the largest step to fake one. A step nobody uses still has to be kept honest every time the card's corner moves.",
      options: [
        {
          id: "drop",
          label: "Drop the top two steps",
          means:
            "The panel takes the step below and the Badge asks for the pill it was faking. Five steps left to keep honest.",
        },
        {
          id: "keep",
          label: "Keep all seven steps",
          means:
            "Both top steps stay, the Badge goes on faking its pill, and every future ruling carries two rungs nobody stands on.",
        },
      ],
      recommended: "drop",
      because:
        "One of the two is used once and the other twice, and one of those two is the Badge faking a pill it could simply ask for.",
      evidence: "rungs",
      control: "dead-rungs",
      lands:
        "Two lines out of theme.css's @theme inline block, and rounded-full on Badge instead of the step it borrows.",
    },
    {
      id: "gap",
      question: "Should the gap between photographs follow their corner?",
      context:
        "The guest album lays photographs out in a tight grid. Each corner comes from a token this ruling moves; the gap between them is a fixed 3px written into three files. Above a corner of 3, the four corners meeting at a junction open a hole on the one page every guest sees: a pixel of one under C, three under D.",
      options: [
        {
          id: "pinned",
          label: "Pin the gap to the photograph",
          means:
            "The gap grows with the corner and the junctions stay flush. The three hard-coded gaps become the token: a sweep across three files.",
        },
        {
          id: "free",
          label: "Leave the 3px gap as it is",
          means:
            "The album tell stays at 3px exactly, so any corner above 3 opens a hole where four photographs meet.",
        },
      ],
      recommended: "pinned",
      because:
        "The hole is only possible because the two numbers live in different places. Tying the gap to the corner makes it impossible for a later ruling to open one again.",
      overrule:
        "Pinning it is a sweep across three files another track owns, so a yes here is also a yes to scheduling that.",
      evidence: "album",
      control: "gap",
      lands:
        "--gap-gallery read off --radius-tile, and the three gap-[3px] classes in the guest grid replaced by the token.",
    },
  ],

  /**
   * ★ ONE PICK DECIDES IT. The six are variants of one thing, so the review is
   * a gallery with a ring rather than six verdicts: the cards ARE the winner
   * ask's tiles, a verdict on a card that did not win is optional feedback, and
   * the real page under the tiles wears whatever is pressed.
   */
  candidates: ITEMS,

  catalog: {
    section: "catalog",
    control: "family",
    compare: ["compare-a", "compare-b"],
    mode: "pick-one",
    winner: "family",
    stage: "pages",
  },

  departures: [
    {
      id: "gallery-gap",
      from: 8,
      text: "guest-masonry.tsx, gallery-skeleton.tsx and ghost-grid.tsx write gap-[3px] while their tiles ride var(--radius-tile), so any corner above 3 opens holes on the grid every guest sees.",
      evidence: "album",
    },
    {
      id: "entry-sheet",
      from: 9,
      text: "entry-shell.tsx draws the first surface any guest meets at 1.4x the action radius, so the button rung decides the corner of a sheet. It should move to the floating layer's token.",
      evidence: "buttons",
    },
    {
      id: "two-boards",
      from: 15,
      text: "The float corner is ruled on two boards: this one sets --radius-float, the floating-surfaces proposal adds --radius-float-item and --radius-float-lg. They have to agree.",
      evidence: "catalog",
    },
    {
      id: "literal-corners",
      from: 8,
      text: "Sixty-four corners are literals rather than tokens, 52 of them photographs across 24 files. Under any family but A and F a photograph keeps today's corner while the card moves, so a ruling is also a sweep.",
      evidence: "pages",
    },
  ],

  assets: [
    {
      what: "A worst-case tile set for the gallery gap",
      spec: "Four photographs with near-white, bright edges (a tablecloth, an overexposed sky, a white dress), 1200px long edge, JPG, so a corner hole is judged at maximum contrast.",
      replaces:
        "the bright-edged nine (wedding-arch, reception-table, party-balloons and the rest) the album specimen stands in with.",
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The six families",
      lede: "One family a card, at a phone's own pixels: the photographs, the card, the menu over it, the buttons under it.",
      argument: [
        "WHY A FAMILY AND NOT THREE SWITCHES. Rounds one to five asked the surface, the button and the ladder as three independent questions and let a reader assemble an answer out of them, which is hundreds of reachable states and an answer in none. A family names every corner at once, so a card is a whole position somebody could argue for out loud rather than one coordinate of a machine.",
        "HOW SIX WERE CHOSEN. Four are the standing A to D, kept because they are still the corners of the space and because a review conversation has referred to them by letter for three rounds. E and F are new, written where the four had a real gap: E moves the photograph away from the surface, which nothing before it did, and F is the cheapest change that is visible at all. Two families that differ only in a number would be one card.",
        "WHY EVERY CARD IS A PHONE'S WIDTH. A corner is a fixed number of pixels and a phone is where the fewest of them are: a 6px corner on a 375 grid takes a visible slice out of a photograph that a 1440 window hides. The strip is drawn at 1:1 in this document with no breakpoint in it, so nothing on it is scaled and the real page below carries the same family at a full canvas.",
      ],
      eager: true,
    },
    {
      id: "pages",
      title: "One real page, wearing the pick",
      lede: "A route at true pixels, redrawn in place by the card you press. Nothing picked is the site as it ships.",
      wiring: [
        "The derived ladder cannot be retuned with a token: @theme inline substitutes each step into its utility at build time, so --radius-xl is empty at runtime and the board renders the retune as utility overrides. The ruling lands on the multipliers in theme.css, one line a step, which is the Orchestrator's file.",
        "--radius-action-lg has exactly one call site, on an h-11. Every marketing CTA is size lg forced to h-11 in 26 files, so the loudest action on the site sits at 0.33 of its height while globals.css documents 0.4. The proposal is a cta size on the Button at 1.1x the action radius, and the -lg token retires with it.",
      ],
    },
    {
      id: "buttons",
      title: "The buttons, and the door that borrows them",
      lede: "Every height a button ships at, over the guest sheet whose corner is 1.4 times the same token.",
    },
    {
      id: "steps",
      title: "The seven corner steps",
      lede: "Each step on the component it lands on, at whatever the picked card's corner makes it.",
    },
    {
      id: "rungs",
      title: "The two steps nobody uses",
      lede: "One marketing panel and the Badge: three call sites between them, and one of those is a pill being faked.",
    },
    {
      id: "album",
      title: "The album's grid, and its gap",
      lede: "Nine photographs at a guest's width, bright edged, with a junction of four corners inside the specimen.",
    },
    {
      id: "compare",
      title: "Any two, on the same real page",
      lede: "One page loaded twice at true pixels and scrolled together, under whichever two cards A and B are set to.",
      argument: [
        "A composition is honest about a component and dishonest about a page, because what a corner has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, the plan card in the band, the tile in the grid. A same-origin frame is the only 1:1 surface the lab has, and the family is written into that document as the same paste a ruling would land.",
      ],
    },
  ],

  controls: [
    /**
     * ★ THE PICK IS CLEARABLE AND OPENS ON NOTHING (Will, 2026-09-16: "I can't
     * unpick a selection to return to a non-selected state"). Nothing picked
     * means the page below shows the site exactly as it ships, and the winner
     * ask offers that same cleared state as "None of these".
     */
    {
      id: "family",
      label: "The winner",
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "a", label: "A, today" },
        { id: "b", label: "B, square" },
        { id: "c", label: "C, soft" },
        { id: "d", label: "D, one family" },
        { id: "e", label: "E, print" },
        { id: "f", label: "F, half a step" },
      ],
      default: "none",
      clearable: true,
    },
    // A and B: the two the compare joins, set from the catalog's cards. They
    // open on today against the board's own pick, which is the comparison a
    // reader wants before he has picked anything.
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "a", label: "A, today" },
        { id: "b", label: "B, square" },
        { id: "c", label: "C, soft" },
        { id: "d", label: "D, one family" },
        { id: "e", label: "E, print" },
        { id: "f", label: "F, half a step" },
      ],
      default: "a",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "a", label: "A, today" },
        { id: "b", label: "B, square" },
        { id: "c", label: "C, soft" },
        { id: "d", label: "D, one family" },
        { id: "e", label: "E, print" },
        { id: "f", label: "F, half a step" },
      ],
      default: "c",
    },
    // Which route the stage loads. One page at a time is what keeps a 1440
    // canvas from becoming a row of them.
    //
    // ★ IT OPENS ON THE APP, NOT ON THE HOME PAGE (2026-09-17). The home page's
    // first screen is a hero: one plate, a strip of photographs and two
    // buttons, so a family pressed above it changed almost nothing a reviewer
    // could see, which reads as "the cards do nothing". The host's event screen
    // holds all four groups in its first screen (a photograph grid on the gap,
    // surfaces, a menu's trigger, buttons), so a press shows at once.
    {
      id: "page",
      label: "Page",
      options: [
        { id: "home", label: "Home" },
        { id: "pricing", label: "Pricing" },
        { id: "album", label: "Album" },
        { id: "guest", label: "Guest" },
        { id: "app", label: "App" },
      ],
      default: "app",
    },
    {
      id: "canvas",
      label: "Width",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    /**
     * ★ FOUR CONTROLS THAT SERVE ONE QUESTION EACH: declared, so their ask can
     * draw every answer as a tile, and kept OFF every strip, because a question
     * asked twice on one screen is the thing this round is deleting. Each one
     * defaults to what the site ships, which is the state its question is
     * asked in.
     */
    {
      id: "action",
      label: "Buttons",
      options: [
        { id: "today", label: "Today, 0.4 of the height" },
        { id: "pill", label: "A full pill" },
        { id: "quiet", label: "Quiet, 0.2 of the height" },
      ],
      default: "today",
    },
    {
      id: "ladder",
      label: "Corner steps",
      options: [
        { id: "stock", label: "The steps as they are today" },
        { id: "quarters", label: "Even quarters, 0.5 up to 2" },
      ],
      default: "stock",
    },
    {
      id: "dead-rungs",
      label: "The top two steps",
      options: [
        { id: "keep", label: "Keep all seven" },
        { id: "drop", label: "Drop the top two" },
      ],
      default: "keep",
    },
    {
      id: "gap",
      label: "The album's gap",
      options: [
        { id: "free", label: "A fixed 3px, as it ships" },
        { id: "pinned", label: "Follows the photograph" },
      ],
      default: "free",
    },
  ],

  lookFirst: [
    {
      section: "catalog",
      note: "Read the six. The strip on each card is the whole family at a phone's own pixels, so nothing has to be switched to compare them.",
    },
    {
      section: "catalog",
      state: { family: "c" },
      note: "The board's own pick, marked with a dot. C and F are the same idea half a step apart, so read those two against each other first.",
    },
    {
      section: "album",
      state: { family: "d", gap: "free" },
      note: "Where the bug lives: D's 6px photograph inside the 3px gap the guest album hard-codes, with a hole at every junction.",
    },
  ],

  links: {
    bible: [8, 9, 15],
    spec: "docs/specs/rounding.md",
    pages: [
      { label: "Home", path: "/", note: "every rounding group meets here" },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the plan cards, the loudest derived step",
      },
      {
        label: "Album",
        path: "/features/album",
        note: "the photograph's own page",
      },
    ],
  },
});
