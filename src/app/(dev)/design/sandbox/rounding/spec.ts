import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE ROUNDING BOARD, AS DATA (round six, the catalog rebuild, 2026-09-16).
 *
 * ★ THE ROUND IS A SUBTRACTION, AND WILL'S TWO NOTES ARE THE WHOLE BRIEF. "Each
 * exploration page feels like a small research paper into its track... a few of
 * our best concepts created for review, pick the best direction and refine for
 * production polish", and "designing a few variations always beats a mountain
 * of research text" (2026-09-16). Round five was 4,859 words outside its folds,
 * seven lettered parts, five switches and an answer assembled out of three
 * independent axes. This round names SIX WHOLE FAMILIES, rules on them card by
 * card, and puts the argument underneath.
 *
 * ★ THE SIX ARE WRITTEN OUT HERE, NEVER MAPPED, AND THAT IS NOT LAZINESS ABOUT
 * DRY. The review scanner reads a spec as TEXT rather than importing it (so a
 * board's asks and items can be read with no build step), and it resolves
 * `candidates: ITEMS` exactly ONE HOP to a const array in this file. A `.map`
 * over `candidates.ts` reads as no items at all, so every ruling on a card
 * would be refused (the palette board learned it twice). The numbers live in
 * `candidates.ts`, the WORDS live here, and `families.test.ts` pins the two
 * lists equal id for id, name for name and fact for fact, so they cannot drift.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 * `candidates.ts` is plain TypeScript for exactly the same reason.
 *
 * The verdict is the BOARD's own call, drawn as the card's pill, and it is not
 * the reviewer's: Will answers each card keep, refine or kill in the row under
 * it. One ship, three refine, two kill, which is a board with an opinion.
 */
const ITEMS: readonly Candidate<
  "catalog" | "compare" | "pages" | "calls" | "paste"
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
    n: 6,
    date: "2026-09-16",
    changed:
      "Rebuilt as a catalog: six whole families, each a card carrying one piece of the app at 1:1 beside a real 375 screen. Two are new, seven parts became five, and the argument went under the evidence.",
  },
  history: [
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "The five asks rewritten so a stranger can answer them where they meet them, and the board moved onto the kit's template.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Stopped arranging and loaded the pages: same-origin frames at exactly 1440x930 or 375x760, with the candidate written into the document.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed: "The action ladder as it ships, and the nested-corner rule.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "The six tokens at true size and the derived ladder's arithmetic.",
    },
  ],
  context:
    "Five rounds built a machine rather than a choice: three independent axes, five switches and a lettered part for each, so an answer had to be assembled by a reader rather than proposed by the board. The measurements behind it all stand and none of them was thrown away. What changed is that somebody chose: six of the reachable states are finished families with names, two of them written for this round, and the rest is collapsed underneath them.",

  verdict: {
    recommendation:
      "C, soft: an 8px card, a 12px menu, a 4px photograph, with the button left where it ships. The seven steps climb in even quarters, the top two go, and the gap follows the photograph.",
    because:
      "At 8px a card finally has a corner you can see, and a 16px button is still twice as round, so a control still reads as the pressable thing. What is broken is not the button: it is a 44px marketing button wearing a 40px one's corner, and a guest sheet taking its corner from a button.",
    overrule:
      "If a photograph may not be cropped by a corner, E, print is C with the photograph at zero and nothing else moved, and it closes the album's gap by deletion.",
  },

  asks: [
    {
      id: "actions",
      question: "How round should buttons be?",
      context:
        "A button takes its corner from its own height: 16px on a 40px button, which is 0.4 of it. It is the one shape meant to read as pressable, so it is ruled apart from the families. Two things wear this corner and should not: the 44px marketing button, and the sheet that greets every guest.",
      look: "The calls, first block: the three rungs on the real Button at every height it ships at, with the guest sheet below them.",
      options: [
        {
          id: "today",
          label: "Today, 0.4 of the height",
          means:
            "Buttons keep what they ship with: 16px on a 40px button, 12.8 on the small one the app uses.",
        },
        {
          id: "pill",
          label: "A full pill",
          means:
            "A half circle at every height, which is the one rung the odd 44px button cannot fall off.",
        },
        {
          id: "quiet",
          label: "Quiet, 0.2 of the height",
          means:
            "Half of today: 8px on a 40px button, and the same shape as a card under C and F.",
        },
      ],
      recommended: "today",
      because:
        "The roundness is not what is broken. What is broken is a 44px button wearing a 40px one's corner, and a sheet taking its corner from a button at all.",
      evidence: "calls",
      control: "action",
    },
    {
      id: "ladder",
      question: "Which sizes should the seven corner steps climb in?",
      context:
        "Above the card's corner sits a ladder of seven sizes, from a tooltip's arrow up to a badge, each a multiple of it. The multipliers were picked when a card was 2px, where all seven land within 4px of each other. Once a card is 8px they spread, and a plan card is either 12 or 14.4.",
      look: "The calls, second block: the seven steps drawn twice, today's beside even quarters, with the arithmetic on each row.",
      options: [
        {
          id: "stock",
          label: "The steps as they are today",
          means: "0.6, 0.8, 1, 1.4, 1.8, 2.2 and 2.6 of the card's corner.",
        },
        {
          id: "quarters",
          label: "Even quarters, 0.5 up to 2",
          means:
            "0.5, 0.75, 1, 1.25, 1.5, 1.75, 2. A plan card lands at 12 rather than 14.4.",
        },
      ],
      recommended: "quarters",
      because:
        "At today's 2px card the two ladders are within half a pixel of each other, so nothing moves now. Once a card is round it is a plan card at 12 against one at 14.4, and a quarter is a step a person can hold in their head.",
      evidence: "calls",
      control: "ladder",
    },
    {
      id: "dead-rungs",
      question: "Should the two largest corner steps be deleted?",
      context:
        "The top two steps have three uses in the product between them: one marketing panel, and the Badge, which wants a full pill and borrows the largest step to fake one. A step nobody uses still has to be kept honest every time the card's corner moves.",
      look: "The same block's last two rows, against the 49 to 105 uses on the rows above.",
      options: [
        {
          id: "keep",
          label: "Keep all seven steps",
          means: "Both top steps stay, and every future ruling carries them.",
        },
        {
          id: "drop",
          label: "Drop the top two steps",
          means:
            "The two largest go: the panel takes the step below, and the Badge asks for the pill it wanted.",
        },
      ],
      recommended: "drop",
      because:
        "One of the two is used once and the other twice, and one of those two is the Badge faking a pill.",
      evidence: "calls",
    },
    {
      id: "gap",
      question: "Should the gap between photographs follow their corner?",
      context:
        "The guest album lays photographs out in a tight grid. Each photograph's corner comes from a token this ruling moves; the gap between them is a fixed 3px written into three files. Above a corner of 3, the four corners meeting at a junction open a hole, on the one page every guest sees.",
      look: "The calls, last block: nine photographs twice, the gap following the corner beside the fixed 3px. Read it on D, where the hole is widest.",
      options: [
        {
          id: "pinned",
          label: "Pin the gap to the photograph's corner",
          means:
            "The gap grows with the corner, and the three hard-coded gaps become the token. A sweep across three files.",
        },
        {
          id: "free",
          label: "Leave the 3px gap as it is",
          means: "The gap stays at 3px, so any corner above 3 opens holes.",
        },
      ],
      recommended: "pinned",
      because:
        "The hole is only possible because the two numbers live in different places. Tying the gap to the corner makes it impossible for a later ruling to open one again.",
      overrule:
        "Pinning it is a sweep across three files another track owns, so a yes here is also a yes to scheduling that.",
      evidence: "calls",
    },
  ],

  /**
   * ★ THE BUDGET IS DECLARED, AND THE NUMBER IS THE WORK RATHER THAN AN EXCUSE.
   * Round five weighed 4,859 words outside its folds; this one weighs about
   * 2,700 with six families instead of four and more real UI than it had. Of
   * those, roughly 1,100 are the template's own and no board can fold them: the
   * answer, the index restating five ledes, the meta panel's six ideas and four
   * rules-broken, and the review panel's instructions. The rest is the four
   * asks, which cost about 140 words each BECAUSE Will ruled that a question
   * has to carry its own context (2026-09-16), and the arithmetic the three
   * calls are ruled on. Every paragraph that can be folded is folded, and the
   * card previews and the pastes are specimens the smoke does not count.
   */
  reading: {
    words: 2800,
    why: "Four asks, each carrying its own context as Will's clarity ruling requires, plus the template's own thousand words. The argument is folded; what is left is questions, labels and arithmetic.",
  },

  /**
   * ★ NAMING THE WINNER IS THE CATALOG'S JOB, NOT AN ASK'S. The palette board
   * kept a "which one" ask beside its catalog because twelve rulings and one
   * choice are different answers; here they are the same answer, because Pick
   * IS the choice and the pages below wear it. Four asks survive, and every one
   * of them is true whichever family wins.
   */
  candidates: ITEMS,

  catalog: {
    section: "catalog",
    control: "family",
    compare: ["compare-a", "compare-b"],
  },

  departures: [
    {
      id: "gallery-gap",
      from: 8,
      text: "guest-masonry.tsx, gallery-skeleton.tsx and ghost-grid.tsx write gap-[3px] while their tiles ride var(--radius-tile), so any corner above 3 opens holes on the grid every guest sees.",
      evidence: "calls",
    },
    {
      id: "entry-sheet",
      from: 9,
      text: "entry-shell.tsx draws the first surface any guest meets at 1.4x the action radius, so the button rung decides the corner of a sheet. It should move to the floating layer's token.",
      evidence: "calls",
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
        "the wedding-golden, party-dj and festival-lights set in the app grid.",
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The six families",
      lede: "Each card is one piece of the app at a phone's width, at 1:1: the photographs, the card, the menu over it, the buttons.",
      argument: [
        "WHY A FAMILY AND NOT THREE SWITCHES. Rounds one to five asked the surface, the button and the ladder as three independent questions and let a reader assemble an answer out of them, which is hundreds of reachable states and an answer in none. A family names every corner at once, so a card is a whole position somebody could argue for out loud rather than one coordinate of a machine.",
        "HOW SIX WERE CHOSEN. Four are the standing A to D, kept because they are still the corners of the space and because a review conversation has referred to them by letter for three rounds. E and F are new, written where the four had a real gap: E moves the photograph away from the surface, which nothing before it did, and F is the cheapest change that is visible at all. Two families that differ only in a number would be one card.",
        "WHY EVERY CARD SHOWS A PHONE. A corner is a fixed number of pixels and a phone is where the fewest of them are: a 6px corner on a 375 grid takes a visible slice out of a photograph that a 1440 window hides. The strip above the frame is drawn at 1:1 in this document with no breakpoint in it, and the frame under it is a real 375 viewport, so neither is scaled.",
        "WHAT THE FOURTH FACT IS FOR. Bible 8's real claim is a ratio: a button is the pressable thing, so it has to out-round the surface under it. Five of the six families leave the button where it ships, so the ratio is what separates them. Under D it inverts, and the card out-rounds the button.",
      ],
    },
    {
      id: "compare",
      title: "Any two, on the same real page",
      lede: "One real page, loaded twice at true pixels and scrolled together, under whichever two cards you pressed A and B on.",
      argument: [
        "A composition is honest about a component and dishonest about a page, because what a corner has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, the plan card in the band, the tile in the grid. A same-origin frame is the only 1:1 surface the lab has, and the family is written into that document as the same paste a ruling would land.",
      ],
    },
    {
      id: "pages",
      title: "The real pages, wearing the pick",
      lede: "Home, the guest album and the host's own screen in whatever the catalog is picking. Nothing picked is the site as it ships.",
    },
    {
      id: "calls",
      title: "The four calls a family does not settle",
      lede: "The button rung at every height, the seven corner steps with their use counts, and the album's gap.",
      wiring: [
        "The derived ladder cannot be retuned with a token: @theme inline substitutes each step into its utility at build time, so --radius-xl is empty at runtime and the board renders the retune as utility overrides. The ruling lands on the multipliers in theme.css, one line a step, which is the Orchestrator's file.",
        "--radius-action-lg has exactly one call site, on an h-11. Every marketing CTA is size lg forced to h-11 in 26 files, so the loudest action on the site sits at 0.33 of its height while globals.css documents 0.4. The proposal is a cta size on the Button at 1.1x the action radius, and the -lg token retires with it.",
      ],
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The picked family as the block that lands on :root, generated from whatever the dock is claiming.",
    },
  ],

  controls: [
    /**
     * ★ THE PICK IS CLEARABLE AND OPENS ON NOTHING (Will, 2026-09-16: "I can't
     * unpick a selection to return to a non-selected state"). Nothing picked
     * means the pages below show the site exactly as it ships.
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
      default: "home",
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
  ],

  lookFirst: [
    {
      section: "catalog",
      note: "Read the six. The strip and the phone under each are the whole family, so nothing has to be switched to compare them.",
    },
    {
      section: "catalog",
      state: { family: "c" },
      note: "The board's own pick, marked with a dot. C and F are the same idea half a step apart, so read those two against each other first.",
    },
    {
      section: "compare",
      state: { "compare-a": "a", "compare-b": "e" },
      note: "Today against E, print on the home page, scrolled together. E is the one family that leaves a photograph its edges while the chrome softens.",
    },
    {
      section: "calls",
      state: { action: "pill" },
      note: "A full pill under the guest entry sheet: a half circle on a sheet, which is why the sheet's corner is a departure.",
    },
    {
      section: "pages",
      state: { family: "c", canvas: "phone" },
      note: "The real pages on C at a guest's width. If the photograph's corner is wrong it is wrong here first.",
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
