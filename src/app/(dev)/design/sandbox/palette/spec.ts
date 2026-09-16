import { type Candidate, defineBoard } from "@/components/lab/board-spec";

import { PALETTE_OPTIONS } from "./palettes";

/**
 * THE PALETTE BOARD, AS DATA (round eight, the stepped review, 2026-09-16).
 *
 * ★ ROUND EIGHT ADDS NO PALETTE AND NO ARGUMENT. Round seven's catalog is the
 * same twelve; what changed is that the board is now WALKED rather than read.
 * The twelve are variants of one thing, so they are decided by ONE pick
 * (`catalog.mode: "pick-one"`, the `palette` ask, "None of these" as the
 * new-directions exit), and every question after it is a step of its own: one
 * specimen, every option drawn on it as a tile, the real product underneath
 * wearing whatever is being shown. The reach waits until an accent is on.
 *
 * ★ WHAT THAT DELETED. Four switches used to sit in the dock with nothing
 * saying which question each served; they are the option states of their own
 * asks now, so a step's strip carries only what it still needs beside its stage
 * (the canvas, and the accent on the pick). The "three calls left" section,
 * which was one ask's wall stacked on another ask's photograph stacked on a
 * third ask's text, is three sections with one specimen each. The app section
 * folded into the real pages, where it belongs: one toggle, the marketing
 * routes and the app screens, all wearing the pick.
 *
 * ★ THE ROUND-SEVEN RULING STILL FRAMES THE PICK (Will, 2026-09-16): "I'm a
 * much bigger fan of the cooler gray direction in slate, studio, and reel...
 * Looks beautiful with the very black/white backgrounds for solid contrast then
 * cooler surfaces rather than darker bland grays." And the accent: "We will
 * likely not use an accent color to stick with our achromatic direction, but I
 * would like to add a single optional accent color config per theme where I can
 * decide if an accent color would pair well."
 *
 * ★ THE OPTIONS AND THE CANDIDATES ARE WRITTEN OUT HERE AND NOWHERE ELSE, and
 * that is not laziness about DRY, it is the desk. The review scanner reads a
 * spec as TEXT rather than importing it, so an `options` or a `candidates`
 * built by a `.map` over another module reads as an ask with no answers and a
 * catalog with no cards (`lab-review.test.ts` caught exactly that). The
 * structure lives in `palettes.ts`, the values in `registers.ts`, the WORDS
 * live here, and `registers.test.ts` pins all three equal, id for id.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React, the board or its sheet would drag a client tree into a server render.
 */

/**
 * THE TWELVE, WRITTEN OUT. Nine cool, three controls.
 *
 * The four facts are the ones a reviewer compares across twelve cards: the dark
 * ground, the light ground, the cast the chrome carries, and the one accent the
 * palette declares. `registers.test.ts` reads all four off the resolved palette,
 * so a card can never print a number the strip beside it does not paint.
 *
 * `lands` is what winning MEANS, in files, and it is new in round eight: on a
 * pick-one catalog the cards are not ruled one by one, so each card has to say
 * what choosing it costs where the choosing happens. The verdict is still the
 * BOARD's own call, drawn as the card's pill, and optional feedback for Will.
 */
const ITEMS: readonly Candidate<
  "catalog" | "pages" | "accent" | "card" | "faint" | "compare" | "paste"
