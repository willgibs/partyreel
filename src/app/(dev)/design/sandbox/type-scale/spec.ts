import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE TYPE-SCALE BOARD, AS DATA (round seven, the stepped review, 2026-09-16).
 *
 * ★ THE BOARD IS ONE DECISION AND TWO FOLLOW-UPS, AND IT SAYS SO IN ITS SHAPE.
 * Round six returned five finished ladders; nothing about them moved this
 * round. What moved is the asking: five variants of ONE thing are decided by
 * one pick, so `catalog.mode` is `pick-one`, the `ladder` ask records the
 * winner (its options are the five cards plus "None of these", which clears
 * the board and is the right preview of none), and the real page underneath
 * wears whatever card is being pressed. The two remaining questions became
 * steps of their own, each drawn on one specimen with BOTH answers visible at
 * once. The comparison section, the glance tables, the reach paragraphs and
 * the walk's five stops left with the reshape. No size moved.
 *
 * ★ THE FIVE ARE WRITTEN OUT HERE AND NOWHERE ELSE, and that is not laziness
 * about DRY. `pnpm lab:review` reads a spec as TEXT rather than importing it
 * (so a board's asks and cards can be validated with no build step), and it
 * resolves `candidates: ITEMS` exactly one hop to a const in this file: a
 * `.map` over `ladders.ts` would read as a catalog with no cards at all and
 * every ruling on one would be refused. The numbers live in `ladders.ts`, the
 * WORDS live here, and `ladders.test.ts` pins the two lists equal id for id.
 *
 * ★ AND A CARD IS A WHOLE-SITE ANSWER. Each one names both halves of the site,
 * and a reviewer who wants marketing from one card and the app from another
 * says so in the note under the pick.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React, the board or its sheet would drag a client tree into a server render.
 */
const ITEMS: readonly Candidate<"items" | "pages" | "spacing" | "dead-link">[] =
  [
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
      lands:
        "Nine size tokens off one rung set; the three breakpoint ramps become one class each.",
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
      lands:
        "Two registers in one block: marketing five steps louder, the app quieter than today.",
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
      lands:
        "Today's desktop sizes baked as tokens, the phone end written out, no new app step.",
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
      lands:
        "Leading and letter-spacing tokens only: not one font-size in theme.css moves.",
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
      lands:
        "Nothing: the shipped ramps and the flat heading tracking stay as they are.",
      rationale: "The control every other card is read against.",
    },
  ];

