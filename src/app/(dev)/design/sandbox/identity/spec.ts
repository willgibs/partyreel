import { defineExploration } from "@/components/lab/exploration";

import { GROUND, SCREEN, SHOW } from "./knobs";

/**
 * PARTYREEL'S OWN ATOMS, ROUND TWO (the identity track, 2026-10-02).
 *
 * Will picked `viewfinder` in round one ("the most themed/bespoke, minimal yet
 * high-info-density-conveyance, sleek direction"), asked for it to be made
 * "individually perfect" through the lab, atom by atom, and set the test for
 * all of it: bespoke, never "too dev-tool-ish", a modern consumer app for a
 * crowd of about 18 to 50.
 *
 * ★ THE VOICE FIRST, AS A LAYER. How loudly the camera's language speaks is
 * the dev-tool question, and it is not an atom: it is the case, size, tracking
 * and figures of every label and readout, and the build of every meter. So it
 * is a layer of variables every atom reads (`sheet/voice.ts`), asked first,
 * and every atom group after it is drawn in the voice he picks. It is a pure
 * layer, so nothing binds: any build of any group renders in any voice.
 *
 * ★ FOUR ATOM GROUPS, THREE BUILDS EACH, ALL INSIDE VIEWFINDER: r1's own
 * drawing refined (keys, wells, matte panels, readouts), a phone camera's
 * (rings, rings, the display, lights) and the viewfinder's own frame taken
 * furthest (corners), so a sitting can keep one line through all four or mix
 * them. Each build is a stylesheet over production's atoms by their hooks
 * (`sheet/`), drawn on every state on paper and in the room, then on the real
 * screens nobody rewires this round (Settings' door and event pages, the
 * guest's Add, Account and billing, Review), so a pick wires at its source.
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
    n: 2,
    date: "2026-10-02",
    changed:
      "Inside your viewfinder pick: its voice asked first as a layer, then actions, fields, layers and status, three builds each drawn in that voice on every state, on paper and in the room, and on five real screens.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Four atomic families drawn whole over production (editorial, soft, crystal, viewfinder) beside today's. You picked viewfinder.",
    },
  ],
  opening: {
    about:
      "Viewfinder made ours atom by atom: first how loudly the camera's language speaks, then actions, fields, layers and status, each in that voice.",
    settled: [
      "Viewfinder is the family: its matte body, silver on paper and near-black in the room, the recording red, and photographs at its 2px.",
      "Two faces stay, state keeps its colour, and every action keeps production's height (the 32px button, the 44px call to action).",
      "Pages are their boards': the dashboard, the hub's head, Create and the hero draw in production's atoms this round.",
      "The voice is a pure layer: every build below reads it, so any pick renders in any voice and nothing binds.",
    ],
    earlier: [
      "Your r1 pick, viewfinder: the most themed and bespoke, minimal yet high-information, and in need of refinement and polish.",
      "Your note: build it through the lab so every atomic element of the new foundation is individually perfect.",
      "This round's test, in your words: bespoke without getting too dev-tool-ish, a modern consumer app for about 18 to 50.",
    ],
  },
  terms: [
    {
      term: "voice",
      means:
        "How the words and numbers on every control are set: case, size, tracking, figures, and how a meter is built.",
    },
    {
      term: "readout",
      means:
        "A value a camera prints: a count, the live mark, a time, a percentage.",
    },
    {
      term: "lock",
      means:
        "Viewfinder's focus: four corner marks that close in on whatever has focus.",
    },
    {
      term: "meter",
      means: "A bar that measures: sending, storage used.",
    },
    {
      term: "corner marks",
      means: "The four L-shaped marks a camera draws round what it focuses on.",
    },
    {
      term: "the display",
      means:
        "A camera's own screen: near-black with light type, the same on paper and in the room.",
    },
  ],
  carried: [
    {
      id: "rings-lock",
      question: "Does every build lock focus with the four marks?",
      taken:
        "Keys and corners lock with the marks; rings lock with a ring closing in, since marks cannot sit on a rounded field.",
      overrule: "The four marks lock focus in every build, rings included.",
    },
    {
      id: "live-red",
      question: "Is the live mark the recording red or today's green?",
      taken:
        "The recording red, r1's signal light, the same red as delete so the palette gains no hue.",
      overrule: "The live mark stays today's green dot.",
    },
    {
      id: "door-parts",
      question: "Do Settings' own parts wear the atoms on the screens?",
      taken:
        "Yes: the door's choice of what the link opens draws as a segmented control and its gates as radio cards, as wiring would make them.",
      overrule:
        "Only today's atoms change; the door's own parts keep their look until its board.",
    },
    {
      id: "field-height",
      question: "Do fields keep production's 32px height?",
      taken:
        "No: every build grows a field to 38 or 40px, so it is found and pressed in a hand; actions keep their heights.",
      overrule: "Fields keep production's 32px in every build.",
    },
    {
      id: "one-empty",
      question: "How many ways is an empty place drawn?",
      taken:
        "One, in every status build: a glyph, a title, a line and an action, never a dashed box; the four drawings today become it.",
      overrule: "Keep each surface's own empty drawing.",
    },
  ],
  asks: [
    /* ── 1. The voice ────────────────────────────────────────────────── */
    {
      id: "voice",
      label: "The voice",
      question:
        "How loudly should the camera's own language speak on every control?",
      where: ["Shared", "Every control's words", "Labels, counts, meters"],
      when: "Anywhere a host or a guest reads a label, a button, a count, the live mark or a meter, on the app and the site alike.",
      matters:
        "The voice is what reads as a camera or as a dev tool, and every atom below wears whichever you pick.",
      lands:
        "Partyreel's text roles (label, readout, word) and its meter's build, as tokens every atom in src/components/ui reads.",
      context:
        "Every place the voice speaks, on paper and in the room, in the recommended builds; Show puts it on the real screens. Between the options only the words change.",
      options: [
        {
          id: "instrument",
          label: "The instrument: everything a readout",
          means:
            "R1's voice as drawn: every label, tab, chip, badge and count in small spaced capitals, zeros slashed, links arrowed, meters as tape.",
          gains: "The most themed: every word reads off a camera's top plate.",
          costs:
            "Spaced capitals on every label read as a bench instrument, the dev-tool risk.",
        },
        {
          id: "camera",
          label: "A camera in your hand",
          means:
            "Words in sentence case at reading weight; spaced capitals only where a camera prints them (counts, live, time); plain figures; meters as frames.",
          gains:
            "Reads as the camera everyone owns: friendly words, precise readouts.",
          costs:
            "Less themed at a glance: the camera shows in its readouts and marks.",
        },
        {
          id: "display",
          label: "The top screen: numbers speak",
          means:
            "No capitals at all: words quiet in sentence case, every count and status set bold in the loud face, the meter one lit bar.",
          gains:
            "The fewest words to read: our own loud face carries the numbers.",
          costs:
            "The loudest numbers: a screen full of counts can shout over its photos.",
        },
      ],
      recommended: "camera",
      because:
        "It keeps the camera where a camera speaks (counts, live, time) and talks like a modern app everywhere else: your not-a-dev-tool test.",
      overrule:
        "If the camera should be unmistakable on every control, the instrument.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 2. Actions ──────────────────────────────────────────────────── */
    {
      id: "actions",
      label: "Actions",
      question:
        "Which build should Partyreel's buttons, chips and segmented choices take?",
      where: ["Shared", "Every action", "From rest to pressed"],
      when: "Every press on the app and the site: a primary, a secondary, an icon, a chip, a segment, a link, the shutter.",
      matters:
        "Actions are pressed more than any other atom; their build is most of what makes the app feel like a camera.",
      lands:
        "Button's variants and sizes, ToggleGroup's chips and segments, and the head's shutter, white primary, glass round and code chip.",
      context:
        "Drawn in your voice: every action in every state (rest, hover, press, focus, off, loading, error) on paper and in the room, then on the real screens.",
      after: { ask: "voice" },
      options: [
        {
          id: "keys",
          label: "Keys: machined and pressable",
          means:
            "R1's keys refined: rounded rectangles in a machined bevel that travel a pixel when pressed, round dials for icons, the lock on focus.",
          gains:
            "The most tactile: every action reads as a physical key you press.",
          costs:
            "A bevel on every control is ornament a flat page does not need.",
        },
        {
          id: "rings",
          label: "Rings: a phone camera's round controls",
          means:
            "Pills and circles: the primary in solid ink, an outline as a ring you see through, a ring closing in on focus, the shutter as a phone's.",
          gains:
            "The camera everyone holds: modern, familiar in a hand, quiet in a row.",
          costs:
            "The least novel shape: the bespoke part is the voice and the marks.",
        },
        {
          id: "corners",
          label: "Corners: the viewfinder's own frame",
          means:
            "The primary a crisp ink plate; every other action drawn as four corner marks that close in when pressed, a chosen segment wearing the frame.",
          gains:
            "Unmistakably ours: the viewfinder's frame is the action itself.",
          costs:
            "A page of framed actions reads busier, and a bare frame is a quieter target.",
        },
      ],
      recommended: "rings",
      because:
        "Guests hold a phone, and a phone camera's controls are round: rings feel native in a hand while the voice and the marks keep it ours.",
      overrule: "If every action should be a physical key, keys.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 3. Fields ───────────────────────────────────────────────────── */
    {
      id: "fields",
      label: "Fields",
      question:
        "Which build should Partyreel's fields, switches, checks and sliders take?",
      where: ["Shared", "Every field", "Typing and choosing"],
      when: "Every time a host names an event, sets the door, flips a switch or types an address, and a guest types a name.",
      matters:
        "A field has to be found and trusted at a glance; its build sets how calm or how technical a form feels.",
      lands:
        "Input, Textarea, Select, Switch and Tabs, and the check, radio, radio card and slider primitives the product adds.",
      context:
        "Drawn in your voice: every field and choice in every state (rest, hover, focus, off, loading, error) on paper and in the room, then on the real screens.",
      after: { ask: "voice" },
      options: [
        {
          id: "wells",
          label: "Wells: recessed into the body",
          means:
            "R1's wells refined: every field a recess with a shade inside its edge, the lock's marks on its corners, a switch's thumb riding in a groove.",
          gains:
            "The calmest: a filled field reads as a field, apart from the actions.",
          costs:
            "The most familiar build: a well is close to many apps' filled fields.",
        },
        {
          id: "rings",
          label: "Rings: soft outlines",
          means:
            "A field is a soft-cornered ring you see the body through; focus inks it and a faint ring closes in; switches are pills, checks circles.",
          gains: "The lightest page: the body shows through every field.",
          costs:
            "Outlines beside ring actions make fields and buttons alike at a glance.",
        },
        {
          id: "corners",
          label: "Corners: frame and line",
          means:
            "A field is four corner marks over a line to write on; focus thickens the marks; a check is a frame that fills, a slider an exposure scale.",
          gains:
            "The most bespoke form there is: a camera framing what you type.",
          costs:
            "An empty field is only its corners: clear at a desk, quieter in sun.",
        },
      ],
      recommended: "wells",
      because:
        "A filled field is found at a glance and never mistaken for a button, and its recess is viewfinder's own matte body.",
      overrule: "If fields should match ring actions, rings.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 4. Layers ───────────────────────────────────────────────────── */
    {
      id: "layers",
      label: "Layers",
      question:
        "What should Partyreel's cards, menus, toasts and sheets be made of?",
      where: ["Shared", "Every surface", "Cards and what opens"],
      when: "Every card on a page and everything that opens over one: a menu, a popover, a tooltip, a toast, a dialog, a panel, a sheet.",
      matters:
        "Layers are where a host works and where every quick choice opens; their material is the app's depth.",
      lands:
        "Card, the floating layers (menus, popovers, selects, tooltips, toasts), the popup's shapes and its overlay, and the code mat.",
      context:
        "Drawn in your voice: a card, an open menu, a popover, a tooltip, a toast, a dialog, the Add's rows and the code's mat, on paper and in the room, then on the real screens.",
      after: { ask: "voice" },
      options: [
        {
          id: "matte",
          label: "Matte: the body's own panels",
          means:
            "R1's panels refined: every layer in the body's material, a hairline and a light edge above, a menu's chosen row marked by an ink tick.",
          gains: "One material everywhere: calm, consistent, nothing to learn.",
          costs:
            "The quietest: the camera shows in the type and marks, not the surfaces.",
        },
        {
          id: "display",
          label: "The display: the camera's own screen",
          means:
            "Every quick layer (menu, tooltip, toast, the Add's rows) is the camera's screen, near-black on paper and in the room; cards lie flat as tone.",
          gains:
            "A signature moment: every quick choice opens the camera's own screen.",
          costs:
            "Dark menus on a light page are a strong contrast; in the room they part by edge.",
        },
        {
          id: "corners",
          label: "Corners: framed, not boxed",
          means:
            "A card is its four corner marks alone, no fill, no line; panels are square-cornered and framed; the chosen row wears the frame.",
          gains: "The most bespoke surfaces: framed like a viewfinder.",
          costs: "Marks on every card and panel add up to a busy page.",
        },
      ],
      recommended: "display",
      because:
        "It turns every quick choice into the camera's own screen, one object on both grounds, so the product has a signature without a costume.",
      overrule: "If layers should stay in the page's own material, matte.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 5. Status ───────────────────────────────────────────────────── */
    {
      id: "status",
      label: "Status",
      question: "How should Partyreel show status, faces and an empty place?",
      where: ["Shared", "Every mark", "Badges, faces, empty"],
      when: "Wherever something has a state (live, waiting, failed), something is loading, a row of faces stands, or nothing is there yet.",
      matters:
        "Status is the information density you asked for: read in a glance, never a wall of plates.",
      lands:
        "Badge and its live mark, the meter's colours, Skeleton, the face row's overlap, the glyph count, and one empty atom for four drawings.",
      context:
        "Drawn in your voice: badges, the live mark, meters (sending, sent, failed), loading, faces and a row of them, the glyph count and the one empty place, on paper and in the room.",
      after: { ask: "voice" },
      options: [
        {
          id: "readouts",
          label: "Readouts: printed on a plate",
          means:
            "R1's readouts refined: a badge is a small plate with its word, a state's colour in an LED beside it; faces overlap by a fifth; empty is a well.",
          gains: "Every status reads as a label you can scan in a list.",
          costs: "Plates add up: a row of badges is a row of boxes.",
        },
        {
          id: "lights",
          label: "Lights: status as light",
          means:
            "A badge is an LED and its word, no plate; the live mark breathes; a meter fills in its state's light; faces overlap by a quarter; empty is a lens.",
          gains:
            "The lightest status: colour where it means something, nothing else.",
          costs: "An LED is small: state rests on a dot and its word.",
        },
        {
          id: "corners",
          label: "Corners: status framed",
          means:
            "A badge is its word inside small marks in its colour; a skeleton an empty frame; the empty place an empty viewfinder with its glyph.",
          gains: "The frame runs through status too, the most of a piece.",
          costs: "Small marks round small words can read as noise.",
        },
      ],
      recommended: "lights",
      because:
        "A camera speaks status as light, and a light needs no plate, so a busy screen stays quiet and colour appears only where it means something.",
      overrule: "If status should scan as labels in a list, readouts.",
      configs: [SHOW, SCREEN, GROUND],
    },
  ],
});
