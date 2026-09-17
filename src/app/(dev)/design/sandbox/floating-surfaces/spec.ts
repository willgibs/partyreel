import { type Candidate, defineBoard } from "@/components/lab/board-spec";

/**
 * THE FLOATING-SURFACES BOARD, AS DATA (round seven, the stepped review,
 * 2026-09-16).
 *
 * ★ THE BOARD IS DECIDED BY ONE PICK. The seven cards are variants of ONE
 * thing, so `catalog.mode` is `pick-one`: the `direction` ask IS the catalog
 * (its options are the seven cards plus "None of these", its control is the
 * pick, so pressing a card previews it and a second press records it), the
 * card verdicts are optional feedback, and the host's desk below wears
 * whatever is pressed. Round six asked the same thing as seven separate keep /
 * refine / kill rulings and four more questions: eleven answers for a decision
 * that is one.
 *
 * ★ AND EVERY OTHER ASK IS ONE SPECIMEN IN EVERY STATE IT CAN TAKE. The four
 * calls left are tile steps: the same menu drawn once per option, so the
 * options are compared rather than read. That is why each has a section of its
 * own and why those sections are small: a step draws its section once per
 * option and again on the stage.
 *
 * ★ AN ASK IS ANSWERABLE COLD, AND THE EVIDENCE CARRIES THE OPTIONS' WORDS.
 * Every ask says what the thing is, where it lives, and what each option would
 * do. The ids never changed: the ledger joins on them. The option LABELS are
 * also the frame titles (`constants.ts` reads them back through
 * `askOptionLabel`), so the words on the question and the words over the
 * specimen cannot drift apart.
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
 * What lives HERE is the words a reviewer compares across seven cards and what
 * each one LANDS as; the CSS, the anatomy and the costs live in `directions.ts`.
 * Round seven cut the fourth fact (how it appears): the entrance is its own
 * question with its own specimen, and no card was ever won on a number of
 * milliseconds.
 */