export const TYPE_SCALE = defineBoard({
  id: "type-scale",
  title: "The type scale",

  question:
    "Which of five finished sets of heading sizes should the site wear?",

  round: {
    n: 7,
    date: "2026-09-16",
    changed:
      "Reshaped as a walk: one pick from five cards or none, then letter spacing and the dead-link title, each on one specimen with both answers drawn. The stage is one real page that re-types itself under the card you press.",
  },
  history: [
    {
      n: 6,
      date: "2026-09-16",
      changed:
        "Rebuilt as a catalog: five ladders as five specimens at true size, any two on one real page, the pick worn by five routes.",
    },
  ],
  context:
    "Bible 5 holds and its numbers were never written. Five rounds wrote them and then kept writing. Every size still stands; what changed is that five of them are finished ladders with names and the argument is folded underneath them.",

  verdict: {
    recommendation:
      "B, rungs, on both halves of the site, with the dead-link heading brought onto the same set.",
    because:
      "Every heading gets a size at both ends of the screen and takes its spacing from that size. Today's sizes are a rough draft of the same set, and the app gains its missing middle.",
    overrule:
      "C, registers, if the public pages should read like a poster and the app quieter.",
  },

  /**
   * ★ THE WINNER COMES FIRST, because the other two questions are about the
   * set that wins. The walk is the spec's own order, and `not-found` is staged
   * behind the pick: "put the title on the set" means nothing until there is a
   * set to put it on.
   */
  asks: [
    {
      id: "ladder",
      question: "Which ladder should the whole site wear?",
      context:
        "Five finished sets of heading sizes, each a whole-site answer: marketing's six steps and the app's three, named once. Press a card to wear it on the real page below.",
      options: [
        {
          id: "b",
          label: "B, rungs",
          means:
            "One rung set from 12 to 160, widening as it climbs. Marketing travels four rungs between the two screen widths, the app one.",
        },
        {
          id: "c",
          label: "C, registers",
          means:
            "The public pages louder than today (200 over 120) and the app quieter (20 flat), sharing the face and the spacing law and nothing else.",
        },
        {
          id: "a",
          label: "A, tuned",
          means:
            "Every desktop size the site ships, kept, with the phone end unpacked so all six marketing steps separate. The app is untouched.",
        },
        {
          id: "law",
          label: "The spacing law alone",
          means:
            "No size moves anywhere. Leading and letter spacing stop being constants and are read off the size instead.",
        },
        {
          id: "today",
          label: "Today, unchanged",
          means:
            "The shipped ladder, written out at both ends. The phone end stays collapsed and the app keeps no middle size.",
        },
        {
          id: "none",
          label: "None of these",
          means:
            "New directions. Say in the note what the five are missing, and the next round starts from that instead of from a card.",
        },
      ],
      recommended: "b",
      evidence: "items",
      control: "ladder",
      lands:
        "One @theme block of nine size names in src/app/theme.css: marketing and the app on one set of rungs.",
      strip: ["canvas", "page", "against"],
    },
    {
      id: "tracking",
      question: "Should a heading's letter spacing change with its size?",
      context:
        "From the 160px word atop /about down to a 16px card title, every heading is letter-spaced by the same amount today. Four of the five cards make it a function of size instead, and it moves no size, so it can be taken whichever card wins.",
      options: [
        {
          id: "adopt",
          label: "Spacing follows the size",
          means:
            "Each size carries its own letter spacing and line spacing, tighter as it climbs.",
        },
        {
          id: "keep",
          label: "Keep one value for every heading",
          means:
            "The single value stays, and so do a loose 160px word and a card title pulled tight at the size that is read most.",
        },
      ],
      recommended: "adopt",
      evidence: "spacing",
      control: "tracking",
      lands:
        "The nine letter-spacing and line-height tokens in the same @theme block; font-heading's flat -0.03em retires.",
      strip: ["canvas"],
    },
    {
      id: "not-found",
      question: "Should the dead-link title use the site's heading font?",
      context:
        "One screen catches every dead link, including every guest link to a deleted event. Its title is the only page title on the site set in Inter, the body font, at a size no card reaches.",
      options: [
        {
          id: "on-ladder",
          label: "Put it on the site's heading set",
          means:
            "The title joins the set: the heading face, at the prose step on marketing and the page step inside the app.",
        },
        {
          id: "leave-off",
          label: "Leave it in Inter, as it ships",
          means:
            "The one page title in the body font stays, and the exception is written down rather than quietly fixed.",
        },
      ],
      recommended: "on-ladder",
      evidence: "dead-link",
      control: "dead-link",
      lands:
        "One rule on [data-not-found] h1 beside the @theme block, or a written exception in the design system doc.",
      after: { ask: "ladder" },
      strip: ["canvas"],
    },
  ],

  candidates: ITEMS,

  /**
   * ★ ONE PICK DECIDES IT. The five are variants of one thing, so the review
   * is a gallery with a ring rather than five verdicts: the cards are the
   * winner ask's tiles, a verdict on a card that did not win is optional
   * feedback, and the real page under the tiles wears whatever is pressed.
   */
  catalog: {
    section: "items",
    control: "ladder",
    mode: "pick-one",
    winner: "ladder",
    stage: "pages",
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
      evidence: "dead-link",
    },
  ],

  assets: [],

  sections: [
    {
      id: "items",
      title: "The five ladders",
      lede: "One ladder a card, at true size, with a missing step drawn as a hole.",
      argument: [
        "NOTHING HERE IS SCALED, AND THE CARDS CLIP RATHER THAN SHRINK. A specimen whose size is being judged may not be zoomed, so a 160px masthead shows four letters in a card column, which is how a masthead meets the edge of a page. What a reader compares across five cards is the cap height and the rhythm under it, and both are true to the pixel, on a card and on a tile. Flip Canvas to read the same five at the phone end, which is where today's ladder fails and where a class string hides it in production.",
        "ONE SET, TWO REGISTERS, AND IT WAS THE BOARD'S CALL. Display through prose are marketing's rungs and page through card are the app's, named once. Two separate sets would name every role twice and then have to answer which set a Card wears, since CardTitle is one component shipping on /pricing and on the dashboard, and they would duplicate a letter-spacing law that is a function of size and not of surface.",
      ],
      eager: true,
    },
    {
      id: "pages",
      title: "One real page, wearing the pick",
      lede: "A route at true pixels, re-typed in place by the card you press.",
      argument: [
        "A FRAME GETS THREE THINGS NO COMPOSITION CAN, and a type ruling needs all three: the canvas's own breakpoints, so at 375 the page's real phone layout runs; an evaluated clamp rather than one resolved here by hand; and everything else on the page moving with the step. The ladder arrives as the block a ruling would land, written into the page's own document, so what does not move is a finding rather than an omission. The dashboard is the one surface that is a lab screen rather than a route: the real one is behind a sign-in and would change between two flips of a switch.",
      ],
      wiring: [
        "The sweep is four headings no hook can reach, and all four have to move with the ruling: the app's section heading (a label inside an h2, no class worth aiming at), sixteen hand-rolled marketing headings at 30 / 36 that stop one rung short of SectionShell's ramp, the guest entry title, written inline as font-heading text-[28px], and the event name inside the production EventCard, a hand-rolled font-heading text-xl. Aiming a step at any of them would move the real site under the Today card, which is the control this board rests on.",
        "The bake is one @theme block whatever is ruled: the same nine names, each half standing on its own rungs, and the three four-breakpoint ramps in page-hero, section-shell and page-heading collapse to one class each. Only the root 404 is outside every design island (app/not-found.tsx renders outside both marketing and the app), so the dead link on the strip is the marketing one.",
      ],
    },
    {
      id: "spacing",
      title: "Letter spacing, on its own",
      lede: "Three sizes, under one flat value and under the law. No size moves between the halves.",
    },
    {
      id: "dead-link",
      title: "The dead-link screen",
      lede: "The production dead end, at true size, with its title on the set and off it.",
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
    // Nothing picked is a state of its own (Will, 2026-09-16): the page below
    // shows the site as built until a card is picked, and pressing the picked
    // card returns here. The winner ask mirrors this control, so a press on a
    // tile IS the preview.
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
    // Which route the stage loads. One page at a time is what keeps a 1440
    // canvas from becoming a row of them.
    {
      id: "page",
      label: "Page",
      options: [
        { id: "about", label: "/about" },
        { id: "home", label: "Home" },
        { id: "help", label: "/help" },
        { id: "dashboard", label: "Dashboard" },
        { id: "album", label: "Album" },
        { id: "dead", label: "Dead link" },
      ],
      // /about opens the stage: the 160px masthead is the loudest difference
      // between the five cards, and the page holds still under a fade.
      default: "about",
    },
    // The second copy of the same page, under the first, on a fade. Two
    // ladders on one real page inside one canvas width.
    {
      id: "against",
      label: "Against",
      options: [
        { id: "off", label: "Off" },
        { id: "today", label: "Today" },
        { id: "b", label: "B, rungs" },
        { id: "c", label: "C, registers" },
        { id: "a", label: "A, tuned" },
        { id: "law", label: "The law alone" },
      ],
      default: "today",
    },
    // Two controls that serve one question each: declared, so their ask can
    // draw both answers as tiles, and kept off every strip, because a question
    // asked twice on one screen is the thing this round is deleting.
    {
      id: "tracking",
      label: "Letter spacing",
      options: [
        { id: "keep", label: "One value" },
        { id: "adopt", label: "Follows the size" },
      ],
      default: "keep",
    },
    {
      id: "dead-link",
      label: "Dead-link title",
      options: [
        { id: "leave-off", label: "Inter, as it ships" },
        { id: "on-ladder", label: "On the set" },
      ],
      default: "leave-off",
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
      section: "pages",
      state: { ladder: "b", against: "today" },
      note: "B over today on /about. Drag the fade to read the two in the same place, then change Page to carry the pick across the site.",
    },
  ],

  notes: [
    {
      section: "pages",
      state: { page: "album" },
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
