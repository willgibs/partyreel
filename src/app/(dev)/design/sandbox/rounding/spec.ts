import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE ROUNDING BOARD, AS DATA (the kit round, 2026-09-15; the asks rewritten
 * in plain words the same night, the clarity round).
 *
 * The round-four board's own asks, candidates, departures and asset, moved out
 * of `board.tsx`. Its answer block already read like this one (five one-word
 * rulings and a button), which is exactly why it was the second pilot: it is
 * the board the template's Answer was generalised FROM, so the migration proves
 * the template can carry a board that had already solved the same problem by
 * hand.
 *
 * ★ THE ASKS ARE THE ONE COPY OF THE ANSWER. `candidates.ts` used to carry a
 * hand-written `ANSWER.lines` saying the same five things in the board's own
 * shorthand; the template renders these, nothing read that, and two copies of
 * one answer is the drift the spec exists to end. It was deleted here.
 *
 * ★ AND EVERY ASK CARRIES ITS OWN CONTEXT (Will, 2026-09-15: "when you use very
 * technical terms or nicknames from spots in these reports, it makes me have to
 * go deep into the track to gain the relevant context"). So no ask is a label
 * over four tokens any more: each says what the thing is, where it lives on the
 * site, where to look, and what choosing each option would do. The option IDS
 * never changed, because the ledger joins on them; what changed is that the
 * surface candidates are now called `a | b | c | d` in the dock, the state and
 * `candidates.ts` too, so the word on the pill is the word on the column.
 *
 * Its seven parts keep their letters as titles, because a review conversation
 * about this board has been referring to "part B" for three rounds and an id
 * that says what it points at is a better link than a letter: the ids are the
 * words, the titles keep the letters.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React or the board's sheet would drag a client tree into a server render.
 */
export const ROUNDING = defineBoard({
  id: "rounding",
  title: "The rounding",

  question:
    "How round should the corners be across the site: cards and panels, the menus and dialogs that float over them, photographs in a grid, and the buttons?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The five asks rewritten so a stranger can answer them where they meet them: what the thing is, where to look, and options named in words instead of letters, with the same names on the evidence. No number, candidate or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Stopped arranging and loaded the pages: same-origin frames at exactly 1440x930 or 375x760, the candidate written into the document, and every page-wide switch moved into the dock.",
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
    "Rounds one to three judged the radius on COMPOSITIONS: real components, arranged by this board, standing in for pages. A composition is honest about a component and dishonest about a page, because what a radius has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, the plan card in the band, the tile in the grid. And a composition inside a Stage is dishonest twice over, because a Stage is a div.",

  verdict: {
    recommendation:
      "C, soft: cards at 8, floating menus at 12, photographs at 4. Buttons keep today's roundness, the seven steps climb in even quarters, the top two steps go, and the gap between photographs follows the tile.",
    because:
      "At 8px a card has a corner you can see, and a button at 16 is still eight pixels rounder, so a control still reads as more pressable than the surface under it. Buttons are not what is broken: what is broken is a 44px marketing button wearing the corner of a 40px one, and the sheet every guest meets taking its corner from a button.",
    overrule:
      "If photographs may not move, the gap fix goes with them and the board's best finding with it. A, today is the ruling that changes nothing.",
  },

  asks: [
    {
      id: "surfaces",
      question: "Which corner should cards, menus and photographs have?",
      context:
        "Three numbers move together here: the corner of a card or panel, the corner of anything floating over the page (a menu, a dialog, a toast), and the corner of a photograph in a grid. Almost every surface on the site reads one of the three, so this is the shape of the whole product. Buttons are asked separately, below.",
      look: "Part C, the four columns labelled A, today through D, one family, at true size. Then flip Surfaces in the dock and read part A (the home page) and part G (the same screen on four phones).",
      options: [
        {
          id: "a",
          label: "A, today: 2 / 8 / 3",
          means:
            "Nothing moves. Cards keep a 2px corner, menus 8, photographs 3, and the 64 hand-written corners on the site need no sweep.",
        },
        {
          id: "b",
          label: "B, square: 0 / 6 / 0",
          means:
            "Cards and photographs go square, menus keep a 6px corner, and every round shape left on the page is a button.",
        },
        {
          id: "c",
          label: "C, soft: 8 / 12 / 4",
          means:
            "Cards come up to 8px, menus to 12, photographs to 4: a corner you can see, with buttons still the roundest thing on the page.",
        },
        {
          id: "d",
          label: "D, one family: 14 / 14 / 6",
          means:
            "One shape for everything: cards and menus at 14, photographs at 6, with size alone telling a card from a button.",
        },
      ],
      recommended: "c",
      because:
        "At 8px a card finally has a corner you can see, and a button at 16 is still eight pixels rounder, so a control still reads as the pressable thing. A, today is a claim nobody can see at 2px, and D gives that difference up.",
      evidence: "tokens",
      state: { surface: "c" },
    },
    {
      id: "actions",
      question: "How round should buttons be?",
      context:
        "A button takes its corner from its own height: today a 40px button is 16px round, which is 0.4 of its height. It is the one shape meant to read as pressable, so it is ruled apart from the surfaces. Two things wear this corner and should not: the 44px marketing button, which borrows the corner of a 40px one, and the sheet that greets every guest.",
      look: "Part F, the three columns labelled Today, 0.4 of the height, A full pill and Quiet, 0.2 of the height, at every height a button ships at, with the guest entry sheet on the row below them.",
      options: [
        {
          id: "today",
          label: "Today, 0.4 of the height",
          means:
            "Buttons keep the roundness they ship with: 16px on a 40px button, 12.8 on the small one the app uses everywhere.",
        },
        {
          id: "pill",
          label: "A full pill",
          means:
            "Every button becomes a half circle whatever its height, which is the one rung the odd 44px button cannot fall off.",
        },
        {
          id: "quiet",
          label: "Quiet, 0.2 of the height",
          means:
            "Half of today: 8px on a 40px button. Still rounder than a card under A and B, and the same shape as one under C and D.",
        },
      ],
      recommended: "today",
      because:
        "The roundness is not what is broken. What is broken is a 44px marketing button wearing the corner of a 40px one, and the sheet every guest meets taking its corner from a button at all.",
      evidence: "actions",
      control: "action",
    },
    {
      id: "ladder",
      question: "Which sizes should the seven corner steps climb in?",
      context:
        "Above the card's own corner sits a ladder of seven sizes, from the smallest (a tooltip's arrow) to the largest (a badge), each a multiple of the card's number. The multipliers were picked when a card was 2px, where all seven land within 4px of each other. Once a card is 8px they spread out, and a plan card on the pricing page is either 12 or 14.4.",
      look: "Part E: the two columns labelled The steps as they are today and Even quarters, one step a row, with the arithmetic and the use counts beside them. Set Surfaces to C, soft first, or every step looks alike.",
      options: [
        {
          id: "stock",
          label: "The steps as they are today",
          means:
            "The seven multipliers stay as they ship: 0.6, 0.8, 1, 1.4, 1.8, 2.2 and 2.6 of the card's corner.",
        },
        {
          id: "quarters",
          label: "Even quarters, 0.5 up to 2",
          means:
            "The steps climb by an even quarter: 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2. A plan card lands at 12 rather than 14.4.",
        },
      ],
      recommended: "quarters",
      because:
        "At today's 2px card the two ladders are within half a pixel of each other, so nothing moves now. Once a card is 8px the difference is a plan card at 12 against one at 14.4, and a quarter is a step a person can hold in their head.",
      evidence: "ladder",
      state: { surface: "c" },
      control: "ladder",
    },
    {
      id: "dead-rungs",
      question: "Should the two largest corner steps be deleted?",
      context:
        "The ladder's top two steps have three uses in the whole product between them: one panel on a marketing page, and the Badge, which is asking for a full pill and borrows the largest step to fake one. A step nobody uses still has to be kept honest every time the card's corner moves.",
      look: "Part E, the last two rows: the use count is printed beside every step, and the two the board would delete say so. Compare them with the rows above, which carry 49 to 105 uses each.",
      options: [
        {
          id: "keep",
          label: "Keep all seven steps",
          means:
            "The ladder keeps both top steps, and every future ruling on the card's corner has to carry them.",
        },
        {
          id: "drop",
          label: "Drop the top two steps",
          means:
            "The two largest steps go: the one panel takes the step below, and the Badge asks for a full pill, which is what it wanted.",
        },
      ],
      recommended: "drop",
      because:
        "One of the two is used once, the other twice, and one of those two is the Badge faking a pill. Deleting them removes two numbers nobody is choosing and nothing anyone can see.",
      evidence: "ladder",
      state: { surface: "c" },
    },
    {
      id: "gap",
      question: "Should the gap between photographs follow their corner?",
      context:
        "The guest album lays photographs out in a tight grid. Each photograph's corner comes from a token this ruling moves, but the gap between them is written as a fixed 3px in three files. When the corner is bigger than the gap, the four corners meeting at a junction open a small hole, on the one page every guest sees.",
      look: "Part B, with App screen set to The gap in the dock: the same nine photographs twice, labelled The gap follows the tile and A fixed 3px gap, as it ships. Take it on D, one family, where the corner is 6 and the hole is widest.",
      options: [
        {
          id: "pinned",
          label: "Pin the gap to the photograph's corner",
          means:
            "The gap grows with the corner, and the three hard-coded 3px gaps become the token. It is a sweep across three files in another track's lane.",
        },
        {
          id: "free",
          label: "Leave the 3px gap as it is",
          means:
            "The gap stays fixed at 3px, so any corner above 3 opens holes between the photographs in the guest album.",
        },
      ],
      recommended: "pinned",
      because:
        "The hole is only possible because the two numbers are set in different places. Tying the gap to the corner makes it impossible for a later ruling to open one again.",
      overrule:
        "Pinning it is a sweep across three files another track owns, so a yes here is also a yes to scheduling that.",
      evidence: "app",
      state: { surface: "d", canvas: "phone" },
    },
  ],

  candidates: [
    {
      id: "a",
      name: "A, today: 2 / 8 / 3",
      rationale:
        "2 / 8 / 3. The site as built, and the only ruling that sweeps nothing: 64 corners in 28 files are px literals no candidate can move, and under A they keep agreeing with the tokens around them.",
    },
    {
      id: "b",
      name: "B, square: 0 / 6 / 0",
      rationale:
        "A harder surface with the action rung untouched, so the contrast between a surface and a control is at its widest. It reads as deliberate on cinema and as unfinished on paper.",
    },
    {
      id: "c",
      name: "C, soft: 8 / 12 / 4",
      recommended: true,
      rationale:
        "8 / 12 / 4. A corner that is legible at a glance and still eight steps short of the action. It is also the candidate that makes the guest gallery's gap finding actionable rather than theoretical.",
    },
    {
      id: "d",
      name: "D, one family: 14 / 14 / 6",
      rationale:
        "Surfaces, floats and tiles at one number. The simplest system to state and the one that gives up the most: at D the guest tiles draw a 6px corner against a 3px gap and four corners meet in three pixels.",
    },
  ],

  departures: [
    {
      id: "gallery-gap",
      from: 8,
      text: "The guest gallery's gap is a literal. guest-masonry.tsx, gallery-skeleton.tsx and ghost-grid.tsx write gap-[3px] while their tiles ride var(--radius-tile), so any tile above 3 opens corner holes on the one grid every guest sees. The fix is in another track's lane.",
      evidence: "app",
    },
    {
      id: "entry-sheet",
      from: 9,
      text: "The guest ENTRY SHEET wears the action token: entry-shell.tsx draws the first surface any guest meets at 1.4x the action radius, so the action rung decides the corner of a sheet. Either it moves to the floating layer's token or the rung is ruled knowing it owns a sheet.",
      evidence: "actions",
    },
    {
      id: "two-boards",
      from: 9,
      text: "The float rung is being ruled on two boards. This one sets --radius-float; the floating-surfaces proposal adds --radius-float-item and --radius-float-lg. They have to agree, and bible 9 says the item token is right.",
      evidence: "tokens",
    },
    {
      id: "action-lg",
      from: "precedent",
      text: "--radius-action-lg has exactly one call site, on an h-11. Every marketing CTA is size lg forced to h-11 in 26 files, so the loudest action on the site sits at 0.33 of its height while globals.css documents 0.4. The proposal is a cta size on the Button.",
      evidence: "actions",
    },
    {
      id: "ladder-is-baked",
      from: "precedent",
      text: "The derived ladder cannot be retuned with a token: @theme inline substitutes each step into its utility at build time, so --radius-xl is empty at runtime. The ruling lands on the multipliers in theme.css, one line a step, which is the Orchestrator's file.",
      evidence: "ladder",
    },
    {
      id: "literal-corners",
      from: 8,
      text: "Sixty-four corners on the site are literals rather than tokens: rounded-[2px], -[3px] and -[4px] account for 52 across 24 non-lab files. Under any candidate but A a photograph keeps today's corner while the card around it moves. A ruling of C is a ruling to sweep them.",
      evidence: "site",
    },
  ],

  assets: [
    {
      what: "A worst-case tile set for the gallery gap",
      spec: "Four photographs whose edges are near-white and bright (a white tablecloth, an overexposed sky, a white dress against a window), 1200px long edge, JPG, so a corner hole between tiles is judged at maximum contrast instead of against the dark stills the board borrows.",
      replaces:
        "the wedding-golden, party-dj and festival-lights set in the app grid.",
    },
  ],

  sections: [
    {
      id: "site",
      title: "A. The real marketing pages, at true size",
      lede: "Each real page in a window of its own, redrawn with the corner picked in the dock (the board calls that the rail), with the site as it ships beside it, the two scrolling together.",
      argument: [
        "A same-origin iframe is the only 1:1 surface the lab has: the real route, the real components, the real breakpoints, the real scroll, wearing this column's radius and nobody else's. No zoom, no transform, no re-implementation, which is what makes it evidence rather than a picture of evidence.",
      ],
    },
    {
      id: "app",
      title: "B. The app's own screens, at true size",
      lede: "The dashboard, an event page, the guest album's grid and the sheet a guest meets first, served from this board's own route because they sit behind a sign-in.",
      argument: [
        "Will's round-four note opens the app's UI to the lab. This is the app as it ships, at the size it ships, which is the thing a ruling has to be made against first. The guest grid is where the board's worst finding lives: at a tile above 3px the corners meet in the 3px literal gap and open a hole, on the one page every guest sees.",
      ],
    },
    {
      id: "tokens",
      title: "C. Every corner this ruling moves, at true size",
      lede: "The four candidates side by side, with the card, the floating menu, the photograph and the button under each, measured off the page rather than captioned from a number.",
    },
    {
      id: "nested",
      title: "D. A corner inside a corner",
      lede: "The rule for a shape sitting inside another: the inner corner is the outer one minus the padding between them, and where the product breaks it.",
    },
    {
      id: "ladder",
      title: "E. The seven corner steps",
      lede: "The seven sizes, their multipliers and the arithmetic at a 2px card beside an 8px one, with how many places in the product use each. It is the part that decides whether a plan card is 12 or 14.4.",
      wiring: [
        "The ladder is baked into its utilities by @theme inline, so the ruling lands on the multipliers in theme.css, one line a step. The board renders the retune as utility overrides because a token cannot reach it.",
      ],
    },
    {
      id: "actions",
      title: "F. Buttons, at every height they ship at",
      lede: "The three roundness options on the real Button at every height it ships at, plus the two things wearing a button's corner that should not: the 44px marketing button and the guest entry sheet.",
    },
    {
      id: "phones",
      title: "G. All four candidates, on a phone",
      lede: "Four 375 windows side by side, one candidate each, scrolled together. It is where the photograph's corner is settled, because that corner is a phone decision.",
    },
  ],

  controls: [
    {
      // ★ THE IDS ARE THE `surfaces` ASK'S OPTION IDS, and `candidates.ts`
      // speaks the same four. The ask cannot declare `control: "surface"`
      // because this switch carries a fifth position the ask does not offer
      // (Live, the tuner's own values), and a mirrored control has to match
      // the ask's options exactly.
      id: "surface",
      label: "Surfaces",
      options: [
        { id: "a", label: "A, today" },
        { id: "b", label: "B, square" },
        { id: "c", label: "C, soft" },
        { id: "d", label: "D, one family" },
        { id: "live", label: "Live, from the tuner" },
      ],
      default: "a",
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
    {
      id: "canvas",
      label: "Window width",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    {
      id: "compare",
      label: "Compare",
      options: [
        { id: "split", label: "The site as it ships, beside it" },
        { id: "single", label: "One window only" },
      ],
      default: "split",
    },
  ],

  lookFirst: [
    {
      section: "site",
      state: { surface: "c", compare: "split" },
      note: "The home page on C, soft beside the site as it ships, scrolled together. If the corner is wrong here it is wrong everywhere.",
    },
    {
      section: "app",
      state: { surface: "d", canvas: "phone" },
      note: "The guest album on D, one family, on a phone, with App screen set to The gap. The holes where four corners meet are the board's worst finding, on the page every guest sees.",
    },
    {
      section: "ladder",
      state: { surface: "c", ladder: "quarters" },
      note: "The plan card at 14.4 against 12. That one number is the whole question about the seven steps.",
    },
    {
      section: "actions",
      state: { action: "pill" },
      note: "A full pill under the guest entry sheet: a half circle on a sheet, which is why the sheet's corner is a departure.",
    },
    {
      section: "phones",
      state: { canvas: "phone" },
      note: "All four candidates at once. Settle the photograph's corner here, then read the rest of the board knowing it.",
    },
  ],

  notes: [
    {
      section: "app",
      state: { surface: "d", canvas: "phone" },
      text: "Measured on D, one family: the photographs draw a 6px corner while the column gap stays at the fixed 3px the guest album hard-codes, so four corners meet in three pixels. Beside it, the same grid as built.",
    },
    {
      section: "site",
      state: { surface: "c" },
      text: "The home page on C, soft still holds 48 corners at 2px and 22 at 3px beside cards at 10 and 12. That mismatch is the hand-written-corner departure, visible rather than counted.",
    },
  ],

  links: {
    bible: [8, 9],
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
