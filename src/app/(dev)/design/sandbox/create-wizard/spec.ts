import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * CREATE, REDRAWN WHOLE (the create-wizard track, round one, cut 2026-10-02).
 *
 * His note on `disposable-mode`'s `create` (answered `cards`, 2026-10-02) is
 * the brief: the pictures help, with light copy; there should be a way to
 * compare more deeply; and the whole wizard, that screen included, is "very
 * text heavy right now". This round's one direction rides every option:
 * bespoke and experiential, sleek, sophisticated (no tilt), minimal yet
 * high-information, media and light as the colour.
 *
 * ★ THREE DECISIONS, ONE WORLD, NOTHING STAGED. `shape` (a card in the app, a
 * room of its own, a studio beside a live preview) is asked first and draws
 * all four screens; `mode` (the album or the camera, his `create=cards`
 * redrawn with the deeper compare) and `hand` (what stands beside the code
 * when it arrives) are drawn in whatever shape the board holds: his pick once
 * he has made it, the room until then, the kit's own rule. Neither waits on
 * `shape` (`after`): each is its own decision in any shape, and a shape he
 * leaves open (the broadest question here, the likeliest to come back as a
 * note) must not hold the other two out of his walk.
 *
 * ★ SETTLED, NOT ASKED: one field, the name (`asks=one`); the code's look a
 * step of its own on samples (`style=step`, chosen over "on the real code");
 * the beat once, the code first, then what is left, then Get it ready into
 * Settings' first step (`landing=beat`, `create=hand`, chosen over Create
 * walking the first steps); the camera's step right after the name, switching
 * both ways later (`pick=step`); the door at the cap (`limit=door`).
 *
 * Nothing here asks what another board asks tonight: the atoms are
 * `identity`'s, the dashboard `host-dashboard`'s, the hub's head
 * `event-header`'s, and the camera itself `disposable-mode` r3's (its pictures
 * here are stand-ins in its settled numbers).
 */
