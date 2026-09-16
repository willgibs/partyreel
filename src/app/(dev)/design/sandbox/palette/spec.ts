import { defineBoard } from "@/components/lab/board-spec";

import { PALETTE_OPTIONS, PALETTES } from "./palettes";

/**
 * THE PALETTE BOARD, AS DATA (round six, the clarity round, 2026-09-15).
 *
 * ★ THE ROUND IS A SUBTRACTION, AND WILL'S NOTE IS THE WHOLE BRIEF: "for the
 * new palette exploration, it almost feels like I'm reading a PhD on color
 * theory. We're simply exploring new color palettes... a dozen polished
 * variants with preview palettes with some demo UI to config & compare would've
 * been far more helpful than this massive mountain we've created. Then I end up
 * with six configs that aren't clearly explained." So: thirteen sections became
 * six, eight asks became four, and seven switches became one. Nothing in the
 * argument was withdrawn; it is underneath, collapsed, which is where an
 * argument belongs once there is an answer above it.
 *
 * ★ THE TWELVE OPTIONS ARE WRITTEN OUT HERE AND NOWHERE ELSE, and that is not
 * laziness about DRY, it is the desk. The review scanner reads a spec as TEXT
 * rather than importing it (so a board's asks can be read without running a
 * client tree), so an `options` built by a `.map` over another module reads as
 * an ask with no answers at all. `lab-review.test.ts` caught exactly that. The
 * structure of a palette lives in `palettes.ts`, the WORDS live here, and
 * `registers.test.ts` pins the two lists equal id for id and label for label.
 * The candidates may be computed, because nothing scans those.
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React, the board or its sheet would drag a client tree into a server render.
 * `palettes.ts` is plain TypeScript for exactly the same reason.
 */
