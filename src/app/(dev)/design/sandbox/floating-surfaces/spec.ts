import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE FLOATING-SURFACES BOARD, AS DATA (the migration wave, 2026-09-15).
 *
 * Nothing here is new argument. Every ask, candidate, departure and section is
 * round four's, moved out of `board.tsx`'s `LANDING`, `CANDIDATES`, `ASKS`,
 * `DEPARTURES` and twelve hand-built `Row` headers so that the template, the
 * desk, the record and the review ledger read ONE list. What changed is where a
 * reviewer meets them: the verdict and the five one-word calls are the first
 * screen instead of a block this board drew for itself, and the page-wide
 * switches are declared state rather than seven `useState` calls the URL never
 * saw.
 *
 * ★ A CANDIDATE'S RATIONALE IS THE DIRECTION'S THESIS, AND THIS IS ITS ONE HOME.
 * `DIRECTION_META` (directions.ts) carries what each direction CHANGES, what it
 * costs and what its paste can reach; what it believes a floating surface IS
 * lives here, and the board's own direction panel reads it back off this list.
 * So the answer block, the meta panel and the panel above the desk cannot drift.
 *
 * ★ AND THIS FILE IMPORTS NOTHING BUT `defineBoard`, on purpose. A spec is read
 * twice over: by `registry.ts` from a SERVER page, and by `scripts/lab-review.mjs`
 * with a masking scanner that has no build step and finds the board at the first
 * `{` after the word `defineBoard`. A second import above the call is enough to
 * hand that scanner the wrong object, and the failure is quiet: every ask is
 * reported as "not an ask on this board" and a ruling cannot be filed.
 */
