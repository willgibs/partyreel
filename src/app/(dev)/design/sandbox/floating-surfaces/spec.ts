import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE FLOATING-SURFACES BOARD, AS DATA (round six, the revamp, 2026-09-16).
 *
 * ★ THE ROUND IS A CATALOG AND A SUBTRACTION. Will's ruling is the whole brief:
 * an exploration returns "a few of our best concepts created for review, pick
 * the best direction and refine for production polish", ruled on card by card,
 * and "designing a few variations always beats a mountain of research text".
 * So twelve sections became four, five asks became four, the board's 5,040
 * words outside its folds became a grid, and the three directions became seven
 * finished floating layers with a name, a line, four facts and a live menu.
 * Nothing in the argument was withdrawn; it is underneath, collapsed, which is
 * where an argument belongs once there is an answer above it.
 *
 * ★ AN ASK IS ANSWERABLE COLD, AND THE EVIDENCE CARRIES THE OPTIONS' WORDS.
 * Every ask says what the thing is, where it lives, where to look, and what
 * each option would do. The ids never changed: the ledger joins on them. The
 * option LABELS are also the frame titles and the ladder columns
 * (`constants.ts` reads them back through `askOptionLabel`), so the words on
 * the question and the words over the specimen cannot drift apart.
 *
 * ★ AND THIS FILE IMPORTS NOTHING BUT THE SPEC TYPES, on purpose. A spec is
 * read twice over: by `registry.ts` from a SERVER page, and by
 * `scripts/lab-review.mjs` with a masking scanner that has no build step and
 * finds the board at the first `{` after `defineBoard(`. A second import above
 * the call is enough to hand that scanner the wrong object, and the failure is
 * quiet: every ask is reported as "not an ask on this board".
 */

/**
 * THE SEVEN, WRITTEN OUT. Never a `.map` over `directions.ts`: the review
 * scanner reads a spec as TEXT, `pnpm lab:review` resolves `candidates: ITEMS`
 * one hop to this const, and a computed list reads as no items at all, so every
 * ruling on a card would be refused (the palette board learned it twice).
 *
 * What lives HERE is the words and the four facts a reviewer compares across
 * seven cards; the CSS, the anatomy and the costs live in `directions.ts`. The
 * verdict is the BOARD's own call, drawn as the card's pill, not the
 * reviewer's: Will answers each card keep, refine or kill in the row under it.
 */
const ITEMS: readonly Candidate<"catalog" | "desk" | "calls" | "pages">[] = [
  {
    id: "today",
    name: "Today",
    one: "The layer as it ships: an anonymous list, no title, no groups, Delete one row under Download everything.",
    verdict: "kill",
    facts: [
      ["Corner", "8px panel, 1.6px rows"],
      ["Appears", "175ms in, 120ms out, a zoom"],
      ["Material", "Opaque, a hairline ring"],
      ["Shadow", "Light only"],
    ],
    rationale:
      "The floor every other card is judged against. A ruling of Today changes no line.",
  },
  {
    id: "card",
    name: "Card",
    one: "A menu as a small made object: a title, labelled groups, an icon rail, state on the right, delete under its own rule.",
    verdict: "ship",
    recommended: true,
    facts: [
      ["Corner", "8px panel, 4px rows"],
      ["Appears", "160ms in, 110ms out, a lift"],
      ["Material", "Opaque, a hairline ring"],
      ["Shadow", "Light and dark"],
    ],
    rationale:
      "A menu that says what it belongs to, groups that say what they are for, and the undoable action on a ground of its own.",
  },
  {
    id: "glass",
    name: "Glass",
    one: "The boxes come out: one translucent pane of the room behind it, lit along its top edge, nothing drawn inside.",
    verdict: "refine",
    facts: [
      ["Corner", "16px panel, 10px rows"],
      ["Appears", "200ms in, 120ms out, condensing"],
      ["Material", "74% pane over an 18px blur"],
      ["Shadow", "Light and dark"],
    ],
    rationale:
      "The album's colour is the product, so the layer lets it through. Move Ground to a plain app screen and it buys nothing.",
  },
  {
    id: "command",
    name: "Command",
    one: "The list replaced by a field you type into, its groups flattened underneath, and no menu opening a second menu.",
    verdict: "kill",
    facts: [
      ["Corner", "12px panel, 8px rows"],
      ["Appears", "90ms in, 70ms out, no scale"],
      ["Material", "Opaque, a hairline ring"],
      ["Shadow", "Light and dark, plus contact"],
    ],
    rationale:
      "The biggest idea and the wrong product for it. Its one idea, no nested menus, belongs in whichever card wins.",
  },
  {
    id: "compact",
    name: "Compact",
    one: "The smallest honest menu: 26px rows, a hairline carrying each group's name, state on the right, nothing added.",
    verdict: "refine",
    facts: [
      ["Corner", "6px panel, 2px rows"],
      ["Appears", "90ms in, 60ms out, no scale"],
      ["Material", "Opaque, a hairline ring"],
      ["Shadow", "A contact shadow only"],
    ],
    rationale:
      "Card's cost answered: a two-row overflow should not become furniture, and a group's name rides the rule that separates it.",
  },
  {
    id: "paper",
    name: "Paper",
    one: "Printed on the page rather than floating over it: no shadow anywhere, a real border, the squarest corner here.",
    verdict: "refine",
    facts: [
      ["Corner", "5px panel, 1px rows"],
      ["Appears", "120ms in, 90ms out, a pure fade"],
      ["Material", "Opaque, a 1px border"],
      ["Shadow", "None, in either mode"],
    ],
    rationale:
      "The quietest and the cheapest: no component change, and it rules the shadow call by itself.",
  },
  {
    id: "lift",
    name: "Lift",
    one: "The edge comes off: no ring and no border, with a doubled shadow doing the whole job in light and in dark.",
    verdict: "refine",
    facts: [
      ["Corner", "14px panel, 10px rows"],
      ["Appears", "180ms in, 120ms out, rising 8px"],
      ["Material", "Opaque, no edge at all"],
      ["Shadow", "Light and dark, doubled"],
    ],
    rationale:
      "Paper's opposite. On a photograph it is the clearest separation here; on a flat app screen it is a smudge.",
  },
];