>[] = [
  {
    id: "today",
    name: "Today",
    one: "The site as it ships: three darks with no ladder, a page a card cannot lift off.",
    verdict: "kill",
    lands:
      "Nothing. The ramp, the grounds and the one see-through card stay exactly as they are.",
    facts: [
      ["Room", "0.140"],
      ["Page", "0.990"],
      ["Cast", "none"],
      ["Accent", "Blue"],
    ],
    rationale:
      "The one to come back to. Every other card is judged against this, and a ruling of Today is a ruling to change no line.",
  },
  {
    id: "ladder",
    name: "Ladder",
    one: "The same rhythm at chroma zero: the control for whether the cool is doing anything.",
    verdict: "kill",
    lands:
      "The new rhythm with no hue in it, which rules the whole cool direction out by ruling.",
    facts: [
      ["Room", "0.145"],
      ["Page", "0.977"],
      ["Cast", "none"],
      ["Accent", "Flare"],
    ],
    rationale:
      "The control for the whole round. Put it on A and any cool card on B, drag the seam onto a card, and the question answers itself in one gesture rather than in a paragraph.",
  },
  {
    id: "ember",
    name: "Ember",
    one: "A warm dark room and a true grey page: round six's pick, kept as the one warm card.",
    verdict: "kill",
    lands:
      "A warm room at 0.120 under a true grey page, and the cool family leaves the board.",
    facts: [
      ["Room", "0.120"],
      ["Page", "0.977"],
      ["Cast", "0.008 at 60"],
      ["Accent", "Flare"],
    ],
    rationale:
      "Kept so the reversal is visible rather than asserted. Lay it beside the dashboard's media grid: that is where the warm tones were read as clashing with a colourful mix of photographs.",
  },
  {
    id: "onyx",
    name: "Onyx",
    one: "The blackest room here, at half Apple's tint. The ground does the work, not the colour.",
    verdict: "refine",
    lands:
      "A near-black room at 0.075 with half Apple's tint: the direction with the colour turned down.",
    facts: [
      ["Room", "0.075"],
      ["Page", "0.995"],
      ["Cast", "0.0015 at 286"],
      ["Accent", "Teal"],
    ],
    rationale:
      "For anyone who wants the direction without the colour: at 0.075 the room is nearly black, so every surface separates by contrast, and the tint is present in the greys without ever being nameable as a hue.",
  },
  {
    id: "graphite",
    name: "Graphite",
    one: "A very black ground, a very white page, Apple's cool greys in between.",
    verdict: "ship",
    lands:
      "A 0.105 room, a 0.995 page and Apple's cool greys between them, in globals.css and marketing.css.",
    facts: [
      ["Room", "0.105"],
      ["Page", "0.995"],
      ["Cast", "0.0053 at 286"],
      ["Accent", "Teal"],
    ],
    recommended: true,
    rationale:
      "The middle of the cool family and the sentence Will wrote, built: the grounds carry the contrast and everything on them is a cool grey rather than a slightly lighter dead one.",
  },
  {
    id: "steel",
    name: "Steel",
    one: "The cool as far as it goes, at twice Apple's tint, on the same white page.",
    verdict: "refine",
    lands:
      "The same shape at twice Apple's tint: the cool as far as this board is willing to take it.",
    facts: [
      ["Room", "0.125"],
      ["Page", "0.995"],
      ["Cast", "0.007 at 286"],
      ["Accent", "Flare"],
    ],
    rationale:
      "The end of the axis, and the card to read on a candle-lit photograph: this is where a cool ground stops staying out of the way and starts disagreeing with its own media.",
  },
  {
    id: "pitch",
    name: "Pitch",
    one: "A true black room, with Apple's own measured grey steps above it.",
    verdict: "refine",
    lands:
      "A true black room at 0.030, so on an OLED panel a photograph is the only light on the page.",
    facts: [
      ["Room", "0.030"],
      ["Page", "0.963"],
      ["Cast", "0.0036 at 286"],
      ["Accent", "Teal"],
    ],
    rationale:
      "The reference read literally: 0.030 is black on an OLED panel, so a photograph is the only light on the page. The most media-forward card here, and the harshest to read a long page on.",
  },
  {
    id: "mist",
    name: "Mist",
    one: "The light side inverted: a cool grey page, a pure white card lifting off it.",
    verdict: "refine",
    lands:
      "A cool grey page at 0.963 with a white card lifting 0.037 off it, over Graphite's room.",
    facts: [
      ["Room", "0.105"],
      ["Page", "0.963"],
      ["Cast", "0.0053 at 286"],
      ["Accent", "Violet"],
    ],
    rationale:
      "A card lifts by 0.037 instead of 0.007, which is the single biggest fix available to the light side. The cost is that the body is a grey rather than a white, which is what a stranger notices first.",
  },
  {
    id: "slate",
    name: "Slate",
    one: "The one you liked, with the blue taken out: the same room on the grey hue.",
    verdict: "refine",
    lands:
      "The cool at Apple's grey hue and a third of their chroma, which is what less blue measures out to.",
    facts: [
      ["Room", "0.145"],
      ["Page", "0.995"],
      ["Cast", "0.0035 at 286"],
      ["Accent", "Teal"],
    ],
    rationale:
      "Round six put the cool at hue 258, which is Apple's BLUE. Their greys are at 286. This is the same set at their hue and a third of the chroma, which is what 'less blue' measures out to.",
  },
  {
    id: "reel",
    name: "Reel",
    one: "Slate's room on the paper page, declaring the product's own violet.",
    verdict: "refine",
    lands:
      "Slate's room under the paper page, and the reel's violet as the hue an accent would wear.",
    facts: [
      ["Room", "0.145"],
      ["Page", "0.977"],
      ["Cast", "0.0035 at 286"],
      ["Accent", "Violet"],
    ],
    rationale:
      "The product is named for the reel, so the accent and the signature moment become one hue. Turn the accent on to read it: the reel icon stops being special once everything else is violet too.",
  },
  {
    id: "studio",
    name: "Studio",
    one: "One room with every surface a veil of the ink, and no chroma anywhere in it.",
    verdict: "refine",
    lands:
      "One room derived as veils of the ink, with no chroma anywhere in the set.",
    facts: [
      ["Room", "0.125"],
      ["Page", "0.990"],
      ["Cast", "none"],
      ["Accent", "Violet"],
    ],
    rationale:
      "Kept because Will read it as cool with nothing cool in it, which makes it the question the whole round rests on: is the coolness a hue, or is it a deep ground and one clean derivation?",
  },
  {
    id: "dusk",
    name: "Dusk",
    one: "The smallest change: the dark side goes cool, the light side is untouched.",
    verdict: "kill",
    lands:
      "The dark side only: the app and the chapters go cool, the light side keeps every value it has.",
    facts: [
      ["Room", "0.105"],
      ["Page", "0.990"],
      ["Cast", "0.0053 at 286"],
      ["Accent", "Teal"],
    ],
    rationale:
      "One block and no marketing page changes. It is a kill because it takes the half of the problem that is easy and leaves the half the measurements say is worst: five light surfaces inside 0.037.",
  },
];

