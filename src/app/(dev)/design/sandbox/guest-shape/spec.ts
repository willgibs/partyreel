import type { Control } from "@/components/lab/board-spec";
import { defineExploration } from "@/components/lab/exploration";

/**
 * THE GUEST EXPERIENCE'S SHAPE, ROUND TWO: THE CHROME, THE WELCOME, THEIRS
 * (2026-09-20).
 *
 * Round one answered whole (docs/reviews/guest-shape.json; verbatim in
 * docs/design/rulings.md, "the sixth batch"). Five of its seven asks are
 * ruled and wired (`guest-wiring`, `7f4f2ffe`): `nothing=river`, `live=land`,
 * `account=after`, `dialogs=stands`, and `yours` by his own rule, verbatim,
 * "a guest can delete any photo they've personally uploaded, ever" (final for
 * the host too). Two of his notes stayed open rather than answers:
 *
 *  - `chrome=dock`, verbatim: "This is the best option of these three, but
 *    having the actions tucked in the bottom right is one of the last places
 *    a guest's eye will reach, especially if they don't know to look for
 *    upload in the first place... Having the actions above felt more
 *    actionable when landing on the page... However, also appreciate that the
 *    actions docked are always accessible, no matter how deep into the album
 *    you get. This likely warrants a second round of exploration." → `chrome`.
 *  - `door=today`, verbatim: "To be clear, this is directly approving the
 *    welcome then gate, not this sheet design." The SEQUENCE is ruled and
 *    stays exactly as it is; only the SHELL returns. Named again the same
 *    night on `demo-event`'s own arrival, `arrival=role`: "This welcome
 *    screen could be redesigned." → `welcome`.
 *
 * And the plan's own third ask, now that Remove lives in the lightbox rather
 * than a strip in the album (round one's `yours=mine` option, not chosen):
 * where a guest finds their own photographs once an album is big rather than
 * a small wedding's 34. → `theirs`.
 *
 * ★ ROUND ONE'S SEVEN ASKS ARE GONE FROM `asks` ON PURPOSE (the `profile-page`
 * precedent: a round replaces its questions rather than accreting them). The
 * ledger keeps their answers for ever; the RULINGS row names them as ruled.
 * `page-parts.tsx` keeps the ground every one of the three below draws on
 * (`TopBar`, `EventBlock`, the tile-size control's guest mount); the files
 * that only ever answered a now-ruled ask (`door.tsx`, `dialogs.tsx`,
 * `account.tsx`, `yours.tsx`) are gone with it.
 *
 * ★ PHONE FIRST, STILL. A guest is at a party holding a phone; 1440 stays the
 * knob every decision shares, because a host and half the people a link is
 * forwarded to are not.
 */

/** The screen every decision shares. */
const SCREEN: Control = {
  id: "screen",
  label: "Screen",
  options: [
    { id: "375", label: "375, a phone" },
    { id: "1440", label: "1440, a laptop" },
  ],
  default: "375",
};

/** `chrome`'s own knob: found on landing, or reachable well past it. The
 *  measuring instrument for his own criterion, not a preference either way. */
const POSITION: Control = {
  id: "position",
  label: "Scroll position",
  options: [
    { id: "landing", label: "Landing" },
    { id: "deep", label: "Scrolled deep into the album" },
  ],
  default: "landing",
};

/** `welcome`'s own knob: a real gated event in two flavours, an open one, and
 *  the demo's own arrival, all on the same four shells. */
const WHICH: Control = {
  id: "which",
  label: "Which door",
  options: [
    { id: "password", label: "A gated event, behind a password" },
    { id: "account", label: "A gated event, an account required" },
    { id: "open", label: "An open event" },
    { id: "demo", label: "The demo's own arrival" },
  ],
  default: "password",
};

/** `welcome`'s second knob: the ruled sequence's two screens, on whichever
 *  shell is on the dock. Moot for the demo, which has one screen and no gate. */
const STEP: Control = {
  id: "step",
  label: "Which step",
  options: [
    { id: "welcome", label: "The welcome" },
    { id: "gate", label: "The gate that follows" },
  ],
  default: "welcome",
};

/** `theirs`'s own knob: the full 68, or narrowed to this guest's own ten. */
const SHOW: Control = {
  id: "show",
  label: "Showing",
  options: [
    { id: "all", label: "All 68" },
    { id: "mine", label: "Yours only" },
  ],
  default: "all",
};