export const FLOATING_SURFACES = defineBoard({
  id: "floating-surfaces",
  title: "Floating surfaces",

  question:
    "If this product had no menus, no popovers and no sheets, what would the floating layer be, and what does today's layer become while that is built?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The board moved onto the kit's template. Its own sticky bar, the model for the dock, became the dock; the seven switches became declared state a link can carry; its frame, its apply and its rows became the kit's. No direction, number or recommendation changed.",
  },
  history: [
    {
      n: 4,
      date: "2026-09-15",
      changed:
        "The question moved, on Will's note: not what today's layer should be tuned to but what it should BE. Three ground-up directions for all ten surfaces, each a working component plus a real paste, at true pixels.",
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
    "Rounds one to three asked what today's floating layer should be TUNED to and answered it in three knobs. Will's review moved the question: the app's menus are the problem, and the exact values of today's options are not. So the board explores what the layer should BE, and keeps the knobs as the ruling for today's primitives if no direction wins.",

  verdict: {
    recommendation:
      "Card: a floating surface is a small made object, with a subject, labelled sections, a rail and a footer. Take command's one idea into it and delete the submenu.",
    because:
      "It fixes the thing the review names. Today's menus are anonymous lists: no subject, no groups, and Delete the event one row under Download everything. Card gives every surface a title, sections, an icon rail, a trailing column for state and a footer rail under the action that cannot be undone, and it does it on all ten at once.",
    overrule:
      "Glass is the prettiest and buys nothing on a flat app ground. Command is the biggest idea and the wrong product for it: a host opens the event menu a dozen times in their life.",
  },

  asks: [
    {
      id: "direction",
      question: "The direction",
      options: ["today", "card", "glass", "command"],
      recommended: "card",
      because:
        "Card changes the anatomy, glass the material, command the model, so they are three kinds of answer rather than three shades of one. Card is the one that answers the complaint on every surface at once.",
      overrule:
        "If the app should read as one room rather than a set of objects, glass is that claim and it is a material ruling, not a menu one.",
      evidence: "answers",
    },
    {
      id: "submenu",
      question: "The submenu",
      options: ["keep", "delete"],
      recommended: "delete",
      because:
        "Three mutually exclusive values are a group, not a tree. Who can upload is the only nested menu in the product and it exists to hold three radio rows behind a hover and a wait. Card should carry them inline under their own label.",
      overrule:
        "Keeping it is a ruling to fix the primitive: shipped, a submenu paints nothing at all.",
      evidence: "submenu",
    },
    {
      id: "radius",
      question: "The radius",
      options: ["sharp", "nested", "round"],
      recommended: "nested",
      because:
        "The only rung that changes one number: today's 8px container stays and the rows rise 4px to nest inside it. The card direction IS this rung, so a ruling for card rules this line too.",
      evidence: "corner",
    },
    {
      id: "entrance",
      question: "The entrance",
      options: ["one-clock", "by-frequency"],
      recommended: "by-frequency",
      because:
        "Rule 12 is the house's motion doctrine and a tooltip is opened fifty times in an evening. Read rule 15's one entrance as one LANGUAGE with rule 12 setting the clock inside it and the two rules never disagreed.",
      overrule:
        "One clock is the simpler contract, and it is the reading rule 15 has as written.",
      evidence: "entrance",
    },
    {
      id: "light",
      question: "The light in dark",
      options: ["today", "shadow", "follow-light"],
      recommended: "follow-light",
      because:
        "The shadow rung is the light board's own --lgt-float family to the byte, and every direction that casts, casts that. So the line is ruled once, on that board, and this family takes the answer.",
      evidence: "light",
    },
  ],

  candidates: [
    {
      id: "card",
      name: "Card, the object",
      recommended: true,
      rationale:
        "A floating surface is a small made object. It has a title, its groups are labelled, its rows sit on an icon rail with their state on the right, and the action that cannot be undone sits under a rule of its own.",
    },
    {
      id: "glass",
      name: "Glass, the room",
      rationale:
        "The album's colour is the product, so the floating layer should let it through. One translucent pane of the room, lit along its top edge, with no boxes inside it at all.",
    },
    {
      id: "command",
      name: "Command, the model",
      rationale:
        "A host's menu is a search problem, not a tree. One surface with a field at the top, grouped rows underneath, keyboard first, and no nested menu anywhere in the product.",
    },
    {
      id: "knobs",
      name: "Today's primitives: radius nested, entrance by frequency",
      rationale:
        "Rounds one to three's answer, kept whole. The three knobs are independent, each is a real paste, and they are what today's layer becomes if no direction is ruled. The card direction already carries the radius line.",
    },
    {
      id: "reduced-motion",
      name: "The reduced-motion patch (free, and it competes with nothing)",
      rationale:
        "Not a candidate and not a hole: globals.css has clamped every animation and transition to 0.01ms under the preference since 2026-06-11. What the family lacks is bible 14's FIRST line, a gate of its own, and this paste is that.",
    },
  ],

  departures: [
    {
      id: "submenu-invisible",
      from: "precedent",
      text: "A SHIPPED BUG, true whatever is ruled: a nested submenu is invisible in the product. dropdown-menu.tsx renders SubContent with no Portal while Content carries overflow-y-auto, so the submenu is a descendant of a box that clips it. It opens at the right place, computes visible at opacity 1, and paints nothing. This board portals it from outside; deleting it takes the bug with it.",
      evidence: "submenu",
    },
    {
      id: "two-halves",
      from: "precedent",
      text: "A direction is two halves and only one is a paste. The material, the radius and the motion are CSS over the primitives' own data-slots, so Apply puts them on the real header nav, the real dashboard menus and the guest drawer. The anatomy (a header row, a rail, a footer) and the model (a field, no submenu) are components, so a ruling for card or command is a change to dropdown-menu.tsx.",
      evidence: "directions",
    },
    {
      id: "rule-15-wording",
      from: 15,
      text: "A finding against rule 15, not a quiet choice. Rule 15's one entrance and rule 12's animate-by-frequency disagree on this family as they are written. The board reads rule 15's line as one entrance LANGUAGE with rule 12 setting the clock inside it. That is a bible edit and it is Will's to make.",
      evidence: "entrance",
    },
    {
      id: "tenth-surface",
      from: 15,
      text: "The family is TEN surfaces, not nine. guest/entry-shell.tsx renders a raw vaul drawer that never goes through ui/drawer.tsx, with a literal radius, and it is the floating layer most people on this product will ever see. Every direction reaches it through [data-entry-drawer].",
      evidence: "phone",
    },
    {
      id: "contract-nest",
      from: 9,
      text: "Today's contract misses bible 9 inside itself: an 8px panel around 1.6px rows sitting in 4px of padding does not nest. The corner section measures it off the live DOM at 6x. The card direction fixes it by being the nested rung; glass and command fix it at their own corners.",
      evidence: "corner",
    },
    {
      id: "glass-in-dark",
      from: 10,
      text: "Glass puts a backdrop blur on every open panel, and the shadow rung puts a shadow in DARK, which the shipped elevation contract still forbids by name. Both are the light board's territory as much as this one's, and the glass section shows where the blur stops paying for itself.",
      evidence: "glass-cost",
    },
  ],

  assets: [],

  sections: [
    {
      id: "desk",
      title: "The host's desk, at 1440",
      lede: "The three menus a host meets in one session, open together on the ground they open over, with the tooltip beside them. Flip the direction on the dock and the whole desk changes.",
      eager: true,
      argument: [
        "This is the canvas rule 15 is about: the header's panel, the event's actions menu and the account menu at once. A direction either reads as one language across them or it does not, and a single menu on a stage can never show that. The comparison costs a click from wherever you are standing, which is the whole reason the switches are in the dock.",
      ],
    },
    {
      id: "answers",
      title: "The four answers, side by side",
      lede: "The same event menu under each direction, each frame at its own real pixels, so a 4px corner is a 4px corner.",
      argument: [
        "Today is an anonymous list: no subject, no groups, and Delete the event one row from Download everything. Card gives it a title, sections, a rail and a footer. Glass takes the boxes out and lets the room through. Command replaces the list with a field.",
        "The canvas is 328 wide and says so on its face, because it is a detail frame and not a phone: four of them plus their gaps have to clear the lab column at 1440 minus the scrollbar, and at 340 the fourth answer wrapped to a second line and turned a four-way comparison into a three-way one.",
      ],
    },
    {
      id: "submenu",
      title: "The nested branch, kept and deleted",
      lede: "Card opens a second panel, which is the best version of the tree. Command has no submenu at all, so the same three values are a group in the one list.",
      argument: [
        "The only nested menu in the product is Who can upload, and it exists to hold three mutually exclusive values behind a hover and a wait. The board's recommendation takes the right-hand idea into the left-hand anatomy: card's panel, with those three values inline under their own label, and no branch anywhere in the product. Which also makes the shipped bug moot, and that is the cheapest way to fix anything.",
      ],
    },
    {
      id: "phone",
      title: "The phone, where most of this product happens",
      lede: "The host's own phone under the direction, and the guest's entry drawer, the tenth surface and the first thing anyone sees after the QR.",
      argument: [
        "A direction has to answer 375 as well as 1440. Command answers it differently on purpose, because a field with no keyboard is a bottom sheet with big rows. The guest drawer wears the same direction through its own attribute: if a direction cannot reach that one, it is not a contract.",
      ],
    },
    {
      id: "family",
      title: "The rest of the family under the direction",
      lede: "The dialog over its scrim, the tooltip, the real sonner toast, the field, and the edge panel entering from the side the product actually uses.",
      argument: [
        "A direction that only answers the menu is half an answer. These are the surfaces that make the layer a family, and a stray one reads as a bug. The edge panel is on the TOP, because ui/sheet.tsx's one product call site is the marketing mobile menu and it enters from there.",
      ],
    },
    {
      id: "glass-cost",
      title: "Where glass stops paying for itself",
      lede: "The honest cost of the prettiest direction, shown rather than argued: the same panel over the album and over a flat app ground, with card beside it on the flat one.",
      argument: [
        "A backdrop blur earns its compositing layer when there is a room behind the panel: over the album, over a photograph, over the cinema ground. Over a flat app surface there is nothing to let through, so glass is a slightly rounder panel with a fainter edge and a blur the GPU still pays for. If the first is worth it and the second is not, that is an argument for a material that varies by ground, which is a question for rule 15.",
      ],
    },
    {
      id: "directions",
      title: "Every direction, and what it costs",
      lede: "The three theses beside each other, so the ruling can be made from the words once the frames have made it from the pixels.",
      wiring: [
        "Each card says what its paste carries and what only a component change can carry. Card and command are edits to src/components/ui/dropdown-menu.tsx; glass is the one direction that needs no component change at all.",
      ],
    },
    {
      id: "corner",
      title: "The corner, measured",
      lede: "The finding rounds one to three turned on, at 6x, read off the live DOM rather than claimed in a caption.",
      argument: [
        "The solid outer arc is the panel, the solid inner arc is the lit row, and the dashed arc is where the row's corner has to sit for the two to share a centre (bible 9). On today's rung the dashed arc and the row's arc are different lines, and they are the same line on all three candidates. The card direction is the nested rung, so it fixes this by being itself.",
      ],
    },
    {
      id: "light",
      title: "The light in dark, over the ramps",
      lede: "A floating layer's light in dark is a question about the ground it floats over, so the palette board's dark ramps are a switch on the dock.",
      argument: [
        "Today's dark popover sits lighter than the card it opens from (0.245 over 0.21, the palette board's finding), and that gap is the whole reason nothing needs to cast; ramp A widens it, ramp B makes every dark surface one room. The shadow rung is the light board's own --lgt-float family to the byte, so the two boards propose one shadow and this line is ruled once.",
      ],
    },
    {
      id: "entrance",
      title: "The entrance: rule 12 against rule 15",
      lede: "Not a number, a principle. Two ratified rules disagree on this family as they are written, and each frame is one rule taken literally on the same three primitives.",
      argument: [
        "The tooltip is the highest-frequency surface on the site, the menu is next, and the dialog is the rare one. Press Replay and watch the two frames together. The board's reading is that rule 15 means one entrance LANGUAGE, and that a wording change to it is the whole disagreement.",
      ],
    },
    {
      id: "outliers",
      title: "The outliers, and bible 14's first line",
      lede: "Three columns, so the outlier ask is a choice between real things: as it ships, the same primitive on the knobs, and the surface that takes its work if it is dropped.",
      argument: [
        "Select has one product call site, the sheet has one, and ui/drawer.tsx has none at all. Under the directions this ask changes shape, because command answers the select by replacing it with a field. Below the columns is the reduced-motion patch, which competes with nothing: globals.css has clamped every animation under the preference since June, and what the family lacks is a gate of its own.",
      ],
    },
    {
      id: "walk",
      title: "Where to walk a candidate",
      lede: "A direction or a knob set is handed to the whole site, so it is judged where the family actually lives. One block at a time; the newest replaces the last.",
      wiring: [
        "The board's own frames are excluded from a site block by html:not([data-flt-frame]), so the sections above stay honest while a candidate is on. Remember what a paste can carry: the material, the radius and the motion reach these pages, and the header row, the icon rail and the field do not until the wiring round lands them.",
      ],
    },
  ],

  controls: [
    {
      id: "direction",
      label: "Direction",
      options: [
        { id: "today", label: "Today" },
        { id: "card", label: "Card" },
        { id: "glass", label: "Glass" },
        { id: "command", label: "Command" },
      ],
      // The board opens on what it recommends, so the first thing on screen is
      // the proposal and every other direction is the alternative.
      default: "card",
    },
    {
      id: "ground",
      label: "Ground",
      options: [
        { id: "cinema", label: "Cinema" },
        { id: "paper", label: "Paper" },
        { id: "ink", label: "Ink" },
        { id: "app-dark", label: "App dark" },
        { id: "app-light", label: "App light" },
      ],
      default: "cinema",
    },
    // ★ THERE IS NO CANVAS SWITCH, AND THAT IS THE MIGRATION'S ONE DELIBERATE
    // SUBTRACTION. Round four's dock carried a 1440/375 toggle that moved
    // exactly ONE frame (the light ladder): every other specimen is pinned to
    // the canvas it is evidence for, because the desk IS the 1440 read and the
    // phone section IS the 375 one. A page-wide control that changes one frame
    // is the "control that does nothing visible" round three's cold walk went
    // looking for, so the canvas is a section here rather than a switch.
    {
      id: "radius",
      label: "Radius",
      options: [
        { id: "off", label: "Today" },
        { id: "sharp", label: "Sharp" },
        { id: "nested", label: "Nested" },
        { id: "round", label: "Round" },
      ],
      default: "nested",
    },
    {
      id: "entrance",
      label: "Entrance",
      options: [
        { id: "off", label: "Today" },
        { id: "one-clock", label: "One clock" },
        { id: "by-frequency", label: "By frequency" },
      ],
      default: "by-frequency",
    },
    {
      id: "light",
      label: "Light",
      options: [
        { id: "off", label: "Today" },
        { id: "shadow", label: "A soft shadow" },
      ],
      default: "off",
    },
    {
      id: "ramp",
      label: "Ramp",
      options: [
        { id: "today", label: "Today" },
        { id: "a", label: "A, one ladder" },
        { id: "b", label: "B, one room" },
      ],
      default: "today",
    },
  ],

  lookFirst: [
    {
      section: "answers",
      note: "The four answers at true pixels. Thirty seconds here and the direction ask answers itself.",
    },
    {
      section: "desk",
      state: { direction: "glass" },
      note: "The desk on glass: the header panel, both menus and the tooltip at once, on the album's own ground.",
    },
    {
      section: "desk",
      state: { direction: "card" },
      note: "The same desk on card. This is the comparison the review asked for, and it is one click from anywhere.",
    },
    {
      section: "submenu",
      note: "A submenu that only exists because this board portals it, beside the model that deletes it.",
    },
    {
      section: "glass-cost",
      state: { direction: "glass", ground: "app-light" },
      note: "The one section that argues against the prettiest candidate. Glass on a flat app ground buys nothing.",
    },
    {
      section: "corner",
      state: { radius: "nested" },
      note: "The rule-9 corner at 6x, off the live DOM. The dashed arc and the row's arc are one line only on a candidate.",
    },
    {
      section: "walk",
      note: "Apply card from the dock, then take the home header nav and a pricing tooltip in your own tabs.",
    },
  ],

  notes: [
    {
      section: "glass-cost",
      state: { ground: "app-light" },
      text: "The mix came up twice while this was built: at 62 percent a row label disappeared into the photograph under it. Both numbers are measured on this board, not chosen.",
    },
    {
      section: "family",
      text: "ui/tooltip.tsx is inverted (a foreground ground with primary-foreground text), so any material that repaints the background and leaves the colour alone puts dark text on a dark pane. Glass has to say so; card and command do not touch it.",
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
        note: "the header nav panel over a paper ground, where the light rungs change sides",
      },
      {
        label: "Contact",
        path: "/contact",
        note: "the select, its one product call site, and the outlier the board asks about",
      },
      {
        label: "The dashboard",
        path: "/dashboard",
        note: "the account dropdown, the event menus and a confirm dialog (signed in)",
      },
    ],
  },
});
