import { defineBoard } from "@/components/lab/board-spec";

/**
 * THE FLOATING-SURFACES BOARD, AS DATA (the migration wave, 2026-09-15; the
 * asks rewritten in plain words the same night, the clarity round).
 *
 * Nothing here is new argument. Every ask, candidate, departure and section is
 * round four's, moved out of `board.tsx`'s `LANDING`, `CANDIDATES`, `ASKS`,
 * `DEPARTURES` and twelve hand-built `Row` headers so that the template, the
 * desk, the record and the review ledger read ONE list. What changed is where a
 * reviewer meets them: the verdict and the five calls are the first screen
 * instead of a block this board drew for itself, and the page-wide switches are
 * declared state rather than seven `useState` calls the URL never saw.
 *
 * ★ AN ASK IS ANSWERABLE COLD, AND THE EVIDENCE CARRIES THE OPTIONS' WORDS.
 * Will's first review through the desk stopped at asks that were labels with
 * token options ("The aurora's placement: no | seam | both | room"), so every
 * ask here is a real question with what the thing is, where to look, and each
 * option in words with what choosing it does. The ids never changed: the ledger
 * joins on them. The option LABELS are also the frame titles and the ladder
 * columns (`constants.ts` reads them back off this list through
 * `askOptionLabel`), so the words on the question and the words on the
 * specimen cannot drift apart.
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
 * `{` after `defineBoard(`. A second import above the call is enough to hand
 * that scanner the wrong object, and the failure is quiet: every ask is
 * reported as "not an ask on this board" and a ruling cannot be filed.
 */
