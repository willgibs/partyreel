import { defineExploration } from "@/components/lab/exploration";

import { GROUND, SCREEN, SHOW, WHERE } from "./knobs";

/**
 * PARTYREEL'S OWN ATOMS, ROUND FIVE: THE SET (the identity track, 2026-10-05).
 *
 * Round four asked seven traits one at a time. Will picked the halo, the
 * shrink and the floating edge, and skipped the field, the button, what is
 * chosen and the toggles on purpose: "it was a bad idea to go per-atom
 * questions when rethinking those components ... if I answer style X for one
 * atom but style Y for another, or even worse style Z for a third, they begin
 * to fall out of sync very quickly, killing the goal of cohesion ... Rather
 * than re-present the current individual options as groups, think it'd be
 * worth going back to the drawing board for 3+ tailored options." And his
 * warning: "it's common for each option to attempt to separate itself so
 * distinctly from the others that all presented options feel *too* themed
 * ... The best option may be a few magic touches from a similar option."
 *
 * ★ ONE ASK, THREE WHOLE SETS (`sheet/sets/`), each drawn by one hand, differing
 * in a few load-bearing constructions (how a field holds a value, how a key
 * stands, how a chosen thing reads, what a toggle is) and sharing everything
 * else (`sheet/base.ts`): the 40px field, the corner ladder, the ink and tone
 * steps, spacing, his three picks (`sheet/settled.ts`). Each set's costs name
 * the touch worth borrowing from a neighbour. They stand in order of depth:
 * keys and wells (every key up, every field down), the house's mix (only the
 * field down, only what is chosen up), ink and tone (no depth at all). A
 * fourth, lit edges, was drawn and cut (`model.ts`, the fresh-eyes pass).
 *
 * ★ REAL SCREENS FIRST, EACH SET'S FIRST FRAME A COMPOSITE: Settings' door
 * beside Account's billing row (between them every family), then the dates,
 * Create's foot, the guest's door, the album's toolbar and Settings' dense
 * first page, at 1440 and 375, on paper beside the room; every state one
 * press away.
 *
 * ★ AFTERGLOW, AND PAPER AS FINISHED AS THE ROOM (desk 4, relayed while this
 * round was drawn: brand r1 is Afterglow; his note, "it is very tough to nail
 * on anything light. It's washed out easily"). Each set is built to read
 * finished on paper, and its costs name what would fight Afterglow (a light
 * of its own on every screen, anything that paints). Form, never hue.
 */