export const CREATE_WIZARD = defineExploration({
  id: "create-wizard",
  title: "The create wizard",
  surface: "host",
  desk: 60,
  lives: [
    "src/components/app/create-event-wizard.tsx",
    "src/app/(app)/dashboard/new/page.tsx",
    "src/components/app/qr-preset-picker.tsx",
    "docs/systems/host-app.md",
  ],
  round: {
    n: 1,
    date: "2026-10-02",
    changed:
      "From your note on the camera's step: Create redrawn whole for Maya & Jay's wedding, three shapes for its four screens, three deeper compares for the album or the camera, and three things to stand beside the code when it arrives.",
  },
  context:
    "Every drawing is Create at /dashboard/new for Maya & Jay's wedding, from production's atoms: the name, the album or camera step (new; the camera is not built yet), the code's look on samples, and the beat once Create is pressed, its rail read from production's readiness. The shape is asked first; the camera step and the beat are drawn in the shape you pick. Each caption counts the words a host reads on that screen.",
  opening: {
    about:
      "Create, redrawn whole and image-led: its shape, the new step that picks an album or a disposable camera, and the moment the code arrives.",
    settled: [
      "One field, the name, at the size it will be (asks=one); the code's look stays a step of its own, on samples (style=step).",
      "Create ends on the beat, once: the code, then what is left, then Get it ready into Settings' first step (create=hand).",
      "The camera's step comes right after the name, and an event switches between the two later, both ways (pick=step).",
      "At the plan's limit the door stands in Create's place before any work (limit=door), drawn in whichever shape wins.",
    ],
    earlier: [
      "The camera's step redraws your disposable-mode pick, create=cards: 'The pictures help immediately visualize the distinct experiences.'",
      "Its note: '...with light copy to clearly define. Should also have an option to compare more deeply somehow.'",
      "'...the entire create wizard, including this screen, needs to be redesigned and polished. Lots going on.'",
      "'Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now.'",
      "This round's direction: bespoke and experiential, sleek, sophisticated with no tilt, the media and the light as the colour.",
    ],
  },
  terms: [
    {
      term: "the beat",
      means:
        "Create's last screen: the new event's code, shown once in its life, then the way into getting it ready.",
    },
    {
      term: "disposable camera",
      means:
        "A mode where each guest shoots 24 shots in the album's own camera, hidden until they appear for everyone at 9 am.",
    },
    {
      term: "Settings' rail",
      means:
        "Settings' five numbered steps (who can get in, what guests add, the reel, the event, the code), each ticked once ready.",
    },
    {
      term: "room",
      means:
        "A screen of its own: Create taking the whole screen, dark, with nothing of the app around it.",
    },
  ],
  carried: [
    {
      id: "sample",
      question: "What tells a host the style step's codes are samples?",
      taken:
        "One word, Sample, on the code's plate, in place of today's sentence; a scanned sample still opens nothing.",
      overrule:
        "The sample link opens a page of its own that says what it is, so the step needs no word at all.",
    },
    {
      id: "defaults",
      question:
        "Which of the camera's defaults does Create show once it is picked?",
      taken:
        "Two, each its own little menu: 24 shots each, and develops at 9 am. The look waits on disposable-mode's save.",
      overrule:
        "All three with the look, or none: the camera's defaults set in Settings.",
    },
    {
      id: "room",
      question: "Is the room dark in a light session too?",
      taken:
        "Yes: Create is a room of its own, so the pictures and the light carry it in both themes, as the darkroom does.",
      overrule:
        "It follows the app's theme, paper in light, like every other host screen.",
    },
  ],
  asks: [
    /* ── 1. The shape ───────────────────────────────────────────────────── */
    {
      id: "shape",
      label: "The wizard's shape",
      question: "How should Create be shaped, from the name to the code?",
      where: ["Host", "Create an event", "Every screen"],
      when: "Maya presses New event: she names the wedding, picks how guests add photos and the code's look, then meets the code.",
      matters:
        "Every event starts here, most hosts pass through it once, and today it reads like a form.",
      lands:
        "The layout of every screen of Create and of its door at the cap: a card in the app, a room of its own, or a studio.",
      context:
        "Each option draws Create's four screens for the wedding: the name, how guests add (in the compare picked next), the code's look, and the beat (in what is picked last to stand beside the code).",
      options: [
        {
          id: "card",
          label: "A quiet card in the app",
          means:
            "Today's card inside the app, each screen cut to one question, its picture and one action; four hairlines count the steps.",
          gains:
            "Familiar and calm: the app stays around her, and each screen reads at a glance.",
          costs:
            "The pictures stay small, and Create still looks like every other card in the app.",
        },
        {
          id: "screen",
          label: "A room of its own",
          means:
            "Create takes the whole screen, dark, one question to a screen: the picture as large as it can be, one button at the thumb.",
          gains:
            "Each step is a moment: big pictures, big type, and almost nothing to read.",
          costs:
            "Four full screens, and Create leaves the app's frame while it runs.",
        },
        {
          id: "preview",
          label: "A studio beside a live preview",
          means:
            "The steps stack on the left and fold to their answers; on the right, the code and a guest's phone change as she picks.",
          gains:
            "She sees what guests will get at every step, and every answer stays in view.",
          costs:
            "Two places to look, and at a phone the preview shrinks to a strip above the steps.",
        },
      ],
      recommended: "screen",
      because:
        "A once-an-event moment earns the whole screen: the pictures carry each step, and the words drop to a question and a button.",
      overrule:
        "If Create should feel like part of the app rather than a moment of its own, the quiet card.",
      configs: [SCREEN],
    },

    /* ── 2. The album or the camera ─────────────────────────────────────── */
    {
      id: "mode",
      label: "Comparing the two",
      question:
        "How should the step that picks an album or a disposable camera let her compare them more deeply?",
      where: ["Host", "Create an event", "Right after the name"],
      when: "Maya has named the wedding; before the code, she picks whether guests add to an album or shoot a disposable camera.",
      matters:
        "It is one of an event's biggest choices, made here once; you asked for pictures, light words and a deeper compare.",
      lands:
        "Create's second step and the event's mode, the camera's two defaults, and how the two experiences are set side by side.",
      context:
        "Your create=cards, redrawn: two pictures of a guest's phone, a line each, the camera's defaults once picked; each option adds the deeper compare its own way. Drawn in the shape you pick, the room until then.",
      options: [
        {
          id: "rows",
          label: "The cards, rows unfolding under them",
          means:
            "Compare unfolds three rows under the two cards (how guests add, when everyone sees it, the reel), each lined up with its card.",
          gains:
            "The differences read side by side in a few words, without leaving the step.",
          costs:
            "The deeper compare is words, the kind of reading you asked to cut.",
        },
        {
          id: "night",
          label: "The cards, playing the night",
          means:
            "Each card is a guest's phone; a slider under both moves them from 8 pm to the party to 9 am, so the difference is seen.",
          gains:
            "The real difference, when everyone sees the photos, shown in the cards themselves.",
          costs:
            "A new control on the step, and a host who never slides it sees one hour.",
        },
        {
          id: "story",
          label: "The cards, both nights in a sheet",
          means:
            "See both nights opens a sheet: each night as three pictures, the album above the camera, the same hours lined up.",
          gains:
            "Everything at once, in pictures: the deepest compare, one press from the cards.",
          costs: "A sheet over the step, one more surface to open and close.",
        },
      ],
      recommended: "night",
      because:
        "The two differ most in when everyone sees the photos, so a slider through the night shows it in the cards themselves.",
      overrule: "If a host should see both nights whole at once, the sheet.",
      configs: [SCREEN],
    },

    /* ── 3. The code arrives ────────────────────────────────────────────── */
    {
      id: "hand",
      label: "Beside the code",
      question:
        "What should stand beside the code when it arrives, before she gets the event ready?",
      where: ["Host", "Create an event", "The beat"],
      when: "Maya has just pressed Create: the wedding exists, its code is real, and a guest still needs one thing, the code opened once.",
      matters:
        "Every host meets this screen once, at the moment the event most needs getting out and set up.",
      lands:
        "What the beat draws beside the code, and Settings' rail standing under it as what is left.",
      context:
        "Your picks stand: the code first, then what is left, then Get it ready into Settings' first step. Each option changes what stands beside the code; what is left is Settings' rail, read from production. Drawn in the shape you pick.",
      options: [
        {
          id: "lit",
          label: "The code alone, lit",
          means:
            "The code is the whole moment, at its largest, lit from below on a dark ground; Print and Share under it, Settings' rail below.",
          gains:
            "Nothing competes with the code, and the rail shows exactly where Get it ready goes.",
          costs:
            "The one thing left, the code opened once, is a step she reads rather than does.",
        },
        {
          id: "scan",
          label: "The code, asking for a scan",
          means:
            "Beside the code: scan it with your phone (open it, on a phone). When it opens, the beat ticks it: Ready for guests.",
          gains:
            "She finishes the one thing guests still need right here, and sees what they will see.",
          costs:
            "The beat waits on a live read of the code's first open, plumbing it does not have today.",
        },
        {
          id: "guest",
          label: "The code beside a guest's view",
          means:
            "Beside the code, a phone shows what a guest opens, in the mode she picked; the rail waits under both.",
          gains: "She sees where the code leads before anyone scans it.",
          costs:
            "A picture of the guest's view beside a code that already opens the real one.",
        },
      ],
      recommended: "scan",
      because:
        "A new event lacks only an opened code, so asking her to scan it finishes it in the moment and shows her what guests see.",
      overrule:
        "If the beat should stay one quiet look at the code, the code alone, lit.",
      configs: [SCREEN],
    },
  ],
});