export const PALETTE = defineBoard({
  id: "palette",
  title: "The palette",

  question:
    "Which of twelve finished palettes should the site wear, and then the three calls that are still open once one is picked?",

  round: {
    n: 6,
    date: "2026-09-15",
    changed:
      "Rebuilt as a catalog: twelve finished palettes, each a card carrying its own grounds, text steps, accent and state colours plus a real piece of the product in dark beside light. Seven switches became one, eight asks became four, thirteen sections became six. No value changed.",
  },
  history: [
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
    "Five rounds built a machine rather than a choice: six dark sets, five light ones, four accents and five switches, which is hundreds of reachable states and no answer in any of them. The colour work behind it stands and none of it was thrown away. What changed is that somebody chose: twelve of those states are finished palettes with names, and the rest is collapsed underneath them.",

  verdict: {
    recommendation:
      "Ember: a warm dark room, a true grey page, and flare as the accent, with the set-apart panel given a ground of its own.",
    because:
      "A warm cast does real work on a dark ground, where skin has to read against a room and a room should not look like a dead screen, and it is a tax on paper, where every white dress and every document pays it. So warm the room and leave the page a true grey. Flare is the one hue left on the wheel that is nowhere near a state colour and is ours alone.",
    overrule:
      "If zero chroma is the brand point exactly as globals.css records it, Ladder is Ember with the warmth taken out and nothing else on the board changes.",
  },

  asks: [
    {
      id: "palette",
      question: "Which palette should the site wear?",
      context:
        "A palette here is a whole answer rather than a swatch: the dark room a marketing chapter sits in, the lighter slab the footer makes on a light page, the page itself, the set-apart panel on it, the bed a photograph lies on, all the text greys, and one accent colour. Twelve of them, each named for what it is.",
      look: "The catalog: twelve cards, each with its grounds as a strip, the accent and the six state colours under them, and the same piece of the product in dark beside light. Nothing to switch.",
      options: [
        {
          id: "today",
          label: "Today",
          means:
            "The site exactly as it ships: three darks with no ladder, a near-white page where a card is its hairline, no accent.",
        },
        {
          id: "ember",
          label: "Ember",
          means: "A warm dark room, a true grey page, the flare accent.",
        },
        {
          id: "ladder",
          label: "Ladder",
          means:
            "A neutral dark in three real steps, a true grey page, the flare accent. Ember with the warmth taken out.",
        },
        {
          id: "slate",
          label: "Slate",
          means:
            "A cold dark room, a daylight page, and the blue already in the system as the accent.",
        },
        {
          id: "gallery",
          label: "Gallery",
          means:
            "A neutral dark in three steps, a daylight page on a dead grey mat, and no accent colour at all.",
        },
        {
          id: "studio",
          label: "Studio",
          means:
            "One dark room with every surface derived from it, a page where the card IS the paper, no accent.",
        },
        {
          id: "loft",
          label: "Loft",
          means:
            "A dark that is never black, a page where the card is the paper, and the reel's violet as the accent.",
        },
        {
          id: "press",
          label: "Press",
          means:
            "Warm on both sides: a warm dark room and warm uncoated paper, with the flare accent.",
        },
        {
          id: "reel",
          label: "Reel",
          means:
            "A cold dark room, a true grey page, and the product's own violet as the accent.",
        },
        {
          id: "signal",
          label: "Signal",
          means:
            "One derived dark room, a true grey page, and the save blue promoted: no new hue anywhere.",
        },
        {
          id: "daylight",
          label: "Daylight",
          means:
            "A warm dark room against a daylight page, with the flare accent. The cast flips at the seam.",
        },
        {
          id: "dusk",
          label: "Dusk",
          means:
            "A warm dark room and today's near-white page kept exactly as it is, with the flare accent.",
        },
      ],
      recommended: "ember",
      because:
        "Warm the room and leave the page alone. The cast earns its keep on a dark ground and costs on paper, and no earlier round could ask it that way, because warming used to be one switch over both modes at once.",
      overrule:
        "Ladder is the same palette with the warmth removed, for keeping zero chroma.",
      evidence: "catalog",
      control: "palette",
    },
    {
      id: "reach",
      question: "How far should the accent colour reach?",
      context:
        "The accent does three jobs today, all from one token: identity (the logo mark, and the wireframe frames that stand in for photographs), attention (the notification badge, the active step of the create wizard, a toast), and standing in for a photograph where a section has none. A ruling can hand the colour any of them, and a job left out goes back to near-black.",
      look: "The calls section, the accent wall: the three jobs in a row on their real call sites, in both modes, with the six state colours underneath so the accent is judged against what it must never be confused with.",
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
        "A section with no photograph in it has all three jobs in it at once. A narrower reach leaves the stand-in near-black, which is the all-or-nothing the rule was rewritten to kill.",
      evidence: "calls",
      control: "reach",
    },
    {
      id: "card",
      question: "In dark mode, should a card be solid or see-through?",
      context:
        "The product ships exactly one see-through surface and no document says so: in dark mode a card is 62 percent of a grey over whatever is behind it. Over a page it looks solid; over a photograph it turns into glass. Every palette here makes it solid unless this says otherwise.",
      look: "The calls section, the two cards lying over a photograph: the same card at the palette's own value, forced solid, and forced back to today's 62 percent.",
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
        "Every palette on the board retires the see-through card by accident, because a colour mixed off the room is opaque. That should be a ruling rather than a side effect.",
      evidence: "calls",
      control: "card",
    },
    {
      id: "faint",
      question: "Should there be a third, fainter text colour?",
      context:
        "The site has two text greys and needs three: a timestamp, a caption and a hint are all dimmer than the second one. Thirty seven places in the product get there by fading the second grey by hand, and nineteen of them land on exactly the same fade, so the third step already exists as a habit.",
      look: "The calls section, the text steps: the same three lines on the page, on a card and on the panel. One colour is one grey on all three; a fade is three different greys.",
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
        "A fade composites against whatever is behind it, so the same line is a different grey on a card than on the page. One colour makes it one grey.",
      overrule:
        "It is a new custom property, so theme.css owes it a line before a utility exists.",
      evidence: "calls",
      control: "faint",
    },
  ],

  /**
   * ★ THE CANDIDATES ARE THE TWELVE, which is the round's whole point. Rounds
   * one to five had to make the REGISTERS the candidates, because the sets were
   * options of two separate asks and no single object on the board was ever a
   * complete answer. Now one is.
   */
  candidates: PALETTES.map((p) => ({
    id: p.id,
    name: p.name,
    rationale: p.why,
    ...(p.recommended ? { recommended: true } : null),
  })),

  departures: [
    {
      id: "the-model",
      from: 16,
      text: "Bible 16 counts four grounds; counted by the job they do there are five plus a literal (a marketing room at 0.110, the app at 0.140, the footer leaf at 0.155, paper at 0.990 and the contact card's unnamed panel, plus media-lightbox.tsx:617's bg-black/90). Every palette here answers with four registers and a bed, which costs one new class and a renamed idea rather than a new colour.",
      evidence: "catalog",
    },
    {
      id: "the-cast",
      from: "ruling",
      text: "Six of the twelve carry a warm or a cool cast on at least one side, which re-opens a decision globals.css records as closed: zero chroma IS the brand point, and tinting the neutrals was consciously declined. Ruling the two sides in one object is what makes it answerable, because the case for a warm room and the case for a warm page are not the same case.",
      evidence: "catalog",
    },
    {
      id: "the-veil",
      from: "precedent",
      text: "Today ships one see-through surface in the whole system, the dark card at 62 percent, and no document says so. Every palette here retires it silently, because a colour mixed off the room is opaque. The card ask makes it a ruling instead of a side effect.",
      evidence: "calls",
    },
    {
      id: "accent-in-the-slab",
      from: "precedent",
      text: "The accent has to be written into the footer slab or it never reaches the bottom of any page. .surface-ink declares --brand itself today, and a class rule outranks a value inherited from the page around it, so a hue ruled for the whole site would reach every surface except the mark at the foot of every page.",
      evidence: "calls",
    },
    {
      id: "one-dark-register",
      from: "precedent",
      text: "Loft and Studio collapse the footer slab into the room, so dark has one ground instead of two. Every other palette lifts the slab, because a room dropped into a light page reads as a hole. At Loft's lightness that stops being true, which is a real disagreement about the model rather than a different number.",
      evidence: "catalog",
    },
  ],

  assets: [
    {
      what: "Four hard cases inside the media kit's shot list",
      spec: "One high key (a white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm, one stage-cool: four of the media-kit track's 36 masters at 1600px long edge, landscape, one grade. A line on that shot list rather than a second delivery.",
      replaces:
        "the two stand-ins every catalog card lays on the well (wedding-golden, party-balloons), which are both mid-key and warm.",
    },
    {
      what: "A portrait pair for the guest masonry",
      spec: "Two of the same 36 at 1600px long edge, PORTRAIT, the same grade. Every stand-in in the kit but one is landscape, so the column flow the guest album actually ships is being faked.",
      replaces: "the hand-set tile ratios in specimens.tsx.",
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The catalog",
      lede: "Twelve finished palettes. Each card carries every ground it declares, the text on them, the accent and the six state colours in both modes, and one piece of the product built from the real components, dark beside light.",
      argument: [
        "THE MODEL UNDER ALL TWELVE. A page picks a mode, dark or light. A section inside it picks one of that mode's two grounds and never a third: on dark that is the room a chapter sits in or the slab the footer makes, on light it is the page or the set-apart panel. Media picks nothing, because a photograph lies on the same bed in both modes, which is why the well belongs to neither. Four registers and a bed, against today's five values nobody named plus a literal black in the lightbox nobody wrote down.",
        "WHY CINEMA AND INK ARE NOT TWO DARKS, which is the question round three asked and no round answered. The room is the deepest thing on its own page; the slab is the only dark thing on a page of paper. So the slab has to sit LIGHTER than the room rather than deeper, and neither of them is pure black today. Every card's strip shows it as a fact: the well, the room, the slab, then the panel and the page, left to right, deepest to brightest.",
        "WHAT IS WRONG TODAY, measured rather than argued. In light mode five surfaces sit inside 0.037 of each other with the page at the top of them, so a card is its hairline and nothing else. In dark mode the panel ships LIGHTER than the card it sits in, which is the ladder upside down. And in both modes there is nothing at all between 0.450 and 0.905, which is why 37 places fade a grey by hand to get a third text step.",
        "HOW TWELVE WERE CHOSEN out of the hundreds the old switches allowed. Each one is a coherent answer somebody could prefer for a reason they could say out loud: a warmer room, a page that stays white, no new hue to hold anywhere, the smallest possible change, or nothing coloured at all. Two that differ only in a number are one, which is why there are twelve rather than thirty.",
      ],
    },
    {
      id: "compare",
      title: "Today, and the one you picked",
      lede: "The surface ladder in one frame (the page, a card, a panel inside it, an input and a menu over the lot) with today underneath and the picked palette on top, and the seam on a slider.",
      argument: [
        "Two canvases side by side is a memory test when the step being judged is 0.02, and an eye cannot hold that across a toggle press. One canvas with the join on a slider can be dragged onto the exact surface in question instead. The lightnesses are printed underneath, read off the same strings the canvas paints, so a number here cannot drift from a colour there.",
      ],
    },
    {
      id: "calls",
      title: "The three calls left",
      lede: "What is still open once a palette is picked, each on the surface it is decided on: the accent on its three jobs, a card lying over a photograph, and the three text steps on the three grounds type lands on.",
      argument: [
        "None of these is a colour, which is why they survive the catalog. The accent's reach is a question about which call sites read the token. The card is a question about opacity, and every palette changes it by accident. The third text step is a question about whether a new custom property exists at all, and a ruling of no means the fade stays, so the same line is a different grey on a card than on the page.",
      ],
    },
    {
      id: "pages",
      title: "The real pages",
      lede: "The production routes at true pixels, loaded twice and scrolled together: today on the left, the picked palette on the right, wearing the exact block the ruling lands.",
      argument: [
        "A composition is honest about a component and dishonest about a page. What a ground has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, the plan card in the band, and the seam where the paper ends and the footer begins. Home is the whole arc in one scroll; pricing is the densest card in the product; help is a wall of one card, which is where a wrong base shows first; contact is the panel the mat is named for.",
      ],
    },
    {
      id: "app",
      title: "The app, and the guest album",
      lede: "The densest chrome in the product and the one surface every guest sees: an event page, the dashboard with its real cards, and the masonry lying on the well, in both modes.",
      argument: [
        "No frame can load these: the app is behind a sign-in, so they are compositions built from production components rather than routes. The data, the counts and the copy are the board's; the components, the density and the breakpoint are real. Will's round-four note opens the app's UI to this lane, so judge the layout as well as the colour.",
      ],
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The picked palette as the block that lands in globals.css and marketing.css, with the three remaining calls folded in exactly as the board is showing them.",
      wiring: [
        "theme.css needs --color-faint: var(--faint) in its @theme inline block before a text-faint utility exists; the board reaches the token with an arbitrary value, so nothing here depends on that line landing first. And .surface-mat is a new class: the token block lands with the paste, and the 35 sites that write bg-muted/N today become sections that carry it, which is a mechanical follow-up rather than part of this ruling.",
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
      note: "Read the twelve. The name and the line say what each one is; the strip and the two panels under it are the whole palette, so nothing has to be switched to compare them.",
    },
    {
      section: "catalog",
      state: { palette: "ember" },
      note: "The board's own pick, marked with a dot. Ember and Ladder are the same palette with and without the warmth, so read those two against each other first.",
    },
    {
      section: "compare",
      state: { palette: "ember" },
      note: "Drag the seam onto the card. Today's dark panel is lighter than the card it sits in, which is the ladder upside down, and it is four pixels from the fix.",
    },
    {
      section: "calls",
      state: { reach: "identity" },
      note: "The accent narrowed to the mark and the frames, so the media stand-ins fall back to near-black. That is the all-or-nothing the rule was rewritten to kill.",
    },
    {
      section: "pages",
      note: "The real home arc, today on the left and the picked palette on the right, scrolled together. The seam where the paper ends and the footer begins is the reading.",
    },
    {
      section: "paste",
      note: "The block the ruling lands, generated from whatever the dock is claiming. Apply it and walk the pages under it.",
    },
  ],

  notes: [
    {
      section: "catalog",
      text: "A cast is only ever wrong against media that fights it, and both stand-ins on the well are mid-key and warm. The high-key end of Press and the candle-lit end of Slate are going untested until the four hard cases land.",
    },
    {
      section: "app",
      text: "These are compositions, not routes, and that is worth knowing while reading them: the breakpoint is honest because the canvas is a real width, but the data, the counts and the copy are the board's rather than a real event's.",
    },
    {
      section: "calls",
      state: { card: "veil" },
      text: "See-through is today, kept: 62 percent of the room over whatever is behind it. It is the only surface in the system like that and no document says so, which is the whole reason this is asked.",
    },
  ],

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