export const FLOATING_SURFACES = defineBoard({
  id: "floating-surfaces",
  title: "Floating surfaces",

  question:
    "If this product had no menus, no popovers and no sheets, what should everything that opens over the page be, and what do today's menus become while that is built?",

  round: {
    n: 5,
    date: "2026-09-15",
    changed:
      "The five asks rewritten in plain words: a real question, what the thing is and where it lives, where to look, and every option labelled with what choosing it does. The frames, the ladders and the dock carry those same words now. No direction, number or recommendation changed.",
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
    "Rounds one to three asked what today's floating surfaces should be TUNED to, and answered in three switches: the corner, how a surface appears, and its light in dark. Will's review moved the question. The app's menus are the problem, and the exact values of today's options are not. So the board explores what these surfaces should BE, and keeps the three switches as the ruling for today's primitives if no direction wins.",

  verdict: {
    recommendation:
      "Card: a menu becomes a small made object, with a title, labelled groups, an icon rail and the row you cannot undo set apart. Take command's one idea into it and delete the nested menu.",
    because:
      "It fixes the thing the review names. Today's menus are anonymous lists: no title, no groups, and Delete the event one row under Download everything. Card gives every surface a title, groups, an icon rail, a right-hand column for state and a rule under the destructive row, and it does it on all ten surfaces at once.",
    overrule:
      "Glass is the prettiest and buys nothing on a plain app screen. Command is the biggest idea and the wrong product for it: a host opens the event menu a dozen times in their life.",
  },

  asks: [
    {
      id: "direction",
      question:
        "Which direction should everything that opens over the page follow?",
      context:
        "Ten surfaces open over the page here: the header's nav panel, an event's actions menu, the account menu, dialogs, tooltips, toasts, the select, the phone's bottom sheet and the guest's entry drawer. Will's review said the app's design lags the marketing site, so the board drew three directions from the ground up, each changing something different about all ten.",
      look: "The four answers section: the same event menu under each option, side by side at true size. Then set Direction on the dock and read the host's desk and the phone with that option on.",
      options: [
        {
          id: "today",
          label: "Today's menus, unchanged",
          means:
            "Nothing changes. The anonymous list the app ships, kept as the floor the other three are judged against.",
        },
        {
          id: "card",
          label: "Card: a menu as a made object",
          means:
            "Every surface gains a title, labelled groups, an icon rail, its state on the right, and the delete row under a rule of its own.",
        },
        {
          id: "glass",
          label: "Glass: one lit pane",
          means:
            "The boxes come out: one translucent pane of the room behind it, lit along its top edge, with nothing drawn inside it.",
        },
        {
          id: "command",
          label: "Command: a search field",
          means:
            "The list is replaced by a field you type into, its groups flattened underneath, and no menu opens a second menu anywhere.",
        },
      ],
      recommended: "card",
      because:
        "Card changes the anatomy, glass the material, command the model, so they are three kinds of answer rather than three shades of one. Card is the one that answers the complaint on all ten surfaces at once.",
      overrule:
        "If the app should read as one room rather than a set of objects, glass is that claim, and it is a ruling about material rather than about menus.",
      evidence: "answers",
      control: "direction",
    },
    {
      id: "submenu",
      question: "Should a menu still be able to open a second menu?",
      context:
        "One menu in the product opens another: Who can upload, on an event's actions menu, holding three choices that cannot both be true (anyone with the link, guests who verify an email, nobody) behind a hover and a wait. It is the only nested menu anywhere here, and as shipped it is invisible: this board has to wrap it in a portal to show it at all.",
      look: "The nested menu section: the frame titled Keep the nested menu is that branch at its best, and the frame titled Delete it, choices inline is the same three choices as one labelled group in a single panel.",
      options: [
        {
          id: "keep",
          label: "Keep the nested menu",
          means:
            "The branch stays, and the wiring round repairs the shipped bug that makes a submenu paint nothing.",
        },
        {
          id: "delete",
          label: "Delete it, choices inline",
          means:
            "The three choices sit inline under their own label, and no menu in the product opens a second one.",
        },
      ],
      recommended: "delete",
      because:
        "Three choices that cannot both be true are a group, not a tree, and hiding them behind a hover and a wait buys nothing. Deleting the branch takes the shipped bug with it, which is the cheapest way to fix anything.",
      overrule:
        "Keeping it is a ruling to repair the primitive instead: as shipped, a submenu paints nothing at all.",
      evidence: "submenu",
    },
    {
      id: "radius",
      question: "How round should a floating panel and its rows be?",
      context:
        "Every menu, popover and sheet shares one corner today: an 8px panel around rows rounded to 1.6px, sitting in 4px of padding. Bible 9 asks a row's corner to sit concentric inside the panel's, and today's numbers miss that by six times, measured off the live page. Three corners are on offer, and the card direction already carries the middle one.",
      look: "The corner section, at six times magnification. The first frame is today, for comparison; the three after it are these options. The dashed arc is where a row's corner has to sit for the two to share a centre.",
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
            "The panel's corner stays exactly where it ships and each row's corner rises 4px, so the two share a centre.",
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
        "It is the only option that changes one number: today's 8px panel stays and the rows rise 4px to nest inside it. The card direction is already this corner, so a ruling for card rules this line too.",
      evidence: "corner",
    },
    {
      id: "entrance",
      question: "Should every floating surface appear at the same speed?",
      context:
        "How a surface appears, how fast it fades and travels in, is set once for the whole family today. Two ratified rules disagree about that. Rule 15 asks for one entrance across every floating surface; rule 12 asks for speed by how often a thing is opened, so a tooltip met fifty times in an evening lands faster than a dialog met once.",
      look: "The appearing section: two frames, each one rule taken literally on the same tooltip, menu and dialog. Press Replay on the dock and watch them together. The difference is the tooltip.",
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
            "The tooltip and the menu land in 90ms and the dialog keeps its slower beat, which is rule 12 as it is written.",
        },
      ],
      recommended: "by-frequency",
      because:
        "A tooltip is opened fifty times in an evening and a dialog once. Read rule 15's one entrance as one language, with rule 12 setting the clock inside it, and the two rules stop disagreeing. That wording change is Will's to make.",
      overrule:
        "One speed is the simpler contract, and it is the reading rule 15 has as it stands today.",
      evidence: "entrance",
    },
    {
      id: "light",
      question: "In dark mode, should a floating panel cast a shadow?",
      context:
        "In dark mode nothing that opens over the page casts a shadow today: a panel is told apart from the page only by sitting a shade lighter than it, and how well that reads depends on which dark greys the palette board settles on. The light board proposes one soft shadow for exactly this case, and these surfaces would wear that same shadow.",
      look: "The shadow in dark section: one frame, two columns, labelled with these options. Flip the dark greys on the dock, today's against the two the palette board proposes, and read the same panel again.",
      options: [
        {
          id: "today",
          label: "No shadow, as dark ships",
          means:
            "Dark keeps no shadow under a floating panel, and a lighter surface stays the only thing separating it from the page.",
        },
        {
          id: "shadow",
          label: "A soft shadow, ruled here",
          means:
            "The soft shadow lands on these surfaces on this board's ruling, without waiting for the light board.",
        },
        {
          id: "follow-light",
          label: "A soft shadow, the light board's call",
          means:
            "The same shadow, ruled once on the light board, and these surfaces take whatever that board decides.",
        },
      ],
      recommended: "follow-light",
      because:
        "The shadow on offer here is the light board's own float shadow to the byte, and every direction that casts one casts that. Ruling the same line twice on two boards is how two boards drift apart.",
      overrule:
        "If dark must stay shadowless, the shipped elevation contract already says so by name, and these surfaces keep their lighter face.",
      evidence: "light",
      state: { ground: "app-dark" },
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
        "A host's menu is a search problem, not a tree. One surface with a field at the top, grouped rows underneath, keyboard first, and no menu opening a second menu anywhere in the product.",
    },
    {
      id: "knobs",
      name: "Today's surfaces, on the three switches",
      rationale:
        "Rounds one to three's answer, kept whole: the corner corrected, the faster entrance where you open often, and the shadow in dark. The three are independent, each is a real paste, and they are what today's surfaces become if no direction is ruled. The card direction already carries the corner.",
    },
    {
      id: "reduced-motion",
      name: "The reduced-motion patch (free, and it competes with nothing)",
      rationale:
        "Not a candidate and not a hole: globals.css has clamped every animation and transition to 0.01ms under the preference since 2026-06-11. What these surfaces lack is bible 14's FIRST line, a gate of their own, and this paste is that.",
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
      text: "A finding against rule 15, not a quiet choice. Rule 15's one entrance and rule 12's animate-by-frequency disagree on these surfaces as they are written. The board reads rule 15's line as one entrance LANGUAGE with rule 12 setting the clock inside it. That is a bible edit and it is Will's to make.",
      evidence: "entrance",
    },
    {
      id: "tenth-surface",
      from: 15,
      text: "The family is TEN surfaces, not nine. guest/entry-shell.tsx renders a raw vaul drawer that never goes through ui/drawer.tsx, with a literal radius, and it is the floating surface most people on this product will ever see. Every direction reaches it through [data-entry-drawer].",
      evidence: "phone",
    },
    {
      id: "contract-nest",
      from: 9,
      text: "Today's contract misses bible 9 inside itself: an 8px panel around 1.6px rows sitting in 4px of padding does not nest. The corner section measures it off the live DOM at 6x. The card direction fixes it by being the corrected corner; glass and command fix it at their own corners.",
      evidence: "corner",
    },
    {
      id: "glass-in-dark",
      from: 10,
      text: "Glass puts a backdrop blur on every open panel, and the soft shadow puts a shadow in DARK, which the shipped elevation contract still forbids by name. Both are the light board's territory as much as this one's, and the glass section shows where the blur stops paying for itself.",
      evidence: "glass-cost",
    },
  ],

  assets: [],

  sections: [
    {
      id: "desk",
      title: "The host's desk, at laptop width",
      lede: "The three menus a host meets in one session, open together on the ground they open over, with the tooltip beside them. Set Direction on the dock and the whole desk changes.",
      eager: true,
      argument: [
        "This is the canvas rule 15 is about: the header's panel, the event's actions menu and the account menu at once. A direction either reads as one language across them or it does not, and a single menu on a stage can never show that. The comparison costs a click from wherever you are standing, which is the whole reason the switches are in the dock.",
      ],
    },
    {
      id: "answers",
      title: "The four answers, side by side",
      lede: "The same event menu under each of the four options, each frame at its own real pixels, so a 4px corner really is 4px.",
      argument: [
        "Today is an anonymous list: no title, no groups, and Delete the event one row from Download everything. Card gives it a title, sections, a rail and a footer. Glass takes the boxes out and lets the room through. Command replaces the list with a field.",
        "The canvas is 328 wide and says so on its face, because it is a detail frame and not a phone: four of them plus their gaps have to clear the lab column at 1440 minus the scrollbar, and at 340 the fourth answer wrapped to a second line and turned a four-way comparison into a three-way one.",
      ],
    },
    {
      id: "submenu",
      title: "The nested menu, kept and deleted",
      lede: "Keep it, and the second panel is as good as a nested menu gets. Delete it, and the same three choices are one labelled group in a single panel.",
      argument: [
        "The only nested menu in the product is Who can upload, and it exists to hold three mutually exclusive values behind a hover and a wait. The board's recommendation takes the right-hand idea into the left-hand anatomy: card's panel, with those three values inline under their own label, and no branch anywhere in the product. Which also makes the shipped bug moot, and that is the cheapest way to fix anything.",
      ],
    },
    {
      id: "phone",
      title: "The phone, where most of this product happens",
      lede: "The host's own phone under the direction, and the guest's entry drawer, which is the first thing anyone sees after scanning the QR code.",
      argument: [
        "A direction has to answer 375 as well as 1440. Command answers it differently on purpose, because a field with no keyboard is a bottom sheet with big rows. The guest drawer wears the same direction through its own attribute: if a direction cannot reach that one, it is not a contract.",
      ],
    },
    {
      id: "family",
      title: "The other surfaces that float",
      lede: "The dialog over its dimmed page, the tooltip, the real toast, the select, and the panel that slides in from the edge the product actually uses.",
      argument: [
        "A direction that only answers the menu is half an answer. These are the surfaces that make the layer a family, and a stray one reads as a bug. The edge panel is on the TOP, because ui/sheet.tsx's one product call site is the marketing mobile menu and it enters from there.",
      ],
    },
    {
      id: "glass-cost",
      title: "Where glass stops paying for itself",
      lede: "The honest cost of the prettiest direction, shown rather than argued: the same panel over the album's photographs and over a plain app screen, with card beside it on the plain one.",
      argument: [
        "A backdrop blur earns its compositing layer when there is a room behind the panel: over the album, over a photograph, over the cinema ground. Over a flat app surface there is nothing to let through, so glass is a slightly rounder panel with a fainter edge and a blur the GPU still pays for. If the first is worth it and the second is not, that is an argument for a material that varies by ground, which is a question for rule 15.",
      ],
    },
    {
      id: "directions",
      title: "Every direction, and what it costs",
      lede: "What each direction believes, what it changes and what it costs, side by side, so the call can be made from the words once the frames have made it from the pixels.",
      wiring: [
        "Each card says what its paste carries and what only a component change can carry. Card and command are edits to src/components/ui/dropdown-menu.tsx; glass is the one direction that needs no component change at all.",
      ],
    },
    {
      id: "corner",
      title: "The corner, measured",
      lede: "The corner every panel and every row inside it shares, at six times magnification, read off the live page rather than claimed in a caption.",
      argument: [
        "The solid outer arc is the panel, the solid inner arc is the lit row, and the dashed arc is where the row's corner has to sit for the two to share a centre (bible 9). On today's rung the dashed arc and the row's arc are different lines, and they are the same line on all three candidates. The card direction is the corrected corner, so it fixes this by being itself.",
      ],
    },
    {
      id: "light",
      title: "Shadow in dark mode",
      lede: "Whether a panel needs a shadow in dark depends on the greys under it, so the palette board's two proposed dark sets sit on the dock beside today's.",
      argument: [
        "Today's dark popover sits lighter than the card it opens from (0.245 over 0.21, the palette board's finding), and that gap is the whole reason nothing needs to cast; ramp A widens it, ramp B makes every dark surface one room. The soft shadow is the light board's own --lgt-float family to the byte, so the two boards propose one shadow and this line is ruled once.",
      ],
    },
    {
      id: "entrance",
      title: "How a surface appears: two rules disagree",
      lede: "Not a number, a principle. Two ratified rules disagree here as they are written, and each frame is one of them taken literally on the same tooltip, menu and dialog.",
      argument: [
        "The tooltip is the highest-frequency surface on the site, the menu is next, and the dialog is the rare one. Press Replay and watch the two frames together. The board's reading is that rule 15 means one entrance LANGUAGE, and that a wording change to it is the whole disagreement.",
      ],
    },
    {
      id: "outliers",
      title: "The three surfaces almost nothing uses",
      lede: "The select, the edge panel and the drawer: each as it ships, the same one on the switches in the dock, and the surface that would take its work if it were dropped.",
      argument: [
        "Select has one product call site, the sheet has one, and ui/drawer.tsx has none at all. Under the directions the question changes shape, because command answers the select by replacing it with a field. Below the columns is the reduced-motion patch, which competes with nothing: globals.css has clamped every animation under the preference since June, and what these surfaces lack is a gate of their own.",
      ],
    },
    {
      id: "walk",
      title: "Where to try a direction on the real site",
      lede: "Apply hands the whole site a direction, so it is judged where these surfaces actually live. One block at a time: the newest replaces the last.",
      wiring: [
        "The board's own frames are excluded from a site block by html:not([data-flt-frame]), so the sections above stay honest while a candidate is on. Remember what a paste can carry: the material, the radius and the motion reach these pages, and the header row, the icon rail and the field do not until the wiring round lands them.",
      ],
    },
  ],

  controls: [
    // ★ THE DIRECTION SWITCH IS THE DIRECTION ASK, to the option id AND to the
    // label (the clarity round): the ask declares `control: "direction"`, so
    // picking an option on the review card previews it, and a reviewer reads the
    // same words on the question, on the dock and on the frame.
    {
      id: "direction",
      label: "Direction",
      options: [
        { id: "today", label: "Today's menus, unchanged" },
        { id: "card", label: "Card: a menu as a made object" },
        { id: "glass", label: "Glass: one lit pane" },
        { id: "command", label: "Command: a search field" },
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
    //
    // The three switches below carry an extra "as it ships" their ask does not
    // offer, which is why none of them declares `control` on its ask: mirroring
    // needs the two id sets to be the same set. Their LABELS are still the ask's
    // words, so a reviewer flipping one is flipping the option they were asked
    // about.
    {
      id: "radius",
      label: "Corner",
      options: [
        { id: "off", label: "As it ships" },
        { id: "sharp", label: "Squarer, like a surface" },
        { id: "nested", label: "Today's panel, rows corrected" },
        { id: "round", label: "Rounder, like a button" },
      ],
      default: "nested",
    },
    {
      id: "entrance",
      label: "How it appears",
      options: [
        { id: "off", label: "As it ships" },
        { id: "one-clock", label: "One speed for every surface" },
        { id: "by-frequency", label: "Faster where you open often" },
      ],
      default: "by-frequency",
    },
    {
      id: "light",
      label: "Shadow in dark",
      options: [
        { id: "off", label: "No shadow, as dark ships" },
        { id: "shadow", label: "A soft shadow" },
      ],
      default: "off",
    },
    {
      id: "ramp",
      label: "Dark greys",
      options: [
        { id: "today", label: "Today's dark" },
        { id: "a", label: "A: one ladder" },
        { id: "b", label: "B: one room" },
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
      note: "The desk on glass, one lit pane: the header panel, both menus and the tooltip at once, on the album's own ground.",
    },
    {
      section: "desk",
      state: { direction: "card" },
      note: "The same desk on card, the menu as a made object. This is the comparison the review asked for, one click from anywhere.",
    },
    {
      section: "submenu",
      note: "A submenu that only exists because this board portals it, beside the model that deletes it.",
    },
    {
      section: "glass-cost",
      state: { direction: "glass", ground: "app-light" },
      note: "The one section that argues against the prettiest direction. Glass over a plain app screen buys nothing.",
    },
    {
      section: "corner",
      state: { radius: "nested" },
      note: "The bible 9 corner at six times. The dashed arc and the row's arc are one line only on a candidate.",
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
        note: "the header nav panel over a paper ground, where the shadow in dark changes sides",
      },
      {
        label: "Contact",
        path: "/contact",
        note: "the select, its one product call site, and one of the three surfaces almost nothing uses",
      },
      {
        label: "The dashboard",
        path: "/dashboard",
        note: "the account dropdown, the event menus and a confirm dialog (signed in)",
      },
    ],
  },
});
