import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE TYPE-SCALE BOARD, AS DATA (round six, the catalog rebuild, 2026-09-16).
 *
 * ★ WILL'S NOTE IS THE WHOLE BRIEF: type-scale should be "a few different
 * scales side by side" on real UI, with "no variable lists", and a track
 * "returns a catalog to rule on item by item" (2026-09-16). So the five
 * ladders are five CARDS, each drawn as a type specimen at true size; the
 * comparison is two of them on the same real page at once; and the pick is
 * worn by the real pages underneath. The eight sections became three, the four
 * asks became two, and the token table, the glance tables, the reach
 * paragraphs and the step descriptions all left with them. No size moved.
 *
 * ★ THE FIVE ARE WRITTEN OUT HERE AND NOWHERE ELSE, and that is not laziness
 * about DRY. `pnpm lab:review` reads a spec as TEXT rather than importing it
 * (so a board's asks and cards can be validated with no build step), and it
 * resolves `candidates: ITEMS` exactly one hop to a const in this file: a
 * `.map` over `ladders.ts` would read as a catalog with no cards at all and
 * every ruling on one would be refused. The numbers live in `ladders.ts`, the
 * WORDS live here, and `ladders.test.ts` pins the two lists equal id for id.
 *
 * ★ AND A CARD IS A WHOLE-SITE ANSWER. Round five carried two switches, one
 * per register, which is the machine the revamp is cutting; each card now
 * names both halves and a reviewer who wants marketing from one and the app
 * from another says so in the note under it.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React, the board or its sheet would drag a client tree into a server render.
 */
const ITEMS: readonly Candidate<"items" | "compare" | "pages">[] = [
  {
    id: "b",
    name: "B, rungs",
    one: "One rung set, 12 to 160, widening as it climbs.",
    verdict: "ship",
    recommended: true,
    facts: [
      ["Masthead", "64 to 160"],
      ["Section", "24 to 52"],
      ["App title", "24 to 28"],
      ["Middle", "yes"],
    ],
    rationale: "Today's sizes are a rough draft of this set.",
  },
  {
    id: "c",
    name: "C, registers",
    one: "The public pages a poster, the app an instrument.",
    verdict: "refine",
    facts: [
      ["Masthead", "80 to 200"],
      ["Section", "26 to 40"],
      ["App title", "20 flat"],
      ["Middle", "yes"],
    ],
    rationale: "The one card that changes how the front of the site feels.",
  },
  {
    id: "a",
    name: "A, tuned",
    one: "Today's desktop sizes, the phone end unpacked.",
    verdict: "refine",
    facts: [
      ["Masthead", "64 to 160"],
      ["Section", "26 to 48"],
      ["App title", "24 flat"],
      ["Middle", "no"],
    ],
    rationale: "The smallest change that could be right.",
  },
  {
    id: "law",
    name: "The spacing law alone",
    one: "Today's sizes, the spacing read off the size.",
    verdict: "refine",
    facts: [
      ["Masthead", "52 to 160"],
      ["Section", "30 to 48"],
      ["App title", "24 flat"],
      ["Middle", "no"],
    ],
    rationale: "The only card that moves no size at all.",
  },
  {
    id: "today",
    name: "Today",
    one: "The shipped ladder, both ends written out.",
    verdict: "kill",
    facts: [
      ["Masthead", "52 to 160"],
      ["Section", "30 to 48"],
      ["App title", "24 flat"],
      ["Middle", "no"],
    ],
    rationale: "The control every other card is read against.",
  },
];

export const TYPE_SCALE = defineBoard({
  id: "type-scale",
  title: "The type scale",

  question:
    "Which of five finished sets of heading sizes should the site wear?",

  round: {
    n: 6,
    date: "2026-09-16",
    changed:
      "Rebuilt as a catalog: five ladders as five specimens at true size, any two on one real page, the pick worn by five routes.",
  },
  history: [
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "Moved onto the kit's template: the verdict first, the sections declared, the frames on the kit's own adopted sheet.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The marketing reconstructions came off and seven real ROUTES went on, in frames exactly the canvas wide.",
    },
  ],
  context:
    "Bible 5 holds and its numbers were never written. Five rounds wrote them and then kept writing: by round five the board carried two register switches, eight sections and a token table nobody could rule on. Every size stands. What changed is that five of them are finished ladders with names, and the argument is collapsed underneath them.",

  verdict: {
    recommendation:
      "B, rungs, on both halves of the site, with the dead-link heading brought onto the same set.",
    because:
      "Every heading gets a size at both ends of the screen and takes its spacing from that size. Today's sizes are a rough draft of the same set, and the app gains its missing middle.",
    overrule:
      "C, registers, if the public pages should read like a poster and the app quieter.",
  },

  asks: [
    {
      id: "tracking",
      question: "Should a heading's letter spacing change with its size?",
      context:
        "Every heading, from the 160px word atop /about down to a 16px card title, is letter-spaced by the same amount today. Four of the five cards make it a function of size instead.",
      look: "The strip under the cards: a masthead and a card title, under each value.",
      options: [
        {
          id: "adopt",
          label: "Spacing follows the size",
          means:
            "Each size carries its own letter spacing and line spacing. On its own it moves no size anywhere on the site.",
        },
        {
          id: "keep",
          label: "Keep one value for every heading",
          means:
            "The single value stays, and so do a loose 160px word and a card title pulled tight at the size that is read most.",
        },
      ],
      recommended: "adopt",
      because:
        "It is the only one of today's faults that today's numbers can fix by themselves.",
      overrule:
        "Keep one value, if the simplicity is worth a loose masthead and a tight card title.",
      evidence: "items",
    },
    {
      id: "not-found",
      question:
        "Should the page-not-found heading use the site's heading font?",
      context:
        "One screen catches every dead link, including every guest link to a deleted event. Its title is the only page title on the site set in the body font.",
      look: "The last frame under the pick.",
      options: [
        {
          id: "on-ladder",
          label: "Put it on the site's heading set",
          means:
            "The title joins the set: the heading font, the app screen at the page size and the public one at the size just above a card title.",
        },
        {
          id: "leave-off",
          label: "Leave it in Inter, as it ships",
          means:
            "The one page title in the body font stays, and the exception is written down rather than quietly fixed.",
        },
      ],
      recommended: "on-ladder",
      because:
        "It is the only page title on the site in Inter, and it is not an edge case.",
      overrule:
        "Leave it off, and the exception is documented rather than swept.",
      evidence: "pages",
    },
  ],

  candidates: ITEMS,

  /**
   * ★ THE CATALOG IS THE EVIDENCE. Declaring this turns the grid into the
   * review surface: Pick drives the pages below from a card, A and B drive the
   * comparison, and each card carries keep, refine or kill with a note.
   */
  catalog: {
    section: "items",
    control: "ladder",
    compare: ["compare-a", "compare-b"],
  },

  departures: [
    {
      id: "b-arithmetic",
      from: 2,
      text: "B states bible 2 as arithmetic: marketing travels four rungs between the widths, the app one. A bible finding if B is adopted.",
      evidence: "items",
    },
    {
      id: "404-face",
      from: 5,
      text: "Bible 5 says one heading face on one ladder, and the dead-link h1 has always been outside it. Every paste puts it on, hence the ask.",
      evidence: "pages",
    },
    {
      id: "c-prose-tier",
      from: "ruling",
      text: "C folds marketing's prose tier into the section step, against the documented three-tier h2 ladder. C's argument, not an oversight.",
      evidence: "compare",
    },
  ],

  assets: [],

  sections: [
    {
      id: "items",
      title: "The five ladders, side by side",
      lede: "One ladder a card, at true size.",
      argument: [
        "NOTHING HERE IS SCALED, AND THE CARDS CLIP RATHER THAN SHRINK. A specimen whose size is being judged may not be zoomed, so a 160px masthead shows four letters in a card column, which is how a masthead meets the edge of a page. What a reader compares across five cards is the cap height and the rhythm under it, and both are true to the pixel. Flip the Canvas switch to read the same five at the other end of the screen: the phone end is where today's ladder fails, and it is hidden inside a class string in production.",
        "A MISSING STEP IS DRAWN AS A HOLE. Today and A, tuned carry no size between the app's page title and its card title, so production writes that rank as an 11px uppercase label inside a heading tag on the dashboard and a 14px one in admin. The gap in the card is read off the data, so a ladder cannot claim a step it does not carry.",
        "ONE SET, TWO REGISTERS, AND IT WAS THE BOARD'S CALL. Display through prose are marketing's rungs and page through card are the app's, named once. Two separate sets would name every role twice and then have to answer which set a Card wears, since CardTitle is one component shipping on /pricing and on the dashboard, and they would duplicate a letter-spacing law that is a function of size and not of surface.",
      ],
      eager: true,
    },
    {
      id: "compare",
      title: "Any two, on the same real page",
      lede: "A on one card, B on another: three real pages, loaded twice, scrolled together.",
      argument: [
        "A composition is honest about a component and dishonest about a page. What a size has to survive is the rest of the page around it: the photograph beside the heading, the CTA under the chapter, the plan card in the band. A frame gets three things no composition can: the canvas's own breakpoints, so at 375 the page's real phone layout runs; an evaluated clamp rather than one resolved here by hand; and everything else on the page moving with the step, which is the reach of the ruling made visible.",
        "THE DASHBOARD IS A LAB SCREEN, NOT A ROUTE, and it is the only surface here that is not. The real dashboard is behind a sign-in and renders whichever events the reader's own account holds that morning, so a frame of it would change between two flips of a switch. This one is built from the same production components in a document of its own, at a real viewport, and it is re-laid out by exactly the block a ruling would land.",
      ],
    },
    {
      id: "pages",
      title: "The real pages, wearing the pick",
      lede: "Five routes at true pixels, wearing the picked card.",
      wiring: [
        "The sweep is four headings no hook can reach, and all four have to move with the ruling: the app's section heading (a label inside an h2, no class worth aiming at), sixteen hand-rolled marketing headings at 30 / 36 that stop one rung short of SectionShell's ramp, the guest entry title, written inline as font-heading text-[28px], and the event name inside the production EventCard, a hand-rolled font-heading text-xl this round found when the dashboard became a frame. Aiming a step at any of them would move the real site under the Today card, which is the control this board rests on.",
        "The bake is one @theme block whatever is ruled: the same nine names, each half standing on its own rungs, and the three four-breakpoint ramps in page-hero, section-shell and page-heading collapse to one class each. Only the root 404 is outside every design island (app/not-found.tsx renders outside both marketing and the app), so the dead link in the walk is the marketing one.",
      ],
    },
  ],

  controls: [
    {
      id: "canvas",
      label: "Canvas",
      options: [
        { id: "desktop", label: "1440" },
        { id: "phone", label: "375" },
      ],
      default: "desktop",
    },
    // Nothing picked is a state of its own (Will, 2026-09-16): the pages below
    // show the site as built until a card is picked, and pressing the picked
    // card returns here.
    {
      id: "ladder",
      label: "Ladder",
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "b", label: "B, rungs" },
        { id: "c", label: "C, registers" },
        { id: "a", label: "A, tuned" },
        { id: "law", label: "The law alone" },
        { id: "today", label: "Today" },
      ],
      default: "none",
      clearable: true,
    },
    // A and B: the two halves of the comparison, set from the catalog's cards.
    // They open on today against the board's own pick, which is the comparison
    // a reader wants before he has picked anything.
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "b", label: "B, rungs" },
        { id: "c", label: "C, registers" },
        { id: "a", label: "A, tuned" },
        { id: "law", label: "The law alone" },
        { id: "today", label: "Today" },
      ],
      default: "today",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "b", label: "B, rungs" },
        { id: "c", label: "C, registers" },
        { id: "a", label: "A, tuned" },
        { id: "law", label: "The law alone" },
        { id: "today", label: "Today" },
      ],
      default: "b",
    },
  ],

  lookFirst: [
    {
      section: "items",
      note: "Read the five. The name, the line and the four numbers say what each one is, and the specimen under them is the ladder itself at true size.",
    },
    {
      section: "items",
      state: { canvas: "phone" },
      note: "The same five at 375, which is where today's ladder fails: its page title and its chapter opener are both 36px and the huge word sits four pixels above the one under it.",
    },
    {
      section: "compare",
      state: { canvas: "phone" },
      note: "Today against B on the real home page, scrolled together: at 375 both halves stand on screen at once. Drag either frame and the other follows.",
    },
    {
      section: "compare",
      state: { canvas: "desktop", "compare-a": "b", "compare-b": "c" },
      note: "The two live candidates at 1440: 160 over 100 beside 200 over 120. Two full pages do not fit one window, so the row scrolls sideways rather than shrinking either.",
    },
    {
      section: "pages",
      state: { ladder: "b" },
      note: "B worn by five real routes. The last frame is a dead link, whose title is the only page title on the site set in the body font.",
    },
  ],

  notes: [
    {
      section: "compare",
      state: { canvas: "phone" },
      text: "At 375 each frame is 375 real pixels wide, so the page's own phone layout runs inside it rather than a desktop layout in a narrow box.",
    },
    {
      section: "pages",
      text: "Nothing on the guest album moves under any card: its entry title is written inline, outside both registers.",
    },
  ],

  links: {
    bible: [2, 5],
    spec: "docs/specs/type-scale.md",
    pages: [
      { label: "the home", path: "/", note: "the display step and the arc" },
      { label: "/about", path: "/about", note: "the masthead, on paper" },
      { label: "/help", path: "/help", note: "the title step, dense index" },
      {
        label: "the dashboard",
        path: "/dashboard",
        note: "the app register, signed in",
      },
      {
        label: "the admin portal",
        path: "/admin",
        note: "the quietest surface in the product",
      },
      {
        label: "a dead link",
        path: "/events/not-a-real-event",
        note: "the one h1 that is off the set",
      },
    ],
  },
});
