import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE PALETTE BOARD, AS DATA (the Library x Lab migration wave, 2026-09-15).
 *
 * Nothing here is new argument. The question, the model, the eight one-word
 * calls, the departures and the two asset asks are round four's, moved out of
 * `board.tsx`, out of its `ASKS` / `DEPARTURES` / `ASSETS` string arrays and out
 * of `BoardMeta`'s props, so the template, the desk, the record and the review
 * ledger read ONE list. What changed is where a reviewer meets them: the
 * verdict and the eight calls are the first screen rather than the last.
 *
 * ★ THE CANDIDATES ARE THE REGISTERS, NOT THE SETS. This board asks two
 * questions at two different altitudes: what the ground SYSTEM is (four
 * registers and a bed) and which ladder each half of it wears. The model is the
 * proposal, so the registers are the candidates and the eleven sets are the
 * OPTIONS of the dark and light asks: a reviewer who rules the model differently
 * has ruled every set off the board, which is exactly the relationship
 * `candidates` is for.
 *
 * ★ AND EVERY SET IS STILL HERE. The wave moves the argument, it does not
 * re-argue it: six darks and five lights, thirty pairs, the same recommendation
 * (`RECOMMENDATION` in registers.ts is the single source and the ask's
 * `recommended` agrees with it by construction).
 *
 * Pure data on purpose (registry.test.ts enforces it): the board route is a
 * SERVER page and reads the question for its header, so a spec that imported
 * React, the board or its sheet would drag a client tree into a server render.
 */
