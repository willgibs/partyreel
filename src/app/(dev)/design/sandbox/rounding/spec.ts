import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE ROUNDING BOARD, AS DATA (the kit round, 2026-09-15).
 *
 * The round-four board's own asks, candidates, departures and asset, moved out
 * of `board.tsx`. Its answer block already read like this one (five one-word
 * rulings and a button), which is exactly why it was the second pilot: it is
 * the board the template's Answer was generalised FROM, so the migration proves
 * the template can carry a board that had already solved the same problem by
 * hand.
 *
 * Its seven parts keep their letters as titles, because a review conversation
 * about this board has been referring to "part B" for three rounds and an id
 * that says what it points at is a better link than a letter: the ids are the
 * words, the titles keep the letters.
 */
export const ROUNDING = defineBoard({
  id: "rounding",
  title: "The rounding",

  question:
    "The radius system as three decisions rather than six numbers: the surface family, the action rung and the derived ladder, each judged on the real pages and the real app screens at true pixels.",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. Its hand-built answer block became the template's, its seven parts became declared sections, its frames became the kit's Frame with an adopted candidate sheet, and the tuner panel no longer covers the evidence. No number, candidate or finding changed.",
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
      changed: "The six tokens at true size and the derived ladder's arithmetic.",
    },
  ],
  context:
    "Rounds one to three judged the radius on COMPOSITIONS: real components, arranged by this board, standing in for pages. A composition is honest about a component and dishonest about a page, because what a radius has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, the plan card in the band, the tile in the grid. And a composition inside a Stage is dishonest twice over, because a Stage is a div.",

  verdict: {
    recommendation:
      "C, at 8 / 12 / 4, with today's action rung, the quarter ladder, the dead rungs dropped and the gallery gap pinned to the tile.",
    because:
      "A corner you can see, and still eight steps short of the action, so bible 8's contrast between a surface and a control survives. The action rung is not what is broken: what is broken is the h-11 CTA wearing a token defined for h-10, and the guest entry sheet wearing the action token at all.",
    overrule:
      "If the tile may not move, the gallery gap stays a literal and C's best finding goes with it. A is the ruling that changes nothing.",
  },

  asks: [
    {
      id: "surfaces",
      question: "The surface family",
      options: ["a", "b", "c", "d"],
      recommended: "c",
      because:
        "8 / 12 / 4. A is a claim nobody can read at 2px, and D gives up the contrast bible 8 exists for. --radius, --radius-float and --radius-tile move together.",
      evidence: "tokens",
    },
    {
      id: "actions",
      question: "The action rung",
      options: ["today", "pill", "quiet"],
      recommended: "today",
      because:
        "0.4 x height, as documented. The rung is sound; the two things wearing the wrong token are what the ruling should fix.",
      evidence: "actions",
    },
    {
      id: "ladder",
      question: "The derived ladder",
      options: ["stock", "quarters"],
      recommended: "quarters",
      because:
        "0.5 / 0.75 / 1 / 1.25 / 1.5 / 1.75 / 2. Within half a pixel of stock at today's base, and the difference between a plan card at 12 and at 14.4 once the base is 8.",
      evidence: "ladder",
    },
    {
      id: "dead-rungs",
      question: "The dead rungs",
      options: ["keep", "drop"],
      recommended: "drop",
      because:
        "rounded-3xl has one call site, rounded-4xl has two, and one of those is the Badge, which wants a pill and should say rounded-full. --radius-action-lg has exactly one.",
      evidence: "ladder",
    },
    {
      id: "gap",
      question: "The gallery gap",
      options: ["pinned", "free"],
      recommended: "pinned",
      because:
        "The gap follows the tile, and the three literal gap-[3px] on the guest grid become the token. Below the radius, four corners meeting open a hole.",
      overrule:
        "Pinning it is a sweep across three files in another track's lane, so a ruling here is a ruling to schedule that.",
      evidence: "app",
    },
  ],

  candidates: [
    {
      id: "today",
      name: "A, Today",
      rationale:
        "2 / 8 / 3. The site as built, and the only ruling that sweeps nothing: 64 corners in 28 files are px literals no candidate can move, and under A they keep agreeing with the tokens around them.",
    },
    {
      id: "square",
      name: "B, Square",
      rationale:
        "A harder surface with the action rung untouched, so the contrast between a surface and a control is at its widest. It reads as deliberate on cinema and as unfinished on paper.",
    },
    {
      id: "soft",
      name: "C, Soft",
      recommended: true,
      rationale:
        "8 / 12 / 4. A corner that is legible at a glance and still eight steps short of the action. It is also the candidate that makes the guest gallery's gap finding actionable rather than theoretical.",
    },
    {
      id: "family",
      name: "D, One family",
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
      replaces: "the wedding-golden, party-dj and festival-lights set in the app grid.",
    },
  ],

  sections: [
    {
      id: "site",
      title: "A. The real site, at 1:1",
      lede: "The marketing routes in a viewport of their own, re-skinned live from the dock, with today beside the rail and the two scrolled together.",
      argument: [
        "A same-origin iframe is the only 1:1 surface the lab has: the real route, the real components, the real breakpoints, the real scroll, wearing this column's radius and nobody else's. No zoom, no transform, no re-implementation, which is what makes it evidence rather than a picture of evidence.",
      ],
    },
    {
      id: "app",
      title: "B. The app, at 1:1",
      lede: "The dashboard, the event page, the guest album and the entry sheet, served from this lane's own route because they sit behind a sign-in.",
      argument: [
        "Will's round-four note opens the app's UI to the lab. This is the app as it ships, at the size it ships, which is the thing a ruling has to be made against first. The guest grid is where the board's worst finding lives: at a tile above 3px the corners meet in the 3px literal gap and open a hole, on the one page every guest sees.",
      ],
    },
    {
      id: "tokens",
      title: "C. The six tokens, at true size",
      lede: "Every token the ruling moves, measured off the page rather than captioned from a literal, with the live column reading the browser's own numbers.",
    },
    {
      id: "nested",
      title: "D. Nested corners",
      lede: "The rule for a corner inside a corner: the inner radius is the outer minus the padding, and where the product breaks it.",
    },
    {
      id: "ladder",
      title: "E. The derived ladder",
      lede: "Seven steps, the multipliers, and the arithmetic against a 2px base beside an 8px one. It is the part that decides whether the plan card is 12 or 14.4.",
      wiring: [
        "The ladder is baked into its utilities by @theme inline, so the ruling lands on the multipliers in theme.css, one line a step. The board renders the retune as utility overrides because a token cannot reach it.",
      ],
    },
    {
      id: "actions",
      title: "F. The action ladder, as it ships",
      lede: "Every rung on the real Button at the real heights, plus the two things wearing the wrong token: the h-11 CTA and the guest entry sheet.",
    },
    {
      id: "phones",
      title: "G. Every candidate at once, on a phone",
      lede: "Four 375 viewports side by side, scrolled together. It is where the tile is settled, because the tile is a phone decision.",
    },
  ],

  controls: [
    {
      id: "surface",
      label: "Surfaces",
      options: [
        { id: "today", label: "A" },
        { id: "square", label: "B" },
        { id: "soft", label: "C" },
        { id: "family", label: "D" },
        { id: "live", label: "Tuner" },
      ],
      default: "today",
    },
    {
      id: "action",
      label: "Actions",
      options: [
        { id: "today", label: "Today" },
        { id: "pill", label: "Pill" },
        { id: "quiet", label: "Quiet" },
      ],
      default: "today",
    },
    {
      id: "ladder",
      label: "Ladder",
      options: [
        { id: "stock", label: "Stock" },
        { id: "quarters", label: "Quarters" },
      ],
      default: "stock",
    },
    {
      id: "canvas",
      label: "Canvas",
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
        { id: "split", label: "Today beside it" },
        { id: "single", label: "One frame" },
      ],
      default: "split",
    },
  ],

  lookFirst: [
    {
      section: "site",
      state: { surface: "soft", compare: "split" },
      note: "The home page at C beside today, scrolled together. If the corner is wrong here it is wrong everywhere.",
    },
    {
      section: "app",
      state: { surface: "family", canvas: "phone" },
      note: "The guest album at D on a phone. The corner holes between tiles are the board's worst finding, on the page every guest sees.",
    },
    {
      section: "ladder",
      state: { surface: "soft", ladder: "quarters" },
      note: "The plan card at 14.4 against 12. This is the whole ladder ask, in one number.",
    },
    {
      section: "actions",
      state: { action: "pill" },
      note: "The pill rung on the guest entry sheet: a half circle under a sheet, which is why the sheet's token is a departure.",
    },
    {
      section: "phones",
      state: { canvas: "phone" },
      note: "Four candidates at once. Settle the tile here, then read the rest of the board knowing it.",
    },
  ],

  notes: [
    {
      section: "app",
      state: { surface: "family", canvas: "phone" },
      text: "Measured at D: the tiles draw a 6px corner while the column gap stays at the literal 3px the guest masonry hard-codes, so four corners meet in three pixels. Beside it, the same grid as built.",
    },
    {
      section: "site",
      state: { surface: "soft" },
      text: "The home page at C holds 48 corners still at 2px and 22 at 3px, beside cards at 10 and 12. That mismatch is the literal-corner departure, visible rather than counted.",
    },
  ],

  links: {
    bible: [8, 9],
    pages: [
      { label: "Home", path: "/", note: "every rounding group meets here" },
      { label: "Pricing", path: "/pricing", note: "the plan cards, the loudest derived step" },
      { label: "Album", path: "/features/album", note: "the tile's home page" },
    ],
  },
});
