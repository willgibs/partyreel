import { defineExploration } from "@/components/lab/exploration";

import { SCREEN } from "./knobs";

/**
 * CREATE, ROUND FOUR: THE STYLES POLISHED, AND THE BEAT'S TWO MOMENTS DRAWN.
 *
 * His r3 pick (`add=styles`) is production now (`components/app/create-event-
 * wizard/add-step.tsx`), with his note answered where it was plain: the style
 * is named Review, and Disposable's develop time opens directly under its
 * card. What he left open is the polish ("could continue to be polished"), so
 * `styles` draws production's step beside the two other answers his note
 * names: the time on a focused screen of its own, and fewer pictures fighting
 * for attention.
 *
 * ★ F1 AND F2 WERE MADE IN TEXT ON 2026-10-04 AND BUILT THAT WAY (the round
 * 15 calls, `docs/calls.md` BG5): what is left as Settings' steps under the
 * code, and the develop playing while the event is made. Each is asked here
 * as a picture, production's own answer one option among real contenders, so
 * the pick weighs it rather than inherits it. F2 parts in two decisions, the
 * wait and the failure, and the failure is drawn in the wait he picks
 * (`after`), since a failure held in place looks like the wait it holds.
 *
 * ★ EVERY FRAME IS PRODUCTION'S OWN ROOM AND ATOMS (`create.tsx`): the head,
 * the question, the foot, the carry, the add step, the look and the beat are
 * imported, never redrawn; an option draws only what differs.
 *
 * Nothing here asks what another board asks: the calls lab's F3 (a sample
 * code until Create) and F4 (a phone's Back leaves Create) stay as built,
 * host-moments asks a develop time added mid-party, brand r2 its take.
 */