export const PALETTE = defineBoard({
  id: "palette",
  title: "The palette",

  question:
    "What the ground system should be for a dark marketing site, a light body, a footer slab, an app with two modes and a guest album, and then the ladder, the accent and the panel inside it.",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template: the model, the eight calls and the case are the first screen now, and the site is judged as the real routes loaded beside today rather than as four sections portalled into a stage. No set, number or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "Named the system instead of adding to it: four registers and a bed, the dark and the light ruled separately, three new darks beside two new papers, and every page-wide switch in the dock.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "Walked cold and cut rather than added: today beside the candidate in one canvas, the temperature demoted to a switch, two counts re-measured.",
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
    "Three rounds judged a ramp and inherited the shape of the thing they were judging: a list of grounds with no statement of what a ground IS. Will's round-three review asked the question none of them had answered, 'what's the difference between cinema and ink?', and behind it whether the board was elevating a bad colour system it was stuck in. Round four answered it from the ground up, and the answer reorganised the board: cinema and ink are one mode's two grounds, not two darks.",

  verdict: {
    recommendation:
      "Four registers and a bed, ruled as two halves: Ember on the dark side, Paper on the light one, Flare on all three accent jobs, the mat as a register and the missing step in.",
    because:
      "Ruling the two sides separately is what produced it, and no earlier round could have: warming had only ever been askable about both modes at once. On a dark ground the cast is doing work, skin against a room and a room that stops reading as a dead screen; on paper the same cast is a tax paid by every white dress. Warm the room, leave the page a true grey.",
    overrule:
      "If zero chroma is the brand point exactly as globals.css records it, Ladder is Ember's rhythm at chroma 0 and every other reading on the board is unchanged.",
  },

  asks: [
    {
      id: "model",
      question: "The model",
      options: ["registers", "grounds"],
      recommended: "registers",
      because:
        "Two modes, two grounds inside each, and one well that belongs to neither, against today's five unnamed grounds plus a literal. Cinema is the room and ink is the slab, so the rework is naming two jobs a side rather than adding a sixth value.",
      overrule:
        "It costs a new class (.surface-mat) and a renamed idea. Keeping today's five grounds costs nothing and leaves the panel an alpha.",
      evidence: "model",
    },
    {
      id: "dark",
      question: "The dark set",
      options: ["today", "ladder", "room", "ember", "slate", "lift"],
      recommended: "ember",
      because:
        "A room with a cast is a room rather than a dead screen, and it is the half of the old temperature switch that was always worth having. Ladder is the same rhythm at chroma 0 for anyone who wants the zero-chroma decision kept.",
      overrule:
        "Lift is the one set that contradicts the model's dark half: one register, no slab.",
      evidence: "ladders",
    },
    {
      id: "light",
      question: "The light set",
      options: ["today", "paper", "bright", "warm", "cool"],
      recommended: "paper",
      because:
        "A true grey page: the cast that earns its keep on a room is a tax on paper, paid by every white dress and every document. Paper is also the set that opens the card step today does not have.",
      evidence: "ladders",
    },
    {
      id: "accent",
      question: "The accent",
      options: ["ink", "blue", "violet", "flare"],
      recommended: "flare",
      because:
        "The one warm gap on the wheel, 45 degrees off --like and 30 off --reel, nowhere near a state colour. It is the only option that is ours alone, and it reads as a party rather than as software.",
      overrule:
        "It is a new hue to hold, and at a 6px dot it has to stay apart from --reel violet.",
      evidence: "accent",
    },
    {
      id: "reach",
      question: "The accent's reach",
      options: ["all", "attention", "identity"],
      recommended: "all",
      because:
        "Rule 1 gives the accent a mandate where there is no media, and a section with no photograph has all three jobs in it. A narrower reach leaves the stand-in ink, which is the binary the rule was rewritten to kill.",
      evidence: "accent",
    },
    {
      id: "mat",
      question: "The set-apart panel",
      options: ["register", "alphas"],
      recommended: "register",
      because:
        "A band, a form panel and a facts strip are the same job, and today they are --muted at six alphas of a token that also does hover. On a 0.99 page, 40 percent is a one percent step.",
      evidence: "mat",
    },
    {
      id: "faint",
      question: "The missing step",
      options: ["in", "out"],
      recommended: "in",
      because:
        "Thirty seven sites dim the second step by hand and nineteen of them land on exactly the same alpha. One token makes the third line the same grey on the page, on a card and on the mat.",
      overrule:
        "It is a new custom property, so theme.css owes it a line before a text-faint utility exists.",
      evidence: "text",
    },
    {
      id: "card",
      question: "The dark card",
      options: ["declared", "opaque", "veil"],
      recommended: "declared",
      because:
        "Every candidate silently retires the system's one translucent surface, because a color-mix off the room is opaque. That should be a ruling rather than a side effect, and the case it matters in is a card over a photograph.",
      evidence: "depth",
    },
  ],

  /**
   * ★ NONE OF THESE IS "RECOMMENDED", AND THAT IS NOT AN OMISSION. The flag
   * marks the one a board lands on among RIVALS; these five are one proposal
   * with five parts, and their rival is the other option of the model ask
   * ("grounds", today's five unnamed values plus a literal). Marking all five
   * printed "the board's answer" five times, which reads as five competing
   * answers to a question nobody asked.
   */
  candidates: [
    {
      id: "room",
      name: "The room (.dark)",
      rationale:
        "The page in dark mode: the deepest ground a reader stands in, and the one everything else is read against. Every dark marketing chapter takes it, so cinema is this rather than a third value, and so does the app's dark mode. Today it is two values pretending to be one, 0.140 and a 0.110 override.",
    },
    {
      id: "slab",
      name: "The slab (.surface-ink)",
      rationale:
        "A dark leaf inside a light page, so it sits LIGHTER than the room: a room dropped into paper reads as a hole. It takes the footer on every marketing page. Today it is derived from the well at 0.155 and declares no card, popover or input, so a Card in the footer renders in the paper card colour.",
    },
    {
      id: "paper",
      name: "The paper (:root, .surface-paper)",
      rationale:
        "The page in light mode: the brightest ground, and the one a card has to lift off. It takes the marketing body and the app in light mode. Today it is 0.990 with the card at 0.997 and the menu at 0.997, so five surfaces sit inside 0.037 and a card is its hairline and nothing else.",
    },
    {
      id: "mat",
      name: "The mat (.surface-mat, new)",
      rationale:
        "The set-apart ground on paper: a band, a form panel, a facts strip, with the card back at the top so a card on a mat still lifts. Today it is not a register at all, it is --muted at six alphas of a token that also does hover, and 40 percent over 0.990 is a one percent step.",
    },
    {
      id: "well",
      name: "The well (--gallery)",
      rationale:
        "The bed a photograph is laid on. Always dark and belonging to neither mode, because a light page does not want a bright hole where an image has not decoded. Today it is 0.155 doing the slab's job too, and the deepest surface in the product is a literal instead, bg-black/90.",
    },
  ],

  departures: [
    {
      id: "the-model",
      from: 16,
      text: "The model itself is the departure. Bible 16 counts four grounds; counted by the job they do there are five plus a literal (cinema 0.110, the app 0.140, the leaf 0.155, paper 0.990 and the contact card's panel, plus media-lightbox.tsx:617's bg-black/90). Ruling it in means a new class, .surface-mat, and a renamed idea, not a new palette.",
      evidence: "model",
    },
    {
      id: "the-cast",
      from: "ruling",
      text: "Four of the eleven sets carry a cast, which re-opens a decision globals.css records as closed: zero-chroma purity IS the brand point, and saturating the neutrals was consciously declined. Splitting the ruling is what makes it answerable, because the case for a warm room and the case for a warm page are not the same case, and this board takes one and refuses the other.",
      evidence: "ladders",
    },
    {
      id: "temperature-as-a-set",
      from: "precedent",
      text: "Round three cut candidate C for moving no step. It does not come back as a letter: the cast is a property four sets carry, each moving its own lightnesses too, and the transform at gain 1 still reproduces C's five published blocks token for token (registers.test.ts). Warm on a derived set is one press rather than a fourth column.",
      evidence: "ladders",
    },
    {
      id: "lift-contradicts",
      from: "precedent",
      text: "Lift argues that dark needs ONE register, not two. Every other set lifts the slab above the room because a 0.14 room dropped into paper reads as a hole; Lift starts the room at 0.195, where that stops being true, and declares the slab equal to it. It is the only candidate that contradicts the model's dark half.",
      evidence: "ladders",
    },
    {
      id: "accent-in-the-slab",
      from: "precedent",
      text: "The accent has to be written into the slab or it never reaches the footer. Today the leaf declares --brand: var(--gallery-foreground), and a class rule outranks a value inherited from the page around it, so a hue ruled for the whole site would reach every surface except the mark at the bottom of every page.",
      evidence: "accent",
    },
    {
      id: "the-veil",
      from: "precedent",
      text: "Round one's departure list said only the derived set kept the system's one translucent surface. That was wrong: a color-mix off the room is fully opaque, so every candidate retires the veil and none of them said so. The card ask makes it a ruling rather than a side effect.",
      evidence: "depth",
    },
  ],

  assets: [
    {
      what: "Four hard cases inside the media kit's shot list",
      spec: "One high key (a white dress against a white wall), one low key (a dance floor lit by one lamp), one candle-warm, one stage-cool: four of the media-kit track's 36 masters at 1600px long edge, landscape, one grade. A line on that shot list rather than a second delivery.",
      replaces:
        "the four stand-ins this board renders most (wedding-golden, party-balloons, concert-confetti, reception-table).",
    },
    {
      what: "A portrait pair for the guest masonry",
      spec: "Two of the same 36 at 1600px long edge, PORTRAIT, the same grade. Every stand-in in the kit but one is landscape, so the column flow the guest album actually ships is being faked.",
      replaces: "the hand-set tile ratios in specimens.tsx.",
    },
  ],

  sections: [
    {
      id: "model",
      title: "The model",
      lede: "Two modes, two grounds inside each, and one media well that belongs to neither, with the cinema-versus-ink answer in one sentence and the selected pair's grounds printed under it.",
      argument: [
        "Judged from the ground up, as if none of today's greys existed. The product has a dark marketing site, a light marketing body, a dark footer on every page of it, an app with two themes and a guest surface that is the host's event rather than ours. Counted by the job they do that is four grounds and one bed, and today it is five unnamed values plus a literal black nobody wrote down.",
        "Cinema and ink are not two darks. Cinema is the room a dark chapter sits in, the deepest thing on its own page; ink is the slab a dark leaf makes on a light one, the only dark thing on a page of paper. That is why the slab has to sit LIGHTER than the room rather than deeper, and why neither of them is pure black today. Every candidate below is an answer inside this model rather than a rival to it.",
      ],
      wiring: [
        "Ruling the model in costs one new class, .surface-mat, and a rename: the panel sites become sections that carry it. Nothing else in the model is new code, because the room, the slab, the paper and the well all exist; they are being named and given one ladder each.",
      ],
    },
    {
      id: "ladders",
      title: "The two ladders",
      lede: "Every value of each set on the black-to-white line, then the tables, then the six state hues under each: a set is not finished until the colours it must never be confused with still read on it.",
      argument: [
        "Today's ladder shows the whole system at a glance: a crowd at each end and a 0.455 hole in the middle, where 37 call sites reach for a step by dimming the one above it. The dark sets first, then the light ones, each ruled on its own.",
        "The ruler interpolates in oklab, so a tick's position IS its lightness. In sRGB the same gradient puts L 0.6 at the halfway mark and the whole reading would be a lie. The hole and the crush are geometry, not opinion, which is why they belong on a ruler rather than in a paragraph.",
      ],
    },
    {
      id: "stack",
      title: "A menu over a card",
      lede: "The frame both halves are judged on, today beside the selected set in one canvas, because a step of 0.02 is exactly the thing an eye cannot hold across a toggle press.",
      argument: [
        "The room first: today's is 0.14, card 0.21 at 62 percent, panel 0.245, menu 0.23, hover 0.25, which is five surfaces inside 0.11 with two of them the wrong way round. Then the same frame on paper, where today's five sit inside 0.037 and a card is its hairline and nothing else.",
      ],
    },
    {
      id: "registers",
      title: "The registers, counted",
      lede: "Three surfaces that all read as the dark one and want different things (the lightbox literal, the well, the slab), on paper because the slab's whole job is to sit on a light page.",
    },
    {
      id: "pages",
      title: "The real site, today beside the pair",
      lede: "The production routes at true pixels, loaded twice and scrolled together: today on the left, the selected pair on the right, wearing the exact block the ruling lands.",
      argument: [
        "A composition is honest about a component and dishonest about a page. What a ground has to survive is the rest of the page: the photograph beside the card, the CTA under the chapter, the plan card in the band, the seam where the paper ends and the footer begins. Rounds one to four portalled four production sections into a stage; these are the pages themselves, same origin, at 1440 or 375, with the candidate written into each document.",
        "Home is the arc: room into paper into slab, with the footer seam and the mark that only carries the accent if the slab declares it. Pricing is the densest card in the product on the paper and then on the mat. Help is a wall of one card, which is where a wrong base shows first. Contact is the fifth ground, the one the mat is named for. The guest album is the well, and the one page every guest sees.",
      ],
    },
    {
      id: "app",
      title: "The host app, in both modes",
      lede: "The densest chrome in the product: an event page's header, stat band and review queue, then the dashboard with the real cards and a panel inside a card. Four crushed dark surfaces at once.",
      argument: [
        "No frame can load these: the app is behind a sign-in, so they are compositions built from production primitives rather than routes. Will's round-four note opens the app's UI to this lane, so judge the layout as well as the colour.",
      ],
    },
    {
      id: "album",
      title: "The guest album, on the well",
      lede: "The masonry at 3px gaps and 3px tile radius, one tile still uploading, one well with nothing in it yet, in both modes, because the well is the model's one claim that should not move between them.",
    },
    {
      id: "floating",
      title: "The floating layer",
      lede: "The production Dialog, DropdownMenu and Popover. They portal to the body, so each button applies the pair to this page first and then opens, which is what a menu in production is painted by.",
      argument: [
        "This is the one place a set with no card step still has to work, because a floating surface has nothing but --popover, the ring and --shadow-float to separate it from the page behind it.",
      ],
    },
    {
      id: "depth",
      title: "Depth, and the card over a photograph",
      lede: "A shadow has to be darker than what it falls on, so a cue and a step fail together; then the card as this set declares it, against today's 62 percent, over a photograph.",
      argument: [
        "The light exploration's proposed family (lift on two overlapping photographs, float on a menu over a card) plus the ring nobody wrote down, rendered on this pair's grounds. These values are not in this board's paste: depth is that track's lane, and they live here so the two can be judged in one look.",
        "Today ships exactly one translucent surface in the whole system and no document says so. Every candidate here retires it, because a color-mix off the room is fully opaque. The card switch in the dock makes that a ruling: declared is the set's own answer, opaque is it forced solid, veil is today's 62 percent kept.",
      ],
    },
    {
      id: "mat",
      title: "The mat, on its real sites",
      lede: "The set-apart ground of bible 16 on the sites it ships on, with the switch putting every one of them on the ruled register instead of on an alpha of a token that also does hover.",
    },
    {
      id: "text",
      title: "The text steps, in real copy",
      lede: "Every text step with a real line at it, on the grounds type lands on: the page, a card, the panel. The hole is only a hole once you try to write the third line.",
      argument: [
        "In: the third line is one token, so it is the same grey on the page, on a card and on the mat, and the ladders have a rung at it. Out: it stays 70 percent of the second step, so it composites against whatever is behind it and every ground gives a different faint, which is where today already is.",
      ],
    },
    {
      id: "accent",
      title: "The accent, by the job it does",
      lede: "Rule 1 gives the accent a mandate where there is no media, so the first question is not which hue but which job. All four render side by side on each job, with the state hues at the foot.",
      argument: [
        "Today one token does three jobs: identity (the mark, the frames family), attention (the badge, the wizard step, the toast) and standing in for a photograph where a section has none. A ruling can hand the hue any subset of them, and a job outside the ruled reach falls back to ink, which is exactly what the ruling would land.",
      ],
    },
    {
      id: "paste",
      title: "The ruling, as a paste",
      lede: "The selected pair as the block that lands in globals.css and marketing.css, with the card question, the missing step and the accent folded in exactly as the board is showing them.",
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
      id: "dark",
      label: "Dark",
      options: [
        { id: "today", label: "Today" },
        { id: "ladder", label: "Ladder" },
        { id: "room", label: "One room" },
        { id: "ember", label: "Ember" },
        { id: "slate", label: "Slate" },
        { id: "lift", label: "Lift" },
      ],
      default: "ember",
    },
    {
      id: "light",
      label: "Light",
      options: [
        { id: "today", label: "Today" },
        { id: "paper", label: "Paper" },
        { id: "bright", label: "Bright" },
        { id: "warm", label: "Warm" },
        { id: "cool", label: "Cool" },
      ],
      default: "paper",
    },
    {
      id: "accent",
      label: "Accent",
      options: [
        { id: "ink", label: "Ink" },
        { id: "blue", label: "Blue" },
        { id: "violet", label: "Violet" },
        { id: "flare", label: "Flare" },
      ],
      default: "flare",
    },
    {
      id: "reach",
      label: "Reach",
      options: [
        { id: "all", label: "All" },
        { id: "attention", label: "Attention" },
        { id: "identity", label: "Identity" },
      ],
      default: "all",
    },
    {
      id: "mat",
      label: "Mat",
      options: [
        { id: "register", label: "Register" },
        { id: "alphas", label: "Alphas" },
      ],
      default: "register",
    },
    {
      id: "faint",
      label: "Faint",
      options: [
        { id: "in", label: "In" },
        { id: "out", label: "Out" },
      ],
      default: "in",
    },
    {
      id: "card",
      label: "Card",
      options: [
        { id: "declared", label: "Declared" },
        { id: "opaque", label: "Opaque" },
        { id: "veil", label: "Veil" },
      ],
      default: "declared",
    },
  ],

  lookFirst: [
    {
      section: "model",
      note: "The model first. It is the only ask whose answer changes what the other seven mean, and the cinema-versus-ink sentence is the round-three question answered.",
    },
    {
      section: "stack",
      state: { dark: "today", light: "today" },
      note: "The frame with today on both sides, so the eye has the thing being changed before anything changes it.",
    },
    {
      section: "stack",
      state: { dark: "ember", light: "paper" },
      note: "The same frame under the board's own pair. Two halves, one canvas: the step is 0.02 and an eye cannot hold that across a toggle press.",
    },
    {
      section: "pages",
      note: "The real home arc, today on the left and the pair on the right, scrolled together. The seam where the paper ends and the slab begins is the reading.",
    },
    {
      section: "ladders",
      state: { dark: "lift" },
      note: "Lift on the ruler: the one set that contradicts the model's dark half by declaring the slab equal to the room.",
    },
    {
      section: "accent",
      state: { accent: "flare", reach: "all" },
      note: "The four hues on the three jobs at once. Then drop the reach to identity and watch the stand-in go back to ink, which is the binary rule 1 was rewritten to kill.",
    },
    {
      section: "paste",
      note: "The block the ruling lands, generated from whatever the dock is claiming. Apply it and walk the pages under it.",
    },
  ],

  notes: [
    {
      section: "ladders",
      text: "Four of the eleven sets carry a cast, and a cast is only ever wrong against media that fights it. Every stand-in on this board is mid-key and warm, so the high-key end of Warm and the candle-lit end of Slate are both going untested until the four hard cases land.",
    },
    {
      section: "app",
      text: "These are compositions, not routes, and that is a limit worth knowing while reading them: a breakpoint is honest because the frame is a real viewport, but the data, the counts and the copy are the board's rather than a real event's.",
    },
    {
      section: "depth",
      state: { card: "veil" },
      text: "Veil is today, kept: 62 percent of the room over whatever is behind it. It is the only translucent surface in the system and no document says so, which is the whole reason this is an ask.",
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
