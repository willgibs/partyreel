import { defineExploration } from "@/components/lab/exploration";

import { GROUND, LIT, SCREEN, SHOW } from "./knobs";

/**
 * PARTYREEL'S OWN ATOMS, ROUND FOUR: THE MIX (the identity track, 2026-10-04).
 *
 * Round three drew actions and fields as three whole systems (keys and wells,
 * all rings, ink). Will loved parts of all three and asked to mix them ("a
 * configurator ... where I can mix and match across and tweak finely"), with
 * keys and wells his favourite foundation, the viewfinder's corners not his
 * focus mark, and a lighter surface for what is chosen. He picked graphite for
 * the room's pop-outs, and asked to see the light edge on more real UI.
 *
 * ★ THE CONFIGURATOR IS THE WALK, NOT NEW MACHINERY (the Advisor's Q29). Seven
 * quick trait asks, field, button, focus, selected, press, loading and
 * toggles, each with the three systems' versions of that trait (and two new
 * focus marks); every option's state is `{ [ask]: option }`, the previews
 * read the whole state, and a step is drawn wearing the picks already made,
 * so he composes the system as he walks and any step can be gone back to.
 * His paste reads `field=well; button=key; focus=...`.
 *
 * ★ REAL SCREENS, NEVER SPECIMENS ALONE: Settings over the hub, Create's
 * steps, the guest's Add, the guest's door and Account, each caught in the
 * trait's moment; the edge on nine screens, on paper beside the room.
 *
 * ★ FORM, NEVER HUE: brand r1 owns colour, so every frame is today's
 * achromatic chrome with the status lights as they are.
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
    n: 4,
    date: "2026-10-04",
    changed:
      "Your mix, as seven quick traits (a field, a button, focus, what is chosen, a press, working, toggles), each on real screens wearing the picks before it; then the light edge on nine real screens, on paper beside the room.",
  },
  history: [
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
      "Round four of Partyreel's own atoms: your mix, trait by trait, each on real screens wearing your picks so far, then how far the light edge reaches.",
    settled: [
      "Viewfinder's body, the camera voice, the display for every pop-out and status as lights are wired: every frame stands on production's own.",
      "The room's pop-outs are graphite, as you picked: a lit grey one step above the room's black, drawn here while it is wired.",
      "Form only, never hue: today's achromatic chrome and the status lights as they are; the brand round owns colour.",
      "Built, drawn on these screens and yours to overrule: 8px panels and 2px photos, a toast's lit glyph, the half-black veil, the hand-made cards.",
    ],
    earlier: [
      "Round three: you loved parts of all three systems and asked to mix them; keys and wells your favourite foundation.",
      "Not sold on the viewfinder's corners for focus; you tend to like a lighter surface for what is chosen.",
      "The room: graphite. The edge: more real UI per option, since one host menu was too few to set a foundation on.",
    ],
  },
  terms: [
    {
      term: "well",
      means:
        "A field sunk into the page, a shade inside its top edge: a subtle step darker than the page.",
    },
    {
      term: "key",
      means:
        "An action that stands up out of the page in a bevel, a light edge above and a shade below.",
    },
    {
      term: "ink",
      means:
        "The house's primary colour: near-black on paper, white in the room.",
    },
    {
      term: "tone",
      means:
        "A quiet fill of the ground's own ink, a few percent strong, with no line.",
    },
    {
      term: "halo",
      means:
        "A quiet ring of light round what has focus: a fine line standing 2px off it, in a soft bloom.",
    },
    {
      term: "the cursor",
      means:
        "Ink's focus mark: the control turns to ink with a thin ring of the inverse inside it.",
    },
    {
      term: "the r3 mark",
      means:
        "The viewfinder's four corners closing in on focus, kept only as the fallback.",
    },
    {
      term: "graphite",
      means:
        "A lit grey one step above the room's black: your pick for the room's pop-outs.",
    },
    {
      term: "the light edge",
      means:
        "One pixel of light along a dark surface's top, fading down its sides, as photographs wear it today.",
    },
    {
      term: "the display",
      means:
        "The camera's own screen: near-black with light type, what every pop-out is made of on paper.",
    },
    {
      term: "pop-out",
      means:
        "A layer a press opens and the next press closes: a menu, a tooltip, a toast, the Add's rows.",
    },
  ],
  carried: [
    {
      id: "one-focus-mark",
      question:
        "Does every action and field share the one focus mark the focus step picks?",
      taken:
        "Yes: the mark you pick is worn by keys, fields, switches, checks, tabs, the shutter and the code chip alike.",
      overrule: "A field and an action may each keep their own focus mark.",
    },
    {
      id: "head-atoms",
      question:
        "Does a trait redraw the shutter, the glass rounds and the white primary?",
      taken:
        "No: they keep event-header's surfaces; a trait gives them its corner, its press and its focus mark only.",
      overrule: "Each trait redraws the head's atoms in its own build.",
    },
    {
      id: "field-height",
      question: "Do fields keep production's 32px height?",
      taken:
        "No: every field grows to 40px whatever it is drawn as, so it is found and pressed in a hand; actions keep their heights.",
      overrule: "Fields keep production's 32px.",
    },
    {
      id: "in-use",
      question: "Are the screens drawn at rest or in use?",
      taken:
        "In use: each trait caught in its moment, a field typed in, a key held down or working, a gate chosen.",
      overrule: "Draw each screen at rest, as it first opens.",
    },
    {
      id: "corner-scale",
      question:
        "Do panels keep 8px corners and photos 2px, with counts and times at the 12px label size?",
      taken:
        "Yes, as built: cards 12px, menus 16, dialogs 20 off an 8px base; photographs at 2px; readouts on the 12px label step.",
      overrule: "Panels at viewfinder's 6px, or readouts at 10.5px.",
    },
    {
      id: "toast-light",
      question:
        "Does a toast say its state with a lit glyph, and does the live mark breathe?",
      taken:
        "Yes, as built: every toast is the display, its glyph lit green, amber or red; the live mark's red breathes every 1.6s.",
      overrule:
        "Success and errors keep filled slabs, or the live mark is a steady light.",
    },
    {
      id: "veil",
      question:
        "Does a dialog, a panel or a sheet dim the page by half, on paper as in the room?",
      taken:
        "Yes, as built: a half-black, sharp veil, drawn under the delete confirm and Settings' panel here.",
      overrule: "A lighter veil on paper (a quarter), or the old light blur.",
    },
    {
      id: "hand-cards",
      question:
        "Do the dashboard's two teasers stay, and hand-made cards keep their thin outline for now?",
      taken:
        "Yes, until their boards: a new host's teaser stays photographic (the edge's tenth place); Settings' and the hub's cards keep a hairline.",
      overrule: "They become the one empty place and flat cards now.",
    },
    {
      id: "dates",
      question: 'Is an event\'s date range two date fields joined by "to"?',
      taken:
        "Yes: no range picker; the end is offered, never asked, and both fields wear the field you pick (Settings' dates).",
      overrule: "One range picker: a calendar with its two ends.",
    },
  ],
  asks: [
    /* ── 1. A field ──────────────────────────────────────────────────── */
    {
      id: "field",
      label: "A field",
      question: "What should a field be, wherever a host or a guest types?",
      where: ["Shared", "Every field", "Typing in"],
      when: "A name, a password, a date, a note: every field on the app and the site, at rest, under a finger and typed in.",
      matters:
        "A field is where a party's details go in: it must read as somewhere to type, never as a button.",
      lands:
        "Input, Textarea and Select, a segmented control's track and a radio card at rest, each field 40px tall.",
      context:
        'Each drawn on Settings\' dates by default, two fields joined by "to" with the end being typed (H3), on paper beside the room; the five real screens and every field in every state are one press away.',
      options: [
        {
          id: "well",
          label: "A well: sunk into the page",
          means:
            "A step darker than the page with a shade inside its top edge; in use it lifts toward the card, still sunk.",
          gains: "Never mistaken for a button, and your favourite foundation.",
          costs:
            "A shade on every field is a detail a flat page could live without.",
        },
        {
          id: "ring",
          label: "A ring: drawn in line",
          means:
            "An open 1.5px ring you see the page through, soft-cornered; in use the ring darkens to ink.",
          gains: "The lightest field, familiar from every phone.",
          costs: "The nearest to the generic shadcn look you wanted to leave.",
        },
        {
          id: "tone",
          label: "A tone: a quiet fill",
          means:
            "A few percent of the ground's own ink and no line at all; in use it steps up a tone.",
          gains: "The calmest page: a form reads as quiet as its type.",
          costs:
            "With no edge, a field on a card is the faintest of the three.",
        },
      ],
      recommended: "well",
      because:
        "Your favourite foundation, and the one where a field is never mistaken for a button, on paper or in the room.",
      overrule: "If a sunk field reads heavy on a long form, the tone.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 2. A button ─────────────────────────────────────────────────── */
    {
      id: "button",
      label: "A button",
      question:
        "What should a button be, from the call to action to the quietest Cancel?",
      where: ["Shared", "Every action", "Pressing"],
      when: "Every press: Save, Change plan, Unlock, Continue, Cancel, a chip, the white Add on a photograph.",
      matters:
        "Buttons are most of what a hand touches: their build is what reads as a product, not a kit.",
      lands:
        "Button's six variants and the head's two (on-photo, glass), a chip at rest, and the code chip's corner.",
      context:
        "Drawn on Account by default (Change plan, Manage billing, Renew, Save, Remove), on paper beside the room, wearing your field; Create's foot, the door's Unlock and every action in every state one press away.",
      options: [
        {
          id: "key",
          label: "A key: bevelled, it stands up",
          means:
            "A light edge above and a shade below, the primary ink with its bevel caught in it; quiet keys sit on a hairline.",
          gains: "The most tactile and the most ours: a key looks pressable.",
          costs:
            "A bevel on every key is ornament a flat page could live without.",
        },
        {
          id: "pill",
          label: "A pill: drawn in line",
          means:
            "Round ends; the primary solid ink, an outline a 1.5px ring you see the page through, a secondary a tonal pill.",
          gains: "Modern and light, at home beside a phone's own controls.",
          costs: "Pills and rings are the generic look you wanted to leave.",
        },
        {
          id: "ink",
          label: "Ink: a tone, and one ink key",
          means:
            "Every action but the primary rests as a quiet tone with no line; the primary is solid ink.",
          gains: "The calmest page: one ink action, everything else hushed.",
          costs: "A quiet tone can read as a field when it sits beside one.",
        },
      ],
      recommended: "key",
      because:
        "Your favourite foundation: keys beside wells keep what you press and what holds a value apart at a glance.",
      overrule: "If a bevel is too much ornament for billing, ink.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 3. Focus ────────────────────────────────────────────────────── */
    {
      id: "focus",
      label: "Focus",
      question:
        "Which mark should show what the keyboard is on, the same on every control?",
      where: ["Shared", "Every control", "Reached by a key"],
      when: "Tab through a form, or a phone's keyboard moves to the next field: the field, key, switch or tab you are on wears it.",
      matters:
        "Focus is how a keyboard user knows where they are; one mark everywhere reads as one product.",
      lands:
        "Every focusable atom's focus-visible: keys, fields, switches, checks, radios, a slider's thumb, tabs, the shutter.",
      context:
        "Drawn on the guest's door by default, her password typed and in focus, on paper beside the room; Account's name, Create's Continue and every state one press away. The r3 mark stays last, as the fallback.",
      options: [
        {
          id: "halo",
          label: "A halo: a quiet ring of light round it",
          means:
            "A fine line of ink stands 2px off the control over a clear band, in a soft bloom of light, lit from above; it gathers in as it arrives.",
          gains:
            "Clear on every control, on paper, in the room and on photos, and calm: light round it, never a box.",
          costs:
            "It reaches 4px past the control, so it crosses a track's edge and runs close to a neighbour.",
        },
        {
          id: "lit",
          label: "Lit: its own edge catches the light",
          means:
            "Inside its edge, a rim of light with a keyline of ink within it, so a dark control shows the light and a light one the ink; a toggle wears it round.",
          gains:
            "Nothing is drawn outside the control, so it never crowds a neighbour, a track or a photo.",
          costs:
            "It covers a key's bevel while it shows, and on a light field it reads near a plain dark border.",
        },
        {
          id: "outline",
          label: "An outline closing in: the web's own ring",
          means:
            "A 2px ring of ink closes in from 6px to 2.5px round the control, as all rings drew it: the web's focus ring, at the 2px a screen really draws.",
          gains: "The plainest mark there is, and the one people already know.",
          costs:
            "The generic ring you set out to leave, and the boldest line of the five.",
        },
        {
          id: "cursor",
          label: "The cursor: the control turns to ink",
          means:
            "The control turns to ink with a thin ring of the inverse inside it, as the display marks its chosen row; a toggle wears an ink ring round it.",
          gains: "Unmissable, and of a piece with the display's chosen row.",
          costs:
            "Every Tab, and every tap into a field, turns it to ink: the loudest of the five.",
        },
        {
          id: "corners",
          label: "The r3 mark: four corners",
          means:
            "The viewfinder's four corners close in on what has focus, kept only as the fallback.",
          gains: "Ours alone, and drawn already.",
          costs:
            "You are not sold on it: it reads as a camera's tool, and a field gives it up while it works.",
        },
      ],
      recommended: "halo",
      because:
        "The clearest of the new marks on every control and ground, and it boxes nothing: light round what has focus, the shutter's own ring without its hue.",
      overrule:
        "If nothing may stand outside a control, lit; if focus must be the web's own ring, the outline.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 4. What is chosen ───────────────────────────────────────────── */
    {
      id: "selected",
      label: "What is chosen",
      question:
        "How should a chosen thing stand out among the others beside it?",
      where: ["Shared", "Choices side by side", "One chosen"],
      when: "What the link opens, who may join, a layout, a filter, a tab: one of a few chosen and the rest waiting.",
      matters:
        "A host reads her settings at a glance by what is chosen: the chosen one must be plain, never shout.",
      lands:
        "A segment and a chip that are on, a chosen radio card and the tab you are on, on the field's own track.",
      context:
        "Drawn on Settings' door by default (Private chosen, A password chosen), on paper beside the room, on the field you picked; Create's look and every state one press away.",
      options: [
        {
          id: "raised",
          label: "Raised: a lighter key, risen from its track",
          means:
            "The chosen one rises out of its track as a lighter key, its face lit from above, a hairline round it and a small shadow under it.",
          gains:
            "Your lighter surface, and a key you can feel: of a piece with keys and wells.",
          costs:
            "On paper only its shadow parts it from the lighter step, and shadows add up on a busy page.",
        },
        {
          id: "lighter",
          label: "Lighter: the chosen one lit, flat",
          means:
            "The chosen one stays flush where it is and is lit, flat, with no shadow: the brightest thing in its track, in the room well above a raised key.",
          gains:
            "The plainest lighter surface: chosen reads as lit, never as an object.",
          costs:
            "On paper white can go no lighter: there it is the key without its shadow, kept by a hairline.",
        },
        {
          id: "ink",
          label: "Ink: a solid pill of ink",
          means:
            "The chosen one is solid ink, near-black on paper and white in the room; a chosen card, too large to fill, is ringed in ink.",
          gains: "Unmissable at any distance, on any track and on the display.",
          costs:
            "The darkest of the four, against your lighter lean, and it rivals the page's one ink key.",
        },
        {
          id: "frame",
          label: "Frame: a thin frame round a tone",
          means:
            "The chosen one is drawn rather than filled: a 1.5px frame of its ink round a faint tone.",
          gains: "Chosen is drawn, not filled: calm on a long list.",
          costs:
            "Inside a ring's track or on a ringed card it reads as one line too many.",
        },
      ],
      recommended: "raised",
      because:
        "Your lighter surface as keys and wells draw it: the chosen one rises as a key, read by its shadow on paper and by its light in the room.",
      overrule:
        "If chosen should read as light rather than as an object, and brighter in the room, the lighter step.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 5. A press ──────────────────────────────────────────────────── */
    {
      id: "press",
      label: "A press",
      question: "What should a press feel like under the finger?",
      where: ["Shared", "Every action", "Held down"],
      when: "The instant a finger or a click lands on a key and holds: Continue, Unlock, Save, a chip.",
      matters:
        "The press is the product answering at once; it is felt a hundred times a night.",
      lands:
        "Every action's active state: buttons, chips, segments, the shutter and the code chip.",
      context:
        "Drawn at Create's foot by default, Continue held down under the name she typed, in the room; the door's Unlock, Account and every action one press away.",
      options: [
        {
          id: "sink",
          label: "Sink: it travels a pixel down",
          means:
            "The key travels a pixel into the page, the rim's shade falls across its top and its face dims a step, as a real key does; it rises back at once.",
          gains:
            "Felt more than seen, and of a piece with a key; the dimmed face shows round a finger.",
          costs:
            "On an ink key only the pixel and its lost top light show: quiet on paper's near-black.",
        },
        {
          id: "shrink",
          label: "Shrink: it gives a little",
          means:
            "The control gives under the finger by about two pixels at every size, from a chip to the 44px key, the way a phone's own controls do.",
          gains: "Seen round the finger on a phone, and familiar.",
          costs:
            "A shrinking key reads as a phone's, not as ours: a bevelled key that shrinks never goes down.",
        },
        {
          id: "blink",
          label: "Blink: it snaps to ink",
          means:
            "The control snaps to ink under the finger and fades back as it lifts; an ink key flashes its negative and the shutter flashes whole, like a camera's.",
          gains:
            "Unmissable and quick: the press is a flash, seen round any finger.",
          costs:
            "A flash on every press is loud on a long form, and an ink key's negative can read as a new state.",
        },
      ],
      recommended: "sink",
      because:
        "A key goes down where the finger lands, of a piece with keys and wells: it lands in the frame the finger does and lets go at the house's speed.",
      overrule: "If a press must be seen round a finger on a phone, shrink.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 6. Working ──────────────────────────────────────────────────── */
    {
      id: "loading",
      label: "Working",
      question: "What should a key show while it works on what you pressed?",
      where: ["Shared", "Every action", "While it works"],
      when: "Unlock checking a password, Save writing a name, Create making the event: the wait after a press, on party wifi.",
      matters:
        "A wait with nothing to read feels broken: a working key must say so at once, and say what it is doing.",
      lands:
        "A working action's busy state, on buttons and on a field checking what was typed.",
      context:
        "Drawn at the guest's door by default, Unlock working on her password, on paper beside the room; Account's Save, Create and every field one press away. Still, each rests on a frame that reads as working.",
      options: [
        {
          id: "dots",
          label: "Three lights breathing",
          means:
            "Its words give way to three lights breathing in its own ink; the key keeps its width.",
          gains: "The plainest wait, and the quietest.",
          costs: "The words go, so a slow wait no longer says what is working.",
        },
        {
          id: "arc",
          label: "An arc running round",
          means:
            "A quarter of a ring runs round the key a few pixels out, and its words stay.",
          gains: "Everyone reads a spinner as working.",
          costs: "A ring round every working key is the generic spinner.",
        },
        {
          id: "track",
          label: "A track filling",
          means:
            "A line of the key's own ink fills a faint track along its floor, a meter of the work, and its words stay.",
          gains: "Words kept, and of a piece with the meters' frames.",
          costs:
            "A filling line can read as progress the server is not sending.",
        },
      ],
      recommended: "track",
      because:
        "It keeps the key's words, so a slow wait still says what is working, and it fills like every meter in the app.",
      overrule: "If a key should go quiet while it waits, three lights.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 7. Toggles ──────────────────────────────────────────────────── */
    {
      id: "toggles",
      label: "Toggles",
      question: "What should a switch, a check and a radio be?",
      where: ["Shared", "Every toggle", "On and off"],
      when: "An email first, a reminder, a gate's dot, a check in a form: on or off at a glance, in a hand.",
      matters:
        "A toggle's state has to read at arm's length on a phone: it is a setting that changes what guests meet.",
      lands:
        "Switch, and the check, radio and slider primitives production adds next.",
      context:
        "Drawn on Account by default, her email preferences on and off, on paper beside the room; Settings' door and every toggle in every state one press away.",
      options: [
        {
          id: "wells",
          label: "Wells: wells that fill with ink",
          means:
            "A switch is a well its thumb, a small key, slides along, filling with ink when on; a check, a radio and a slider's track are small wells too.",
          gains:
            "Of a piece with wells and keys: a toggle is a field you flip, and on reads as filled.",
          costs:
            "The shade inside small wells adds up in a long list, and off is quiet on a white card.",
        },
        {
          id: "circles",
          label: "Circles: drawn in line",
          means:
            "A switch is a pill of a 1.5px ring that fills with ink; a check and a radio are circles of the same ring, a check filling round its tick, a radio dotted.",
          gains: "The lightest toggles, familiar from every phone.",
          costs:
            "A round check sits close to a radio, and rings are the generic look you wanted to leave.",
        },
        {
          id: "tone",
          label: "Tone: a quiet tone that turns to ink",
          means:
            "Every toggle rests as a quiet tone with no line and a lit thumb, and turns to solid ink when it is on.",
          gains: "The calmest list of settings: only what is on is inked.",
          costs:
            "Off is faint: a row of off switches is the quietest thing on the page.",
        },
      ],
      recommended: "wells",
      because:
        "A toggle is a field you flip: wells keep it of a piece with your fields, on reads as filled with ink, and a held thumb gives under the finger.",
      overrule: "If a long list of settings must stay calm, the tone.",
      configs: [SHOW, SCREEN, GROUND],
    },

    /* ── 8. The light edge ───────────────────────────────────────────── */
    {
      id: "edge",
      label: "The light edge",
      question: "How far beyond photographs should the light edge reach?",
      where: ["Shared", "Every dark surface", "Lit from above"],
      when: "Wherever a dark surface stands: a pop-out on paper or in the room, a sheet or a dialog, a card at night.",
      matters:
        "You said the edge makes media richer; carried further it becomes the material's signature, or a third outline.",
      lands:
        "globals.css's bright edge (data-lit), carried from media to the surfaces the answer names, on dark grounds only.",
      context:
        "Nine real screens, paper beside the room, each layer open: the dashboard's Display, Settings over the hub, the guest's Add, a delete confirm, toasts over the album, the door's held sheet, the reel's Style menu, the account menu, a tooltip.",
      options: [
        {
          id: "media",
          label: "Media only: photographs and screens, as built",
          means:
            "The edge stays where it is today: photographs, players, framed screens and the code's card, lit on a dark ground only; every layer keeps its hairline.",
          gains:
            "Nothing to change: the light stays the photographs' own signature.",
          costs:
            "Menus, toasts and dialogs keep a flat hairline beside lit photographs.",
        },
        {
          id: "floating",
          label: "Everything that floats: layers lit, cards flat",
          means:
            "Every pop-out takes the edge in place of its hairline, on paper too; in the room every dialog, sheet and panel takes it on its free edge. Cards stay flat.",
          gains:
            "What opens over the page reads lit, of a piece with the photographs; pages of cards stay calm.",
          costs:
            "Cards stay flat beside lit layers; on paper the light is a quiet lip inside the display's edge.",
        },
        {
          id: "every",
          label: "Every dark surface: layers and cards lit",
          means:
            "Everything that floats, plus every card in the room (the card and the hand-made cards that end in a ring) and the cover's glass rounds' lip brighter.",
          gains:
            "The richest room: one light over the whole dark app, cards included.",
          costs:
            "A page of cards (Account, Settings) fills with lit edges; past a few they read as frames.",
        },
      ],
      recommended: "floating",
      because:
        "It puts the light exactly where something floats over the page, so the edge stays a signature of lift rather than a pattern on every card.",
      overrule:
        "If the room should feel lit everywhere, every dark surface; if the light should stay the photographs' own, media only.",
      configs: [LIT, SCREEN],
    },
  ],
});