const ITEMS: readonly Candidate<"catalog" | "desk">[] = [
  {
    id: "today",
    name: "Today",
    one: "The layer as it ships: an anonymous list, no title, no groups, Delete one row under Download everything.",
    verdict: "kill",
    lands: "Nothing. It is the floor the other six are judged against.",
    facts: [
      ["Corner", "8px panel, 1.6px rows"],
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
    lands:
      "The Library's dropdown-menu entry, rebuilt: a title, groups, an icon rail, a footer rail.",
    facts: [
      ["Corner", "8px panel, 4px rows"],
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
    lands:
      "A material variant on the dropdown-menu entry, for the surfaces the album sits behind.",
    facts: [
      ["Corner", "16px panel, 10px rows"],
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
    lands:
      "Nothing of its own. Its one idea, no menu opening a second menu, is the branch question.",
    facts: [
      ["Corner", "12px panel, 8px rows"],
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
    lands:
      "A density variant on the same entry, for an overflow that should not become furniture.",
    facts: [
      ["Corner", "6px panel, 2px rows"],
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
    lands:
      "A token block: no shadow in either mode, a real 1px border, the squarest corner here.",
    facts: [
      ["Corner", "5px panel, 1px rows"],
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
    lands:
      "A token block: no edge at all, and a doubled shadow carrying the whole separation.",
    facts: [
      ["Corner", "14px panel, 10px rows"],
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
    "Which of seven layers should everything that opens over the page wear, and what is left to call once one wins?",

  round: {
    n: 7,
    date: "2026-09-16",
    changed:
      "Reshaped as a walk: one pick decides the seven cards, the real product below wears whatever you press, and each call left is one menu drawn in every state you can choose. The shadow question has left: you answered it on the light board, and this board inherits it.",
  },
  history: [
    {
      n: 6,
      date: "2026-09-16",
      changed:
        "Rebuilt as a catalog: seven finished layers, each a card with the real menu on it and its facts under it, and twelve sections became four.",
    },
    {
      n: 5,
      date: "2026-09-15",
      changed:
        "Moved onto the kit's template, with the asks rewritten in plain words: a real question, what the thing is, where to look, every option labelled with what choosing it does.",
    },
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The question moved, on Will's note: not what today's layer should be tuned to but what it should BE. Three ground-up directions for all ten surfaces, each a working component plus a real paste.",
    },
  ],
  context:
    "Rounds one to three tuned today's layer in three switches. Round four moved the question to what the layer should BE and answered with three directions; round six made those a catalog of seven finished ones. Round seven added no direction and no argument: it turned the catalog into one pick and the four calls left into four drawn questions.",

  verdict: {
    recommendation:
      "Card: a menu becomes a small made object, with a title, labelled groups, an icon rail and the row you cannot undo set apart. Take Command's one idea into it and delete the nested menu.",
    because:
      "Today's menus are anonymous lists: no title, no groups, and Delete the event one row under Download everything. Card answers all of that, on all ten surfaces at once.",
    overrule: "Compact is the same argument at half the height.",
  },

  /**
   * ★ THE WINNER COMES FIRST, AND THE FOUR CALLS WAIT ON NOTHING. The walk is
   * spec order, and a pick-one catalog is decided before the questions that
   * survive it. None of the four is STAGED behind the pick (`after`), because
   * each is askable cold: the branch is a model and a shipped bug, the corner
   * is bible 9 against what ships, the entrance is two ratified rules
   * disagreeing, the shadow is a line the light board proposes anyway. A winner
   * marked "not clear to me" would otherwise take all four down with it.
   *
   * ★ THE SHADOW ASK LEFT INSIDE THE ROUND (2026-09-17). Its own context said
   * "ruled once there and inherited here", and Will ruled it there the same day
   * (`light r8: depth=both`, a larger shadow under menus, dialogs and toasts in
   * dark). Asking it again here would be asking him twice, so the ask is gone
   * and its section and its `light` control stay on the board page as evidence.
   */
  asks: [
    {
      id: "direction",
      question: "Which of these seven layers should the whole family wear?",
      context:
        "Ten surfaces open over a page today and all of them wear one layer: every menu, the popovers, the tooltips, a dialog, the marketing sheet and the guest's entry drawer. Each card is that layer rebuilt, with the real event menu open on it. Press one and the product below wears it.",
      options: [
        { id: "today", label: "Today: the layer as it ships" },
        { id: "card", label: "Card: a menu as a made object" },
        { id: "glass", label: "Glass: one translucent pane" },
        { id: "command", label: "Command: a field you type into" },
        { id: "compact", label: "Compact: the smallest honest menu" },
        { id: "paper", label: "Paper: printed, not floating" },
        { id: "lift", label: "Lift: no edge, a doubled shadow" },
        {
          id: "none",
          label: "None of these",
          means:
            "New directions instead. Say what you want in the note and the next round starts from that.",
        },
      ],
      recommended: "card",
      because:
        "Today's menus are anonymous lists: no title, no groups, and Delete the event one row under Download everything. Card answers all of it at once.",
      overrule: "Compact is the same argument at half the height.",
      evidence: "catalog",
      control: "direction",
      strip: ["ground"],
      lands:
        "The Library's dropdown-menu entry rebuilt as the winner, and the floating-surface tokens every panel reads.",
    },
    {
      id: "submenu",
      question: "Should a menu still be able to open a second menu?",
      context:
        "One menu in the product opens another: the theme picker inside the account menu, on every host and guest page. As shipped it paints NOTHING, because SubContent has no portal, and the wiring round carries that either way. The specimen is portalled, so you are judging the model rather than the bug.",
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
      evidence: "branch",
      control: "submenu",
      lands:
        "The Sub parts of dropdown-menu.tsx: portalled and kept, or deleted from the component and the account menu.",
    },
    {
      id: "radius",
      question: "How round should a floating panel and its rows be?",
      context:
        "Every menu, popover and sheet shares one corner today: an 8px panel around 1.6px rows in 4px of padding. Bible 9 asks the two to share a centre, and today misses by six times. The loupe under the menu is that corner at six times, and the dashed arc is where the row's has to sit.",
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
      evidence: "corner",
      control: "radius",
      lands:
        "--radius-float and the row radius on every panel in the family: menus, popovers, selects, the sheet.",
    },
    // ★ THE SAME QUESTION, POPPED BACK UP AT WILL'S ASKING (2026-09-17). He
    // answered `radius=nested` and added: "Today's panel corrected and Rounder
    // seem to be the same option, so I suppose this is also selecting rounder at
    // the same time. If there's meant to be a difference, please pop this
    // question back up." There is one: they are different corners. They LOOKED
    // alike because both nest (a dashed arc lying on a solid one, twice) and a
    // tile was a third of true size. So the corner is drawn filled and at true
    // size now, and this step asks only the pair he could not tell apart, with
    // the pixels in the labels. Staged behind his own answer: had he picked the
    // squarer corner there would be nothing to confirm.
    {
      id: "roundness",
      question:
        "You picked today's panel with its rows fixed. Rounder is a different corner: do you want it instead?",
      context:
        "Last time these two looked the same, because the drawing was thin lines at a third of its size. They are not the same. Your pick keeps the panel's corner where it ships, 8px, and only fixes the rows inside it. Rounder changes the panel itself. The large picture is the real menu, and under it the same corner six times bigger with both shapes filled in.",
      options: [
        {
          id: "nested",
          label: "Keep my pick: 8px panel, 4px rows",
          means:
            "The panel's corner stays exactly as it ships today. Only the rows change, from 1.6px to 4px, so they sit properly inside it.",
          state: { radius: "nested" },
        },
        {
          id: "round",
          label: "Rounder: 12px panel, 8px rows",
          means:
            "The panel gets half as round again and the rows round like small buttons, so a menu reads as a cluster of things you press.",
          state: { radius: "round" },
        },
      ],
      recommended: "nested",
      because:
        "It is what you chose, it is Card's own corner, and it changes one number instead of two.",
      overrule:
        "If the rounder menu simply looks better to you now that you can see it, take it: it is two tokens either way.",
      evidence: "corner",
      // No `control`: a mirrored ask has to offer every option of its control
      // (registry.test.ts), and this one offers two of the three on purpose. Each
      // option carries its own state instead, which is the same preview.
      lands:
        "--radius-float and the row radius on every panel in the family. It only confirms or replaces your radius answer.",
      after: { ask: "radius", option: "nested" },
    },
    {
      id: "entrance",
      question: "Should every floating surface appear at the same speed?",
      context:
        "One entrance is set for the whole family today, and two ratified rules disagree about that: rule 15 asks for one speed everywhere, rule 12 asks for speed by how often a thing is opened. Press Replay under the specimen and watch the tooltip, the menu and the dialog land together or apart.",
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
      evidence: "appears",
      control: "entrance",
      lands:
        "The entrance block in globals.css, and a rewording of bible 15 so rule 12 sets the clock inside it.",
    },
  ],

  candidates: ITEMS,

  catalog: {
    section: "catalog",
    control: "direction",
    compare: ["compare-a", "compare-b"],
    // ★ ONE PICK, AND "NONE OF THESE" IS AN ANSWER RATHER THAN A SILENCE. The
    // winner ask mirrors the pick control, so a press previews a card on the
    // stage before anything is recorded and a second press records it; `none`
    // clears the board, which is the honest preview of new directions.
    mode: "pick-one",
    winner: "direction",
    stage: "desk",
  },

  departures: [
    {
      id: "submenu-invisible",
      from: "precedent",
      text: "A SHIPPED BUG, true whatever is ruled: the theme picker inside the account menu is invisible, on every host and guest page. dropdown-menu.tsx renders SubContent with no Portal while Content carries overflow-y-auto, so the submenu is a descendant of a box that clips it. Deleting the branch takes the bug with it.",
      evidence: "branch",
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
      evidence: "appears",
    },
  ],

  assets: [
    {
      what: "A dark, low-key event photograph for the menu ground",
      spec: "One of the media-kit track's 36 masters at 1600px long edge, landscape, one grade: a dance floor lit by a single lamp. A line on that shot list rather than a second delivery.",
      replaces:
        "the nine mid-key marketing photographs the catalog's ground uses, which are all bright enough to flatter a translucent pane.",
      row: 14,
    },
  ],

  sections: [
    {
      id: "catalog",
      title: "The seven layers",
      lede: "Each card is the layer, with the real event menu open on it. Press one and the product below wears it.",
      eager: true,
      argument: [
        "WHAT A LAYER IS, UNDER ALL SEVEN. A floating surface is four decisions and nothing else: how round it is, how it arrives, what it is made of, and whether it casts. Anatomy is the fifth and only three of the seven touch it: Card adds furniture, Compact takes it away, Command replaces the list with a field. Every card past the first answers a cost the ones before it pay, which is why there are seven rather than twenty.",
        "WHAT IS WRONG TODAY, measured rather than argued. The panel's corner does not nest around its rows, by a factor of six, which is bible 9 missed inside the shipped contract. In dark the popover sits LIGHTER than the card it opens from, and nothing casts. A menu has no title, so an overflow on a page of four events makes the reader remember which one it belongs to. And the one nested menu in the product paints nothing at all.",
        "TWO DEPARTURES THE CARDS CARRY. Four of the seven cast a shadow in DARK, which the shipped elevation contract still forbids by name, and Lift makes that shadow the only thing separating a panel from the page; Glass adds a backdrop blur on every open panel, which is a compositing layer each. Both are the light board's territory as much as this one's, and both are visible on the cards rather than argued here.",
      ],
    },
    {
      id: "desk",
      title: "The pick, on the real product",
      lede: "The production dashboard at 1440, the same host on a phone, the covering family and the guest's drawer, wearing what you pressed.",
      argument: [
        "This is the canvas rule 15 is about: the account menu, an event's overflow and a tooltip open at once on a page made of real components. A layer either reads as one language across them or it does not, and a single menu on a stage can never show that. The dashboard is the production one (shared/app-shell.tsx, dashboard/filter-chips.tsx, dashboard/feed-section.tsx, app/event-card.tsx) at the real density; what the board still draws is the floating layer itself and the events, because /dashboard is behind the auth gate and a frame pointed at it lands on /login.",
      ],
    },
    {
      id: "branch",
      title: "A menu opening a second menu",
      lede: "The event menu with the branch held open, and the same menu with those choices inline under their own name.",
    },
    {
      id: "corner",
      title: "The corner, at six times",
      lede: "The menu at 1:1 with the loupe under it: outer arc the panel, inner arc the lit row, dashed arc where the row has to sit.",
    },
    {
      id: "appears",
      title: "How a surface appears",
      lede: "The tooltip, the menu and the dialog on one canvas. Press Replay and watch the three of them land.",
    },
    {
      id: "shadow",
      title: "The shadow in dark",
      lede: "One panel on the app's own dark, wearing the layer as it ships. Nothing casts there today.",
    },
    {
      id: "pages",
      title: "The real routes, wearing the pick",
      lede: "Three production routes at true pixels, and the block a ruling pastes onto the whole site.",
      argument: [
        "A composition is honest about a component and dishonest about a page. These are the routes themselves, at 1:1, so the panels are the production primitives with the production content behind them. Remember what a paste can carry: the material, the radius, the motion and the density reach these pages; the header row, the icon rail and the field do not until the wiring round lands them.",
        "THE FAMILY IS TEN SURFACES, NOT NINE, and the tenth is why /e/<token> is on this row. guest/entry-shell.tsx renders a raw vaul drawer that never goes through ui/drawer.tsx, with a literal radius, and it is the floating surface most people on this product will ever see. Every layer reaches it through [data-entry-drawer], so the route is the proof rather than a specimen of one.",
      ],
      wiring: [
        "Apply hands the whole site the picked layer and the three calls that are a paste, so it can be walked in your own tabs, including the two routes a frame cannot load: /help for the nav panel over paper, and /dashboard signed in. The board's own frames are excluded from a site block by html:not([data-flt-frame]), so the sections above stay honest while a candidate is on.",
        "The reduced-motion patch competes with nothing and is not a candidate: globals.css has clamped every animation and transition to 0.01ms under the preference since 2026-06-11, and what these surfaces lack is bible 14's first line, a gate of their own. It lands with whichever layer wins.",
      ],
    },
  ],

  controls: [
    // ★ PICK IS THE DIRECTION CONTROL, CLEARABLE, AND THE WINNER ASK MIRRORS
    // IT. Nothing picked is a state of its own (Will, 2026-09-16): the product
    // below shows the site as built until a card is picked, and "None of these"
    // returns it there.
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
    // A and B: the two the folded comparison joins, set from the catalog's own
    // cards. They open on today against the board's own pick, which is the
    // comparison a reader wants before he has picked anything.
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
    // ★ THE GROUND IS THE GLASS ARGUMENT, which is why it is the one control on
    // the winner step's strip: moving all seven cards onto a plain app screen at
    // once is what shows where a translucent pane stops paying for itself.
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
    // The four below serve one question each. They stay DECLARED, because an
    // option draws itself by setting one of them, and they are on no config
    // strip, because a step carrying its own answer twice is the density this
    // round is deleting.
    {
      id: "submenu",
      label: "Nested menu",
      options: [
        { id: "keep", label: "Keep the nested menu" },
        { id: "delete", label: "Delete it, choices inline" },
      ],
      default: "keep",
    },
    // The two clearable ones default to "as it ships": their ask offers no
    // "leave it", so the floor is the comparison rather than an option, and
    // clearing is how a reader gets back to it.
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
      note: "Read the seven. The name and the line say what each one is, the three facts say what it does, and the menu under them is the real thing open at 328 pixels.",
    },
    {
      section: "catalog",
      state: { ground: "cinema" },
      note: "The same seven over the album's photographs. This is the press that decides Glass: a room behind the pane is the condition its blur is written for.",
    },
    {
      section: "desk",
      note: "The production dashboard wearing the pick. Open the any-two fold under it to stand one card beside another on the same four surfaces.",
    },
    {
      section: "pages",
      note: "The real routes wearing the pick. Hover Features on the home frame for the production nav panel, and read the guest drawer at 375.",
    },
  ],

  notes: [
    {
      section: "catalog",
      text: "Every photograph on the ground is mid-key and warm, so the hardest case for a translucent pane goes untested until the dark master lands. Glass's 74 percent was measured against these.",
    },
    {
      section: "desk",
      text: "ui/tooltip.tsx is inverted (a foreground ground with primary-foreground text), so a material that repaints the background and leaves the colour alone puts dark text on a dark pane. Glass has to say so.",
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