const DRAFT = defineExploration({
  id: "guest-shape",
  title: "The guest experience",
  round: {
    n: 2,
    date: "2026-09-20",
    changed:
      "Round one's seven decisions are ruled and five are wired; this round drops them and asks the two he named by hand (the chrome, the welcome's shell) plus the plan's third (where a guest finds their own photographs once the album is big), on the wired album and the demo's own arrival.",
  },
  history: [
    {
      n: 1,
      date: "2026-09-19",
      changed:
        "The first round: the door, what an album with nothing in it says, the chrome over a wide album, whether the album admits it is filling, the other four guest surfaces, what a guest can do about their own photograph, and how many voices ask for an account. Phone first, on the real components.",
    },
  ],
  context:
    "The wired album today: a full-width Add over a full-width Invite (Save moved out, `account=after`), a floating Add pill once that row scrolls away, a welcome-then-gate door in the shell he flagged, and a guest's own Remove for ever in the lightbox with no way to find it again past the first screen. Every option below is that page or that door with one thing changed.",
  bible: [1, 4, 15, 21],
  asks: [
    {
      id: "chrome",
      label: "The chrome",
      question:
        "Where should Add and Invite live so the most important action is found on landing and reachable at any depth?",
      context:
        "Save already left this row. Today: a full-width Add over a full-width Invite on landing, then only a floating Add pill once that row scrolls away, Invite gone with it. Drawn on the real 34-photograph album at both ends of a real scroll, landing and 900px down, well past the row at either screen this board judges.",
      options: [
        {
          id: "column",
          label: "The row, plus the floating pill (today)",
          means:
            "As shipped: Add over Invite on landing; scrolled deep, only the floating Add pill remains and Invite is out of reach.",
        },
        {
          id: "dock",
          label: "Both actions, docked at every depth",
          means:
            "No row under the event at all. Add and Invite share one bar fixed to the foot of the screen, landing or deep, always the same two buttons.",
        },
        {
          id: "both",
          label: "The row on landing, a dock once it scrolls away",
          means:
            "Today's row stays for the first look; once it scrolls out of view a dock with both actions takes its place, and the single pill retires.",
        },
        {
          id: "header",
          label: "Add in a sticky header, Invite in a dock",
          means:
            "The header pins to the top and carries Add beside the wordmark; Invite lives alone in a bar fixed to the foot. Two objects, each always on screen.",
        },
      ],
      recommended: "both",
      because:
        "His own words hold both halves of the criterion at once: the row felt more actionable landing on the page, and he appreciated always accessible, no matter how deep. `both` is the row he liked first becoming the dock he trusted, so neither half depends on a guest noticing a lone pill scroll in.",
      overrule:
        "If one object beats the row's first impression, the dock alone is never a different picture at any depth, the simpler promise and the closest to his own pick.",
      lands: "The top of every guest album, and whether the floating Add pill survives.",
      tile: "phone",
      configs: [SCREEN, POSITION],
    },
    {
      id: "welcome",
      label: "The welcome",
      question: "What shell should the door and its welcome screen wear?",
      context:
        "The sequence is ruled: welcome, then the gate, on a gated event, exactly as it stands. The shell it rides was named directly, not this sheet design. Drawn on a real gated event (password the knob's default, account the other flavour), an open event, and the demo's own arrival, the same four shells around each.",
      options: [
        {
          id: "today",
          label: "The drawer and dialog, as shipped",
          means:
            "Unchanged: a drawer at the foot below 640, the centred dialog above it, today's copy.",
        },
        {
          id: "page",
          label: "The welcome is the page",
          means:
            "No floating chrome at any width. The welcome fills the screen; the gate replaces it in place as the ruled second step, and the album begins once both are past.",
        },
        {
          id: "card",
          label: "A compact card, the album behind it",
          means:
            "A small float over the album's own top: the locked page's river, or the real photographs, visible in the room the card leaves rather than dimmed behind a scrim.",
        },
        {
          id: "sheet",
          label: "The responsive Sheet's own posture",
          means:
            "The primitive promoted everywhere else: a bottom sheet under 640, a full-height panel from the right edge from 640 up, no centred float at a desk.",
        },
      ],
      recommended: "card",
      because:
        "It is the one shape that is not a sheet at all, which is what he flagged. A compact float that admits the party is already happening behind it (the real teaser, or the locked page's own river) reads as an invitation continuing rather than a form standing in front of one.",
      overrule:
        "If a guest's first screen should hold their whole attention, `page` gives welcome and gate the whole screen each, the album hidden until both pass.",
      lands:
        "The one shell a guest's very first screen wears, on a real gate and on the demo's own arrival.",
      tile: "phone",
      configs: [SCREEN, WHICH, STEP],
    },
    {
      id: "theirs",
      label: "Theirs",
      question: "Where does a guest find their own photographs once the album is big?",
      context:
        "A guest's own photograph is already removable for ever, on both identities, final for the host too. That answers what a guest can do about it; it says nothing about finding it again. Drawn on a 68-photograph album, ten of them this guest's own, spread from near the top to well past the fold.",
      options: [
        {
          id: "none",
          label: "Nothing added (today)",
          means:
            "The lightbox's Remove is the whole of it. Finding one of ten among 68 is scrolling and recognising it by eye.",
        },
        {
          id: "chip",
          label: "A \"Yours\" chip in the control row",
          means:
            "One filter chip beside Sort and Filter, in the row the tile-size control already sits in. On, the grid narrows to the ten.",
        },
        {
          id: "strip",
          label: "Their own, in a strip above the album",
          means:
            "Everything this guest added, together, above the full album rather than in place of any of it.",
        },
        {
          id: "mark",
          label: "A mark on their own tiles, tap to filter",
          means:
            "A subtle mark rides the ten tiles that are theirs, wherever they fall in the grid; a tap on the mark is the same filter as the chip.",
        },
      ],
      recommended: "mark",
      because:
        "It costs no new surface (no chip's real estate, no strip's second copy of ten photographs) and answers the harder half of the question too, which one of the 68 is mine, wherever it falls, before a single tap.",
      overrule:
        "If a mark on every tile a guest scrolls past is too quiet to ever be found, the chip names itself in the one row a guest already reads for Download all.",
      lands:
        "Whether the album ever says which tiles are a guest's own, and how the removal a guest already has stays findable at scale.",
      tile: "phone",
      configs: [SCREEN, SHOW],
    },
  ],
});

/**
 * ★ ONE KNOB PER ID, NOT ONE PER DECISION THAT USES IT. `defineExploration`
 * flattens every decision's `configs` into the board's controls, so a screen
 * knob three decisions share arrives three times: the dock would draw it
 * three times and React would warn on the duplicate key. Each decision keeps
 * it on its own strip; the board declares it once (the `guest-shape` round one
 * and `profile-page` precedent).
 */
export const GUEST_SHAPE: typeof DRAFT = {
  ...DRAFT,
  controls: DRAFT.controls?.filter(
    (c, i, all) => all.findIndex((d) => d.id === c.id) === i,
  ),
};
