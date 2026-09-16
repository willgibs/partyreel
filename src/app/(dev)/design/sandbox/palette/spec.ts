import { type Candidate, defineBoard } from "@/components/lab/board-spec";

import { PALETTE_OPTIONS } from "./palettes";

/**
 * THE PALETTE BOARD, AS DATA (round seven, the cool round, 2026-09-16).
 *
 * ★ THE ROUND IS WILL'S, A FEW QUESTIONS INTO HIS FIRST SITTING ON THE CATALOG
 * AND BEFORE HE RULED ON ITS CARDS: "I'm a much bigger fan of the cooler gray
 * direction in slate, studio, and reel, think they feel more modern, clean, and
 * combat less harshly with a very media-forward dashboard. Looks beautiful with
 * the very black/white backgrounds for solid contrast then cooler surfaces
 * rather than darker bland grays. Many of the warmer tones feel like they'd
 * clash with a colorful mix of photos. Slate could even be less blue, but I'd
 * like more 'cool' gray options. Apple has a beautiful palette, but we wouldn't
 * use that blue they use." Plus: one optional accent per palette, as a config.
 *
 * ★ THE OPTIONS AND THE CANDIDATES ARE WRITTEN OUT HERE AND NOWHERE ELSE, and
 * that is not laziness about DRY, it is the desk. The review scanner reads a
 * spec as TEXT rather than importing it (so a board's asks can be read without
 * running a client tree), so an `options` or a `candidates` built by a `.map`
 * over another module reads as an ask with no answers and a catalog with no
 * cards. `lab-review.test.ts` caught exactly that. The structure lives in
 * `palettes.ts`, the values in `registers.ts`, the WORDS live here, and
 * `registers.test.ts` pins all three equal, id for id and line for line.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React, the board or its sheet would drag a client tree into a server render.
 * `palettes.ts` is plain TypeScript for exactly the same reason.
 */

/**
 * THE TWELVE, WRITTEN OUT. Nine cool, three controls.
 *
 * The four facts are the ones a reviewer compares across twelve cards: the dark
 * ground, the light ground, the cast the chrome carries (chroma and hue, or
 * none), and the one accent the palette declares. `registers.test.ts` reads all
 * four off the resolved palette, so a card can never print a number the strip
 * beside it does not paint.
 *
 * The verdict is the BOARD's own call, drawn as the card's pill, and it is not
 * the reviewer's: Will answers each card keep, refine or kill in the row under
 * it. One ship, seven refine, four kill.
 */
const ITEMS: readonly Candidate<
  "catalog" | "compare" | "calls" | "pages" | "app" | "paste"