export const FLOATING_SURFACES = defineBoard({
  id: "floating-surfaces",
  title: "Floating surfaces",

  question:
    "Which of seven floating layers should everything that opens over the page wear, and then the four calls still open once one is picked?",

  round: {
    n: 6,
    date: "2026-09-16",
    changed:
      "Rebuilt as a catalog: seven finished layers, each a card with the real menu on it and its four facts under it. The desk is the production dashboard now, and twelve sections became four.",
  },
  history: [
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "Moved onto the kit's template, with the five asks rewritten in plain words: a real question, what the thing is, where to look, every option labelled with what choosing it does.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The question moved, on Will's note: not what today's layer should be tuned to but what it should BE. Three ground-up directions for all ten surfaces, each a working component plus a real paste.",
    },
    {
      n: 3,
      date: "2026-09-14",
      changed:
        "Walked cold at 1440 and 375, the rows cut to the ones that decide something, every number measured or labelled a stand-in.",
    },
    {
      n: 2,
      date: "2026-09-14",
      changed:
        "Apply to the site, the palette's dark ramps under the panels, and the guest sheet at 375 as the primary specimen.",
    },
    {
      n: 1,
      date: "2026-09-14",
      changed:
        "Nine primitives on one canvas, three knobs over them, and the finding that the contract misses bible 9 inside itself.",
    },
  ],
  context:
    "Rounds one to three tuned today's layer in three switches. Round four moved the question to what the layer should BE and answered with three directions. Round five put it on the kit's template. All of that stands underneath; what changed here is that the directions are a grid of seven finished answers ruled card by card, the comparison is the production dashboard rather than a drawing of one, and everything that was not a choice has left the board.",

  verdict: {
    recommendation:
      "Card: a menu becomes a small made object, with a title, labelled groups, an icon rail and the row you cannot undo set apart. Take Command's one idea into it and delete the nested menu.",
    because:
      "Today's menus are anonymous lists: no title, no groups, and Delete the event one row under Download everything. Card answers all of that, on all ten surfaces at once.",
    overrule:
      "Compact is the same argument at half the height.",
  },

  asks: [
    {
      id: "submenu",
      question: "Should a menu still be able to open a second menu?",
      context:
        "One menu in the product opens another: the theme picker inside the account menu, on every host and guest page. As shipped it is INVISIBLE, because SubContent has no portal and Content clips what overflows it.",
      look: "The four calls, the first row.",
      options: [
        {
          id: "keep",
          label: "Keep the nested menu",
          means:
            "The branch stays and the wiring round repairs the primitive, so a submenu paints at all.",
        },
        {
          id: "delete",
          label: "Delete it, choices inline",
          means:
            "The choices sit inline under their own name, and no menu in the product opens a second one.",
        },
      ],
      recommended: "delete",
      because:
        "Choices that cannot both be true are a group, not a tree, and deleting the branch takes the bug with it.",
      evidence: "calls",
      control: "submenu",
    },
    {
      id: "radius",
      question: "How round should a floating panel and its rows be?",
      context:
        "Every menu, popover and sheet shares one corner today: an 8px panel around 1.6px rows in 4px of padding. Bible 9 asks the two to share a centre, and today misses by six times.",
      look: "The four calls, the corner row, at six times. The dashed arc is where the row's corner has to sit.",
      options: [
        {
          id: "sharp",
          label: "Squarer, like a surface",
          means:
            "Rows keep the near-square corner of a surface, and the panel is only as round as what it holds.",
        },
        {
          id: "nested",
          label: "Today's panel, rows corrected",
          means:
            "The panel's corner stays where it ships and each row's corner rises 4px, so the two share a centre.",
        },
        {
          id: "round",
          label: "Rounder, like a button",
          means:
            "Rows round like buttons, so a menu reads as a cluster of things you press rather than as a list.",
        },
      ],
      recommended: "nested",
      because:
        "The only option that changes one number, and Card is already this corner.",
      evidence: "calls",
      control: "radius",
    },
    {
      id: "entrance",
      question: "Should every floating surface appear at the same speed?",
      context:
        "One entrance is set for the whole family today, and two ratified rules disagree about that: rule 15 asks for one speed everywhere, rule 12 asks for speed by how often a thing is opened.",
      look: "The four calls, the appearing row. Press Replay and watch the two frames together.",
      options: [
        {
          id: "one-clock",
          label: "One speed for every surface",
          means:
            "The tooltip, the menu and the dialog appear on the same beat, which is rule 15 as it is written.",
        },
        {
          id: "by-frequency",
          label: "Faster where you open often",
          means:
            "The tooltip and the menu land in 90ms and the dialog keeps its slower beat, which is rule 12 as written.",
        },
      ],
      recommended: "by-frequency",
      because:
        "Read rule 15 as one entrance LANGUAGE with rule 12 setting the clock inside it, and the two stop disagreeing. That wording change is yours.",
      evidence: "calls",
      control: "entrance",
    },
    {
      id: "light",
      question: "In dark mode, should a floating panel cast a shadow?",
      context:
        "In dark nothing casts today: a panel is told from the page only by sitting a shade lighter. The light board proposes one soft shadow for this case, and every layer here casts that same one.",
      look: "The four calls, the shadow row: the same panel twice on the app's dark.",
      options: [
        {
          id: "today",
          label: "No shadow, as dark ships",
          means:
            "Dark keeps no shadow, and a lighter surface stays the only thing separating a panel from the page.",
        },
        {
          id: "shadow",
          label: "A soft shadow, the light board's",
          means:
            "The light board's float shadow lands on these surfaces, ruled once on that board and inherited here.",
        },
      ],
      recommended: "shadow",
      because:
        "Today's dark popover sits LIGHTER than the card it opens from, which is the ladder upside down.",
      overrule:
        "Paper is a shadowless dark taken to both modes.",
      evidence: "calls",
      control: "light",
    },
  ],

  /**
   * ★ THE CANDIDATES ARE THE SEVEN LAYERS, which is the round's whole point.
   * Rounds four and five carried the three directions plus two things that were
   * not directions at all (the three knobs as one bundle, and the reduced-motion
   * patch). The knobs are the four calls now, each ruled on its own; the
   * reduced-motion patch was never a candidate and is a wiring line.
   */
  candidates: ITEMS,

  /**
   * ★ THE BUDGET IS DECLARED, AND THE REASON IS THE TEMPLATE RATHER THAN THE
   * BOARD (round six). 1,200 words is the smoke's cap on what a reviewer MEETS.
   * This board's own evidence weighs about 900 of them: four section ledes, the
   * seven cards' lines and facts, the labels over nineteen frames. The rest is
   * the template's, and it is not optional: the Answer prints each of four asks
   * with its context, its options and its look (the clarity ratchet requires
   * every one), the index repeats the ledes, the Rule-on panel repeats the asks,
   * and the meta panel prints seven rationales and three departures un-folded.
   * With four asks and seven cards that floor is about 1,300 on its own, so no
   * amount of cutting inside this file reaches 1,200 while the asks stay. Round
   * six cut about 1,700 words getting here; the next honest cut is the kit's,
   * and it is a finding in the Handoff rather than a thing this board can do.
   */
  reading: {
    words: 2400,
    why: "Four asks and seven cards: the template's own chrome (the Answer's four asks with their context, the index, the Rule-on panel, the meta panel's rationales) is about 1,300 words before the board says anything. The board's own voice is under 1,000. Round six cut 1,700; the rest is a kit finding.",
  },

  catalog: {
    section: "catalog",
    control: "direction",
    compare: ["compare-a", "compare-b"],
  },

  /**
   * ★ SIX DEPARTURES BECAME THREE (round six). The meta panel prints every one
   * of these un-folded, so a board with six long ones spends four hundred words
   * before a reviewer has looked at anything. What is left here is what a
   * ruling has to KNOW; the tenth surface, the corner that does not nest and
   * the shadow in dark moved into the sections' own arguments, which are
   * collapsed, and none of them is news to this board.
   */
  departures: [
    {
      id: "submenu-invisible",
      from: "precedent",
      text: "A SHIPPED BUG, true whatever is ruled: the theme picker inside the account menu is invisible, on every host and guest page. dropdown-menu.tsx renders SubContent with no Portal while Content carries overflow-y-auto, so the submenu is a descendant of a box that clips it. Deleting the branch takes the bug with it.",
      evidence: "calls",
    },
    {
      id: "two-halves",
      from: "precedent",
      text: "A layer is two halves and only one is a paste. Material, radius, motion and density are CSS over the primitives' data-slots, so Apply reaches the real pages. The anatomy and the model are components, so a ruling for Card, Compact or Command is an edit to dropdown-menu.tsx.",
      evidence: "catalog",
    },
    {
      id: "rule-15-wording",
      from: 15,
      text: "A finding against rule 15, not a quiet choice. Rule 15's one entrance and rule 12's animate-by-frequency disagree here as they are written. The board reads rule 15 as one entrance LANGUAGE with rule 12 setting the clock inside it. That is a bible edit and it is Will's to make.",
      evidence: "calls",
    },
  ],

  assets: [
    {
      what: "A dark, low-key event photograph for the menu ground",
      spec: "One of the media-kit track's 36 masters at 1600px long edge, landscape, one grade: a dance floor lit by a single lamp. A line on that shot list rather than a second delivery.",
      replaces:
        "the nine mid-key marketing photographs the catalog's ground uses, which are all bright enough to flatter a translucent pane.",
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The seven layers",
      lede: "Each a card: the real event menu open on the ground the switch sets, with its four facts under it.",
      eager: true,
      argument: [
        "WHAT A LAYER IS, UNDER ALL SEVEN. A floating surface is four decisions and nothing else: how round it is, how it arrives, what it is made of, and whether it casts. Every card names those four in the same order, so two cards differ in a place you can point at rather than in an impression. Anatomy is the fifth decision and only three of the seven touch it: Card adds furniture, Compact takes it away, Command replaces the list with a field.",
        "WHY SEVEN AND NOT THREE. Round four drew three because three was the minimum to ask the question at all: an anatomy answer, a material answer, a model answer. A catalog wants the answers somebody could actually prefer, so each new one answers a cost the first four pay. Compact answers Card's furniture. Paper answers the shadow. Lift answers the edge. Two layers that differ only in a number would be one card, which is why there are seven rather than twenty.",
        "WHAT IS WRONG TODAY, measured rather than argued. The panel's corner does not nest around its rows, by a factor of six, which is bible 9 missed inside the shipped contract. In dark the popover sits LIGHTER than the card it opens from, and nothing casts. A menu has no title, so an overflow on a page of four events makes the reader remember which one it belongs to. And the one nested menu in the product paints nothing at all.",
        "TWO DEPARTURES THE CARDS CARRY. Four of the seven cast a shadow in DARK, which the shipped elevation contract still forbids by name, and Lift makes that shadow the only thing separating a panel from the page; Glass adds a backdrop blur on every open panel, which is a compositing layer each. Both are the light board's territory as much as this one's, and both are visible on the cards rather than argued here.",
      ],
    },
    {
      id: "desk",
      title: "Any two, on the host's desk",
      lede: "The production dashboard at 1440 under the two cards you pressed A and B on, then the phone, the covering family and the guest's drawer.",
      argument: [
        "This is the canvas rule 15 is about: the account menu, an event's overflow and a tooltip open at once on a page made of real components. A layer either reads as one language across them or it does not, and a single menu on a stage can never show that.",
        "The dashboard is the production one: shared/app-shell.tsx, dashboard/filter-chips.tsx, dashboard/feed-section.tsx and app/event-card.tsx, at the real density. What the board still draws is the floating layer itself, because that is the thing being designed, and the events and the counts, because /dashboard is behind the auth gate and a frame pointed at it lands on /login.",
      ],
    },
    {
      id: "calls",
      title: "The four calls left",
      lede: "What is still open once a layer is picked, each on the surface it is decided on.",
      argument: [
        "None of these is a layer, which is why they survive the catalog. The nested menu is a question about a model and about a bug. The corner is a number bible 9 already decides and today gets wrong. The entrance is two ratified rules disagreeing as they are written. The shadow in dark is a line the light board is also proposing, and ruling it twice on two boards is how two boards drift apart.",
        "Three of the four are answered by some of the cards and not by others: Card is the corrected corner, Compact and Command are the faster clock, Paper is no shadow in either mode. So a ruling on a card can settle a call by itself, and these switches are what a reader uses to check that before he rules.",
      ],
      wiring: [
        "The reduced-motion patch competes with nothing and is not a candidate: globals.css has clamped every animation and transition to 0.01ms under the preference since 2026-06-11, and what these surfaces lack is bible 14's first line, a gate of their own. It lands with whichever layer wins.",
      ],
    },
    {
      id: "pages",
      title: "The real pages, wearing the pick",
      lede: "Three production routes at true pixels, wearing whatever card is picked.",
      argument: [
        "A composition is honest about a component and dishonest about a page. These are the routes themselves, in frames at 1:1, so the panels are the production primitives with the production content behind them. Remember what a paste can carry: the material, the radius, the motion and the density reach these pages; the header row, the icon rail and the field do not until the wiring round lands them.",
        "THE FAMILY IS TEN SURFACES, NOT NINE, and the tenth is why /e/<token> is on this row. guest/entry-shell.tsx renders a raw vaul drawer that never goes through ui/drawer.tsx, with a literal radius, and it is the floating surface most people on this product will ever see. Every layer reaches it through [data-entry-drawer], so the route is the proof rather than a specimen of one.",
      ],
      wiring: [
        "Apply hands the whole site the picked layer, so it can be walked in your own tabs, including the two routes a frame cannot load: /help for the nav panel over paper, and /dashboard signed in. The board's own frames are excluded from a site block by html:not([data-flt-frame]), so the sections above stay honest while a candidate is on.",
      ],
    },
  ],

  controls: [
    // ★ PICK IS THE DIRECTION CONTROL, CLEARABLE. Nothing picked is a state of
    // its own (Will, 2026-09-16): the pages below show the site as built until a
    // card is picked, and pressing the picked card returns here.
    {
      id: "direction",
      label: "Pick",
      options: [
        { id: "none", label: "Nothing picked" },
        { id: "today", label: "Today" },
        { id: "card", label: "Card" },
        { id: "glass", label: "Glass" },
        { id: "command", label: "Command" },
        { id: "compact", label: "Compact" },
        { id: "paper", label: "Paper" },
        { id: "lift", label: "Lift" },
      ],
      default: "none",
      clearable: true,
    },
    // A and B: the two the desk compares, set from the catalog's cards. They
    // open on today against the board's own pick, which is the comparison a
    // reader wants before he has picked anything.
    {
      id: "compare-a",
      label: "A",
      options: [
        { id: "today", label: "Today" },
        { id: "card", label: "Card" },
        { id: "glass", label: "Glass" },
        { id: "command", label: "Command" },
        { id: "compact", label: "Compact" },
        { id: "paper", label: "Paper" },
        { id: "lift", label: "Lift" },
      ],
      default: "today",
    },
    {
      id: "compare-b",
      label: "B",
      options: [
        { id: "today", label: "Today" },
        { id: "card", label: "Card" },
        { id: "glass", label: "Glass" },
        { id: "command", label: "Command" },
        { id: "compact", label: "Compact" },
        { id: "paper", label: "Paper" },
        { id: "lift", label: "Lift" },
      ],
      default: "card",
    },
    // ★ THE GROUND IS THE GLASS ARGUMENT, and it is why round five's whole
    // "where glass stops paying for itself" section is gone: moving all seven
    // cards onto a plain app screen at once shows it in one press.
    {
      id: "ground",
      label: "Ground",
      options: [
        { id: "app-dark", label: "The app, dark" },
        { id: "app-light", label: "The app, light" },
        { id: "cinema", label: "The room" },
        { id: "paper", label: "Paper" },
        { id: "ink", label: "The footer slab" },
      ],
      default: "app-dark",
    },
    {
      id: "submenu",
      label: "Nested menu",
      options: [
        { id: "keep", label: "Keep the nested menu" },
        { id: "delete", label: "Delete it, choices inline" },
      ],
      default: "keep",
    },
    // The three below are clearable, and their cleared default is "as it ships":
    // the ask offers no "leave it", so the floor is the comparison rather than
    // an option, and clearing is how a reader gets back to it.
    {
      id: "radius",
      label: "Corner",
      options: [
        { id: "off", label: "As it ships" },
        { id: "sharp", label: "Squarer, like a surface" },
        { id: "nested", label: "Today's panel, rows corrected" },
        { id: "round", label: "Rounder, like a button" },
      ],
      default: "off",
      clearable: true,
    },
    {
      id: "entrance",
      label: "How it appears",
      options: [
        { id: "off", label: "As it ships" },
        { id: "one-clock", label: "One speed for every surface" },
        { id: "by-frequency", label: "Faster where you open often" },
      ],
      default: "off",
      clearable: true,
    },
    {
      id: "light",
      label: "Shadow in dark",
      options: [
        { id: "today", label: "No shadow, as dark ships" },
        { id: "shadow", label: "A soft shadow, the light board's" },
      ],
      default: "today",
    },
  ],

  lookFirst: [
    {
      section: "catalog",
      note: "Read the seven. The name and the line say what each one is, the four facts say what it does, and the menu under them is the real thing open at 328 pixels.",
    },
    {
      section: "catalog",
      state: { ground: "cinema" },
      note: "The same seven over the album's photographs. This is the press that decides Glass: a room behind the pane is the condition its blur is written for.",
    },
    {
      section: "catalog",
      state: { ground: "app-light" },
      note: "And over a plain app screen, where Glass buys nothing and Lift's shadow has no photograph to separate it from.",
    },
    {
      section: "desk",
      note: "The production dashboard under A and B. Card against Today is the comparison the review asked for; press A or B on any card to change it from where you stand.",
    },
    {
      section: "calls",
      note: "The account menu as it ships. Open the avatar, hover Theme, and watch a submenu paint nothing: every host and every guest has this menu.",
    },
    {
      section: "pages",
      note: "The real routes wearing the pick. Hover Features on the home frame for the production nav panel, and read the guest drawer at 375.",
    },
  ],

  notes: [
    {
      section: "catalog",
      text: "Every photograph on the ground is mid-key and warm, so the hardest case for a translucent pane goes untested until the dark master lands. Glass's 74 percent was measured against these: at 62 a row label disappeared into the photograph under it.",
    },
    {
      section: "desk",
      text: "ui/tooltip.tsx is inverted (a foreground ground with primary-foreground text), so any material that repaints the background and leaves the colour alone puts dark text on a dark pane. Glass has to say so; the others do not touch it.",
    },
  ],

  links: {
    bible: [9, 10, 12, 14, 15],
    spec: "docs/specs/floating-surfaces.md",
    pages: [
      {
        label: "Home",
        path: "/",
        note: "the header nav panel (hover Features), then the mobile menu sheet at 375, which is ui/sheet.tsx's only product call site",
      },
      {
        label: "Pricing",
        path: "/pricing",
        note: "the plan tooltips, the highest-frequency surface on the site",
      },
      {
        label: "Help",
        path: "/help",
        note: "the same nav panel over a paper ground, where a shadow changes sides",
      },
      {
        label: "The dashboard",
        path: "/dashboard",
        note: "the account menu with its theme submenu, the event menus and a confirm dialog (signed in)",
      },
    ],
  },
});