export const CREATE_WIZARD = defineExploration({
  id: "create-wizard",
  title: "The create wizard",
  surface: "host",
  desk: 60,
  lives: [
    "src/components/app/create-event-wizard.tsx",
    "src/components/app/create-event-wizard/",
    "src/lib/events/readiness.ts",
    "docs/systems/host-app.md",
  ],
  round: {
    n: 4,
    date: "2026-10-06",
    changed:
      "From your round three note: the album style step polished three ways, as built among them. And the beat's two moments, built in text on 10-04, drawn as contenders: what Create closes on, the wait while the event is made, a failed Create.",
  },
  history: [
    {
      n: 3,
      date: "2026-10-03",
      changed:
        "The add step a second time, in the room as wired and the-wait's words. You picked Settings' three cards, the night in each: wired since, as Review, Disposable's time under its card.",
    },
    {
      n: 2,
      date: "2026-10-02",
      changed:
        "The room designed screen by screen in your layout. You picked each answer rising into the head, the code where guests meet it and the sample developing into her code, all wired now.",
    },
    {
      n: 1,
      date: "2026-10-02",
      changed:
        "Create redrawn whole for Maya & Jay's wedding. You picked a room of its own, the cards playing the night, and the code alone, lit.",
    },
  ],
  context:
    "Round four, four decisions, for Maya & Jay's wedding, all in production's own room: the album style step, then the beat's close, its wait and its failure. Each option opens on Try it, Create running from the moment asked; every press works and nothing is made. Each caption is read off its frame.",
  opening: {
    about:
      "Round four: the album style step polished, then the beat's two moments built in text (what it closes on, the wait while the event is made) drawn as contenders.",
    settled: [
      "The room as wired, your round three styles step in it: three cards each moving through the night, Disposable's develop time under its card.",
      "Review is the style's name, your plainer word, wherever a style is named.",
      "A sample code until Create, and a phone's Back leaving Create, stay as built (the calls lab's F3 and F4).",
      "Drawn on Afterglow's tokens: brand r2's take would recolour the room's light and the beat's bloom, nothing else here.",
    ],
    earlier: [
      "On round three's styles: 'Could continue to be polished, but this is the far superior option.'",
      "'Feels cleaner with more focused views/less fighting for attention ... Really clear mental model.'",
      "'If disposable is selected, time should either be directly below option item or on a focused following screen.'",
      "On round two's beat: 'a beautiful screen ... The steps beneath could be designed better, while remaining somewhat minimal.'",
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
        "Create's last screen: her code, lit, with Print and Share under it and Get it ready at the foot.",
    },
    {
      term: "develop time",
      means:
        "When a Disposable's photos open to everyone at once: 9 am the morning after, unless she moves it.",
    },
    {
      term: "the sample",
      means:
        "The stand-in code she styles on the look before her event exists; it opens no album.",
    },
    {
      term: "Try it",
      means:
        "An option's first frame: Create itself, running from the moment asked; every press works.",
    },
  ],
  carried: [
    {
      id: "slow",
      question: "How long does Try it's wait last, on the wait and the failure?",
      taken:
        "2.6 seconds, a slow line's, so the wait is long enough to judge; a good line answers in about one.",
      overrule: "A good line's second, as most hosts will meet it.",
    },
    {
      id: "retry",
      question: "On Try it for the failure, what does a second Create do?",
      taken:
        "It makes the event: the line came back, so every option is seen through to her code.",
      overrule: "It fails again, so the failure can be read twice.",
    },
  ],
  asks: [
    {
      id: "styles",
      label: "The styles, polished",
      question:
        "How should the album style step stand, so the three read apart at a glance and Disposable's develop time is never missed?",
      where: ["Host", "Create an event", "Pick your album's style"],
      when: "Maya has named the wedding; she picks Live, Review or Disposable before the code's look.",
      matters:
        "One of an event's biggest choices, met here first: three styles told apart at a glance, nothing missed.",
      lands:
        "Create's album style step: how the three styles show, and where a Disposable's develop time and roll stand.",
      context:
        "In production's room: Try it (Create from this step; every press works), then Disposable picked at rest. The focused option adds its own next screen.",
      options: [
        {
          id: "built",
          label: "As built: the time under its card",
          means:
            "Production's step: three cards, each its album through the night, the slider under them; picking Disposable opens its time and roll under its card.",
          gains:
            "Every style pictured at once, and the time opens where her eye already is.",
          costs:
            "Three pictures, a slider and the time's controls on one screen; a phone scrolls to reach them.",
        },
        {
          id: "focused",
          label: "Three cards, then the time's own screen",
          means:
            "The same three cards with nothing opening under them; picking Disposable adds one screen after this: when they develop, and the roll.",
          gains:
            "The time gets a whole screen of its own, impossible to miss, and the cards never move.",
          costs:
            "One more screen for a Disposable host, and the steppers grow by one when she picks it.",
        },
        {
          id: "quiet",
          label: "One picture, three plain rows",
          means:
            "One large album for the style picked, moving through the night; under it Live, Review and Disposable as plain rows, the time opening in Disposable's.",
          gains:
            "The least fighting for attention: one picture read large, the words carry the choice.",
          costs:
            "Never pictured side by side; at a phone the picture shrinks when Disposable's time opens.",
        },
      ],
      recommended: "focused",
      today: "built",
      because:
        "Your second placement: the cards stay calm and still, and the time is a screen she cannot miss, at the cost of one screen only for Disposable.",
      overrule:
        "If one more screen for a Disposable host costs more than a row opening under its card.",
      configs: [SCREEN],
    },
    {
      id: "close",
      label: "What Create closes on",
      question:
        "Under her new code, how much of Settings should Create's last screen carry?",
      where: ["Host", "Create an event", "Her code, made"],
      when: "Create event has made the wedding: her code stands lit, Print and Share under it, Get it ready at the foot.",
      matters:
        "Create's last words: whether she leaves knowing what guests still need, or only that she is done.",
      lands:
        "The beat's close, under Print and Share: Settings' steps, one line, or nothing, before Get it ready.",
      context:
        "The beat at rest once the event exists, then Try it from the look: Create event, the wait, the beat; Get it ready starts again.",
      options: [
        {
          id: "marks",
          label: "As built: Settings' five marks",
          means:
            "Settings' five steps as numbered marks on one line, two ticked, then the checklist's line: guests still need one more thing.",
          gains:
            "Settings' shape is seen before Get it ready opens it, in a line.",
          costs:
            "Five unnamed marks to decode, and the line never says what the one thing is.",
        },
        {
          id: "next",
          label: "One line: what guests still need",
          means:
            "No marks: one line saying what guests still need, the code sent or printed, which Print and Share just above it do.",
          gains:
            "The fewest words, and they point at the two rounds right above them.",
          costs:
            "Settings' later steps (the reel, the welcome) go unseen until Get it ready.",
        },
        {
          id: "named",
          label: "Settings' steps, named",
          means:
            "Settings' five steps as small named chips, the two done ticked, so every step reads without opening Settings.",
          gains: "Everything ahead in words, nothing to decode.",
          costs:
            "The most to read on a screen meant as a first win, and it wraps at a phone.",
        },
        {
          id: "none",
          label: "Nothing of Settings",
          means:
            "Her code, Print and Share, and Get it ready alone: Settings says what is left once she opens it.",
          gains: "The calmest close: the code is the whole moment.",
          costs:
            "Nothing says guests still need anything before she leaves Create.",
        },
      ],
      recommended: "next",
      today: "marks",
      because:
        "The one thing a new event still needs is the code, sent or printed: one line names it and the rounds above it do it.",
      overrule:
        "If seeing all of Settings' steps before Get it ready matters more than a calm first win.",
      configs: [SCREEN],
    },
    {
      id: "wait",
      label: "The wait",
      question: "While Create makes the event, what should Maya be watching?",
      where: ["Host", "Create an event", "Making the event"],
      when: "She has pressed Create event on the code's look; the event takes about a second, longer on a slow line.",
      matters:
        "Immediate, or a clear state: the moment between her press and her code must never read as stuck, or as done.",
      lands:
        "The beat's first moment: what stands while the event is made, and how her own code arrives.",
      context:
        "The wait held (a line that never answers), then Try it from the look on a slow line; Get it ready starts again.",
      options: [
        {
          id: "breath",
          label: "As built: the sample breathes",
          means:
            "The beat lands at once, the room dims, the sample she styled breathes like a print in the tray, and her code comes up sharp under it.",
          gains:
            "Her pick carries straight into her code: one picture, never a gap.",
          costs:
            "A sample code stands lit on the screen while nothing is real yet.",
        },
        {
          id: "tray",
          label: "Blank paper, then her code develops",
          means:
            "The beat lands at once on a blank print with her name under it; her code develops up out of the paper only once it exists.",
          gains:
            "Nothing on the screen is false: a code appears only once it is hers.",
          costs: "A blank square for the wait, which on a slow line can read empty.",
        },
        {
          id: "inplace",
          label: "The wait on the look",
          means:
            "Nothing moves on the press: Create event works in place on the look, then the beat lands with her own code.",
          gains:
            "No in-between screen at all: the beat only ever shows what is true.",
          costs:
            "The develop from her pick into her code is lost, and the look waits under a working button.",
        },
      ],
      recommended: "breath",
      today: "breath",
      because:
        "Your round two pick, and the wait is its best part: the code she styled develops into hers where it stands, the status saying so.",
      overrule:
        "If a sample standing lit while nothing is real reads as a promise the screen has not kept.",
      configs: [SCREEN],
    },
    {
      id: "failed",
      label: "When Create fails",
      question:
        "When Create fails, where should Maya land, with everything she chose kept?",
      after: { ask: "wait" },
      where: ["Host", "Create an event", "Create failed"],
      when: "She pressed Create event and the line dropped or the server refused: nothing was made.",
      matters:
        "A failure says so where she is looking, keeps her work and offers the one next step.",
      lands:
        "What a failed Create shows and where: the screen she lands on, its words, and the way to try again.",
      context:
        "Drawn in the wait you picked: the failure at rest, then Try it, where the first Create fails and the second makes it.",
      options: [
        {
          id: "back",
          label: "As built: back to the look, a toast",
          means:
            "The room returns to the look, her name, style and look kept, and a toast says the event could not be created.",
          gains:
            "She is back where she pressed, everything in place to press again.",
          costs:
            "The toast stands apart from the room, and the screen she was watching vanishes.",
        },
        {
          id: "held",
          label: "Held where she is, Try again",
          means:
            "The screen she is watching stays and says nothing was lost; the foot becomes Try again, and Back is there for a change.",
          gains:
            "No jump: the failure is said where her eyes are, with one press to retry.",
          costs:
            "A failure state of its own on the beat, and changing anything means Back.",
        },
        {
          id: "line",
          label: "Back to the look, said in the room",
          means:
            "The room returns to the look and says why under the question, in the room's own words, never a toast.",
          gains:
            "Her place to press again, with the reason in the room's one place for words.",
          costs:
            "The look's quiet line changes meaning for a moment, then stays until she presses.",
        },
      ],
      recommended: "held",
      today: "back",
      because:
        "Immediate, or a clear state: the failure is said where she was looking, her work untouched, with Try again at her thumb.",
      overrule:
        "If a failure should always return her to the screen where she pressed.",
      configs: [SCREEN],
    },
  ],
});