export const IDENTITY = defineExploration({
  id: "identity",
  title: "Partyreel's own atoms",
  surface: "shared",
  desk: 10,
  lives: [
    "docs/systems/design-system.md",
    "src/components/ui/",
    "src/app/globals.css",
    "src/app/theme.css",
    "src/lib/glass.ts",
    "src/app/(dev)/design/(shell)/library/components/",
  ],
  round: {
    n: 5,
    date: "2026-10-05",
    changed:
      "Your four skipped atoms as one ask: three whole sets drawn fresh (keys and wells finished, the house's own mix, ink and tone), each on real screens on paper and in the room, wearing your three picks; then working again.",
  },
  history: [
    {
      n: 4,
      date: "2026-10-04",
      changed:
        "Your mix as seven trait asks, then the light edge on ten screens. You picked the halo, the shrink and the floating edge, asked for working again, and skipped four atoms to judge them as sets.",
    },
    {
      n: 3,
      date: "2026-10-03",
      changed:
        "Actions and fields as one system in three directions (keys and wells, all rings, ink), then the room's pop-out and the light edge's reach. You picked graphite and asked to mix the systems.",
    },
    {
      n: 2,
      date: "2026-10-02",
      changed:
        "Viewfinder atom by atom: the voice, then actions, fields, layers and status. You picked the camera voice, the display and lights, and asked for actions and fields again, together.",
    },
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Four atomic families drawn whole over production (editorial, soft, crystal, viewfinder) beside today's. You picked viewfinder.",
    },
  ],
  opening: {
    about:
      "Round five: the field, the buttons, what is chosen and the toggles as one set, three drawn whole on real screens; then what a key shows while it works.",
    settled: [
      "Your r4 picks, worn by every set: focus is the halo, a press shrinks, and every pop-out takes the bright edge.",
      "Shared by all four: the 40px field, the corner ladder (8px fields, keys at 0.4 of their height), the ink and tone steps, spacing.",
      "The brand is Afterglow (desk 4): each set names what would fight it, and every frame stays form, never hue.",
      "The head's atoms keep their surfaces: the shutter, the glass rounds and the white Add take a set's finish, press and halo only.",
    ],
    earlier: [
      "Your r4 note: judge the atoms as a set so they stay in sync, drawn fresh rather than r4's options regrouped.",
      "Your warning: options pushed apart feel too themed; the best may be a few touches from a neighbour.",
      "Keys and wells your favourite foundation, a lighter surface for what is chosen, and tailwindcss.com's cohesion as the bar.",
      "Afterglow, you said, washes out on anything light: every set is drawn to read finished on paper as in the room.",
      "Working: you lean to the arc running round; three lights felt unnatural and the track was easy to miss.",
    ],
  },
  terms: [
    {
      term: "set",
      means:
        "One whole system: the field, the button family, what is chosen and the toggles, drawn by one hand.",
    },
    {
      term: "well",
      means:
        "A part sunk a step under its ground: a soft shade inside its top, its foot catching the light.",
    },
    {
      term: "key",
      means:
        "Anything you press. In keys and wells it stands a step up: lit on top, a hairline round it, a soft shade under.",
    },
    {
      term: "tone",
      means:
        "A quiet fill of the ground's own ink, a few percent strong, with no line.",
    },
    {
      term: "ink",
      means:
        "The house's one strong value: near-black on paper, white in the room.",
    },
    {
      term: "the bright edge",
      means:
        "One pixel of light along a surface's top, fading down its sides, as photographs and pop-outs wear it.",
    },
    {
      term: "graphite",
      means:
        "A lit grey one step above the room's black: the room's pop-outs, and what floats in the house mix.",
    },
    {
      term: "lift",
      means:
        "The house's small shadow for one thing standing over another, here a chosen part over its track.",
    },
    {
      term: "halo",
      means:
        "Your focus mark: a fine line of ink standing 2px off the control, in a soft aura.",
    },
    {
      term: "the arc",
      means:
        "A third of a ring turning round a faint whole ring, in a working key's icon place beside its words.",
    },
    {
      term: "Afterglow",
      means:
        "The brand vision you picked: all colour is light from the photographs, one light a screen.",
    },
  ],
  carried: [
    {
      id: "door-composite",
      question:
        "Is each set's first frame Settings' door beside Account, its dates one press away?",
      taken:
        "Yes: no one real screen holds every family; the door has the field and the chosen, Account the quiet keys.",
      overrule: "One screen alone, or the two dates drawn into the door's frame.",
    },
    {
      id: "create-wait",
      question: "Is Create's foot caught at Create event rather than Continue?",
      taken:
        "Yes: Create event is its one real wait; Continue moves on at once, so a working Continue would picture a wait that never happens.",
      overrule: "Draw Continue working, as the brief named it.",
    },
    {
      id: "status-slot",
      question:
        "Does a field checking what was typed draw its working in a slot at its end?",
      taken:
        "Yes: a proposed hook where a wired field puts its tick or its cross, so working never covers what was typed.",
      overrule: "A field shows working only in the line under it.",
    },
    {
      id: "veil",
      question:
        "Does a panel or a sheet dim the page a quarter on paper and half in the room?",
      taken:
        "Yes, as r4 drew it: half read heavy on paper; every frame here keeps it.",
      overrule: "Half on paper too, as production draws it.",
    },
  ],
  asks: [
    /* ── 1. The set ──────────────────────────────────────────────────── */
    {
      id: "set",
      label: "Which set?",
      question:
        "Which set should every field, button, chosen thing and toggle wear together?",
      where: ["Shared", "Every control", "As one set"],
      when: "Wherever a host or a guest types, presses, chooses or flips: Settings, Account, Create, the guest's door, the album.",
      matters:
        "Picked whole they stay in step: one hand draws the field, the keys, the chosen and the toggles, so the product reads as one.",
      lands:
        "Input, Textarea and Select, Button's variants, chips, segments, tabs, radio cards, Switch, and the check, radio and slider to come.",
      context:
        "Each set first on the composite: Settings' door (her new password typed, Set password and Cancel, a gate chosen) beside Account's billing row, paper beside the room; more real screens and every state one press away.",
      options: [
        {
          id: "keys",
          label: "Keys and wells: it stands up, or sinks in",
          means:
            "A field is sunk a step under the page; every key stands a step above it, one hairline round it and a soft shade under; what is chosen rises.",
          gains:
            "The most tactile and the crispest on paper: a field is never mistaken for a key.",
          costs:
            "Relief on every key, where Afterglow draws keys flat; borrow the house's flat keys.",
        },
        {
          id: "house",
          label: "The house mix: sunk, flat, afloat",
          means:
            "A field is a well; keys lie flat (ink, a tone, a clear key with keys' hairline); what is chosen floats: white on its lift on paper, graphite lit in the room.",
          gains:
            "Each depth says one part's job, and its keys lie flat as Afterglow draws them.",
          costs:
            "Its lit chosen is a light beside Afterglow's in the room; it borrows keys' hairline.",
        },
        {
          id: "tone",
          label: "Ink and tone: values only, flat as a print",
          means:
            "No line, no shadow, no light: a field is the faintest tone, a key a firmer one, the primary ink, and what is chosen a firmer tone, pressed in.",
          gains:
            "The calmest page, and it leaves every light on the screen to Afterglow.",
          costs:
            "Chosen reads pressed in, against your lighter lean; borrow the house's float.",
        },
      ],
      recommended: "house",
      because:
        "Each depth earns its place: a well says type here, a flat key matches Afterglow's own, and the chosen floats as every pop-out does.",
      overrule:
        "If every key should stand up, keys and wells (your favourite foundation); if the page must be flat, ink and tone.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 2. Working ──────────────────────────────────────────────────── */
    {
      id: "loading",
      label: "Working",
      question: "What should a key show while it works on what you pressed?",
      where: ["Shared", "Every action", "While it works"],
      when: "Unlock checking a password, Save writing a name, Create event making the album: the wait after a press, on party wifi.",
      matters:
        "A wait with nothing to read feels broken: a working key must say at once that it is held, and why.",
      lands:
        "A working action's busy state, on every key and on a field checking what was typed.",
      context:
        "Drawn on what it works on (a primary, a quiet key, the call to action, a field checking a link), each moving beside its still, paper and room, wearing the set; Create, the door, Account, Settings one press away.",
      options: [
        {
          id: "arc",
          label: "The arc, refined: a third of a ring",
          means:
            "A third of a ring turns round a faint whole ring in the key's own ink, in its icon's place beside its words; still, a ring a third filled.",
          gains:
            "Your pick, cleaner: its still reads as working too, and a key with an icon keeps its width.",
          costs: "The plainest of the three: it says working, never what.",
        },
        {
          id: "words",
          label: "The words say it: Saving, with the arc",
          means:
            "The arc, and the key's words turn to what it is doing (Saving, Unlocking, Creating your event), as production's own Saving already does.",
          gains:
            "Says why it is held, in words a guest reads at a glance.",
          costs:
            "Words to write for every key, and a key grows a little while it says them.",
        },
        {
          id: "still",
          label: "The words stay with her: Still saving",
          means:
            "The arc and the working words, and past four seconds they say it is still at it (Still saving, Still unlocking); a field says Still checking.",
          gains:
            "A slow wait on party wifi reads alive, never stuck, and no clock counts it.",
          costs:
            "Two sets of words to write for every key, and a long wait is named aloud.",
        },
      ],
      recommended: "words",
      because:
        "Your arc, with words saying what it waits on: held, and why, as production's own Saving already reads.",
      overrule: "If a key's words must never change, the arc alone.",
      configs: [WHERE, SCREEN, GROUND],
    },
  ],
});
