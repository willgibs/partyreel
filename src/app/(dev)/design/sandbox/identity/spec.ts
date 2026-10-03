import { defineExploration } from "@/components/lab/exploration";

import { GROUND, LIT, NIGHT, SCREEN, SHOW } from "./knobs";

/**
 * PARTYREEL'S OWN ATOMS, ROUND THREE (the identity track, 2026-10-03).
 *
 * Round two drew viewfinder atom by atom. Will picked the camera voice, the
 * display for every pop-out and status as lights (wired at the source by
 * `identity-wiring`), left actions and fields open with one note for both, and
 * asked two things of the layers. This round answers those three.
 *
 * ★ ACTIONS AND FIELDS ARE ONE DECISION NOW. His note: rings for both read
 * modern but sit back near the generic shadcn look; rings for actions beside
 * wells for fields leaves "some focuses rings, some corners, which is bad"; he
 * likes wells and does not mind the corners as a focus mark only. So each
 * option is a whole system with ONE focus mark across every action and field
 * (`sheet/system.ts`): keys and wells (the lock), all rings (a ring), and ink,
 * this lane's own idea (the cursor). No corner is a style anywhere and
 * nothing loads by moving one (`identity.test.ts` holds both).
 *
 * ★ IN USE, NOT ONLY IN STATES: every system is shown on three real screens
 * no round-13 lane rewires, caught mid-task (Account with a name being typed,
 * Settings' door with its password being changed, a guest typing the album's
 * password at its door), and on every atom in every state one press away.
 *
 * ★ THE LAYERS' TWO EXTRAS: what a pop-out is in the room (the display's
 * inverse he asked about, beside a one-step lift and the display as wired),
 * and how far the light edge he liked reaches (`sheet/room.ts`,
 * `sheet/edge.ts`); the edge is drawn on the room's answer.
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
    n: 3,
    date: "2026-10-03",
    changed:
      "Actions and fields asked as one system in three directions (keys and wells, all rings, and ink, a new idea), each shown in use on Account, Settings' door and the guest's door; then the room's pop-out and how far the light edge reaches.",
  },
  history: [
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
      "Round three of Partyreel's own atoms: actions and fields as one system, then what a pop-out is in the room and how far the light edge reaches.",
    settled: [
      "Viewfinder is the family: a matte body, silver on paper and near-black in the room, the recording red, photographs at their 2px.",
      "Your round-two picks are wired at the source: the camera voice, the display for every pop-out, and status as lights.",
      "The viewfinder's corners survive only as a focus mark, never a style, and nothing loads by moving them.",
      "Actions keep production's heights (the 32px button, the 44px call to action); every field grows to 40px.",
    ],
    earlier: [
      "Round two: voice=camera, layers=display, status=lights; actions and fields left open for this round, together.",
      "Your note: rings for both feel modern but near the generic shadcn look; you like wells, and the corners for focus only.",
      "On the display: curious about white pop-outs on the black body, and about the light edge carried beyond media cards.",
    ],
  },
  terms: [
    {
      term: "key",
      means:
        "An action that stands up out of the body in a bevel and sinks a pixel when pressed.",
    },
    {
      term: "well",
      means:
        "A field sunk into the body, a shade inside its top edge: a subtle step darker than the page.",
    },
    {
      term: "the lock",
      means:
        "Four corner marks that close in on whatever has focus: the viewfinder's one surviving mark.",
    },
    {
      term: "ink",
      means:
        "The house's primary colour: near-black on paper, white in the room.",
    },
    {
      term: "the cursor",
      means:
        "Ink's focus mark: the control turns to ink with a thin ring of the inverse inside it.",
    },
    {
      term: "pop-out",
      means:
        "A layer a press opens and the next press closes: a menu, a tooltip, a toast, the Add's rows.",
    },
    {
      term: "the display",
      means:
        "The camera's own screen: near-black with light type, your pick for every pop-out.",
    },
    {
      term: "graphite",
      means: "A lit grey one step above the room's black.",
    },
    {
      term: "the light edge",
      means:
        "One pixel of light along a dark surface's top, fading down its sides, as photographs wear it today.",
    },
  ],
  carried: [
    {
      id: "one-focus-mark",
      question:
        "Does each system keep one focus mark on every action and field?",
      taken:
        "Yes: keys lock with the corners, rings with a ring, ink with the cursor (inside a key or a field, round a switch or a check).",
      overrule: "A field and an action may each keep their own focus mark.",
    },
    {
      id: "head-atoms",
      question:
        "Does a system redraw the shutter, the glass rounds and the white primary?",
      taken:
        "No: they keep the surfaces event-header wired; a system gives them its shape, its press and its focus mark only.",
      overrule: "Each system redraws the head's atoms in its own build.",
    },
    {
      id: "in-use",
      question: "Are the screens drawn at rest or in use?",
      taken:
        "In use: a name typed on Account, the password changed on Settings' door, a guest typing it at the album's door: a system judged mid-task.",
      overrule: "Draw each screen at rest, as it first opens.",
    },
    {
      id: "field-height",
      question: "Do fields keep production's 32px height?",
      taken:
        "No, as in round two: every system grows a field to 40px, so it is found and pressed in a hand; actions keep their heights.",
      overrule: "Fields keep production's 32px in every system.",
    },
  ],
  asks: [
    /* ── 1. Actions and fields, one system ───────────────────────────── */
    {
      id: "system",
      label: "Actions and fields",
      question: "Which system should every Partyreel action and field share?",
      where: ["Shared", "Every action and field", "Pressing and typing"],
      when: "Every press and every field on the app and the site: a button, a chip, a segment, a name typed, a switch flipped, a gate chosen.",
      matters:
        "Actions and fields are most of what a hand touches; one system with one focus mark is what reads as a product, not a kit.",
      lands:
        "Button, ToggleGroup's chips and segments, Input, Textarea, Select, Switch and Tabs, and the check, radio and slider primitives.",
      context:
        "Each system drawn whole: on Account, Settings' door and the guest's door, each caught in use (a field being typed in), and on every action and field in every state, on paper and in the room.",
      options: [
        {
          id: "keys",
          label: "Keys and wells: carved",
          means:
            "What you press stands up as a bevelled key and sinks a pixel; what holds a value is a well a shade below the page; the lock is the one focus mark.",
          gains:
            "The most tactile and the most ours: a field is never mistaken for a button.",
          costs:
            "A bevel on every key is ornament a flat page could live without.",
        },
        {
          id: "rings",
          label: "All rings: drawn in line",
          means:
            "Pills and soft outlines: the primary solid ink, an outline a ring you see the page through, a field a soft ring; focus is a ring closing in.",
          gains:
            "The camera everyone holds: modern, light, familiar in a hand.",
          costs:
            "The nearest to the generic shadcn look you wanted to leave behind.",
        },
        {
          id: "ink",
          label: "Ink: tone at rest, ink in use",
          means:
            "Every control rests as a quiet tone with no line; the one you press, choose or type in turns to solid ink, and the cursor marks focus.",
          gains:
            "The calmest page, and your display's black exactly where you work.",
          costs:
            "Every press blinks to ink: the boldest moment of the three, and the newest to learn.",
        },
      ],
      recommended: "keys",
      because:
        "Your own lean, and the one where a field never reads as a button: carved keys, recessed wells, one lock for focus.",
      overrule: "If a bevel is too much ornament for billing, ink.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 2. The room's pop-outs ──────────────────────────────────────── */
    {
      id: "room",
      label: "The room's pop-outs",
      question: "In the room, what should a pop-out be made of?",
      where: ["Shared", "Everything that pops out", "In the room"],
      when: "Every menu, tooltip, toast and the Add's rows opened in the room: the app's dark theme, and a guest's album at night.",
      matters:
        "On paper a black pop-out takes the eye; in the room its colour decides whether it is found, or flashes in a dark venue.",
      lands:
        "The room's tokens for the display, worn by every menu, popover, select, tooltip, toast and the Add's rows in the dark theme.",
      context:
        "Paper's display drawn beside the room's option on one sheet of every pop-out, then the guest's Add rising at the thumb and a host's account menu, both in the room.",
      options: [
        {
          id: "display",
          label: "The display: near-black, as wired",
          means:
            "The same camera's screen on both grounds: a near-black panel over the black room, parted from it by its edge and its shadow.",
          gains:
            "One object on both grounds: the display is the display, day or night.",
          costs:
            "Near-black on black is the quietest: a pop-out parts from the room by a hairline.",
        },
        {
          id: "graphite",
          label: "Graphite: one step up",
          means:
            "In the room a pop-out lifts one step to graphite, a lit grey the eye finds at once, its words still light on dark.",
          gains:
            "Found at a glance in a dark room, with no flash in a dim venue.",
          costs:
            "Black on paper and graphite in the room: one object in two tones.",
        },
        {
          id: "white",
          label: "White: the display's inverse",
          means:
            "Paper's pop-out mirrored: in the room every pop-out is white with ink words, the brightest thing on the screen.",
          gains:
            "The strongest attention there is: what pops out is never missed.",
          costs:
            "A white sheet flashes at a dark party, lighting a dimmed phone's whole screen.",
        },
      ],
      recommended: "graphite",
      because:
        "It gets the attention you liked on paper without the flash: a lit grey is found at once in the dark and lets the photographs stay brightest.",
      overrule:
        "If a pop-out should be the same object on both grounds, the display.",
      configs: [NIGHT, SCREEN],
    },

    /* ── 3. The light edge ───────────────────────────────────────────── */
    {
      id: "edge",
      label: "The light edge",
      question: "How far beyond photographs should the light edge reach?",
      where: ["Shared", "Every dark surface", "Lit from above"],
      when: "Wherever a dark surface stands: a pop-out on paper or in the room, a sheet or a panel, a card and a cover's glass at night.",
      matters:
        "You said the edge makes media richer; carried further it becomes the material's signature, or a third outline if it goes too far.",
      lands:
        "globals.css's bright edge (data-lit), carried from media to the surfaces the answer names, on dark grounds only.",
      context:
        "Every pop-out and surface on paper and in the room, with a loupe on a pop-out, a card, a photograph and a glass round; then a host's menu over Account's cards in the room, on the room's answer.",
      after: { ask: "room" },
      options: [
        {
          id: "media",
          label: "Media only, as built",
          means:
            "The edge stays where it is today: photographs, players, framed screens and the code's card, on a dark ground.",
          gains:
            "Nothing to change: the edge stays the photographs' own signature.",
          costs: "Menus, sheets and cards stay flat beside lit photographs.",
        },
        {
          id: "floating",
          label: "Everything that floats",
          means:
            "The edge also lights every pop-out, on paper and in the room, and every sheet, panel and dialog in the room, in place of its hairline.",
          gains:
            "What opens over the page reads lit and of a piece with the photographs.",
          costs:
            "Cards on the page stay flat: the light marks only what floats.",
        },
        {
          id: "every",
          label: "Every dark surface",
          means:
            "Everything that floats, plus every card in the room, and the cover's glass rounds lit brighter: one light from above over the whole dark app.",
          gains:
            "The richest room: the light you liked is the material everywhere.",
          costs:
            "On a page of cards the edges add up, and past a few they read as frames.",
        },
      ],
      recommended: "floating",
      because:
        "It keeps the light where it says 'this floats over the page', so the edge stays a signature rather than a pattern.",
      overrule: "If the room should feel lit everywhere, every dark surface.",
      configs: [LIT, SCREEN],
    },
  ],
});
