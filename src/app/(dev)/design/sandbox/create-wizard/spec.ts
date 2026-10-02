import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * CREATE, ROUND TWO: THE ROOM DESIGNED WHOLE (his r1 answers, 2026-10-02).
 *
 * His picks: `shape=screen` (a room of its own), `mode=night` (the cards
 * playing the night on a slider) and `hand=lit` (the code alone, lit). His
 * note on the room is this round's brief: "always keep the question up top so
 * users aren't searching for the spot of the new one in a centered group each
 * time, keeping the button at the bottom, and using the center space as
 * needed ... think we could use a second-layer exploration to design that
 * room experience flow perfectly. Love the subtle steppers up top now."
 *
 * ★ SETTLED, DRAWN IN EVERY OPTION, NEVER ASKED: the room in his layout
 * (`room.tsx`: the steppers quiet at the top, the question just under them at
 * the same place on every screen, the answer's space in the centre, one
 * button at the foot); the night; lit, its beat leading into Get it ready and
 * Settings' first step (the hub's See it as a guest is the payoff,
 * `event-header` r2's, never mid-setup); and round one's settled lines (one
 * field, the look a step on samples, the beat once, the camera's step after
 * the name, the door at the cap).
 *
 * ★ FOUR DECISIONS, ONE WORLD, NOTHING STAGED. `flow` (how one screen becomes
 * the next, Back and the steppers) frames every screen; `add`, `look` and
 * `beat` are each one screen's centre. Each is drawn in what the board holds
 * for the other three (his pick once made, the recommendation until then),
 * and none waits on another (`after`), so a note on one never holds the rest
 * out of his walk. `name` is not asked: its centre holds no decision (the
 * carried call `name`).
 *
 * ★ EVERY DECISION OPENS ON A LIVE FRAME: Try it is Create running in the
 * option's flow, and each step's first frame is that step as it opens, its
 * picks and its night pressable, so the motion and the feel he is choosing
 * between are felt rather than described.
 *
 * Nothing here asks what another board asks tonight: the atoms are
 * `identity`'s (drawn in production's), the hub's head and its See it as a
 * guest `event-header`'s, the camera itself `disposable-mode`'s (drawn here in
 * its round-three picks), and the camera's setting `disposable-foundation`'s
 * control (`camera-settings`), drawn as the place it mounts.
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
    "src/lib/events/readiness.ts",
    "docs/systems/host-app.md",
  ],
  round: {
    n: 2,
    date: "2026-10-02",
    changed:
      "From your round one notes: the room drawn screen by screen in your layout, the question up top on every screen. How one screen becomes the next, the add step's night, the code's look and the lit beat, three ways each, each to try.",
  },
  history: [
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Create redrawn whole for Maya & Jay's wedding. You picked a room of its own, the cards playing the night, and the code alone, lit; this round designs that room screen by screen.",
    },
  ],
  context:
    "Round two, in the room you picked, for Maya & Jay's wedding: every screen in your layout, from production's atoms and readiness. Each decision's first frame is live (Try it, or the step as it opens): press Continue, Back, the phones, the night and the looks. Moving frames play where motion is welcome and stand still under reduced motion. The camera is drawn in disposable-mode's picks. Each caption counts the words a host reads.",
  opening: {
    about:
      "Create as a room of its own, designed screen by screen in your layout: how it moves, the add step's night, the code's look and the lit code's arrival.",
    settled: [
      "The room, in your layout: subtle steppers up top, the question just under them in one place, the answer in the centre, one button at the foot.",
      "How guests add compares the two on your night slider; the beat is the code alone, lit, leading into Get it ready.",
      "See it as a guest stays the hub's payoff, never offered mid-setup; the name is one field, and the code's look is picked on samples.",
      "The camera's step stays right after the name, switching both ways later; at the plan's limit the door stands in Create's place.",
    ],
    earlier: [
      "'Always keep the question up top so users aren't searching for the spot of the new one in a centered group each time.'",
      "'The name screen, for example, would be \"Name your event\" up top, input center, continue bottom.'",
      "'Some of these screens (how guests add, code's look, the beat) could all be improved.' 'Love the subtle steppers up top now.'",
      "On lit: 'This screen presents more cleanly with less going on (first win), but also keeps hosts in the event flow.'",
      "'...rather than mid-setup. That should feel like a final payoff, not mid-point distraction.'",
    ],
  },
  terms: [
    {
      term: "the room",
      means:
        "Create as a screen of its own: the whole screen, dark, nothing of the app around it.",
    },
    {
      term: "the beat",
      means:
        "Create's last screen: the new event's code, shown once in its life, then the way into getting it ready.",
    },
    {
      term: "disposable camera",
      means:
        "A mode where each guest shoots 24 shots in the album's own camera, hidden until they develop at 9 am.",
    },
    {
      term: "night slider",
      means:
        "The track under the add step's phones that moves both from 8 pm to the party to 9 am.",
    },
    {
      term: "Settings' steps",
      means:
        "Settings' five numbered steps (who gets in, what guests add, the reel, the event, the code), each ticked once ready.",
    },
    {
      term: "Try it",
      means:
        "A decision's first frame: Create itself, running in that option; Continue, Back and the picks all work.",
    },
  ],
  carried: [
    {
      id: "name",
      question: "Does the name's screen show anything but the name?",
      taken:
        "No: the name alone at its size. At a phone the keyboard holds the lower part of the screen and Continue rides on it.",
      overrule:
        "The name typed onto what guests meet first, the album's door, so she watches it land.",
    },
    {
      id: "reveal",
      question:
        "What of the camera's own setting does Create show once the camera is picked?",
      taken:
        "Its develop time, where its control will mount: 9 am tomorrow, or straight away. The 24 shots are the server's count, never a setting.",
      overrule:
        "Nothing: Create picks album or camera, and the develop time waits in Settings.",
    },
    {
      id: "night",
      question: "Does the night play by itself as the add step opens?",
      taken:
        "Once, from 8 pm to the party, then it rests for her hand; under reduced motion it opens on the party.",
      overrule: "It waits for her to drag it.",
    },
    {
      id: "close",
      question: "On the beat, where does Go to your event go?",
      taken:
        "Into the close at the top, which now leaves for the event's page; the foot keeps Get it ready alone.",
      overrule:
        "A quieter second press beside Get it ready, as Create has it today.",
    },
    {
      id: "room",
      question:
        "Does Create's hand-off say when her account is running out of room?",
      taken:
        "Yes: past 85% room joins what is left, as on the hub, read from the account's storage.",
      overrule:
        "No: room stays the hub's, and Create lists the event's own steps only.",
    },
  ],
  asks: [
    /* ── 1. From one screen to the next ─────────────────────────────────── */
    {
      id: "flow",
      label: "From one screen to the next",
      question:
        "How should one screen of Create become the next, and how should she go back?",
      where: ["Host", "Create an event", "Between the screens"],
      when: "Maya presses Continue on each of Create's screens, or goes back to change an answer, before she presses Create event.",
      matters:
        "It is the room's whole feel: every host passes through it, and it decides where Back lives and what the steppers say.",
      lands:
        "The room's head, its steppers and Back, and the motion between Create's screens.",
      context:
        "Four frames each: Try it (Create running, Continue and Back working), the change from the name to how guests add played there and back, then how guests add and the code's look at rest.",
      options: [
        {
          id: "still",
          label: "The room holds still",
          means:
            "Only the question and its answer change, fading in place, as the steppers fill; Back waits beside the button, at the thumb.",
          gains:
            "Calm: nothing moves but what changed, and Back is where her thumb already is.",
          costs:
            "Little sense of going forward, and Back crowds the one button.",
        },
        {
          id: "slide",
          label: "Each screen slides in",
          means:
            "Each screen slides in from the right, the way a phone's own setup does; Back at the head's left, the close at its right.",
          gains: "Familiar from every phone's setup: forward and back read at once.",
          costs: "The whole page moves on every step, and Back is a reach at a phone.",
        },
        {
          id: "carry",
          label: "Each answer rises into the head",
          means:
            "Her answer rises into the head: the name stays there as the room's title, a pick drops into its stepper, and the head is the way back.",
          gains:
            "Her event visibly takes shape, and any answer is one press away in the head.",
          costs: "More motion on every step, and a busier head than a bare stepper.",
        },
      ],
      recommended: "carry",
      because:
        "The name she typed titles the room from then on, so each step reads as building her event, and the head is her way back.",
      overrule: "If Create should feel as calm as it can, the room holding still.",
      configs: [SCREEN],
    },

    /* ── 2. How guests add, compared ────────────────────────────────────── */
    {
      id: "add",
      label: "How guests add, compared",
      question:
        "How should the room's centre show the album and the camera through your night?",
      where: ["Host", "Create an event", "How guests add"],
      when: "Maya has named the wedding; before the code's look she picks whether guests add to an album or shoot a disposable camera.",
      matters:
        "One of an event's biggest choices, made here once: your night slider is settled, and how it fills the centre is open.",
      lands:
        "Create's second step: the event's mode, and where the camera's own setting, its develop time, stands.",
      context:
        "Three frames each: the step as it opens (live: the night plays once, then pick and drag), slid to the morning, and the camera picked, its develop time where its own setting will mount.",
      options: [
        {
          id: "pair",
          label: "Side by side, the night under both",
          means:
            "The two phones as large as two fit, each with its line at that hour; the night slider spans both.",
          gains: "The difference is seen at a glance, at every hour.",
          costs: "At a phone each picture is about 150 px wide.",
        },
        {
          id: "switch",
          label: "One phone, a switch over it",
          means:
            "One phone as large as the room allows, the album or the camera a switch over it, the night under it.",
          gains: "The biggest picture of what a guest gets, and the least to look at.",
          costs: "The two are never seen together: comparing means switching.",
        },
        {
          id: "stack",
          label: "The pick in front, the other behind",
          means:
            "The picked phone stands in front, the other behind it to the right, a tap from coming forward; the night under both.",
          gains: "The pick is large, and the other stays in sight.",
          costs: "The one behind is half hidden, so the compare is weaker.",
        },
      ],
      recommended: "pair",
      because:
        "The two differ most in when everyone sees the photos, and side by side the night shows that at a glance.",
      overrule:
        "If the picture should be as big as a phone allows, one phone with a switch.",
      configs: [SCREEN],
    },

    /* ── 3. The code's look ─────────────────────────────────────────────── */
    {
      id: "look",
      label: "The code's look",
      question: "How should the code's look step show what she is choosing?",
      where: ["Host", "Create an event", "The code's look"],
      when: "Maya has picked how guests add; before Create event she picks one of four looks for her code, on samples.",
      matters:
        "It is how a host learns her code has a look at all, and you said the step could be improved.",
      lands:
        "Create's third step: what its centre shows, and how the four looks are offered.",
      context:
        "Two frames each: the step as it opens on today's default look (live: press the looks), then Rounded picked. Every code is a sample: her real one arrives on the beat.",
      options: [
        {
          id: "plate",
          label: "The code large, its looks under it",
          means:
            "One code at full size on its plate, the four looks under it as corners, each showing its own finder.",
          gains: "The code is the subject, and the four read as one choice.",
          costs: "It never says where the look will show.",
        },
        {
          id: "places",
          label: "The code where guests meet it",
          means:
            "The code held up on her phone and in the corner of the room's screen, both re-dressed as she picks.",
          gains: "She sees what the look is for, in the two places it really goes.",
          costs: "Each code is smaller, and the centre holds more to look at.",
        },
        {
          id: "four",
          label: "Every look whole, side by side",
          means:
            "The four codes whole in a square, each named, the pick lit by the room's light.",
          gains: "Every look seen whole, and all at once.",
          costs: "Four codes at once read busy, and each is smaller.",
        },
      ],
      recommended: "places",
      because:
        "Seeing her code on her own phone and on the room's screen tells her what the look is for, which is the step's whole job.",
      overrule: "If the code itself should be the whole subject, the code large.",
      configs: [SCREEN],
    },

    /* ── 4. The lit code arrives ────────────────────────────────────────── */
    {
      id: "beat",
      label: "The code's arrival",
      question:
        "How should the lit code arrive, and how should its acts and what is left read?",
      where: ["Host", "Create an event", "The beat"],
      when: "Maya has pressed Create event: the wedding exists, its code is real, and guests still need the code opened once.",
      matters:
        "Every host meets it once, as the first win; you asked for it clean and leading on into the event.",
      lands:
        "The beat: its arrival, Print and Share, and how Settings' steps and room read before Get it ready.",
      context:
        "Three frames each: as it arrives (played where motion is welcome), at rest, and for a host whose storage is 92% used, so room joins what is left.",
      options: [
        {
          id: "develop",
          label: "The sample develops into her code",
          means:
            "The sample she styled develops into her real code where it stands while Create runs; two quiet rounds; what is left in one line.",
          gains: "One moment from her pick to her code, with the least to read.",
          costs: "What is left is a line and five ticks, not the steps' names.",
        },
        {
          id: "rise",
          label: "The code rises into its light",
          means:
            "The room dims, light gathers on the floor and the code rises into it; Print and Share; Settings' steps as the rail.",
          gains: "A staged reveal, and the rail shows where Get it ready leads.",
          costs: "The most words of the three, under the code.",
        },
        {
          id: "two",
          label: "The code alone, then the hand-off",
          means:
            "The code alone first, nothing else on the screen; a moment later the hand-off rises under it as a sheet, Get it ready at its foot.",
          gains: "The code has its moment entirely to itself.",
          costs: "A second beat to wait for, and a sheet over the room.",
        },
      ],
      recommended: "develop",
      because:
        "Her pick becomes her code in one moment, the first win, and what is left reads in a line on the way to Get it ready.",
      overrule:
        "If the beat should show where Get it ready leads, the code rising onto the rail.",
      configs: [SCREEN],
    },
  ],
});