export const PALETTE = defineBoard({
  id: "palette",
  title: "The palette",

  question:
    "Which palette should the whole site wear, and should it carry the accent that palette declares?",

  round: {
    n: 8,
    date: "2026-09-16",
    changed:
      "Reshaped as a stepped review: one pick from the twelve with None of these as the exit, then four questions with every option drawn on one specimen, the reach held back until an accent is on, and no palette added or changed.",
  },
  history: [
    {
      n: 7,
      date: "2026-09-16",
      changed:
        "Leaned cool and made the accent a config: four new cool sets on very black and very white grounds, the cool moved off hue 258 (Apple's blue) onto 286 (their grey), and one accent per palette behind a switch that is off.",
    },
    {
      n: 6,
      date: "2026-09-15",
      changed:
        "Rebuilt as a catalog: twelve finished palettes, each a card carrying its own grounds, text steps, accent and state colours plus a real piece of the product in dark beside light.",
    },
  ],
  context:
    "Round six put twelve finished palettes on one grid. Round seven leaned them cool on your note and moved the accent behind a switch. Round eight changes nothing about them: it turns the board into a walk, so the pick is one press and each remaining question stands alone on its own specimen.",

  verdict: {
    recommendation:
      "Graphite: a very black room at 0.105, a very white page at 0.995, Apple's cool greys between them, and no accent worn.",
    because:
      "Your note is about grounds, not greys: the black and the white carry the contrast, and everything on them is cool rather than merely lighter. Graphite is deep enough to be a ground and tinted enough to read cool on one. Onyx is the same answer halved and Steel is it doubled, so the three are an axis rather than three opinions.",
    overrule:
      "If the page being a grey rather than a white is acceptable, Mist fixes the light side outright: a white card lifts 0.037 off it instead of 0.007.",
  },

  /**
   * ★ THE WINNER FIRST, THEN ONE QUESTION PER STEP. The order is the walk, and
   * the reach is staged: it is meaningless until an accent is on, so it stays
   * off the desk and out of the walk until `accent=own` is held or ruled, and
   * is moot the moment the accent is ruled off.
   *
   * Every ask draws every option on ONE specimen, which is why none of them
   * carries a `look` any more: where to look is the tile you are pressing. The
   * four switches that used to sit in the dock are these option states.
   */
  asks: [
    {
      id: "palette",
      question: "Which palette should the whole site wear?",
      context:
        "Twelve finished palettes. Each is one complete set: the dark room every marketing chapter and the whole app sit on, the light page under the body, and every surface between them. Press a card to wear it; the real pages under the cards re-skin as you press. None of these means none is right, and the note says what to try instead.",
      options: [
        { id: "today", label: "Today" },
        { id: "ladder", label: "Ladder" },
        { id: "ember", label: "Ember" },
        { id: "onyx", label: "Onyx" },
        { id: "graphite", label: "Graphite" },
        { id: "steel", label: "Steel" },
        { id: "pitch", label: "Pitch" },
        { id: "mist", label: "Mist" },
        { id: "slate", label: "Slate" },
        { id: "reel", label: "Reel" },
        { id: "studio", label: "Studio" },
        { id: "dusk", label: "Dusk" },
        {
          id: "none",
          label: "None of these",
          means:
            "New directions. The note says what to try: cooler, warmer, deeper, a different page, a different card step.",
        },
      ],
      recommended: "graphite",
      because:
        "Your note was about grounds rather than greys, and Graphite is that sentence built: deep enough at 0.105 to be a ground, tinted at half again Apple's amount so everything on it reads cool. Onyx is the same answer halved, Steel is it doubled.",
      overrule:
        "A grey page instead of a white one. Mist fixes the light side outright, and it is the one real trade on the board.",
      evidence: "catalog",
      control: "palette",
      lands:
        "The grey ramp and every surface token in globals.css and marketing.css: both modes, the marketing site and the app.",
      strip: ["canvas", "accent"],
    },
    {
      id: "accent",
      question: "Should the site carry an accent colour at all?",
      context:
        "Every palette declares the one hue that would pair with its grey, for the accent's jobs: the mark, the primary action, the focus ring, the live dot, and the stand-in where a photograph has not been taken. Nothing wears it until this is on. Off is what ships today.",
      options: [
        {
          id: "none",
          label: "No accent",
          means:
            "The achromatic identity kept exactly: the photographs are the only colour anywhere, and the paste prints no accent block.",
          state: { accent: "none" },
        },
        {
          id: "own",
          label: "The palette's own",
          means:
            "The palette wears the hue it declares, and the paste carries it. Which places wear it is the next question.",
          state: { accent: "own" },
        },
      ],
      recommended: "none",
      because:
        "Bible 1 is the achromatic identity, and a cool chrome already has a temperature. The switch exists so the answer is a ruling rather than an assumption.",
      evidence: "accent",
      control: "accent",
      lands:
        "Whether --brand stays the alias for --primary, or the palette's hue lands in globals.css and reaches every --brand site.",
    },
    {
      id: "reach",
      question: "If an accent is on, how far should it reach?",
      context:
        "The brand token does three unrelated jobs, and one hue may not be right for all three: identity (the mark), attention (the primary action, the badge, the wizard step, the live dot), and standing in for a photograph that has not been taken. A job left out keeps near-black.",
      options: [
        {
          id: "all",
          label: "All three jobs",
          means:
            "The mark, the primary action, the badge, the wizard step and the media stand-ins all take the hue.",
          state: { reach: "all" },
        },
        {
          id: "attention",
          label: "Only what asks to be noticed",
          means:
            "The action, the badge and the wizard step take it; the mark and the stand-ins stay near-black.",
          state: { reach: "attention" },
        },
        {
          id: "identity",
          label: "Only the mark and the stand-ins",
          means:
            "Identity takes it and attention does not, so a state colour stays the only colour in the app.",
          state: { reach: "identity" },
        },
      ],
      recommended: "all",
      because:
        "An event with no cover photograph has all three jobs in one frame, and a narrower reach leaves the stand-in near-black beside a coloured badge.",
      evidence: "accent",
      state: { accent: "own" },
      control: "reach",
      after: { ask: "accent", option: "own" },
      lands:
        "Which --brand call sites keep the hue and which revert to var(--primary): the mark, the frames, or the attention set.",
    },
    {
      id: "card",
      question: "In dark mode, should a card be solid or see-through?",
      context:
        "The product ships exactly one see-through surface and no document says so: in dark mode a card is 62 percent of a grey over whatever is behind it. Over a page it looks solid; over a photograph it turns to glass. Every palette on this board retires it by accident.",
      options: [
        {
          id: "declared",
          label: "Solid, as the palette declares it",
          means:
            "A card is an opaque surface everywhere, and the one see-through surface in the system retires.",
          state: { card: "declared" },
        },
        {
          id: "opaque",
          label: "Solid, and written down as a rule",
          means:
            "The same look, taken as an explicit rule rather than as a side effect of how the palettes are built.",
          state: { card: "opaque" },
        },
        {
          id: "veil",
          label: "Keep it see-through",
          means:
            "Today's 62 percent stays, so a card lying over a photograph keeps reading as a pane of glass.",
          state: { card: "veil" },
        },
      ],
      recommended: "declared",
      because:
        "Every palette retires the veil by accident, because a colour mixed off the room is opaque. That should be a ruling, not a side effect.",
      evidence: "card",
      control: "card",
      lands:
        "--card in .dark: an opaque value, or today's oklch(0.21 0 0 / 0.62) kept as the system's one translucent surface.",
    },
    {
      id: "faint",
      question: "Should there be a third, fainter text colour?",
      context:
        "The site has two text greys and needs three: a timestamp, a caption and a hint are all dimmer than the second. Thirty seven places fade the second grey by hand, and a fade composites against what is behind it, so the same line is a different grey on a card than on the page.",
      options: [
        {
          id: "in",
          label: "Yes, add the third colour",
          means:
            "One new token, so the third line is the same grey on the page, on a card and on the panel.",
          state: { faint: "in" },
        },
        {
          id: "out",
          label: "No, keep fading by hand",
          means:
            "The thirty seven places keep fading the second grey, and every ground gives a slightly different result.",
          state: { faint: "out" },
        },
      ],
      recommended: "in",
      because:
        "One token is one grey on all three grounds; an alpha is three greys. The specimen draws the same three lines on all three, which is the whole difference.",
      overrule: "A new custom property: theme.css owes it a line first.",
      evidence: "faint",
      control: "faint",
      lands:
        "A new --faint in globals.css and --color-faint in theme.css, or the 37 hand-faded sites stay as they are.",
    },
  ],

  candidates: ITEMS,

  /**
   * ★ ONE PICK DECIDES THIS BOARD. The twelve are variants of one thing, so the
   * catalog is `pick-one`: the cards are the winner ask's tiles, "None of
   * these" is the new-directions exit, and the real pages sit under them
   * wearing whatever is pressed. A verdict on a card is still accepted, as
   * optional feedback, but it is not what the board is asking for.
   */
  catalog: {
    section: "catalog",
    control: "palette",
    compare: ["compare-a", "compare-b"],
    mode: "pick-one",
    winner: "palette",
    stage: "pages",
  },

  departures: [
    {
      id: "the-blue",
      from: "precedent",
      text: "Rounds three to six built the cool cast at hue 258, which converted is Apple's BLUE; their system greys are at 286. That one number is most of what made Slate read blue rather than cool, and moving it re-prints every cool value here.",
      evidence: "catalog",
    },
    {
      id: "the-cast",
      from: "ruling",
      text: "Ten of the twelve carry a cast, re-opening a decision globals.css records as closed: zero chroma IS the brand point. The cool sets also tint the INK, against round three's own rule. Ladder is on the board at chroma zero so both can be ruled by looking.",
      evidence: "catalog",
    },
    {
      id: "the-model",
      from: 16,
      text: "Bible 16 counts four grounds; by the job they do there are five plus a literal (cinema 0.110, the app 0.140, the footer leaf 0.155, paper 0.990, the contact panel, and media-lightbox.tsx:617's bg-black/90). Every palette answers with four registers and a bed.",
      evidence: "catalog",
    },
    {
      id: "the-veil",
      from: "precedent",
      text: "Today ships one see-through surface, the dark card at 62 percent, and no document says so; every palette retires it silently, which is why it is a question of its own rather than a footnote.",
      evidence: "card",
    },
  ],

  assets: [
    {
      what: "Four hard cases inside the media kit's shot list",
      spec: "One high key (a white dress on a white wall), one low key (a dance floor lit by one lamp), one candle-warm, one stage-cool: four of the media kit's 36 masters at 1600px, landscape, one grade. A line on that shot list, not a second delivery.",
      replaces:
        "the five stand-ins on every card's well, which span gold, pastel, night blue and laser but hold no high key and no candle.",
    },
    {
      what: "A portrait pair for the guest masonry",
      spec: "Two of the same 36 at 1600px, PORTRAIT, the same grade. Every stand-in but one is landscape, so the guest album's column flow is faked.",
      replaces: "the hand-set tile ratios in specimens.tsx.",
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The catalog",
      lede: "Twelve palettes, nine cool. Each card carries its own grounds, its text steps and a real product fragment in dark beside light.",
      argument: [
        "WHAT COOL MEANS HERE, MEASURED. Converted to oklch, Apple's six system greys sit at hue 286 with an almost constant chroma of 0.0066, and their blue sits at 257. Rounds three to six built this board's cool cast at 258, which is the blue's hue and not the grey's, at a chroma that rose with lightness the way the warm table does. Both were wrong for a grey: a cool grey's tint is a constant property of the family, not something the light does to it. The band is now theirs, and `gain` is how far past or short of their amount a set sits.",
        "THE SHAPE OF EVERY NEW SET IS WILL'S SENTENCE. A very black ground and a very white one carry the contrast; the surfaces sitting on them are cool greys rather than slightly lighter dead ones. Today's dark mode does the opposite: a 0.140 room with four semantic surfaces crushed between 0.210 and 0.250. Onyx, Graphite, Steel and Pitch are that sentence at four distances from black, with the tint at half, one and a half, two and one and a fifth times Apple's amount.",
        "WHAT IS WRONG TODAY, measured rather than argued. In light mode five surfaces sit inside 0.037 of each other with the page at the top of them, so a card is its hairline and nothing else. In dark mode the panel ships LIGHTER than the card it sits in, which is the ladder upside down. And in both modes there is nothing at all between 0.450 and 0.905, which is why 37 places fade a grey by hand to get a third text step.",
      ],
    },
    {
      id: "pages",
      title: "The real product",
      lede: "The marketing routes and the guest album loaded at true pixels beside today, the two signed-in screens rebuilt: all of it wearing the pick.",
      argument: [
        "A composition is honest about a component and dishonest about a page. What a ground has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, and the seam where the paper ends and the footer begins. The four marketing routes are real documents with the paste written into them, so the right frame is the site after the ruling, to the byte.",
        "Two screens are behind a sign-in, so the dashboard and an event are compositions built from production components rather than routes: the data, the counts and the copy are the board's, the components, the density and the breakpoint are real. They are here because this is where Will's objection lived, a colourful mix of photographs on a media-forward chrome, and no marketing route holds one. The guest album is public, so it loads as the real page.",
      ],
    },
    {
      id: "accent",
      title: "The accent",
      lede: "The dashboard wearing the hue this palette declares, with all three of the accent's jobs in one frame: the mark, the things asking to be noticed, and the stand-in for a photograph.",
      eager: true,
    },
    {
      id: "card",
      title: "A card over a photograph",
      lede: "The one see-through surface in the system, on the only specimen where the answer is a look rather than a number.",
    },
    {
      id: "faint",
      title: "The third text step",
      lede: "The same three lines on the three grounds type lands on: the page, a card and the panel inside it.",
    },
    {
      id: "compare",
      title: "Any two, side by side",
      lede: "The surface ladder under the two cards you pressed A and B on, with the seam on a slider.",
      argument: [
        "Two canvases side by side is a memory test when the step being judged is 0.02, and an eye cannot hold that across a toggle press. One canvas with the join on a slider can be dragged onto the exact surface in question instead. The comparison the round was built for is Ladder against any cool card: same rhythm, same steps, one at chroma zero and one at Apple's hue. If the cool is not visible in that wipe at 1440, it is not visible anywhere.",
      ],
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The picked palette as the block that lands in globals.css and marketing.css, every answer above folded in.",
      wiring: [
        "theme.css needs --color-faint: var(--faint) in its @theme inline block before a text-faint utility exists; the board reaches the token with an arbitrary value, so nothing here depends on that line landing first. And .surface-mat is a new class: the token block lands with the paste, and the 35 sites that write bg-muted/N today become sections that carry it, which is a mechanical follow-up rather than part of this ruling.",
        "The accent prints only while the switch is on. Off resolves to the alias that ships (--brand is --primary), which is a ruling to change no line, so the paste is shorter by three blocks and the walk is the achromatic site.",
      ],
    },
  ],

  /**
   * ★ FOUR OF THESE ARE NOT DOCK PILLS ANY MORE. `accent`, `reach`, `card` and
   * `faint` are declared because their asks' option states set them and the
   * tiles mirror them, not because a reviewer should hunt for them: no step puts
   * them on its strip except the accent, which rides the pick so a palette can
   * be judged with and without the hue it declares. The canvas and the two
   * compare controls are the only ones a reader still drives by hand.
   */
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
    {
      id: "palette",
      label: "Palette",
      // Nothing picked is a state of its own (Will, 2026-09-16): the pages
      // below show the site as built until a card is picked, and picking the
      // picked card returns here. It is also the right preview of "None of
      // these", which is why the winner ask offers it as an option.
      options: [{ id: "none", label: "Nothing picked" }, ...PALETTE_OPTIONS],
      default: "none",
      clearable: true,
    },
    // The accent config's switch (Will, 2026-09-16). NOT clearable: "none" is
    // already the cleared state, and a clearable two-option control would leave
    // the ask mirroring it with one option.
    {
      id: "accent",
      label: "Accent",
      options: [
        { id: "none", label: "None" },
        { id: "own", label: "The palette's own" },
      ],
      default: "none",
    },
    // A and B: the two the wipe joins. They open on Ladder against the board's
    // own pick, which is the comparison the whole round turns on: the same
    // rhythm at chroma zero and at Apple's hue.
    {
      id: "compare-a",
      label: "A",
      options: PALETTE_OPTIONS,
      default: "ladder",
    },
    {
      id: "compare-b",
      label: "B",
      options: PALETTE_OPTIONS,
      default: "graphite",
    },
    {
      id: "reach",
      label: "Reach",
      options: [
        { id: "all", label: "All three" },
        { id: "attention", label: "Attention" },
        { id: "identity", label: "Identity" },
      ],
      default: "all",
    },
    {
      id: "card",
      label: "Card",
      options: [
        { id: "declared", label: "Solid" },
        { id: "opaque", label: "Solid, ruled" },
        { id: "veil", label: "See-through" },
      ],
      default: "declared",
    },
    {
      id: "faint",
      label: "Faint text",
      options: [
        { id: "in", label: "In" },
        { id: "out", label: "Out" },
      ],
      default: "in",
    },
  ],

  notes: [
    {
      section: "catalog",
      text: "The five stand-ins on each well span gold, pastel, night blue and laser, which is a colourful mix but not a hard one. The high-key case and the candle-lit one are untested until the four hard cases land.",
    },
    {
      section: "pages",
      text: "The dashboard and the event page are compositions, not routes: the breakpoint is honest because the canvas is a real width, but the data, the counts and the copy are the board's rather than a real event's.",
    },
  ],

  reading: {
    words: 1950,
    why: "Measured at 1,940 on the stepped surface, down from 2,924: the asks stopped being printed three times (the answer block's pills, the section's Rule-on row and the review panel) and became steps, and the board's own voice is now the verdict, seven ledes and the twelve cards. About 550 of what is left is the catalog: twelve names, twelve one-lines and forty-eight facts, which IS the evidence.",
  },

  links: {
    bible: [1, 16],
    spec: "docs/specs/palette.md",
    pages: [
      { label: "Home", path: "/", note: "room into paper into slab" },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the mat, the cards, the table",
      },
      {
        label: "Help",
        path: "/help",
        note: "the facts band and the closer panel",
      },
      {
        label: "Contact",
        path: "/contact",
        note: "the fifth ground, now the mat",
      },
      {
        label: "The dashboard",
        path: "/dashboard",
        note: "signed in, both modes, then one click to an event",
      },
      {
        label: "The bible",
        path: "/design/library/rules",
        note: "rule 1, as it stands",
      },
    ],
  },
});