>[] = [
  {
    id: "today",
    name: "Today",
    one: "The site as it ships: three darks with no ladder, a page a card cannot lift off.",
    verdict: "kill",
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
    facts: [
      ["Room", "0.120"],
      ["Page", "0.977"],
      ["Cast", "0.008 at 60"],
      ["Accent", "Flare"],
    ],
    rationale:
      "Kept so the reversal is visible rather than asserted. Lay it beside the media grid in the app section: that is where the warm tones were read as clashing with a colourful mix of photographs.",
  },
  {
    id: "onyx",
    name: "Onyx",
    one: "The blackest room here, at half Apple's tint. The ground does the work, not the colour.",
    verdict: "refine",
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
    "Which of twelve palettes should the site wear now the catalog leans cool, and should it carry the accent that palette declares?",

  round: {
    n: 7,
    date: "2026-09-16",
    changed:
      "Leaned cool and made the accent a config: four new cool sets on very black and very white grounds with Apple's greys above them, the cool moved off hue 258 (their blue) onto 286 (their grey), and one accent per palette behind a switch that is off.",
  },
  history: [
    {
      n: 6,
      date: "2026-09-15",
      changed:
        "Rebuilt as a catalog: twelve finished palettes, each a card carrying its own grounds, text steps, accent and state colours plus a real piece of the product in dark beside light.",
    },
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "Moved onto the kit's template, and the site judged as the real routes loaded beside today rather than as sections portalled into a stage.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Named the system instead of adding to it: four registers and a bed, the dark and the light ruled separately, three new darks beside two new papers.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "Walked cold and cut rather than added: today beside the candidate in one canvas, the temperature demoted to a switch.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "Every candidate left the board as the paste its ruling lands, and the judged surfaces widened to what the product is made of.",
    },
    {
      n: 1,
      date: "2026-09-13",
      changed:
        "Three letters on the oklab ruler, which proved the ramp is wrong in ways a ruler shows rather than in ways an eye argues.",
    },
  ],
  context:
    "Round six put twelve finished palettes on one grid and the board's own pick was a warm one. Will read it and went the other way: cooler, and never Apple's blue. So the catalog was rewritten rather than reordered. Four sets are new and built from his sentence, Apple's system greys are the measured reference under all of them, the cool moved off the hue that was making it read blue, and the accent stopped being a column and became one declaration per palette behind a switch.",

  verdict: {
    recommendation:
      "Graphite: a very black room at 0.105, a very white page at 0.995, Apple's cool greys between them, and no accent worn.",
    because:
      "The note is about grounds, not greys: the black and the white carry the contrast, and everything on them is cool rather than merely lighter. Graphite is deep enough to be a ground and tinted enough to read cool on one. Onyx is the same answer halved and Steel is it doubled, so the three are an axis rather than three opinions.",
    overrule:
      "If the page being a grey rather than a white is acceptable, Mist fixes the light side outright: a white card lifts 0.037 off it instead of 0.007.",
  },

  asks: [
    {
      id: "accent",
      question: "Should the site carry an accent colour at all?",
      context:
        "Every palette declares the one hue that would pair with its grey, for the accent's three jobs: the primary action, the focus ring, the live dot. Nothing wears it until this is on. Off is what ships today.",
      look: "The Accent switch in the dock. It flips all twelve cards, the wall and the real pages at once.",
      options: [
        {
          id: "none",
          label: "No accent",
          means:
            "The achromatic identity kept exactly: the photographs are the only colour anywhere, and the paste prints no accent block.",
        },
        {
          id: "own",
          label: "The palette's own",
          means:
            "Each palette wears the hue it declares, at the primary action, the focus ring and the live dot. The paste carries it.",
        },
      ],
      recommended: "none",
      because:
        "Bible 1 is the achromatic identity, and a cool chrome already has a temperature. The switch exists so the answer is a ruling rather than an assumption.",
      evidence: "calls",
      control: "accent",
    },
    {
      id: "reach",
      question: "If an accent is on, how far should it reach?",
      context:
        "The brand token does three jobs: identity (the mark and the wireframe frames), attention (the badge, the wizard step, a toast), and standing in for a photograph where a section has none. A job left out goes back to near-black.",
      look: "The accent wall: each job on its call sites, the palette's hue beside none.",
      options: [
        {
          id: "all",
          label: "All three jobs",
          means:
            "The mark, the frames, the badge, the wizard step and the media stand-ins all take the colour.",
        },
        {
          id: "attention",
          label: "Only what asks to be noticed",
          means:
            "The badge, the wizard step and the toast take it; the mark and the frames stay near-black.",
        },
        {
          id: "identity",
          label: "Only the mark and the frames",
          means:
            "Identity takes it and attention does not, so a state colour stays the only colour in the app.",
        },
      ],
      recommended: "all",
      because:
        "A section with no photograph has all three jobs in it at once, and a narrower reach leaves the stand-in near-black.",
      evidence: "calls",
      control: "reach",
    },
    {
      id: "card",
      question: "In dark mode, should a card be solid or see-through?",
      context:
        "The product ships exactly one see-through surface and no document says so: in dark mode a card is 62 percent of a grey over what is behind it. Over a page it looks solid; over a photograph it turns to glass.",
      look: "The two cards over a photograph: the palette's own value, and today's 62 percent.",
      options: [
        {
          id: "declared",
          label: "Solid, as the palette declares it",
          means:
            "A card is an opaque surface everywhere, and the one see-through surface in the system retires.",
        },
        {
          id: "opaque",
          label: "Solid, and written down as a rule",
          means:
            "The same look, taken as an explicit rule rather than as a side effect of how the palettes are built.",
        },
        {
          id: "veil",
          label: "Keep it see-through",
          means:
            "Today's 62 percent stays, so a card lying over a photograph keeps reading as glass.",
        },
      ],
      recommended: "declared",
      because:
        "Every palette retires the veil by accident, because a colour mixed off the room is opaque. That should be a ruling, not a side effect.",
      evidence: "calls",
      control: "card",
    },
    {
      id: "faint",
      question: "Should there be a third, fainter text colour?",
      context:
        "The site has two text greys and needs three: a timestamp, a caption and a hint are all dimmer than the second. Thirty seven places fade the second grey by hand and nineteen land on the same fade, so the step already exists as a habit.",
      look: "The text steps on the page, on a card and on the panel. One colour is one grey; a fade is three.",
      options: [
        {
          id: "in",
          label: "Yes, add the third colour",
          means:
            "One new colour, so the third line is the same grey on the page, on a card and on the panel.",
        },
        {
          id: "out",
          label: "No, keep fading by hand",
          means:
            "The thirty seven places keep fading the second grey, and every ground gives a slightly different result.",
        },
      ],
      recommended: "in",
      because:
        "A fade composites against what is behind it, so the same line is a different grey on a card than on the page.",
      overrule: "A new custom property: theme.css owes it a line first.",
      evidence: "calls",
      control: "faint",
    },
  ],

  /**
   * ★ THE CANDIDATES ARE THE TWELVE, and each one is ruled where it stands. The
   * `palette` ask retired with round six: naming the one the site wears is what
   * Pick does, and the desk reads a pick as a ruling, so asking it twice was
   * asking for one item.
   */
  candidates: ITEMS,

  /**
   * ★ AND THE CATALOG IS THE EVIDENCE. Declaring this is what turns the grid
   * into the review surface: Pick drives the whole page from a card, A and B
   * drive the wipe below it, and each card carries keep, refine or kill with a
   * note.
   */
  catalog: {
    section: "catalog",
    control: "palette",
    compare: ["compare-a", "compare-b"],
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
      text: "Ten of the twelve carry a cast, re-opening a decision globals.css records as closed: zero chroma IS the brand point. The cool sets also tint the INK, against round three's own rule, because Apple's own secondary label is tinted harder than any of their greys. Ladder is here at chroma zero so both can be ruled by looking.",
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
      text: "Today ships one see-through surface, the dark card at 62 percent, and no document says so; every palette retires it silently. And an accent has to be written into the footer slab, or it reaches every surface except the mark at the foot of every page.",
      evidence: "calls",
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
      lede: "Twelve palettes, nine cool. Every ground a card declares, its text steps, and one product fragment in dark beside light, on a mix of photographs.",
      argument: [
        "WHAT COOL MEANS HERE, MEASURED. Converted to oklch, Apple's six system greys sit at hue 286 with an almost constant chroma of 0.0066, and their blue sits at 257. Rounds three to six built this board's cool cast at 258, which is the blue's hue and not the grey's, at a chroma that rose with lightness the way the warm table does. Both were wrong for a grey: a cool grey's tint is a constant property of the family, not something the light does to it. The band is now theirs, and `gain` is how far past or short of their amount a set sits.",
        "THE SHAPE OF EVERY NEW SET IS WILL'S SENTENCE. A very black ground and a very white one carry the contrast; the surfaces sitting on them are cool greys rather than slightly lighter dead ones. Today's dark mode does the opposite: a 0.140 room with four semantic surfaces crushed between 0.210 and 0.250. Onyx, Graphite, Steel and Pitch are that sentence at four distances from black, with the tint at half, one and a half, two and one and a fifth times Apple's amount.",
        "WHY CINEMA AND INK ARE NOT TWO DARKS, which is the question round three asked and no round answered. The room is the deepest thing on its own page; the slab is the only dark thing on a page of paper. So the slab has to sit LIGHTER than the room rather than deeper, and neither of them is pure black today. Every card's strip shows it as a fact: the well, the room, the slab, then the mat and the page, left to right, deepest to brightest.",
        "WHAT IS WRONG TODAY, measured rather than argued. In light mode five surfaces sit inside 0.037 of each other with the page at the top of them, so a card is its hairline and nothing else. In dark mode the panel ships LIGHTER than the card it sits in, which is the ladder upside down. And in both modes there is nothing at all between 0.450 and 0.905, which is why 37 places fade a grey by hand to get a third text step.",
        "WHAT THE WARM CARDS COST, which is the thing to check rather than take on trust. Ember is kept for one reason: to be laid beside the media grid and the album, where a warm ground and a colourful mix of photographs are in the same frame. The claim is that a cool ground makes a warm photograph read warmer and a warm ground argues with it. Press and Daylight left the board with the warm light set.",
      ],
    },
    {
      id: "compare",
      title: "Any two, side by side",
      lede: "The surface ladder under the two cards you pressed A and B on, with the seam on a slider.",
      argument: [
        "Two canvases side by side is a memory test when the step being judged is 0.02, and an eye cannot hold that across a toggle press. One canvas with the join on a slider can be dragged onto the exact surface in question instead. The lightnesses are printed underneath, read off the same strings the canvas paints, so a number here cannot drift from a colour there.",
        "THE COMPARISON THE ROUND WAS BUILT FOR is Ladder against any cool card: same rhythm, same steps, one at chroma zero and one at Apple's hue. If the cool is not visible in that wipe at 1440, it is not visible anywhere, and the whole direction is a conversation about numbers rather than about a look.",
      ],
    },
    {
      id: "calls",
      title: "The accent, and the two calls left",
      lede: "The accent on its jobs, the palette's hue beside none; then a card over a photograph, and the text steps.",
      argument: [
        "None of these is a colour a pick decides. The accent is a question about whether the achromatic identity should hold at all, and the wall answers it by putting the hue next to none at the size the call site ships at. The card is a question about opacity, and every palette changes it by accident. The third text step is a question about whether a new custom property exists, and a ruling of no means the fade stays, so the same line is a different grey on a card than on the page.",
      ],
    },
    {
      id: "pages",
      title: "The real pages",
      lede: "The production routes at true pixels, scrolled together: today left, the picked palette right, wearing the block the ruling lands.",
      argument: [
        "A composition is honest about a component and dishonest about a page. What a ground has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, the plan card in the band, and the seam where the paper ends and the footer begins. Home is the whole arc in one scroll; pricing is the densest card in the product; help is a wall of one card, which is where a wrong base shows first; contact is the panel the mat is named for.",
      ],
    },
    {
      id: "app",
      title: "The app, and the guest album",
      lede: "The densest chrome and the surface every guest sees, both modes: an event, the dashboard, the masonry on the well.",
      argument: [
        "THIS IS WHERE THE ROUND IS DECIDED. Will's objection to the warm tones was about a colourful mix of photographs, and these are the only surfaces where the product actually holds one: the dashboard's media grid, the review queue and the guest album. Read the cool cards and Ember here before reading anything else.",
        "No frame can load these: the app is behind a sign-in, so they are compositions built from production components rather than routes. The data, the counts and the copy are the board's; the components, the density and the breakpoint are real. Will's round-four note opens the app's UI to this lane, so judge the layout as well as the colour.",
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
      // picked card returns here.
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
    // A and B: the two the wipe joins, set from the catalog's cards. They open
    // on Ladder against the board's own pick, which is the comparison the whole
    // round turns on: the same rhythm at chroma zero and at Apple's hue.
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

  lookFirst: [
    {
      section: "catalog",
      state: { palette: "graphite" },
      note: "Onyx, Graphite and Steel are one answer at half, one and a half and twice Apple's tint. Read those three against each other, on the mix of photographs lying on each well, before anything else.",
    },
    {
      section: "catalog",
      state: { accent: "own" },
      note: "The accent switch on. Every card wears the one hue it declares and says why that hue for that grey; press it again for the achromatic default.",
    },
    {
      section: "compare",
      note: "Ladder against Graphite: the same rhythm at chroma zero and at Apple's hue. Drag the seam onto the card.",
    },
    {
      section: "app",
      note: "The dashboard's media grid and the guest album, which is where the round is decided. Put Ember on the board and come back: a warm ground and a colourful mix of photographs in one frame.",
    },
  ],

  notes: [
    {
      section: "catalog",
      text: "The five stand-ins on each well span gold, pastel, night blue and laser, which is a colourful mix but not a hard one. The high-key case and the candle-lit one are untested until the four hard cases land.",
    },
    {
      section: "app",
      text: "These are compositions, not routes: the breakpoint is honest because the canvas is a real width, but the data, the counts and the copy are the board's rather than a real event's.",
    },
  ],

  reading: {
    words: 2950,
    why: "Measured at 2,924. About 1,100 are the template's own: the dock lists all twelve palettes three times (165), the index reprints every lede (110), and the Rule-on panel prints every ask and every card a second time (280), on top of each card's Pick, A, B and verdict row. The board's own voice is about 950 and every argument is folded. Round six weighed 3,817 with no declaration at all.",
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
